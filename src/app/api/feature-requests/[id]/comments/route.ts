import { getAuthUser, createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000),
  parent_comment_id: z.string().uuid().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createServerSupabaseClient()

  // Fetch all comments for this feature request
  const { data: comments, error } = await supabase
    .from('feature_request_comments')
    .select('id, feature_request_id, parent_comment_id, user_id, user_email, user_name, content, created_at, updated_at')
    .eq('feature_request_id', id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }

  if (!comments || comments.length === 0) {
    return NextResponse.json({ comments: [], users: {} })
  }

  // Batch fetch user titles and avatars for all comment authors
  const userIds = [...new Set(comments.map(c => c.user_id))]
  const { data: users } = await supabase
    .from('users')
    .select('id, title, avatar_url')
    .in('id', userIds)

  const usersMap: Record<string, { title: string | null; avatar_url: string | null }> = {}
  for (const u of users || []) {
    usersMap[u.id] = { title: u.title, avatar_url: u.avatar_url }
  }

  return NextResponse.json({ comments, users: usersMap })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request)
  const limiter = await rateLimit(`comment:${ip}`, { limit: 20, windowSeconds: 900 })
  if (!limiter.success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const body = await request.json()
  const parsed = commentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  // Get user info
  const { data: userRecord } = await supabase
    .from('users')
    .select('name, title, avatar_url')
    .eq('id', authUser.id)
    .single()

  // Enforce max 2 levels: if parent itself has a parent, re-parent to root
  let parentCommentId = parsed.data.parent_comment_id || null
  if (parentCommentId) {
    const { data: parentComment } = await supabase
      .from('feature_request_comments')
      .select('id, parent_comment_id, feature_request_id')
      .eq('id', parentCommentId)
      .single()

    if (!parentComment || parentComment.feature_request_id !== id) {
      return NextResponse.json({ error: 'Invalid parent comment' }, { status: 400 })
    }

    // If parent has a parent, re-parent to root (enforce 2 levels max)
    if (parentComment.parent_comment_id) {
      parentCommentId = parentComment.parent_comment_id
    }
  }

  const { data: comment, error } = await supabase
    .from('feature_request_comments')
    .insert({
      feature_request_id: id,
      parent_comment_id: parentCommentId,
      user_id: authUser.id,
      user_email: authUser.email || '',
      user_name: userRecord?.name || authUser.email || 'Anonymous',
      content: parsed.data.content,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }

  return NextResponse.json({
    comment,
    user: {
      title: userRecord?.title || null,
      avatar_url: userRecord?.avatar_url || null,
    },
  }, { status: 201 })
}
