// src/app/api/clients/route.ts
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { clientOnboardingSchema } from '@/lib/validations'
import {
  calculateNextPayDate,
  calculatePeriodDates,
  calculateRtiDueDate,
  calculateEpsDueDate,
  type PayFrequency,
} from '@/lib/hmrc-deadlines'
import { z } from 'zod'

async function getOrCreateUser(supabase: ReturnType<typeof createServerSupabaseClient>) {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return { user: null, session: null, error: 'Unauthorized' }
  }

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
      return { user: null, session, error: 'Failed to create tenant' }
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
      return { user: null, session, error: 'Failed to create user' }
    }

    user = newUser
  }

  return { user, session, error: null }
}

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { user, error: authError } = await getOrCreateUser(supabase)

    if (authError === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!user) {
      return NextResponse.json({ error: authError }, { status: 500 })
    }

    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false })

    if (clientsError) {
      return NextResponse.json({ error: clientsError.message }, { status: 400 })
    }

    if (!clients || clients.length === 0) {
      return NextResponse.json([])
    }

    // Fetch latest payroll run for each client
    const { data: runs } = await supabase
      .from('payroll_runs')
      .select('*')
      .in(
        'client_id',
        clients.map((c) => c.id)
      )
      .order('pay_date', { ascending: false })

    // Build a map of client_id -> latest run (first one per client since sorted desc)
    const latestRunMap = new Map<string, (typeof runs extends (infer T)[] | null ? T : never)>()
    if (runs) {
      for (const run of runs) {
        if (!latestRunMap.has(run.client_id)) {
          latestRunMap.set(run.client_id, run)
        }
      }
    }

    const clientsWithRuns = clients.map((client) => ({
      ...client,
      latestRun: latestRunMap.get(client.id) || null,
    }))

    return NextResponse.json(clientsWithRuns)
  } catch (error) {
    console.error('Unexpected error in GET /api/clients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { user, session, error: authError } = await getOrCreateUser(supabase)

    if (authError === 'Unauthorized' || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!user) {
      return NextResponse.json({ error: authError }, { status: 500 })
    }

    const body = await request.json()
    const validatedData = clientOnboardingSchema.parse(body)

    // Separate checklist_items from client data
    const { checklist_items: checklistData, ...clientData } = validatedData

    // 1. Insert client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        ...clientData,
        tenant_id: user.tenant_id,
        created_by: session.user.id,
        status: 'active',
      })
      .select()
      .single()

    if (clientError) {
      return NextResponse.json({ error: clientError.message }, { status: 400 })
    }

    // 2. Insert checklist templates
    const templateRows = checklistData.map((item) => ({
      client_id: client.id,
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
      return NextResponse.json({ error: templatesError.message }, { status: 400 })
    }

    // 3. Calculate dates for the first payroll run
    const nextPayDate = calculateNextPayDate(
      clientData.pay_frequency as PayFrequency,
      clientData.pay_day,
      new Date()
    )
    const { periodStart, periodEnd } = calculatePeriodDates(
      clientData.pay_frequency as PayFrequency,
      nextPayDate
    )
    const rtiDueDate = calculateRtiDueDate(nextPayDate)
    const epsDueDate = calculateEpsDueDate(nextPayDate)

    // 4. Insert payroll run
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

    // 5. Copy checklist templates into checklist_items for this run
    if (templates && templates.length > 0) {
      const checklistItemRows = templates.map((t) => ({
        payroll_run_id: payrollRun.id,
        template_id: t.id,
        name: t.name,
        sort_order: t.sort_order,
        is_completed: false,
      }))

      const { error: itemsError } = await supabase
        .from('checklist_items')
        .insert(checklistItemRows)

      if (itemsError) {
        console.error('Checklist items creation error:', itemsError)
      }
    }

    return NextResponse.json({
      ...client,
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

    console.error('Unexpected error in POST /api/clients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
