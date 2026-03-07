// src/app/api/dashboard/stats/route.ts
import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { isBefore, addDays, startOfDay, startOfMonth, subMonths, format, differenceInDays } from 'date-fns'
import { parseDateString } from '@/lib/hmrc-deadlines'

export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!authUser.email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
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
          plan: 'free',
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
          email: authUser.email,
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
      .select('id, name, status, employee_count, pay_frequency, created_at, pension_provider, pension_staging_date, pension_reenrolment_date, declaration_of_compliance_deadline')
      .eq('tenant_id', user.tenant_id)

    const allClients = clients || []
    const totalClients = allClients.length

    // Total employees across all clients
    const totalEmployees = allClients.reduce((sum, c) => sum + (c.employee_count || 0), 0)

    // All payroll runs with client names and checklist items
    const { data: runs } = await supabase
      .from('payroll_runs')
      .select('*, clients(name, id), checklist_items(id, is_completed)')
      .eq('tenant_id', user.tenant_id)

    const today = startOfDay(new Date())
    const monthStart = startOfMonth(today)

    const allRuns = runs || []

    // Build a client name lookup
    const clientNameMap: Record<string, string> = {}
    for (const c of allClients) {
      clientNameMap[c.id] = c.name || 'Unknown'
    }

    // ── TODAY'S RUNS ──
    // Runs where pay_date is today (or overdue from before today) and not complete
    const todayRuns: Array<{
      id: string
      clientName: string
      clientId: string
      payDate: string
      status: string
      totalSteps: number
      completedSteps: number
      currentStep: string | null
    }> = []

    // ── OVERDUE RUNS ──
    const overdueRuns: Array<{
      id: string
      clientName: string
      clientId: string
      payDate: string
      daysOverdue: number
      totalSteps: number
      completedSteps: number
    }> = []

    // ── THIS WEEK'S RUNS ──
    const thisWeekRuns: Array<{
      id: string
      clientName: string
      clientId: string
      payDate: string
      status: string
      totalSteps: number
      completedSteps: number
      daysUntil: number
    }> = []

    // ── PERIOD PROGRESS (all active/current period runs) ──
    let periodTotal = 0
    let periodComplete = 0
    let periodInProgress = 0
    let periodNotStarted = 0

    // ── ACTION REQUIRED items ──
    const actionRequired: Array<{
      id: string
      clientName: string
      clientId: string
      payDate: string
      severity: 'red' | 'amber' | 'neutral'
      reason: string
      daysOverdue?: number
      daysUntil?: number
    }> = []

    for (const run of allRuns) {
      const payDate = parseDateString(run.pay_date)
      const payDateNorm = startOfDay(payDate)
      const clientName = (run.clients as { name: string; id: string } | null)?.name || 'Unknown Client'
      const clientId = (run.clients as { name: string; id: string } | null)?.id || run.client_id
      const items = (run.checklist_items as Array<{ id: string; is_completed: boolean }>) || []
      const totalSteps = items.length
      const completedSteps = items.filter(i => i.is_completed).length
      const daysUntilPay = differenceInDays(payDateNorm, today)

      // Only count runs with pay_date within reasonable range for period progress
      // (not ancient completed runs)
      const isCurrentPeriod = daysUntilPay >= -30 && daysUntilPay <= 30

      if (isCurrentPeriod && run.status !== 'complete') {
        periodTotal++
        if (completedSteps === totalSteps && totalSteps > 0) {
          periodComplete++
        } else if (completedSteps > 0) {
          periodInProgress++
        } else {
          periodNotStarted++
        }
      } else if (run.status === 'complete' && isCurrentPeriod) {
        periodTotal++
        periodComplete++
      }

      // TODAY: pay date is today and not complete
      if (daysUntilPay === 0 && run.status !== 'complete') {
        todayRuns.push({
          id: run.id,
          clientName,
          clientId,
          payDate: run.pay_date,
          status: run.status,
          totalSteps,
          completedSteps,
          currentStep: null,
        })
      }

      // OVERDUE: pay date before today and not complete
      if (isBefore(payDateNorm, today) && run.status !== 'complete') {
        overdueRuns.push({
          id: run.id,
          clientName,
          clientId,
          payDate: run.pay_date,
          daysOverdue: Math.abs(daysUntilPay),
          totalSteps,
          completedSteps,
        })

        actionRequired.push({
          id: run.id,
          clientName,
          clientId,
          payDate: run.pay_date,
          severity: 'red',
          reason: `Overdue ${Math.abs(daysUntilPay)} day${Math.abs(daysUntilPay) !== 1 ? 's' : ''} — ${completedSteps}/${totalSteps} steps done`,
          daysOverdue: Math.abs(daysUntilPay),
        })
      }

      // THIS WEEK: pay date within next 7 days (including today) and not complete
      if (daysUntilPay >= 0 && daysUntilPay <= 7 && run.status !== 'complete') {
        thisWeekRuns.push({
          id: run.id,
          clientName,
          clientId,
          payDate: run.pay_date,
          status: run.status,
          totalSteps,
          completedSteps,
          daysUntil: daysUntilPay,
        })

        // Amber action items for runs due soon but not started or barely started
        if (!isBefore(payDateNorm, today) && daysUntilPay <= 3 && completedSteps < totalSteps) {
          const dayLabel = daysUntilPay === 0 ? 'today' : daysUntilPay === 1 ? 'tomorrow' : `in ${daysUntilPay} days`
          actionRequired.push({
            id: run.id,
            clientName,
            clientId,
            payDate: run.pay_date,
            severity: 'amber',
            reason: completedSteps === 0
              ? `Due ${dayLabel} — not started`
              : `Due ${dayLabel} — ${completedSteps}/${totalSteps} steps done`,
            daysUntil: daysUntilPay,
          })
        }
      }
    }

    // Sort overdue by most overdue first
    overdueRuns.sort((a, b) => b.daysOverdue - a.daysOverdue)
    // Sort action items: red first, then amber, then by urgency
    actionRequired.sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === 'red' ? -1 : 1
      return (a.daysOverdue ?? 999) - (b.daysOverdue ?? 999)
    })

    // ── RECENT ACTIVITY ──
    const recentActivity: Array<{
      id: string
      type: 'client_added' | 'payroll_completed' | 'payroll_started' | 'payroll_created'
      description: string
      timestamp: string
    }> = []

    for (const c of allClients) {
      if (c.created_at) {
        recentActivity.push({
          id: `client-${c.id}`,
          type: 'client_added',
          description: `${c.name || 'New client'} was added`,
          timestamp: c.created_at,
        })
      }
    }

    for (const run of allRuns) {
      const clientName = (run.clients as { name: string } | null)?.name || 'Unknown Client'

      if (run.status === 'complete' && run.updated_at) {
        recentActivity.push({
          id: `run-complete-${run.id}`,
          type: 'payroll_completed',
          description: `${clientName} — Payroll completed`,
          timestamp: run.updated_at,
        })
      } else if (run.status === 'in_progress' && run.updated_at) {
        recentActivity.push({
          id: `run-progress-${run.id}`,
          type: 'payroll_started',
          description: `${clientName} — Payroll in progress`,
          timestamp: run.updated_at,
        })
      } else if (run.created_at) {
        recentActivity.push({
          id: `run-created-${run.id}`,
          type: 'payroll_created',
          description: `${clientName} — Payroll run created`,
          timestamp: run.created_at,
        })
      }
    }

    recentActivity.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    const limitedActivity = recentActivity.slice(0, 5)

    // ── LEGACY STATS (keep for backwards compat) ──
    const dueThisWeek = thisWeekRuns.length
    const overdue = overdueRuns.length

    const completedThisMonth = allRuns.filter((run) => {
      if (run.status !== 'complete') return false
      if (!run.updated_at) return false
      const updatedAt = startOfDay(new Date(run.updated_at))
      return !isBefore(updatedAt, monthStart)
    }).length

    // Upcoming deadlines
    const twoWeeksFromNow = addDays(today, 14)
    const upcomingDeadlines: Array<{
      clientName: string
      type: 'FPS' | 'EPS'
      date: string
      payrollRunId: string
    }> = []

    for (const run of allRuns) {
      const payDate = startOfDay(parseDateString(run.pay_date))
      if (run.status === 'complete') continue
      if (isBefore(payDate, today) || !isBefore(payDate, twoWeeksFromNow)) continue

      const clientName = (run.clients as { name: string } | null)?.name || 'Unknown Client'

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

    upcomingDeadlines.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Payroll status breakdown
    const statusLabels: Record<string, string> = {
      not_started: 'Not Started',
      in_progress: 'In Progress',
      complete: 'Complete',
      overdue: 'Overdue',
    }
    const statusCounts: Record<string, number> = {}
    for (const run of allRuns) {
      const payDate = startOfDay(parseDateString(run.pay_date))
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
        const payDate = startOfDay(parseDateString(run.pay_date))
        return !isBefore(payDate, mStart) && isBefore(payDate, mEnd)
      })

      completionTrend.push({
        month: monthLabel,
        completed: monthRuns.filter(r => r.status === 'complete').length,
        total: monthRuns.length,
      })
    }

    // Client status + pay frequency distributions
    const clientStatusDistribution = [
      { name: 'Active', value: allClients.filter(c => c.status === 'active').length },
      { name: 'Prospect', value: allClients.filter(c => c.status === 'prospect').length },
      { name: 'Inactive', value: allClients.filter(c => c.status === 'inactive').length },
    ].filter(d => d.value > 0)

    const freqMap: Record<string, string> = {
      weekly: 'Weekly',
      two_weekly: '2-Weekly',
      four_weekly: '4-Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      biannually: 'Biannually',
      annually: 'Annually',
    }
    const freqCounts: Record<string, number> = {}
    for (const c of allClients) {
      if (c.pay_frequency) {
        const label = freqMap[c.pay_frequency] || c.pay_frequency
        freqCounts[label] = (freqCounts[label] || 0) + 1
      }
    }
    const payFrequencyDistribution = Object.entries(freqCounts).map(([name, value]) => ({ name, value }))

    // ── PENSION DECLARATIONS ──
    const pensionOverdue: Array<{
      clientName: string
      clientId: string
      field: string
      date: string
      daysOverdue: number
    }> = []
    const pensionDueSoon: Array<{
      clientName: string
      clientId: string
      field: string
      date: string
      daysUntil: number
    }> = []

    const pensionFieldLabels: Record<string, string> = {
      pension_staging_date: 'Staging Date',
      pension_reenrolment_date: 'Re-Enrolment Date',
      declaration_of_compliance_deadline: 'Declaration of Compliance',
    }

    for (const c of allClients) {
      // Skip exempt clients
      if (c.pension_provider?.toLowerCase() === 'exempt') continue

      for (const field of ['pension_staging_date', 'pension_reenrolment_date', 'declaration_of_compliance_deadline'] as const) {
        const dateStr = c[field]
        if (!dateStr) continue

        const date = startOfDay(parseDateString(dateStr))
        const daysUntilDate = differenceInDays(date, today)

        if (isBefore(date, today)) {
          pensionOverdue.push({
            clientName: c.name || 'Unknown',
            clientId: c.id,
            field: pensionFieldLabels[field],
            date: dateStr,
            daysOverdue: Math.abs(daysUntilDate),
          })

          actionRequired.push({
            id: `pension-${c.id}-${field}`,
            clientName: c.name || 'Unknown',
            clientId: c.id,
            payDate: dateStr,
            severity: 'red',
            reason: `${pensionFieldLabels[field]} overdue ${Math.abs(daysUntilDate)} day${Math.abs(daysUntilDate) !== 1 ? 's' : ''}`,
            daysOverdue: Math.abs(daysUntilDate),
          })
        } else if (daysUntilDate <= 30) {
          pensionDueSoon.push({
            clientName: c.name || 'Unknown',
            clientId: c.id,
            field: pensionFieldLabels[field],
            date: dateStr,
            daysUntil: daysUntilDate,
          })

          if (daysUntilDate <= 7) {
            const dayLabel = daysUntilDate === 0 ? 'today' : daysUntilDate === 1 ? 'tomorrow' : `in ${daysUntilDate} days`
            actionRequired.push({
              id: `pension-${c.id}-${field}`,
              clientName: c.name || 'Unknown',
              clientId: c.id,
              payDate: dateStr,
              severity: 'amber',
              reason: `${pensionFieldLabels[field]} due ${dayLabel}`,
              daysUntil: daysUntilDate,
            })
          }
        }
      }
    }

    // Re-sort action items after adding pension items
    actionRequired.sort((a, b) => {
      if (a.severity !== b.severity) return a.severity === 'red' ? -1 : 1
      return (a.daysOverdue ?? 999) - (b.daysOverdue ?? 999)
    })

    return NextResponse.json({
      // New action-focused data
      todayRuns,
      overdueRuns,
      thisWeekRuns,
      actionRequired: actionRequired.slice(0, 10),
      periodProgress: {
        total: periodTotal,
        complete: periodComplete,
        inProgress: periodInProgress,
        notStarted: periodNotStarted,
      },
      // Existing data
      totalClients,
      totalEmployees,
      dueThisWeek,
      overdue,
      completedThisMonth,
      upcomingDeadlines: upcomingDeadlines.slice(0, 10),
      payrollStatusBreakdown,
      clientStatusDistribution,
      payFrequencyDistribution,
      completionTrend,
      recentActivity: limitedActivity,
      pensionOverdue: pensionOverdue.length,
      pensionDueSoon: pensionDueSoon.length,
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/dashboard/stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
