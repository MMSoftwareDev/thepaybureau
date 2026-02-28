// src/app/api/payroll-runs/generate/route.ts
import { createServerSupabaseClient } from '@/lib/supabase-server'
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

export async function POST(request: NextRequest) {
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

    // Validate body
    const body = await request.json()
    const validatedData = generatePayrollRunSchema.parse(body)

    // Fetch client to get pay_frequency and pay_day (verify tenant ownership)
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', validatedData.client_id)
      .eq('tenant_id', user.tenant_id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    if (!client.pay_frequency || !client.pay_day) {
      return NextResponse.json(
        { error: 'Client is missing pay frequency or pay day configuration' },
        { status: 400 }
      )
    }

    // Get the latest payroll run for this client to find the last pay date
    const { data: latestRun } = await supabase
      .from('payroll_runs')
      .select('pay_date')
      .eq('client_id', client.id)
      .order('pay_date', { ascending: false })
      .limit(1)
      .single()

    const lastPayDate = latestRun ? new Date(latestRun.pay_date) : new Date()

    // Calculate dates
    const nextPayDate = calculateNextPayDate(
      client.pay_frequency as PayFrequency,
      client.pay_day,
      lastPayDate
    )
    const { periodStart, periodEnd } = calculatePeriodDates(
      client.pay_frequency as PayFrequency,
      nextPayDate
    )
    const rtiDueDate = calculateRtiDueDate(nextPayDate)
    const epsDueDate = calculateEpsDueDate(nextPayDate)

    // Insert new payroll run
    const { data: payrollRun, error: runError } = await supabase
      .from('payroll_runs')
      .insert({
        client_id: client.id,
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
      return NextResponse.json({ error: runError.message }, { status: 400 })
    }

    // Fetch active checklist templates for this client
    const { data: templates } = await supabase
      .from('checklist_templates')
      .select('*')
      .eq('client_id', client.id)
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
