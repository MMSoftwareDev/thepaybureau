import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { verifyCronSecret } from '@/lib/rate-limit'
import { NextRequest, NextResponse } from 'next/server'
import { scrapeManual, HMRC_MANUALS, getManualBySlug } from '@/lib/ai/hmrc-manual-scraper'
import { chunkDocument } from '@/lib/ai/chunking'
import { embedDocuments } from '@/lib/ai/embeddings'
import { writeAuditLog } from '@/lib/audit'

export const maxDuration = 300 // 5 minutes per manual

function isAdmin(email: string): boolean {
  const adminEmails = (process.env.PLATFORM_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
  return adminEmails.includes(email.toLowerCase())
}

/**
 * POST /api/ai-assistant/documents/scrape-manuals
 *
 * Triggers a smart crawl of ONE HMRC internal manual.
 * Requires a `manual` query param (slug) to specify which manual.
 *
 * Example: POST /api/ai-assistant/documents/scrape-manuals?manual=paye-manual
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

    // Get the manual slug from query params
    const manualSlug = request.nextUrl.searchParams.get('manual')
    if (!manualSlug) {
      return NextResponse.json(
        { error: 'Missing `manual` query parameter. Valid values: ' + HMRC_MANUALS.map(m => m.slug).join(', ') },
        { status: 400 }
      )
    }

    const manual = getManualBySlug(manualSlug)
    if (!manual) {
      return NextResponse.json(
        { error: `Unknown manual: ${manualSlug}. Valid values: ${HMRC_MANUALS.map(m => m.slug).join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Get existing manual documents with their source URLs and content hashes
    const { data: existingDocs } = await supabase
      .from('ai_documents')
      .select('id, source_url, metadata')
      .not('source_url', 'is', null)

    const existingMap = new Map<string, { id: string; contentHash: string }>()
    for (const doc of existingDocs || []) {
      if (doc.source_url) {
        const meta = doc.metadata as Record<string, unknown> | null
        if (meta?.source === 'hmrc_manual_scraper') {
          existingMap.set(doc.source_url, {
            id: doc.id,
            contentHash: (meta?.content_hash as string) || '',
          })
        }
      }
    }

    // Run the scraper for this single manual
    const { pages, result, sectionsFound, sectionsRelevant } = await scrapeManual(manual, existingMap)

    // Process each new/updated page
    for (const page of pages) {
      try {
        const existing = existingMap.get(page.url)

        if (existing) {
          await supabase
            .from('ai_documents')
            .delete()
            .eq('id', existing.id)
        }

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
              source: 'hmrc_manual_scraper',
              manual_slug: manual.slug,
            },
          })
          .select()
          .single()

        if (docError || !document) {
          console.error(`Failed to create document for ${page.url}:`, docError)
          result.errors.push({ url: page.url, error: 'Database insert failed' })
          continue
        }

        const chunks = chunkDocument(page.content)

        if (chunks.length === 0) {
          await supabase
            .from('ai_documents')
            .update({ status: 'error', metadata: { ...document.metadata, error: 'No content to process' } })
            .eq('id', document.id)
          continue
        }

        const texts = chunks.map(c => c.content)
        const embeddings = await embedDocuments(texts)

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
        resourceId: `hmrc-manual-scrape-${manual.slug}`,
        resourceName: `${manual.title} scrape: ${result.new} new, ${result.updated} updated`,
        request,
      })
    }

    return NextResponse.json({
      ok: true,
      manual: manual.slug,
      manual_title: manual.title,
      sections_found: sectionsFound,
      sections_relevant: sectionsRelevant,
      ...result,
    })
  } catch (error) {
    console.error('HMRC manual scrape error:', error)
    return NextResponse.json(
      { error: 'Manual scrape failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ai-assistant/documents/scrape-manuals
 *
 * Returns manual scrape status — per-manual breakdown.
 */
export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser || !isAdmin(authUser.email!)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { data: allDocs } = await supabase
      .from('ai_documents')
      .select('id, title, source_url, status, metadata, created_at, updated_at')
      .not('source_url', 'is', null)
      .order('updated_at', { ascending: false })

    const manualDocs = (allDocs || []).filter(
      d => (d.metadata as Record<string, unknown>)?.source === 'hmrc_manual_scraper'
    )

    // Per-manual breakdown
    const perManual = HMRC_MANUALS.map(m => {
      const docs = manualDocs.filter(d =>
        (d.metadata as Record<string, unknown>)?.manual_slug === m.slug
        // Fallback: check if source_url contains the manual slug
        || d.source_url?.includes(`/hmrc-internal-manuals/${m.slug}/`)
      )
      const lastDoc = docs.length > 0 ? docs[0] : null

      return {
        slug: m.slug,
        title: m.title,
        scraped_count: docs.length,
        ready: docs.filter(d => d.status === 'ready').length,
        errors: docs.filter(d => d.status === 'error').length,
        last_scrape: lastDoc?.updated_at || null,
      }
    })

    const lastScrape = manualDocs.length > 0 ? manualDocs[0].updated_at : null

    return NextResponse.json({
      total_manuals: HMRC_MANUALS.length,
      manuals: perManual,
      scraped_count: manualDocs.length,
      ready: manualDocs.filter(d => d.status === 'ready').length,
      processing: manualDocs.filter(d => d.status === 'processing').length,
      errors: manualDocs.filter(d => d.status === 'error').length,
      last_scrape: lastScrape,
    })
  } catch (error) {
    console.error('Manual scrape status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
