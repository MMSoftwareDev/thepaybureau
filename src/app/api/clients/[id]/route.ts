// src/app/api/clients/[id]/route.ts - Individual Client Operations

import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schema for client updates (all fields optional)
const checklistTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  sort_order: z.number().int().min(0),
})

const clientUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  company_number: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    postcode: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  employee_count: z.number().int().positive().optional(),
  status: z.enum(['active', 'inactive', 'prospect']).optional(),
  notes: z.string().optional(),
  paye_reference: z.string().optional(),
  accounts_office_ref: z.string().max(13).optional(),
  pay_frequency: z.enum(['weekly', 'fortnightly', 'four_weekly', 'monthly', 'annually']).optional(),
  pay_day: z.string().optional(),
  payroll_software: z.string().optional(),
  pension_provider: z.string().optional(),
  pension_staging_date: z.string().optional(),
  pension_reenrolment_date: z.string().optional(),
  declaration_of_compliance_deadline: z.string().optional(),
  contact_name: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  checklist_templates: z.array(checklistTemplateSchema).optional(),
})

// GET /api/clients/[id] - Fetch single client with details
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

    // Get user to verify tenant ownership
    const { data: user } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', authUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch client with checklist templates
    const { data: client, error } = await supabase
      .from('clients')
      .select('*, checklist_templates(*)')
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
      console.error('Database error fetching client:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Fetch payroll runs for this client
    const { data: payrollRuns } = await supabase
      .from('payroll_runs')
      .select('id, period_start, period_end, pay_date, status, rti_due_date, eps_due_date, created_at, updated_at')
      .eq('client_id', id)
      .order('pay_date', { ascending: false })

    return NextResponse.json({
      ...client,
      payroll_runs: payrollRuns || [],
    })
  } catch (error) {
    console.error('Server error in GET /api/clients/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/clients/[id] - Update client
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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = clientUpdateSchema.parse(body)

    // Separate checklist_templates from client fields
    const { checklist_templates, ...clientFields } = validatedData

    // Get user's tenant_id
    const { data: user } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', authUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if client exists and belongs to user's tenant
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', user.tenant_id)
      .single()

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Update client
    const { data: client, error } = await supabase
      .from('clients')
      .update({
        ...clientFields,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error updating client:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Update checklist templates if provided
    if (checklist_templates) {
      // Delete existing templates
      const { error: deleteError } = await supabase
        .from('checklist_templates')
        .delete()
        .eq('client_id', id)

      if (deleteError) {
        console.error('Database error deleting checklist templates:', deleteError)
        return NextResponse.json({ error: deleteError.message }, { status: 400 })
      }

      // Insert new templates
      if (checklist_templates.length > 0) {
        const { error: insertError } = await supabase
          .from('checklist_templates')
          .insert(
            checklist_templates.map((t) => ({
              name: t.name,
              sort_order: t.sort_order,
              client_id: id,
              is_active: true,
            }))
          )

        if (insertError) {
          console.error('Database error inserting checklist templates:', insertError)
          return NextResponse.json({ error: insertError.message }, { status: 400 })
        }
      }
    }

    return NextResponse.json(client)
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

    console.error('Server error in PUT /api/clients/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/clients/[id] - Delete client
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

    // Delete client (related records will cascade)
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error deleting client:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      message: 'Client deleted successfully',
      id
    })
  } catch (error) {
    console.error('Server error in DELETE /api/clients/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
