import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getAnthropicClient, AI_MODEL, PAYROLL_SYSTEM_PROMPT } from '@/lib/anthropic'
import { embedQuery } from '@/lib/ai/embeddings'

export interface RetrievedChunk {
  id: string
  documentId: string
  content: string
  sectionTitle: string | null
  similarity: number
  metadata: Record<string, unknown>
}

export interface Citation {
  document_id: string
  chunk_id: string
  section_title: string | null
  source_url: string | null
  document_title: string
}

/**
 * Search for relevant document chunks using vector similarity.
 */
export async function searchDocuments(
  query: string,
  matchCount: number = 8
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embedQuery(query)
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: JSON.stringify(queryEmbedding),
    match_count: matchCount,
    match_threshold: 0.3,
  })

  if (error) {
    console.error('Vector search error:', error)
    throw new Error('Failed to search documents')
  }

  return (data || []).map((row: {
    id: string
    document_id: string
    content: string
    section_title: string | null
    similarity: number
    metadata: Record<string, unknown>
  }) => ({
    id: row.id,
    documentId: row.document_id,
    content: row.content,
    sectionTitle: row.section_title,
    similarity: row.similarity,
    metadata: row.metadata || {},
  }))
}

/**
 * Build the prompt context from retrieved chunks, including document metadata.
 */
async function buildContext(chunks: RetrievedChunk[]): Promise<{
  contextText: string
  citations: Citation[]
}> {
  if (chunks.length === 0) {
    return { contextText: '', citations: [] }
  }

  const supabase = createServerSupabaseClient()
  const documentIds = [...new Set(chunks.map(c => c.documentId))]

  const { data: documents } = await supabase
    .from('ai_documents')
    .select('id, title, source_url')
    .in('id', documentIds)

  const docMap = new Map(
    (documents || []).map(d => [d.id, { title: d.title, source_url: d.source_url }])
  )

  const citations: Citation[] = []
  const contextParts: string[] = []

  for (const chunk of chunks) {
    const doc = docMap.get(chunk.documentId)
    const docTitle = doc?.title || 'Unknown Document'
    const sectionLabel = chunk.sectionTitle ? ` - ${chunk.sectionTitle}` : ''

    contextParts.push(
      `--- Source: ${docTitle}${sectionLabel} ---\n${chunk.content}`
    )

    citations.push({
      document_id: chunk.documentId,
      chunk_id: chunk.id,
      section_title: chunk.sectionTitle,
      source_url: doc?.source_url || null,
      document_title: docTitle,
    })
  }

  return {
    contextText: contextParts.join('\n\n'),
    citations,
  }
}

/**
 * Run the full RAG pipeline and stream the response.
 * Returns a ReadableStream for SSE consumption.
 */
export async function streamRagResponse(
  query: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<{
  stream: ReadableStream<Uint8Array>
  citationsPromise: Promise<Citation[]>
}> {
  const chunks = await searchDocuments(query)
  const { contextText, citations } = await buildContext(chunks)

  const userMessage = contextText
    ? `Based on the following HMRC guidance:\n\n${contextText}\n\n---\n\nQuestion: ${query}`
    : `Question: ${query}\n\nNote: No relevant HMRC guidance was found in the knowledge base for this query. Please let the user know and suggest what they should look for.`

  const messages = [
    ...conversationHistory.slice(-6), // Keep last 3 exchanges for context
    { role: 'user' as const, content: userMessage },
  ]

  const client = getAnthropicClient()
  let inputTokens = 0
  let outputTokens = 0

  const encoder = new TextEncoder()
  const citationsResolve: { resolve: (c: Citation[]) => void; reject: (e: Error) => void } = {
    resolve: () => {},
    reject: () => {},
  }
  const citationsPromise = new Promise<Citation[]>((resolve, reject) => {
    citationsResolve.resolve = resolve
    citationsResolve.reject = reject
  })

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const response = client.messages.stream({
          model: AI_MODEL,
          max_tokens: 2048,
          system: PAYROLL_SYSTEM_PROMPT,
          messages,
        })

        response.on('text', (text) => {
          const sseData = `data: ${JSON.stringify({ type: 'text', content: text })}\n\n`
          controller.enqueue(encoder.encode(sseData))
        })

        const finalMessage = await response.finalMessage()
        inputTokens = finalMessage.usage.input_tokens
        outputTokens = finalMessage.usage.output_tokens

        // Send citations
        const citationData = `data: ${JSON.stringify({ type: 'citations', citations })}\n\n`
        controller.enqueue(encoder.encode(citationData))

        // Send usage info
        const usageData = `data: ${JSON.stringify({
          type: 'done',
          usage: { input_tokens: inputTokens, output_tokens: outputTokens },
          model: AI_MODEL,
        })}\n\n`
        controller.enqueue(encoder.encode(usageData))

        controller.close()
        citationsResolve.resolve(citations)
      } catch (error) {
        const errorMsg = `data: ${JSON.stringify({ type: 'error', message: 'Failed to generate response' })}\n\n`
        controller.enqueue(encoder.encode(errorMsg))
        controller.close()
        citationsResolve.reject(error instanceof Error ? error : new Error('Unknown error'))
      }
    },
  })

  return { stream, citationsPromise }
}

/**
 * Run the RAG pipeline and return a complete response (non-streaming, for external API).
 */
export async function generateRagResponse(
  query: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<{
  answer: string
  citations: Citation[]
  usage: { input_tokens: number; output_tokens: number }
  model: string
}> {
  const chunks = await searchDocuments(query)
  const { contextText, citations } = await buildContext(chunks)

  const userMessage = contextText
    ? `Based on the following HMRC guidance:\n\n${contextText}\n\n---\n\nQuestion: ${query}`
    : `Question: ${query}\n\nNote: No relevant HMRC guidance was found in the knowledge base for this query. Please let the user know and suggest what they should look for.`

  const messages = [
    ...conversationHistory.slice(-6),
    { role: 'user' as const, content: userMessage },
  ]

  const client = getAnthropicClient()
  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 2048,
    system: PAYROLL_SYSTEM_PROMPT,
    messages,
  })

  const answer = response.content
    .filter(block => block.type === 'text')
    .map(block => block.type === 'text' ? block.text : '')
    .join('')

  return {
    answer,
    citations,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
    },
    model: AI_MODEL,
  }
}
