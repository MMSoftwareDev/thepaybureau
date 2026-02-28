// src/app/api/dashboard/stats/route.ts
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { isAfter, isBefore, addDays, startOfDay, startOfMonth } from 'date-fns'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Auth check
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create user
    let { data: user } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', session.user.id)
      .single()

    if (!user) {
      const { data: newTenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: session.user.email?.split('@')[0] || 'My Bureau',
          plan: 'starter',
        })
        .select()
        .single()

      if (tenantError) {
        return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 })
      }

      const { data: newUser, error: newUserError } = await supabase
        .from('users')
        .insert({
          id: session.user.id,
          tenant_id: newTenant.id,
          email: session.user.email!,
          name:
            session.user.user_metadata?.name ||
            session.user.email?.split('@')[0] ||
            'User',
        })
        .select()
        .single()

      if (newUserError) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
      }

      user = newUser
    }

    if (!user) {
      return NextResponse.json({ error: 'Failed to resolve user' }, { status: 500 })
    }

    // Total clients
    const { count: totalClients } = await supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', user.tenant_id)

    // All payroll runs with client names
    const { data: runs } = await supabase
      .from('payroll_runs')
      .select('*, clients(name)')
      .eq('tenant_id', user.tenant_id)

    const today = startOfDay(new Date())
    const weekFromNow = addDays(today, 7)
    const twoWeeksFromNow = addDays(today, 14)
    const monthStart = startOfMonth(today)

    const allRuns = runs || []

    // Due this week: pay_date within next 7 days AND status !== 'complete'
    const dueThisWeek = allRuns.filter((run) => {
      const payDate = startOfDay(new Date(run.pay_date))
      return (
        run.status !== 'complete' &&
        !isBefore(payDate, today) &&
        isBefore(payDate, weekFromNow)
      )
    }).length

    // Overdue: pay_date < today AND status !== 'complete'
    const overdue = allRuns.filter((run) => {
      const payDate = startOfDay(new Date(run.pay_date))
      return run.status !== 'complete' && isBefore(payDate, today)
    }).length

    // Completed this month: status === 'complete' and updated_at in current month
    const completedThisMonth = allRuns.filter((run) => {
      if (run.status !== 'complete') return false
      if (!run.updated_at) return false
      const updatedAt = startOfDay(new Date(run.updated_at))
      return !isBefore(updatedAt, monthStart) && !isAfter(updatedAt, today)
    }).length

    // Upcoming deadlines: non-complete runs with pay_date in next 14 days
    const upcomingDeadlines: Array<{
      clientName: string
      type: 'FPS' | 'EPS'
      date: string
      payrollRunId: string
    }> = []

    for (const run of allRuns) {
      const payDate = startOfDay(new Date(run.pay_date))
      if (run.status === 'complete') continue
      if (isBefore(payDate, today) || !isBefore(payDate, twoWeeksFromNow)) continue

      const clientName =
        (run.clients as { name: string } | null)?.name || 'Unknown Client'

      if (run.rti_due_date) {
        upcomingDeadlines.push({
          clientName,
          type: 'FPS',
          date: run.rti_due_date,
          payrollRunId: run.id,
        })
      }

      if (run.eps_due_date) {
        upcomingDeadlines.push({
          clientName,
          type: 'EPS',
          date: run.eps_due_date,
          payrollRunId: run.id,
        })
      }
    }

    // Sort by date ascending, limit to 10
    upcomingDeadlines.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
    const limitedDeadlines = upcomingDeadlines.slice(0, 10)

    return NextResponse.json({
      totalClients: totalClients || 0,
      dueThisWeek,
      overdue,
      completedThisMonth,
      upcomingDeadlines: limitedDeadlines,
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/dashboard/stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
