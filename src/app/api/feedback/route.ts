import { getAuthUser, createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/resend'
import { feedbackNotificationEmail } from '@/lib/email-templates'

const feedbackSchema = z.object({
  category: z.enum(['bug', 'improvement', 'other']),
  message: z.string().min(1).max(2000),
  page_url: z.string().max(500).optional(),
})

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const limiter = await rateLimit(`feedback:${ip}`, { limit: 10, windowSeconds: 900 })
  if (!limiter.success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  const authUser = await getAuthUser()
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = feedbackSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  // Get user details
  const { data: userRecord } = await supabase
    .from('users')
    .select('name, tenant_id')
    .eq('id', authUser.id)
    .single()

  const { error } = await supabase
    .from('feedback')
    .insert({
      user_id: authUser.id,
      tenant_id: userRecord?.tenant_id || null,
      user_email: authUser.email || '',
      user_name: userRecord?.name || null,
      category: parsed.data.category,
      message: parsed.data.message,
      page_url: parsed.data.page_url || null,
      user_agent: request.headers.get('user-agent') || null,
    })

  if (error) {
    console.error('Error saving feedback:', error)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }

  // Notify admin(s) via email (fire-and-forget)
  const adminEmails = (process.env.PLATFORM_ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)

  if (adminEmails.length > 0) {
    const email = feedbackNotificationEmail({
      userName: userRecord?.name || '',
      userEmail: authUser.email || '',
      category: parsed.data.category,
      message: parsed.data.message,
      pageUrl: parsed.data.page_url,
    })
    for (const adminEmail of adminEmails) {
      sendEmail({ to: adminEmail, ...email }).catch(err =>
        console.error('Failed to send feedback notification:', err)
      )
    }
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
