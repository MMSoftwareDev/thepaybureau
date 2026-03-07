// src/app/api/pensions/route.ts
import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { writeAuditLog, diffChanges } from '@/lib/audit'

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
      console.error('Database error in GET /api/pensions:', error)
      return NextResponse.json({ error: 'Failed to fetch pension data' }, { status: 400 })
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

    const body = await request.json()
    const { client_id, ...updates } = updateSchema.parse(body)

    // Fetch existing client for audit diff
    const { data: existingClient, error: clientError } = await supabase
      .from('clients')
      .select('id, name, pension_provider, pension_staging_date, pension_reenrolment_date, declaration_of_compliance_deadline')
      .eq('id', client_id)
      .eq('tenant_id', user.tenant_id)
      .single()

    if (clientError || !existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const { data: updated, error: updateError } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', client_id)
      .eq('tenant_id', user.tenant_id)
      .select('id, name, status, pension_provider, pension_staging_date, pension_reenrolment_date, declaration_of_compliance_deadline')
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update pension details' }, { status: 400 })
    }

    // Audit log: pension fields updated
    const changes = diffChanges(
      existingClient as unknown as Record<string, unknown>,
      updated as unknown as Record<string, unknown>
    )
    if (changes) {
      writeAuditLog({
        tenantId: user.tenant_id,
        userId: authUser.id,
        userEmail: authUser.email,
        action: 'UPDATE',
        resourceType: 'client',
        resourceId: client_id,
        resourceName: updated.name,
        changes,
        request,
      })
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
