import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
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
      auditLogsResult,
      trainingResult,
      badgesResult,
      statsResult,
      tenantResult,
    ] = await Promise.all([
      supabase.from('clients').select('*').eq('tenant_id', tenantId),
      supabase.from('payroll_runs').select('*, checklist_items(*)').eq('tenant_id', tenantId),
      supabase.from('audit_logs').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
      supabase.from('training_records').select('*').eq('tenant_id', tenantId),
      supabase.from('user_badges').select('*').eq('user_id', authUser.id),
      supabase.from('user_stats').select('*').eq('user_id', authUser.id),
      supabase.from('tenants').select('*').eq('id', tenantId).single(),
    ])

    const exportData = {
      exported_at: new Date().toISOString(),
      account: {
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
      },
      tenant: tenantResult.data ? {
        name: tenantResult.data.name,
        plan: tenantResult.data.plan,
        settings: tenantResult.data.settings,
      } : null,
      clients: clientsResult.data || [],
      payroll_runs: payrollRunsResult.data || [],
      training_records: trainingResult.data || [],
      audit_logs: auditLogsResult.data || [],
      badges: badgesResult.data || [],
      stats: statsResult.data || [],
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="thepaybureau-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error) {
    console.error('Error exporting account data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
