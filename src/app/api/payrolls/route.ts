// src/app/api/payrolls/route.ts
import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { createPayrollSchema } from '@/lib/validations'
import {
  calculateNextPayDate,
  calculatePeriodDates,
  calculateRtiDueDate,
  calculateEpsDueDate,
  type PayFrequency,
} from '@/lib/hmrc-deadlines'
import { z } from 'zod'
import { writeAuditLog } from '@/lib/audit'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function GET() {
  try {
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

    const { data: payrolls, error } = await supabase
      .from('payrolls')
      .select('*, clients(name)')
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error in GET /api/payrolls:', error)
      return NextResponse.json({ error: error.message || 'Failed to fetch payrolls' }, { status: 400 })
    }

    if (!payrolls || payrolls.length === 0) {
      return NextResponse.json([])
    }

    // Fetch latest (most recent) payroll run for each payroll
    const { data: runs } = await supabase
      .from('payroll_runs')
      .select('id, payroll_id, pay_date, period_start, period_end, status, rti_due_date, eps_due_date')
      .in('payroll_id', payrolls.map((p) => p.id))
      .order('pay_date', { ascending: false })

    const latestRunMap = new Map<string, {
      id: string; payroll_id: string; pay_date: string; period_start: string; period_end: string;
      status: string; rti_due_date: string | null; eps_due_date: string | null;
    }>()
    if (runs) {
      for (const run of runs) {
        if (run.payroll_id && !latestRunMap.has(run.payroll_id)) {
          latestRunMap.set(run.payroll_id, run)
        }
      }
    }

    // Batch-fetch checklist items for all latest runs
    const latestRunIds = Array.from(latestRunMap.values()).map((r) => r.id)
    const checklistMap = new Map<string, Array<{
      id: string; payroll_run_id: string; name: string; is_completed: boolean;
      completed_at: string | null; completed_by: string | null; sort_order: number;
    }>>()

    if (latestRunIds.length > 0) {
      const { data: checklistItems } = await supabase
        .from('checklist_items')
        .select('id, payroll_run_id, name, is_completed, completed_at, completed_by, sort_order')
        .in('payroll_run_id', latestRunIds)
        .order('sort_order', { ascending: true })

      if (checklistItems) {
        for (const item of checklistItems) {
          const existing = checklistMap.get(item.payroll_run_id) || []
          existing.push(item)
          checklistMap.set(item.payroll_run_id, existing)
        }
      }
    }

    const payrollsWithRuns = payrolls.map((payroll) => {
      const latestRun = latestRunMap.get(payroll.id)
      return {
        ...payroll,
        latestRun: latestRun ? {
          ...latestRun,
          checklist_items: checklistMap.get(latestRun.id) || [],
        } : null,
      }
    })

    return NextResponse.json(payrollsWithRuns)
  } catch (error) {
    console.error('Unexpected error in GET /api/payrolls:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 20 payroll creations per 15 minutes
    const limiter = await rateLimit(`payroll-create:${getClientIp(request)}`, { limit: 20, windowSeconds: 900 })
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
      .select('tenant_id')
      .eq('id', authUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = createPayrollSchema.parse(body)

    // Verify client belongs to tenant
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', validatedData.client_id)
      .eq('tenant_id', user.tenant_id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Separate checklist_items from payroll data
    const { checklist_items: checklistData, ...payrollFields } = validatedData

    // 1. Insert payroll
    const { data: payroll, error: payrollError } = await supabase
      .from('payrolls')
      .insert({
        ...payrollFields,
        tenant_id: user.tenant_id,
        created_by: authUser.id,
        status: 'active',
      })
      .select()
      .single()

    if (payrollError) {
      console.error('Payroll creation error:', payrollError)
      return NextResponse.json({ error: payrollError.message || 'Failed to create payroll' }, { status: 400 })
    }

    // 2. Insert checklist templates
    const templateRows = checklistData.map((item) => ({
      client_id: client.id,
      payroll_id: payroll.id,
      name: item.name,
      sort_order: item.sort_order,
      is_active: true,
    }))

    const { data: templates, error: templatesError } = await supabase
      .from('checklist_templates')
      .insert(templateRows)
      .select()

    if (templatesError) {
      console.error('Checklist templates creation error:', templatesError)
      await supabase.from('payrolls').delete().eq('id', payroll.id)
      return NextResponse.json({ error: templatesError.message || 'Failed to create checklist templates' }, { status: 400 })
    }

    // 3. Calculate dates for first payroll run
    const nextPayDate = calculateNextPayDate(
      payrollFields.pay_frequency as PayFrequency,
      payrollFields.pay_day,
      new Date()
    )
    const { periodStart, periodEnd } = calculatePeriodDates(
      payrollFields.pay_frequency as PayFrequency,
      nextPayDate
    )
    const rtiDueDate = calculateRtiDueDate(nextPayDate)
    const epsDueDate = calculateEpsDueDate(nextPayDate)

    // 4. Insert first payroll run
    const { data: payrollRun, error: runError } = await supabase
      .from('payroll_runs')
      .insert({
        client_id: client.id,
        payroll_id: payroll.id,
        tenant_id: user.tenant_id,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        pay_date: nextPayDate.toISOString().split('T')[0],
        status: 'not_started',
        rti_due_date: rtiDueDate.toISOString().split('T')[0],
        eps_due_date: epsDueDate.toISOString().split('T')[0],
      })
      .select()
      .single()

    if (runError) {
      console.error('Payroll run creation error:', runError)
    }

    // 5. Copy templates into checklist_items for the run
    if (payrollRun && templates && templates.length > 0) {
      const checklistItemRows = templates.map((t) => ({
        payroll_run_id: payrollRun.id,
        template_id: t.id,
        name: t.name,
        sort_order: t.sort_order,
        is_completed: false,
      }))

      await supabase.from('checklist_items').insert(checklistItemRows)
    }

    // Audit log
    writeAuditLog({
      tenantId: user.tenant_id,
      userId: authUser.id,
      userEmail: authUser.email!,
      action: 'CREATE',
      resourceType: 'payroll',
      resourceId: payroll.id,
      resourceName: payroll.name,
      request,
    })

    return NextResponse.json({
      ...payroll,
      checklist_templates: templates,
      payroll_run: payrollRun,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Unexpected error in POST /api/payrolls:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
