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
    const limiter = await rateLimit(`client-export:${ip}`, { limit: 5, windowSeconds: 900 })
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

    // Parse filters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const industry = searchParams.get('industry')

    let query = supabase
      .from('clients')
      .select('name, status, company_number, industry, domain, employee_count, contact_name, contact_email, contact_phone, secondary_contact_name, secondary_contact_email, secondary_contact_phone, accountant_name, accountant_email, accountant_phone, address, notes, created_at')
      .eq('tenant_id', user.tenant_id)
      .order('name', { ascending: true })
      .limit(5000)

    if (status && status !== 'all') query = query.eq('status', status)
    if (industry && industry !== 'all') query = query.eq('industry', industry)
    if (search) {
      const sanitized = search.replace(/[,%().*]/g, '')
      if (sanitized) {
        query = query.or(`name.ilike.%${sanitized}%,contact_name.ilike.%${sanitized}%,contact_email.ilike.%${sanitized}%,domain.ilike.%${sanitized}%,company_number.ilike.%${sanitized}%`)
      }
    }

    const { data: clients, error } = await query

    if (error) {
      console.error('Database error in client export:', error)
      return NextResponse.json({ error: 'Failed to export clients' }, { status: 400 })
    }

    const headers = [
      'Name', 'Status', 'Company Number', 'Industry', 'Domain', 'Employee Count',
      'Contact Name', 'Contact Email', 'Contact Phone',
      'Secondary Contact Name', 'Secondary Contact Email', 'Secondary Contact Phone',
      'Accountant Name', 'Accountant Email', 'Accountant Phone',
      'Street', 'City', 'Postcode', 'Notes', 'Date Added',
    ]

    const rows = (clients || []).map(client => {
      const addr = client.address as { street?: string; city?: string; postcode?: string } | null
      return [
        client.name || '',
        client.status || '',
        client.company_number || '',
        client.industry || '',
        client.domain || '',
        client.employee_count?.toString() || '',
        client.contact_name || '',
        client.contact_email || '',
        client.contact_phone || '',
        client.secondary_contact_name || '',
        client.secondary_contact_email || '',
        client.secondary_contact_phone || '',
        client.accountant_name || '',
        client.accountant_email || '',
        client.accountant_phone || '',
        addr?.street || '',
        addr?.city || '',
        addr?.postcode || '',
        client.notes || '',
        client.created_at ? new Date(client.created_at).toISOString().split('T')[0] : '',
      ].map(v => escapeCsv(String(v))).join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="clients-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Unexpected error in client export:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
