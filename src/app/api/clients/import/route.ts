// src/app/api/clients/import/route.ts
// Bulk import clients from parsed CSV data

import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { writeAuditLog } from '@/lib/audit'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import {
  calculateNextPayDate,
  calculatePeriodDates,
  calculateRtiDueDate,
  calculateEpsDueDate,
  type PayFrequency,
} from '@/lib/hmrc-deadlines'

const PAY_FREQUENCIES = ['weekly', 'two_weekly', 'four_weekly', 'monthly', 'annually'] as const

const csvClientSchema = z.object({
  name: z.string().min(1, 'Company name is required').max(255),
  paye_reference: z.string().optional().default(''),
  accounts_office_ref: z.string().optional().default(''),
  pay_frequency: z.enum(PAY_FREQUENCIES).default('monthly'),
  pay_day: z.string().optional().default('last_day_of_month'),
  employee_count: z.number().int().positive().optional().nullable(),
  contact_name: z.string().optional().default(''),
  contact_email: z.string().email().optional().or(z.literal('')).default(''),
  contact_phone: z.string().optional().default(''),
  email: z.string().email().optional().or(z.literal('')).default(''),
  phone: z.string().optional().default(''),
  payroll_software: z.string().optional().default(''),
  pension_provider: z.string().optional().default(''),
  notes: z.string().optional().default(''),
})

const importSchema = z.object({
  clients: z.array(csvClientSchema).min(1, 'At least one client is required').max(500, 'Maximum 500 clients per import'),
})

interface ImportResult {
  row: number
  name: string
  success: boolean
  error?: string
  clientId?: string
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 import operations per IP per 15 minutes
    const ip = getClientIp(request)
    const limiter = await rateLimit(`import:${ip}`, { limit: 5, windowSeconds: 900 })
    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Too many import attempts. Please try again later.' },
        { status: 429 }
      )
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
      .select('tenant_id')
      .eq('id', authUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get default checklist from tenant settings
    const { data: tenant } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', user.tenant_id)
      .single()

    const tenantSettings = (tenant?.settings || {}) as Record<string, unknown>
    const defaultChecklist = (tenantSettings.default_checklist as { name: string; sort_order: number }[]) || [
      { name: 'Receive payroll changes', sort_order: 0 },
      { name: 'Process payroll', sort_order: 1 },
      { name: 'Review & approve', sort_order: 2 },
      { name: 'Send payslips', sort_order: 3 },
      { name: 'Submit RTI to HMRC', sort_order: 4 },
      { name: 'BACS payment', sort_order: 5 },
      { name: 'Pension submission', sort_order: 6 },
    ]

    const body = await request.json()
    const { clients } = importSchema.parse(body)

    const results: ImportResult[] = []
    let successCount = 0

    for (let i = 0; i < clients.length; i++) {
      const clientData = clients[i]
      try {
        // 1. Insert client
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: clientData.name,
            paye_reference: clientData.paye_reference || null,
            accounts_office_ref: clientData.accounts_office_ref || null,
            pay_frequency: clientData.pay_frequency,
            pay_day: clientData.pay_day || 'last_day_of_month',
            employee_count: clientData.employee_count || null,
            contact_name: clientData.contact_name || null,
            contact_email: clientData.contact_email || null,
            contact_phone: clientData.contact_phone || null,
            email: clientData.email || null,
            phone: clientData.phone || null,
            payroll_software: clientData.payroll_software || null,
            pension_provider: clientData.pension_provider || null,
            notes: clientData.notes || null,
            tenant_id: user.tenant_id,
            created_by: authUser.id,
            status: 'active',
          })
          .select()
          .single()

        if (clientError) {
          results.push({ row: i + 1, name: clientData.name, success: false, error: clientError.message })
          continue
        }

        // 2. Insert checklist templates
        const templateRows = defaultChecklist.map((item) => ({
          client_id: client.id,
          name: item.name,
          sort_order: item.sort_order,
          is_active: true,
        }))

        const { data: templates } = await supabase
          .from('checklist_templates')
          .insert(templateRows)
          .select()

        // 3. Calculate dates for first payroll run
        const payDay = clientData.pay_day || 'last_day_of_month'
        const nextPayDate = calculateNextPayDate(
          clientData.pay_frequency as PayFrequency,
          payDay,
          new Date()
        )
        const { periodStart, periodEnd } = calculatePeriodDates(
          clientData.pay_frequency as PayFrequency,
          nextPayDate
        )
        const rtiDueDate = calculateRtiDueDate(nextPayDate)
        const epsDueDate = calculateEpsDueDate(nextPayDate)

        // 4. Insert payroll run
        const { data: payrollRun } = await supabase
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

        // 5. Copy checklist templates into checklist_items
        if (templates && templates.length > 0 && payrollRun) {
          await supabase.from('checklist_items').insert(
            templates.map((t) => ({
              payroll_run_id: payrollRun.id,
              template_id: t.id,
              name: t.name,
              sort_order: t.sort_order,
              is_completed: false,
            }))
          )
        }

        results.push({ row: i + 1, name: clientData.name, success: true, clientId: client.id })
        successCount++
      } catch (err) {
        results.push({
          row: i + 1,
          name: clientData.name,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    // Audit log the import
    writeAuditLog({
      tenantId: user.tenant_id,
      userId: authUser.id,
      userEmail: authUser.email,
      action: 'CREATE',
      resourceType: 'client_import',
      resourceId: user.tenant_id,
      resourceName: `CSV Import: ${successCount}/${clients.length} clients`,
      changes: {
        import_summary: {
          from: `${clients.length} rows in CSV`,
          to: `${successCount} imported, ${clients.length - successCount} failed`,
        },
      },
      request,
    })

    return NextResponse.json({
      total: clients.length,
      successful: successCount,
      failed: clients.length - successCount,
      results,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Unexpected error in POST /api/clients/import:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
