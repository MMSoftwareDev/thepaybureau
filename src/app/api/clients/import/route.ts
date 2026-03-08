// src/app/api/clients/import/route.ts
// Bulk import clients from parsed CSV data — batched inserts for performance

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

const BATCH_SIZE = 50

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

    // Process in batches to reduce DB round-trips
    for (let batchStart = 0; batchStart < clients.length; batchStart += BATCH_SIZE) {
      const batch = clients.slice(batchStart, batchStart + BATCH_SIZE)

      // 1. Batch insert all clients in this chunk
      const clientRows = batch.map((c) => ({
        name: c.name,
        paye_reference: c.paye_reference || null,
        accounts_office_ref: c.accounts_office_ref || null,
        pay_frequency: c.pay_frequency,
        pay_day: c.pay_day || 'last_day_of_month',
        employee_count: c.employee_count || null,
        contact_name: c.contact_name || null,
        contact_email: c.contact_email || null,
        contact_phone: c.contact_phone || null,
        email: c.email || null,
        phone: c.phone || null,
        payroll_software: c.payroll_software || null,
        pension_provider: c.pension_provider || null,
        notes: c.notes || null,
        tenant_id: user.tenant_id,
        created_by: authUser.id,
        status: 'active' as const,
      }))

      const { data: insertedClients, error: clientsError } = await supabase
        .from('clients')
        .insert(clientRows)
        .select('id, name')

      if (clientsError || !insertedClients) {
        // If batch insert fails, mark all in this batch as failed
        for (let i = 0; i < batch.length; i++) {
          results.push({
            row: batchStart + i + 1,
            name: batch[i].name,
            success: false,
            error: clientsError?.message || 'Failed to insert clients',
          })
        }
        continue
      }

      // 2. Batch insert checklist templates for all new clients
      const templateRows = insertedClients.flatMap((client) =>
        defaultChecklist.map((item) => ({
          client_id: client.id,
          name: item.name,
          sort_order: item.sort_order,
          is_active: true,
        }))
      )

      const { data: templates } = await supabase
        .from('checklist_templates')
        .insert(templateRows)
        .select('id, client_id, name, sort_order')

      // Build a lookup: client_id -> template[]
      const templatesByClient: Record<string, NonNullable<typeof templates>> = {}
      if (templates) {
        for (const t of templates) {
          if (!templatesByClient[t.client_id]) templatesByClient[t.client_id] = []
          templatesByClient[t.client_id]!.push(t)
        }
      }

      // 3. Batch insert payroll runs for all new clients
      const payrollRows = insertedClients.map((client, idx) => {
        const c = batch[idx]
        const payDay = c.pay_day || 'last_day_of_month'
        const nextPayDate = calculateNextPayDate(c.pay_frequency as PayFrequency, payDay, new Date())
        const { periodStart, periodEnd } = calculatePeriodDates(c.pay_frequency as PayFrequency, nextPayDate)
        const rtiDueDate = calculateRtiDueDate(nextPayDate)
        const epsDueDate = calculateEpsDueDate(nextPayDate)

        return {
          client_id: client.id,
          tenant_id: user.tenant_id,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
          pay_date: nextPayDate.toISOString().split('T')[0],
          status: 'not_started' as const,
          rti_due_date: rtiDueDate.toISOString().split('T')[0],
          eps_due_date: epsDueDate.toISOString().split('T')[0],
        }
      })

      const { data: payrollRuns } = await supabase
        .from('payroll_runs')
        .insert(payrollRows)
        .select('id, client_id')

      // 4. Batch insert checklist items for all new payroll runs
      if (payrollRuns && payrollRuns.length > 0) {
        const checklistItemRows = payrollRuns.flatMap((run) => {
          const clientTemplates = templatesByClient[run.client_id] || []
          return clientTemplates.map((t) => ({
            payroll_run_id: run.id,
            template_id: t.id,
            name: t.name,
            sort_order: t.sort_order,
            is_completed: false,
          }))
        })

        if (checklistItemRows.length > 0) {
          await supabase.from('checklist_items').insert(checklistItemRows)
        }
      }

      // Record results for this batch
      for (let i = 0; i < insertedClients.length; i++) {
        results.push({
          row: batchStart + i + 1,
          name: insertedClients[i].name,
          success: true,
          clientId: insertedClients[i].id,
        })
        successCount++
      }
    }

    // Audit log the import
    writeAuditLog({
      tenantId: user.tenant_id,
      userId: authUser.id,
      userEmail: authUser.email!,
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
