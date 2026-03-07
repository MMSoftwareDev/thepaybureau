import { getAuthUser, createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(request)
    const limiter = await rateLimit(`vote:${ip}`, { limit: 20, windowSeconds: 900 })
    if (!limiter.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = createServerSupabaseClient()

    // Check if user already voted
    const { data: existing } = await supabase
      .from('feature_request_votes')
      .select('id')
      .eq('feature_request_id', id)
      .eq('user_id', authUser.id)
      .single()

    if (existing) {
      // Remove vote
      const { error: deleteError } = await supabase
        .from('feature_request_votes')
        .delete()
        .eq('id', existing.id)

      if (deleteError) {
        console.error('Failed to remove vote:', deleteError)
        return NextResponse.json({ error: 'Failed to remove vote' }, { status: 500 })
      }
    } else {
      // Add vote
      const { error } = await supabase
        .from('feature_request_votes')
        .insert({ feature_request_id: id, user_id: authUser.id })

      if (error) {
        return NextResponse.json({ error: 'Failed to vote' }, { status: 500 })
      }
    }

    // Return updated count
    const { count } = await supabase
      .from('feature_request_votes')
      .select('*', { count: 'exact', head: true })
      .eq('feature_request_id', id)

    return NextResponse.json({
      vote_count: count || 0,
      user_has_voted: !existing,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
