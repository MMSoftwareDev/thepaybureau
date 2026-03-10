import { getAuthUser } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const PLATFORM_ADMIN_EMAILS = (process.env.PLATFORM_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

export async function GET() {
  const authUser = await getAuthUser()
  if (!authUser?.email) {
    return NextResponse.json({ isAdmin: false })
  }

  return NextResponse.json({
    isAdmin: PLATFORM_ADMIN_EMAILS.includes(authUser.email.toLowerCase()),
  })
}
