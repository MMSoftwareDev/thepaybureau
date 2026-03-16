import { getAuthUser, createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { sendEmail, SUPPORT_EMAIL } from '@/lib/resend'
import { featureRequestNotificationEmail } from '@/lib/email-templates'

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
})

export async function GET(request: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerSupabaseClient()
  const sort = request.nextUrl.searchParams.get('sort') || 'newest'
  const statusFilter = request.nextUrl.searchParams.get('status')

  // Fetch all feature requests
  let query = supabase.from('feature_requests').select('id, title, description, status, created_by_user_id, created_by_email, created_by_name, created_at, updated_at')

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  if (sort === 'oldest') {
    query = query.order('created_at', { ascending: true })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data: requests, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch feature requests' }, { status: 500 })
  }

  if (!requests || requests.length === 0) {
    return NextResponse.json({ requests: [] })
  }

  // Fetch vote counts for all requests
  const requestIds = requests.map(r => r.id)
  const { data: votes } = await supabase
    .from('feature_request_votes')
    .select('feature_request_id, user_id')
    .in('feature_request_id', requestIds)

  // Build vote map
  const voteCountMap: Record<string, number> = {}
  const userVoteMap: Record<string, boolean> = {}
  for (const vote of votes || []) {
    voteCountMap[vote.feature_request_id] = (voteCountMap[vote.feature_request_id] || 0) + 1
    if (vote.user_id === authUser.id) {
      userVoteMap[vote.feature_request_id] = true
    }
  }

  // Fetch comment counts per request
  const { data: commentCounts } = await supabase
    .from('feature_request_comments')
    .select('feature_request_id')
    .in('feature_request_id', requestIds)

  const commentCountMap: Record<string, number> = {}
  for (const c of commentCounts || []) {
    commentCountMap[c.feature_request_id] = (commentCountMap[c.feature_request_id] || 0) + 1
  }

  // Fetch user titles and avatars for request authors
  const authorIds = [...new Set(requests.map(r => r.created_by_user_id).filter(Boolean))] as string[]
  const userInfoMap: Record<string, { title: string | null; avatar_url: string | null }> = {}
  if (authorIds.length > 0) {
    const { data: authorUsers } = await supabase
      .from('users')
      .select('id, title, avatar_url')
      .in('id', authorIds)

    for (const u of authorUsers || []) {
      userInfoMap[u.id] = { title: u.title, avatar_url: u.avatar_url }
    }
  }

  const enriched = requests.map(r => ({
    ...r,
    vote_count: voteCountMap[r.id] || 0,
    user_has_voted: !!userVoteMap[r.id],
    comment_count: commentCountMap[r.id] || 0,
    created_by_title: r.created_by_user_id ? userInfoMap[r.created_by_user_id]?.title || null : null,
    created_by_avatar_url: r.created_by_user_id ? userInfoMap[r.created_by_user_id]?.avatar_url || null : null,
  }))

  // Sort by votes if requested (after enrichment)
  if (sort === 'most_votes') {
    enriched.sort((a, b) => b.vote_count - a.vote_count)
  }

  return NextResponse.json({ requests: enriched })
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const limiter = await rateLimit(`feature-req:${ip}`, { limit: 10, windowSeconds: 900 })
  if (!limiter.success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  // Get user name from users table
  const { data: userRecord } = await supabase
    .from('users')
    .select('name')
    .eq('id', authUser.id)
    .single()

  const { data: created, error } = await supabase
    .from('feature_requests')
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || null,
      created_by_user_id: authUser.id,
      created_by_email: authUser.email || '',
      created_by_name: userRecord?.name || authUser.email || 'Anonymous',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to create feature request' }, { status: 500 })
  }

  // Send email notification to support (awaited to prevent serverless termination)
  const email = featureRequestNotificationEmail({
    userName: userRecord?.name || authUser.email || 'Anonymous',
    userEmail: authUser.email || '',
    title: parsed.data.title,
    description: parsed.data.description,
  })
  try {
    await sendEmail({ to: SUPPORT_EMAIL, ...email })
  } catch (err) {
    console.error('Failed to send feature request notification email:', err)
  }

  return NextResponse.json({ request: { ...created, vote_count: 0, user_has_voted: false } }, { status: 201 })
}
