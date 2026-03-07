import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { writeAuditLog } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const limiter = await rateLimit(`export-data:${ip}`, { limit: 3, windowSeconds: 900 })
    if (!limiter.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!authUser.email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
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

    // Fetch all user data in parallel
    const [
      { data: clients },
      { data: payrollRuns },
      { data: trainingRecords },
      { data: auditLogs },
      { data: featureRequests },
      { data: votes },
      { data: badges },
      { data: stats },
    ] = await Promise.all([
      supabase.from('clients').select('*').eq('tenant_id', user.tenant_id).limit(10000),
      supabase.from('payroll_runs').select('*').eq('tenant_id', user.tenant_id).limit(10000),
      supabase.from('training_records').select('*').eq('tenant_id', user.tenant_id).limit(10000),
      supabase.from('audit_logs').select('*').eq('tenant_id', user.tenant_id).limit(10000),
      supabase.from('feature_requests').select('*').eq('created_by_user_id', authUser.id).limit(1000),
      supabase.from('feature_request_votes').select('*').eq('user_id', authUser.id).limit(1000),
      supabase.from('user_badges').select('*').eq('user_id', authUser.id).limit(1000),
      supabase.from('user_stats').select('*').eq('user_id', authUser.id).limit(1),
    ])

    const exportData = {
      exported_at: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      },
      clients: clients || [],
      payroll_runs: payrollRuns || [],
      training_records: trainingRecords || [],
      audit_logs: auditLogs || [],
      feature_requests: featureRequests || [],
      feature_request_votes: votes || [],
      badges: badges || [],
      stats: stats?.[0] || null,
    }

    // Audit log the export
    writeAuditLog({
      tenantId: user.tenant_id,
      userId: authUser.id,
      userEmail: authUser.email,
      action: 'CREATE',
      resourceType: 'data_export',
      resourceId: authUser.id,
      resourceName: 'GDPR data export',
      request,
    })

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="thepaybureau-data-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Data export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
