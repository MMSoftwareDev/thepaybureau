import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { verifyCronSecret } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'
import { scrapeAllGuidance, HMRC_GUIDANCE_URLS, hashContent } from '@/lib/ai/hmrc-scraper'
import { chunkDocument } from '@/lib/ai/chunking'
import { embedDocuments } from '@/lib/ai/embeddings'
import { writeAuditLog } from '@/lib/audit'

export const maxDuration = 300 // 5 minutes — scraping ~50 pages takes time

function isAdmin(email: string): boolean {
  const adminEmails = (process.env.PLATFORM_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
  return adminEmails.includes(email.toLowerCase())
}

/**
 * POST /api/ai-assistant/documents/scrape
 *
 * Triggers a full scrape of HMRC payroll guidance.
 * - Fetches all seed URLs from gov.uk
 * - Compares content hashes to detect changes
 * - Creates/updates documents with new content
 * - Processes chunks and embeddings for changed docs
 *
 * Admin only. Can also be called by the cron job.
 */
export async function POST(request: NextRequest) {
  try {
    // Auth: either admin user or cron secret (timing-safe comparison)
    const isCronCall = verifyCronSecret(request)

    let authUserId: string | null = null
    let authUserEmail: string | null = null
    let tenantId: string | null = null

    if (!isCronCall) {
      const authUser = await getAuthUser()
      if (!authUser || !isAdmin(authUser.email!)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      authUserId = authUser.id
      authUserEmail = authUser.email!

      const supabase = createServerSupabaseClient()
      const { data: user } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', authUser.id)
        .single()
      tenantId = user?.tenant_id || null
    }

    const supabase = createServerSupabaseClient()

    // Get existing documents with their source URLs and content hashes
    const { data: existingDocs } = await supabase
      .from('ai_documents')
      .select('id, source_url, metadata')
      .not('source_url', 'is', null)

    const existingMap = new Map<string, { id: string; contentHash: string }>()
    for (const doc of existingDocs || []) {
      if (doc.source_url) {
        const meta = doc.metadata as Record<string, unknown> | null
        existingMap.set(doc.source_url, {
          id: doc.id,
          contentHash: (meta?.content_hash as string) || '',
        })
      }
    }

    // Run the scraper
    const { pages, result } = await scrapeAllGuidance(existingMap)

    // Process each new/updated page
    for (const page of pages) {
      try {
        const existing = existingMap.get(page.url)

        if (existing) {
          // Delete old document (cascade deletes chunks)
          await supabase
            .from('ai_documents')
            .delete()
            .eq('id', existing.id)
        }

        // Create new document record
        const { data: document, error: docError } = await supabase
          .from('ai_documents')
          .insert({
            title: page.title,
            source_url: page.url,
            category: page.category,
            status: 'processing',
            metadata: {
              content_hash: page.contentHash,
              scraped_at: new Date().toISOString(),
              last_updated_on_govuk: page.lastUpdated,
              source: 'hmrc_scraper',
            },
          })
          .select()
          .single()

        if (docError || !document) {
          console.error(`Failed to create document for ${page.url}:`, docError)
          result.errors.push({ url: page.url, error: 'Database insert failed' })
          continue
        }

        // Chunk the content
        const chunks = chunkDocument(page.content)

        if (chunks.length === 0) {
          await supabase
            .from('ai_documents')
            .update({ status: 'error', metadata: { ...document.metadata, error: 'No content to process' } })
            .eq('id', document.id)
          continue
        }

        // Generate embeddings
        const texts = chunks.map(c => c.content)
        const embeddings = await embedDocuments(texts)

        // Store chunks with embeddings
        const chunkRecords = chunks.map((chunk, i) => ({
          document_id: document.id,
          content: chunk.content,
          chunk_index: chunk.chunkIndex,
          section_title: chunk.sectionTitle,
          embedding: JSON.stringify(embeddings[i]),
          token_count: chunk.tokenCount,
        }))

        const { error: chunkError } = await supabase
          .from('ai_document_chunks')
          .insert(chunkRecords)

        if (chunkError) {
          console.error(`Failed to store chunks for ${page.url}:`, chunkError)
          await supabase
            .from('ai_documents')
            .update({ status: 'error', metadata: { ...document.metadata, error: 'Failed to store chunks' } })
            .eq('id', document.id)
          continue
        }

        // Mark as ready
        await supabase
          .from('ai_documents')
          .update({
            status: 'ready',
            metadata: {
              ...document.metadata,
              chunk_count: chunks.length,
              total_tokens: chunks.reduce((sum, c) => sum + c.tokenCount, 0),
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', document.id)
      } catch (err) {
        console.error(`Error processing ${page.url}:`, err)
        result.errors.push({ url: page.url, error: err instanceof Error ? err.message : String(err) })
      }
    }

    // Audit log
    if (authUserId && authUserEmail && tenantId) {
      writeAuditLog({
        tenantId,
        userId: authUserId,
        userEmail: authUserEmail,
        action: 'CREATE',
        resourceType: 'ai_document',
        resourceId: 'hmrc-scrape',
        resourceName: `HMRC scrape: ${result.new} new, ${result.updated} updated`,
        request,
      })
    }

    return NextResponse.json({
      ok: true,
      total_urls: HMRC_GUIDANCE_URLS.length,
      ...result,
    })
  } catch (error) {
    console.error('HMRC scrape error:', error)
    return NextResponse.json(
      { error: 'Scrape failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ai-assistant/documents/scrape
 *
 * Returns scrape status — how many HMRC docs exist, last scrape time, etc.
 */
export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser || !isAdmin(authUser.email!)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Count HMRC-scraped documents
    const { data: hmrcDocs } = await supabase
      .from('ai_documents')
      .select('id, title, source_url, status, metadata, created_at, updated_at')
      .not('source_url', 'is', null)
      .order('updated_at', { ascending: false })

    const scrapedDocs = (hmrcDocs || []).filter(
      d => (d.metadata as Record<string, unknown>)?.source === 'hmrc_scraper'
    )

    const lastScrape = scrapedDocs.length > 0
      ? scrapedDocs[0].updated_at
      : null

    return NextResponse.json({
      total_seed_urls: HMRC_GUIDANCE_URLS.length,
      scraped_count: scrapedDocs.length,
      ready: scrapedDocs.filter(d => d.status === 'ready').length,
      processing: scrapedDocs.filter(d => d.status === 'processing').length,
      errors: scrapedDocs.filter(d => d.status === 'error').length,
      last_scrape: lastScrape,
    })
  } catch (error) {
    console.error('Scrape status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
