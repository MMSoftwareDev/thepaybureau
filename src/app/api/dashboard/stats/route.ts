// src/app/api/dashboard/stats/route.ts
import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { isAfter, isBefore, addDays, startOfDay, startOfMonth, subMonths, format } from 'date-fns'

export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    // Get or create user
    let { data: user } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', authUser.id)
      .single()

    if (!user) {
      const { data: newTenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: authUser.email?.split('@')[0] || 'My Bureau',
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
          id: authUser.id,
          tenant_id: newTenant.id,
          email: authUser.email!,
          name:
            authUser.user_metadata?.name ||
            authUser.email?.split('@')[0] ||
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

    // All clients for this tenant
    const { data: clients } = await supabase
      .from('clients')
      .select('id, status, employee_count, pay_frequency')
      .eq('tenant_id', user.tenant_id)

    const allClients = clients || []
    const totalClients = allClients.length

    // Total employees across all clients
    const totalEmployees = allClients.reduce((sum, c) => sum + (c.employee_count || 0), 0)

    // Client status distribution
    const clientStatusDistribution = [
      { name: 'Active', value: allClients.filter(c => c.status === 'active').length },
      { name: 'Prospect', value: allClients.filter(c => c.status === 'prospect').length },
      { name: 'Inactive', value: allClients.filter(c => c.status === 'inactive').length },
    ].filter(d => d.value > 0)

    // Pay frequency distribution
    const freqMap: Record<string, string> = {
      weekly: 'Weekly',
      fortnightly: 'Fortnightly',
      four_weekly: '4-Weekly',
      monthly: 'Monthly',
    }
    const freqCounts: Record<string, number> = {}
    for (const c of allClients) {
      if (c.pay_frequency) {
        const label = freqMap[c.pay_frequency] || c.pay_frequency
        freqCounts[label] = (freqCounts[label] || 0) + 1
      }
    }
    const payFrequencyDistribution = Object.entries(freqCounts).map(([name, value]) => ({ name, value }))

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

    // Payroll status breakdown
    const statusLabels: Record<string, string> = {
      not_started: 'Not Started',
      in_progress: 'In Progress',
      complete: 'Complete',
      overdue: 'Overdue',
    }
    const statusCounts: Record<string, number> = {}
    for (const run of allRuns) {
      // Override status for overdue runs
      const payDate = startOfDay(new Date(run.pay_date))
      const effectiveStatus = run.status !== 'complete' && isBefore(payDate, today) ? 'overdue' : run.status
      const label = statusLabels[effectiveStatus] || effectiveStatus
      statusCounts[label] = (statusCounts[label] || 0) + 1
    }
    const payrollStatusBreakdown = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

    // Completion trend — last 6 months
    const completionTrend: Array<{ month: string; completed: number; total: number }> = []
    for (let i = 5; i >= 0; i--) {
      const mStart = startOfMonth(subMonths(today, i))
      const mEnd = startOfMonth(subMonths(today, i - 1))
      const monthLabel = format(mStart, 'MMM')

      const monthRuns = allRuns.filter((run) => {
        const payDate = startOfDay(new Date(run.pay_date))
        return !isBefore(payDate, mStart) && isBefore(payDate, mEnd)
      })

      completionTrend.push({
        month: monthLabel,
        completed: monthRuns.filter(r => r.status === 'complete').length,
        total: monthRuns.length,
      })
    }

    return NextResponse.json({
      totalClients,
      totalEmployees,
      dueThisWeek,
      overdue,
      completedThisMonth,
      upcomingDeadlines: limitedDeadlines,
      payrollStatusBreakdown,
      clientStatusDistribution,
      payFrequencyDistribution,
      completionTrend,
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/dashboard/stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
