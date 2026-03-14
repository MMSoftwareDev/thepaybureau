import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const limiter = await rateLimit(`payroll-export:${ip}`, { limit: 5, windowSeconds: 900 })
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

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const frequency = searchParams.get('frequency')
    const status = searchParams.get('status')

    let query = supabase
      .from('payrolls')
      .select('name, status, pay_frequency, pay_day, paye_reference, accounts_office_ref, payroll_software, employment_allowance, pension_provider, pension_staging_date, pension_reenrolment_date, declaration_of_compliance_deadline, created_at, clients(name)')
      .eq('tenant_id', user.tenant_id)
      .order('name', { ascending: true })
      .limit(5000)

    if (status && status !== 'all') query = query.eq('status', status)
    if (frequency && frequency !== 'all') query = query.eq('pay_frequency', frequency)
    if (search) {
      const sanitized = search.replace(/[,%().*]/g, '')
      if (sanitized) {
        query = query.or(`name.ilike.%${sanitized}%,paye_reference.ilike.%${sanitized}%`)
      }
    }

    const { data: payrolls, error } = await query

    if (error) {
      console.error('Database error in payroll export:', error)
      return NextResponse.json({ error: 'Failed to export payrolls' }, { status: 400 })
    }

    const frequencyMap: Record<string, string> = {
      weekly: 'Weekly',
      two_weekly: 'Fortnightly',
      four_weekly: '4-Weekly',
      monthly: 'Monthly',
      annually: 'Annually',
    }

    const headers = [
      'Payroll Name', 'Client', 'Status', 'Pay Frequency', 'Pay Day',
      'PAYE Reference', 'Accounts Office Ref', 'Payroll Software',
      'Employment Allowance', 'Pension Provider', 'Pension Staging Date',
      'Re-enrolment Date', 'DoC Deadline', 'Date Added',
    ]

    const rows = (payrolls || []).map(payroll => {
      const clientData = payroll.clients as unknown as { name: string } | { name: string }[] | null
      const client = Array.isArray(clientData) ? clientData[0] : clientData
      return [
        payroll.name || '',
        client?.name || '',
        payroll.status || '',
        frequencyMap[payroll.pay_frequency || ''] || payroll.pay_frequency || '',
        payroll.pay_day || '',
        payroll.paye_reference || '',
        payroll.accounts_office_ref || '',
        payroll.payroll_software || '',
        payroll.employment_allowance ? 'Yes' : 'No',
        payroll.pension_provider || '',
        payroll.pension_staging_date || '',
        payroll.pension_reenrolment_date || '',
        payroll.declaration_of_compliance_deadline || '',
        payroll.created_at ? new Date(payroll.created_at).toISOString().split('T')[0] : '',
      ].map(v => escapeCsv(String(v))).join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="payrolls-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Unexpected error in payroll export:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
