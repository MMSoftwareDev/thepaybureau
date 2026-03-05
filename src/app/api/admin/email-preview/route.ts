import { getAuthUser } from '@/lib/supabase-server'
import { sendEmail } from '@/lib/resend'
import { complianceDeadlineEmail, payrollIncompleteEmail } from '@/lib/email-templates'
import { NextRequest, NextResponse } from 'next/server'

const PLATFORM_ADMIN_EMAILS = (process.env.PLATFORM_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

function isAdmin(email: string | undefined): boolean {
  return !!email && PLATFORM_ADMIN_EMAILS.includes(email.toLowerCase())
}

// Sample data for previews
const SAMPLE_DATA = {
  compliance_deadline: {
    userName: 'Sarah',
    clientName: 'Acme Ltd',
    deadlineDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  payroll_incomplete: {
    userName: 'Sarah',
    clientName: 'Acme Ltd',
    payDate: new Date().toISOString().split('T')[0],
    completedItems: 4,
    totalItems: 7,
  },
}

// GET — return preview HTML for both templates
export async function GET() {
  const authUser = await getAuthUser()
  if (!authUser || !isAdmin(authUser.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const compliance = complianceDeadlineEmail(SAMPLE_DATA.compliance_deadline)
  const payroll = payrollIncompleteEmail(SAMPLE_DATA.payroll_incomplete)

  return NextResponse.json({
    compliance_deadline: { subject: compliance.subject, html: compliance.html },
    payroll_incomplete: { subject: payroll.subject, html: payroll.html },
  })
}

// POST — send a test email to the admin's own address
export async function POST(request: NextRequest) {
  const authUser = await getAuthUser()
  if (!authUser?.email || !isAdmin(authUser.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const emailType = body.emailType as string

  let subject: string
  let html: string

  if (emailType === 'compliance_deadline') {
    const result = complianceDeadlineEmail(SAMPLE_DATA.compliance_deadline)
    subject = `[TEST] ${result.subject}`
    html = result.html
  } else if (emailType === 'payroll_incomplete') {
    const result = payrollIncompleteEmail(SAMPLE_DATA.payroll_incomplete)
    subject = `[TEST] ${result.subject}`
    html = result.html
  } else {
    return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
  }

  const sendResult = await sendEmail({ to: authUser.email, subject, html })

  if (!sendResult.success) {
    return NextResponse.json({ error: sendResult.error || 'Failed to send' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, sentTo: authUser.email })
}
