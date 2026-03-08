import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { aiChatSchema } from '@/lib/validations'
import { streamRagResponse } from '@/lib/ai/rag'

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { data: user } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', authUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { message, conversation_id } = aiChatSchema.parse(body)

    // Get or create conversation
    let conversationId = conversation_id
    if (!conversationId) {
      const title = message.length > 60 ? message.slice(0, 57) + '...' : message
      const { data: conversation, error: convError } = await supabase
        .from('ai_conversations')
        .insert({
          tenant_id: user.tenant_id,
          user_id: authUser.id,
          title,
        })
        .select('id')
        .single()

      if (convError || !conversation) {
        return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
      }
      conversationId = conversation.id
    }

    // Store the user message
    await supabase.from('ai_messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: message,
    })

    // Load conversation history for context
    const { data: history } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10)

    const conversationHistory = (history || [])
      .slice(0, -1) // Exclude the message we just inserted
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    // Run RAG pipeline with streaming
    const { stream } = await streamRagResponse(message, conversationHistory)

    // We need to tee the stream to both send to client AND collect for storage
    const [clientStream, storageStream] = stream.tee()

    // Collect the full response text in the background
    void (async () => {
      try {
        const reader = storageStream.getReader()
        const decoder = new TextDecoder()
        let fullText = ''
        let citations: unknown[] = []
        let model = ''
        let tokenCount = 0

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.slice(6))
                if (parsed.type === 'text') {
                  fullText += parsed.content
                } else if (parsed.type === 'citations') {
                  citations = parsed.citations
                } else if (parsed.type === 'done') {
                  model = parsed.model
                  tokenCount = parsed.usage?.output_tokens || 0
                }
              } catch {
                // Skip malformed JSON
              }
            }
          }
        }

        // Store the complete assistant message
        if (fullText) {
          await supabase.from('ai_messages').insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: fullText,
            citations: JSON.parse(JSON.stringify(citations)),
            model,
            token_count: tokenCount,
          })

          // Update conversation timestamp
          await supabase
            .from('ai_conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId)
        }
      } catch (err) {
        console.error('Failed to store assistant message:', err)
      }
    })()

    // Return SSE stream with conversation_id header
    return new Response(clientStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Conversation-Id': conversationId!,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error in POST /api/ai-assistant/chat:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
