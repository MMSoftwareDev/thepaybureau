import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/ai-assistant/conversations/messages?conversation_id=xxx
 *
 * Returns all messages for a conversation (owned by the current user).
 */
export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversationId = request.nextUrl.searchParams.get('conversation_id')
    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversation_id' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // Verify the user owns this conversation
    const { data: conversation } = await supabase
      .from('ai_conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', authUser.id)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Fetch messages
    const { data: messages, error } = await supabase
      .from('ai_messages')
      .select('id, role, content, citations, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch messages:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    return NextResponse.json(messages || [])
  } catch (error) {
    console.error('Error in GET /api/ai-assistant/conversations/messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
