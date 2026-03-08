import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { aiDocumentUploadSchema } from '@/lib/validations'
import { chunkDocument } from '@/lib/ai/chunking'
import { embedDocuments } from '@/lib/ai/embeddings'
import { writeAuditLog } from '@/lib/audit'

function isAdmin(email: string): boolean {
  const adminEmails = (process.env.PLATFORM_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
  return adminEmails.includes(email.toLowerCase())
}

export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser || !isAdmin(authUser.email!)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { data: documents, error } = await supabase
      .from('ai_documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error in GET /api/ai-assistant/documents:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 400 })
    }

    return NextResponse.json(documents || [])
  } catch (error) {
    console.error('Unexpected error in GET /api/ai-assistant/documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || !isAdmin(authUser.email!)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { data: user } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', authUser.id)
      .single()

    const body = await request.json()
    const { title, source_url, category, content } = aiDocumentUploadSchema.parse(body)

    // Create document record
    const { data: document, error: docError } = await supabase
      .from('ai_documents')
      .insert({
        title,
        source_url: source_url || null,
        category: category || null,
        status: 'processing',
      })
      .select()
      .single()

    if (docError || !document) {
      console.error('Failed to create document:', docError)
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
    }

    // Process in background: chunk, embed, store
    void (async () => {
      try {
        // Chunk the document
        const chunks = chunkDocument(content)

        if (chunks.length === 0) {
          await supabase
            .from('ai_documents')
            .update({ status: 'error', metadata: { error: 'No content to process' } })
            .eq('id', document.id)
          return
        }

        // Generate embeddings for all chunks
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
          console.error('Failed to store chunks:', chunkError)
          await supabase
            .from('ai_documents')
            .update({ status: 'error', metadata: { error: 'Failed to store chunks' } })
            .eq('id', document.id)
          return
        }

        // Mark as ready
        await supabase
          .from('ai_documents')
          .update({
            status: 'ready',
            metadata: { chunk_count: chunks.length, total_tokens: chunks.reduce((sum, c) => sum + c.tokenCount, 0) },
            updated_at: new Date().toISOString(),
          })
          .eq('id', document.id)
      } catch (err) {
        console.error('Document processing error:', err)
        await supabase
          .from('ai_documents')
          .update({ status: 'error', metadata: { error: String(err) } })
          .eq('id', document.id)
      }
    })()

    if (user) {
      writeAuditLog({
        tenantId: user.tenant_id,
        userId: authUser.id,
        userEmail: authUser.email!,
        action: 'CREATE',
        resourceType: 'ai_document',
        resourceId: document.id,
        resourceName: title,
        request,
      })
    }

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Unexpected error in POST /api/ai-assistant/documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || !isAdmin(authUser.email!)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing document id' }, { status: 400 })
    }

    const { data: document } = await supabase
      .from('ai_documents')
      .select('title')
      .eq('id', id)
      .single()

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Cascade delete will remove chunks too
    const { error } = await supabase
      .from('ai_documents')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error in DELETE /api/ai-assistant/documents:', error)
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 400 })
    }

    const { data: user } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', authUser.id)
      .single()

    if (user) {
      writeAuditLog({
        tenantId: user.tenant_id,
        userId: authUser.id,
        userEmail: authUser.email!,
        action: 'DELETE',
        resourceType: 'ai_document',
        resourceId: id,
        resourceName: document.title,
        request,
      })
    }

    return NextResponse.json({ message: 'Deleted', id })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/ai-assistant/documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
