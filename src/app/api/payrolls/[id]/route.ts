// src/app/api/payrolls/[id]/route.ts — Individual Payroll Operations
import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { updatePayrollSchema } from '@/lib/validations'
import { z } from 'zod'
import { writeAuditLog, diffChanges } from '@/lib/audit'

// GET /api/payrolls/[id] — Fetch single payroll with templates and runs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const { data: payroll, error } = await supabase
      .from('payrolls')
      .select('*, clients(name), checklist_templates(*)')
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Payroll not found' }, { status: 404 })
      }
      console.error('Database error fetching payroll:', error)
      return NextResponse.json({ error: 'Failed to fetch payroll' }, { status: 400 })
    }

    // Fetch payroll runs
    const { data: payrollRuns } = await supabase
      .from('payroll_runs')
      .select('id, period_start, period_end, pay_date, status, rti_due_date, eps_due_date, created_at, updated_at')
      .eq('payroll_id', id)
      .order('pay_date', { ascending: false })

    return NextResponse.json({
      ...payroll,
      payroll_runs: payrollRuns || [],
    })
  } catch (error) {
    console.error('Server error in GET /api/payrolls/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/payrolls/[id] — Update payroll
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()
    const body = await request.json()
    const validatedData = updatePayrollSchema.parse(body)

    const { checklist_templates, ...payrollFields } = validatedData

    const { data: user } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', authUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch existing payroll for audit diff
    const { data: existingPayroll } = await supabase
      .from('payrolls')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .single()

    if (!existingPayroll) {
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 })
    }

    // Update payroll
    const { data: payroll, error } = await supabase
      .from('payrolls')
      .update({
        ...payrollFields,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .select()
      .single()

    if (error) {
      console.error('Database error updating payroll:', error)
      return NextResponse.json({ error: 'Failed to update payroll' }, { status: 400 })
    }

    // Audit log
    const changes = diffChanges(
      existingPayroll as unknown as Record<string, unknown>,
      payroll as unknown as Record<string, unknown>
    )
    if (changes) {
      writeAuditLog({
        tenantId: user.tenant_id,
        userId: authUser.id,
        userEmail: authUser.email!,
        action: 'UPDATE',
        resourceType: 'payroll',
        resourceId: id,
        resourceName: payroll.name,
        changes,
        request,
      })
    }

    // Update checklist templates if provided
    if (checklist_templates) {
      await supabase
        .from('checklist_templates')
        .delete()
        .eq('payroll_id', id)

      if (checklist_templates.length > 0) {
        await supabase
          .from('checklist_templates')
          .insert(
            checklist_templates.map((t) => ({
              name: t.name,
              sort_order: t.sort_order,
              client_id: existingPayroll.client_id,
              payroll_id: id,
              is_active: true,
            }))
          )
      }
    }

    return NextResponse.json(payroll)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }, { status: 400 })
    }

    console.error('Server error in PUT /api/payrolls/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/payrolls/[id] — Delete payroll
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const { data: payrollToDelete } = await supabase
      .from('payrolls')
      .select('name')
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .single()

    if (!payrollToDelete) {
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('payrolls')
      .delete()
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)

    if (error) {
      console.error('Database error deleting payroll:', error)
      return NextResponse.json({ error: 'Failed to delete payroll' }, { status: 400 })
    }

    writeAuditLog({
      tenantId: user.tenant_id,
      userId: authUser.id,
      userEmail: authUser.email!,
      action: 'DELETE',
      resourceType: 'payroll',
      resourceId: id,
      resourceName: payrollToDelete.name,
      request,
    })

    return NextResponse.json({ message: 'Payroll deleted successfully', id })
  } catch (error) {
    console.error('Server error in DELETE /api/payrolls/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
