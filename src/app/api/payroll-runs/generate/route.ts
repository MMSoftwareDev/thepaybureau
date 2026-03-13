// src/app/api/payroll-runs/generate/route.ts
import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { generatePayrollRunSchema } from '@/lib/validations'
import {
  calculateNextPayDate,
  calculatePeriodDates,
  calculateRtiDueDate,
  calculateEpsDueDate,
  type PayFrequency,
} from '@/lib/hmrc-deadlines'
import { z } from 'zod'
import { writeAuditLog } from '@/lib/audit'

export async function POST(request: NextRequest) {
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

    // Validate body
    const body = await request.json()
    const validatedData = generatePayrollRunSchema.parse(body)

    // Fetch payroll to get config (verify tenant ownership)
    const { data: payroll, error: payrollError } = await supabase
      .from('payrolls')
      .select('*, clients(name)')
      .eq('id', validatedData.payroll_id)
      .eq('tenant_id', user.tenant_id)
      .single()

    if (payrollError || !payroll) {
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 })
    }

    if (!payroll.pay_frequency || !payroll.pay_day) {
      return NextResponse.json(
        { error: 'Payroll is missing pay frequency or pay day configuration' },
        { status: 400 }
      )
    }

    // Get the latest payroll run for this payroll to find the last pay date
    const { data: latestRun } = await supabase
      .from('payroll_runs')
      .select('pay_date')
      .eq('payroll_id', payroll.id)
      .order('pay_date', { ascending: false })
      .limit(1)
      .single()

    const lastPayDate = latestRun ? new Date(latestRun.pay_date) : new Date()

    // Calculate dates
    const nextPayDate = calculateNextPayDate(
      payroll.pay_frequency as PayFrequency,
      payroll.pay_day,
      lastPayDate
    )
    const { periodStart, periodEnd } = calculatePeriodDates(
      payroll.pay_frequency as PayFrequency,
      nextPayDate
    )
    const rtiDueDate = calculateRtiDueDate(nextPayDate)
    const epsDueDate = calculateEpsDueDate(nextPayDate)

    // Insert new payroll run
    const { data: payrollRun, error: runError } = await supabase
      .from('payroll_runs')
      .insert({
        client_id: payroll.client_id,
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
      return NextResponse.json({ error: 'Failed to generate payroll run' }, { status: 400 })
    }

    // Fetch active checklist templates for this payroll
    const { data: templates } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('payroll_id', payroll.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    // Insert checklist items from templates
    let checklistItems = null
    if (templates && templates.length > 0) {
      const itemRows = templates.map((t) => ({
        payroll_run_id: payrollRun.id,
        template_id: t.id,
        name: t.name,
        sort_order: t.sort_order,
        is_completed: false,
      }))

      const { data: items, error: itemsError } = await supabase
        .from('checklist_items')
        .insert(itemRows)
        .select()

      if (itemsError) {
        console.error('Checklist items creation error:', itemsError)
      } else {
        checklistItems = items
      }
    }

    const clientName = (payroll as unknown as { clients: { name: string } }).clients?.name || 'Unknown'

    // Audit log
    writeAuditLog({
      tenantId: user.tenant_id,
      userId: authUser.id,
      userEmail: authUser.email!,
      action: 'CREATE',
      resourceType: 'payroll_run',
      resourceId: payrollRun.id,
      resourceName: `${clientName} — ${payrollRun.pay_date}`,
      request,
    })

    return NextResponse.json({
      ...payrollRun,
      checklist_items: checklistItems || [],
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Unexpected error in POST /api/payroll-runs/generate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
