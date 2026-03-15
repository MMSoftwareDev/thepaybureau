import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return ''
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ]
  return lines.join('\n')
}

export async function GET(request: NextRequest) {
  try {
    // Rate limit: 3 exports per 15 minutes
    const limiter = await rateLimit(`account-export:${getClientIp(request)}`, { limit: 3, windowSeconds: 900 })
    if (!limiter.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const tenantId = user.tenant_id

    // Fetch all user/tenant data in parallel
    const [
      clientsResult,
      payrollRunsResult,
      checklistItemsResult,
      auditLogsResult,
      trainingResult,
      badgesResult,
      statsResult,
    ] = await Promise.all([
      supabase.from('clients').select('*').eq('tenant_id', tenantId),
      supabase.from('payroll_runs').select('*').eq('tenant_id', tenantId),
      supabase.from('checklist_items').select('*, payroll_runs!inner(tenant_id)').eq('payroll_runs.tenant_id', tenantId),
      supabase.from('audit_logs').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
      supabase.from('training_records').select('*').eq('tenant_id', tenantId),
      supabase.from('user_badges').select('*').eq('user_id', authUser.id),
      supabase.from('user_stats').select('*').eq('user_id', authUser.id),
    ])

    const zip = new JSZip()
    const dateStr = new Date().toISOString().split('T')[0]

    // Account info
    zip.file('account.csv', toCsv([{
      email: user.email,
      name: user.name,
      role: user.role,
      created_at: user.created_at,
    }]))

    // Clients
    if (clientsResult.data?.length) {
      zip.file('clients.csv', toCsv(clientsResult.data))
    }

    // Payroll runs
    if (payrollRunsResult.data?.length) {
      zip.file('payroll_runs.csv', toCsv(payrollRunsResult.data))
    }

    // Checklist items (flattened, without the join column)
    if (checklistItemsResult.data?.length) {
      const items = checklistItemsResult.data.map(({ payroll_runs, ...rest }) => rest)
      zip.file('checklist_items.csv', toCsv(items))
    }

    // Training records
    if (trainingResult.data?.length) {
      zip.file('training_records.csv', toCsv(trainingResult.data))
    }

    // Audit logs
    if (auditLogsResult.data?.length) {
      zip.file('audit_logs.csv', toCsv(auditLogsResult.data))
    }

    // Badges
    if (badgesResult.data?.length) {
      zip.file('badges.csv', toCsv(badgesResult.data))
    }

    // Stats
    if (statsResult.data?.length) {
      zip.file('stats.csv', toCsv(statsResult.data))
    }

    const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' })

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="thepaybureau-export-${dateStr}.zip"`,
      },
    })
  } catch (error) {
    console.error('Error exporting account data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
