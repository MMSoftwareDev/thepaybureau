// src/app/api/audit-logs/export/route.ts
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
    const limiter = await rateLimit(`audit-export:${ip}`, { limit: 5, windowSeconds: 900 })
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

    // Parse filters (same as main route)
    const { searchParams } = new URL(request.url)
    const resourceType = searchParams.get('resource_type')
    const action = searchParams.get('action')
    const search = searchParams.get('search')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    // Build query — fetch up to 5000 rows for export
    let query = supabase
      .from('audit_logs')
      .select('created_at, user_email, action, resource_type, resource_name, changes, ip_address')
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false })
      .limit(5000)

    if (resourceType) query = query.eq('resource_type', resourceType)
    if (action) query = query.eq('action', action)
    if (search) {
      const sanitized = search.replace(/[,%().*]/g, '')
      if (sanitized) {
        query = query.or(`resource_name.ilike.%${sanitized}%,user_email.ilike.%${sanitized}%`)
      }
    }
    if (from) query = query.gte('created_at', from)
    if (to) query = query.lte('created_at', to)

    const { data: logs, error } = await query

    if (error) {
      console.error('Database error in export:', error)
      return NextResponse.json({ error: 'Failed to export audit logs' }, { status: 400 })
    }

    // Build CSV
    const headers = ['Date', 'User', 'Action', 'Resource Type', 'Resource Name', 'Changes', 'IP Address']
    const rows = (logs || []).map(log => {
      const changesStr = log.changes
        ? Object.entries(log.changes as Record<string, { from: unknown; to: unknown }>)
            .map(([field, c]) => `${field}: ${JSON.stringify(c.from)} → ${JSON.stringify(c.to)}`)
            .join('; ')
        : ''

      return [
        new Date(log.created_at).toISOString(),
        log.user_email,
        log.action,
        log.resource_type,
        log.resource_name || '',
        changesStr,
        log.ip_address || '',
      ].map(v => escapeCsv(String(v))).join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="audit-log-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Unexpected error in audit log export:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
