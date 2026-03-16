import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function getDateStatus(dateStr: string | null): string {
  if (!dateStr) return 'Not set'
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (date < today) return 'Overdue'
  const thirtyDays = new Date(today)
  thirtyDays.setDate(thirtyDays.getDate() + 30)
  if (date < thirtyDays) return 'Due soon'
  return 'OK'
}

function getOverallStatus(client: { pension_staging_date: string | null; pension_reenrolment_date: string | null; declaration_of_compliance_deadline: string | null; auto_enrolment_status: string | null }): string {
  if (client.auto_enrolment_status === 'exempt') return 'Exempt'
  if (!client.pension_reenrolment_date || !client.declaration_of_compliance_deadline) return 'Missing info'
  const declarationStatus = getDateStatus(client.declaration_of_compliance_deadline)
  if (declarationStatus === 'Overdue') return 'Overdue'
  if (declarationStatus === 'Due soon') return 'Due soon'
  const reenrolmentDate = new Date(client.pension_reenrolment_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (reenrolmentDate <= today) return 'Ready'
  return 'Waiting'
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const limiter = await rateLimit(`pension-export:${ip}`, { limit: 5, windowSeconds: 900 })
    if (!limiter.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

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

    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name, status, auto_enrolment_status, tpr_dashboard_status, pension_staging_date, pension_reenrolment_date, declaration_of_compliance_deadline, last_declaration_completed_at')
      .eq('tenant_id', user.tenant_id)
      .order('name', { ascending: true })
      .limit(5000)

    if (clientsError) {
      console.error('Database error in pension export:', clientsError)
      return NextResponse.json({ error: 'Failed to export pension data' }, { status: 400 })
    }

    const { data: payrolls, error: payrollsError } = await supabase
      .from('payrolls')
      .select('client_id, name, pension_provider')
      .eq('tenant_id', user.tenant_id)

    if (payrollsError) {
      console.error('Database error in pension export (payrolls):', payrollsError)
      return NextResponse.json({ error: 'Failed to export pension data' }, { status: 400 })
    }

    // Group payroll providers by client
    const providersByClient = new Map<string, string[]>()
    for (const p of payrolls || []) {
      if (p.pension_provider) {
        const list = providersByClient.get(p.client_id) || []
        list.push(p.pension_provider)
        providersByClient.set(p.client_id, list)
      }
    }

    const AE_LABELS: Record<string, string> = {
      exempt: 'Exempt',
      currently_not_required: 'Currently Not Required',
      enrolled: 'Enrolled',
    }

    const TPR_LABELS: Record<string, string> = {
      not_added: 'Not Added',
      waiting: 'Waiting',
      added: 'Added',
    }

    const headers = [
      'Client Name', 'Client Status', 'Auto Enrolment Status', 'TPR Dashboard',
      'Pension Provider(s)', 'Staging Date', 'Re-enrolment Date', 'Declaration Deadline', 'Last Declaration Completed', 'Overall Status',
    ]

    const rows = (clients || []).map(client => {
      const providers = providersByClient.get(client.id) || []
      return [
        client.name || '',
        client.status || '',
        client.auto_enrolment_status ? AE_LABELS[client.auto_enrolment_status] || client.auto_enrolment_status : '',
        client.tpr_dashboard_status ? TPR_LABELS[client.tpr_dashboard_status] || client.tpr_dashboard_status : 'Not Added',
        providers.join('; ') || '',
        client.pension_staging_date || '',
        client.pension_reenrolment_date || '',
        client.declaration_of_compliance_deadline || '',
        client.last_declaration_completed_at ? new Date(client.last_declaration_completed_at).toISOString().split('T')[0] : '',
        getOverallStatus(client),
      ].map(v => escapeCsv(String(v))).join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="pensions-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Unexpected error in pension export:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
