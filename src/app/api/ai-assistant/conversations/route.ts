import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { hasPaidFeature } from '@/lib/stripe'

export async function GET() {
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

    // Check subscription — AI assistant requires paid plan
    const { data: tenant } = await supabase
      .from('tenants')
      .select('plan')
      .eq('id', user.tenant_id)
      .single()

    if (!hasPaidFeature(tenant?.plan)) {
      return NextResponse.json(
        { error: 'AI Assistant requires an Unlimited plan.' },
        { status: 403 }
      )
    }

    const { data: conversations, error } = await supabase
      .from('ai_conversations')
      .select('id, title, created_at, updated_at')
      .eq('user_id', authUser.id)
      .eq('tenant_id', user.tenant_id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Database error in GET /api/ai-assistant/conversations:', error)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 400 })
    }

    return NextResponse.json(conversations || [])
  } catch (error) {
    console.error('Unexpected error in GET /api/ai-assistant/conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Check subscription — AI assistant requires paid plan
    const { data: delUser } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', authUser.id)
      .single()

    if (delUser) {
      const { data: delTenant } = await supabase
        .from('tenants')
        .select('plan')
        .eq('id', delUser.tenant_id)
        .single()

      if (!hasPaidFeature(delTenant?.plan)) {
        return NextResponse.json(
          { error: 'AI Assistant requires an Unlimited plan.' },
          { status: 403 }
        )
      }
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing conversation id' }, { status: 400 })
    }

    // Verify ownership
    const { data: conversation } = await supabase
      .from('ai_conversations')
      .select('id')
      .eq('id', id)
      .eq('user_id', authUser.id)
      .single()

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error in DELETE /api/ai-assistant/conversations:', error)
      return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 400 })
    }

    return NextResponse.json({ message: 'Deleted', id })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/ai-assistant/conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
