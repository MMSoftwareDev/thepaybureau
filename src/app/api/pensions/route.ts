// src/app/api/pensions/route.ts
import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

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

    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, name, status, pension_provider, pension_staging_date, pension_reenrolment_date, declaration_of_compliance_deadline')
      .eq('tenant_id', user.tenant_id)
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(clients || [])
  } catch (error) {
    console.error('Unexpected error in GET /api/pensions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const updateSchema = z.object({
  client_id: z.string().uuid(),
  pension_provider: z.string().optional(),
  pension_staging_date: z.string().optional().nullable(),
  pension_reenrolment_date: z.string().optional().nullable(),
  declaration_of_compliance_deadline: z.string().optional().nullable(),
})

export async function PUT(request: NextRequest) {
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

    const body = await request.json()
    const { client_id, ...updates } = updateSchema.parse(body)

    // Verify client belongs to tenant
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', client_id)
      .eq('tenant_id', user.tenant_id)
      .single()

    if (clientError || !client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const { data: updated, error: updateError } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', client_id)
      .select('id, name, status, pension_provider, pension_staging_date, pension_reenrolment_date, declaration_of_compliance_deadline')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Unexpected error in PUT /api/pensions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
