// src/app/api/clients/[id]/route.ts - Individual Client Operations

import { createServerSupabaseClient, ensureUserExists } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schema for client updates (all fields optional)
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
  industry: z.string().max(100).optional(),
  employee_count: z.number().int().positive().optional(),
  status: z.enum(['active', 'inactive', 'prospect']).optional(),
  notes: z.string().optional()
})

// GET /api/clients/[id] - Fetch single client with details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user exists
    const user = await ensureUserExists()
    if (!user) {
      return NextResponse.json({ error: 'User setup incomplete' }, { status: 400 })
    }

    // Fetch client with related data
    const { data: client, error } = await supabase
      .from('clients')
      .select(`
        id,
        name,
        company_number,
        email,
        phone,
        address,
        industry,
        employee_count,
        status,
        notes,
        created_at,
        updated_at,
        contacts(
          id,
          name,
          email,
          phone,
          role,
          is_primary
        ),
        contracts(
          id,
          name,
          contract_number,
          start_date,
          end_date,
          value,
          status,
          billing_frequency
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
      console.error('Database error fetching client:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Server error in GET /api/clients/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/clients/[id] - Update client
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user exists
    const user = await ensureUserExists()
    if (!user) {
      return NextResponse.json({ error: 'User setup incomplete' }, { status: 400 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = clientUpdateSchema.parse(body)

    // Check if client exists and belongs to user's tenant
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('id', params.id)
      .single()

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Update client
    const { data: client, error } = await supabase
      .from('clients')
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Database error updating client:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
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
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user exists
    const user = await ensureUserExists()
    if (!user) {
      return NextResponse.json({ error: 'User setup incomplete' }, { status: 400 })
    }

    // Check if client has active contracts
    const { data: activeContracts } = await supabase
      .from('contracts')
      .select('id, name')
      .eq('client_id', params.id)
      .eq('status', 'active')

    if (activeContracts && activeContracts.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete client with active contracts',
        details: `Client has ${activeContracts.length} active contract(s)`
      }, { status: 400 })
    }

    // Check if client has unpaid invoices
    const { data: unpaidInvoices } = await supabase
      .from('invoices')
      .select('id, invoice_number')
      .eq('client_id', params.id)
      .in('status', ['pending', 'sent', 'overdue'])

    if (unpaidInvoices && unpaidInvoices.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete client with unpaid invoices',
        details: `Client has ${unpaidInvoices.length} unpaid invoice(s)`
      }, { status: 400 })
    }

    // Delete client (contacts will be deleted automatically due to CASCADE)
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Database error deleting client:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Client deleted successfully',
      id: params.id 
    })
  } catch (error) {
    console.error('Server error in DELETE /api/clients/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}