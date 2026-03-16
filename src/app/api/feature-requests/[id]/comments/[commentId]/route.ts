import { getAuthUser, createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

const PLATFORM_ADMIN_EMAILS = (process.env.PLATFORM_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

function isAdmin(email: string | undefined): boolean {
  return !!email && PLATFORM_ADMIN_EMAILS.includes(email.toLowerCase())
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { commentId } = await params
  const supabase = createServerSupabaseClient()

  // Check ownership — admin can delete any, users can delete their own
  if (isAdmin(authUser.email)) {
    // Service role client bypasses RLS
    const { error } = await supabase
      .from('feature_request_comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
    }
  } else {
    // RLS ensures users can only delete their own
    const { error } = await supabase
      .from('feature_request_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', authUser.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
