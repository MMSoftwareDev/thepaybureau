// src/app/api/clients/route.ts
import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { createClientSchema } from '@/lib/validations'
import { z } from 'zod'
import type { User } from '@supabase/supabase-js'
import { writeAuditLog } from '@/lib/audit'
import { PLANS } from '@/lib/stripe'

async function getOrCreateUser(supabase: ReturnType<typeof createServerSupabaseClient>, authUser: User) {
  let { data: user } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', authUser.id)
    .single()

  if (!user) {
    const { data: newTenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: authUser.email?.split('@')[0] || 'My Bureau',
        plan: 'free',
      })
      .select()
      .single()

    if (tenantError) {
      return { user: null, error: 'Failed to create tenant' }
    }

    const { data: newUser, error: newUserError } = await supabase
      .from('users')
      .insert({
        id: authUser.id,
        tenant_id: newTenant.id,
        email: authUser.email!,
        name:
          authUser.user_metadata?.name ||
          authUser.email?.split('@')[0] ||
          'User',
      })
      .select()
      .single()

    if (newUserError) {
      return { user: null, error: 'Failed to create user' }
    }

    user = newUser
  }

  return { user, error: null }
}

export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()
    const { user, error: authError } = await getOrCreateUser(supabase, authUser)

    if (!user) {
      return NextResponse.json({ error: authError }, { status: 500 })
    }

    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false })

    if (clientsError) {
      console.error('Database error in GET /api/clients:', clientsError)
      return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 400 })
    }

    return NextResponse.json(clients || [])
  } catch (error) {
    console.error('Unexpected error in GET /api/clients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()
    const { user, error: authError } = await getOrCreateUser(supabase, authUser)

    if (!user) {
      return NextResponse.json({ error: authError }, { status: 500 })
    }

    // Check client limit for free tier
    const { data: tenant } = await supabase
      .from('tenants')
      .select('plan')
      .eq('id', user.tenant_id)
      .single()

    const plan = (tenant?.plan || 'free') as keyof typeof PLANS
    const clientLimit = PLANS[plan]?.clients ?? PLANS.free.clients

    if (clientLimit !== Infinity) {
      const { count } = await supabase
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', user.tenant_id)

      if ((count ?? 0) >= clientLimit) {
        return NextResponse.json(
          { error: 'Client limit reached. Upgrade your plan to add more clients.', limit: clientLimit, upgrade: true },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const validatedData = createClientSchema.parse(body)

    // Insert client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        ...validatedData,
        tenant_id: user.tenant_id,
        created_by: authUser.id,
        status: validatedData.status || 'active',
      })
      .select()
      .single()

    if (clientError) {
      console.error('Client creation error:', clientError)
      return NextResponse.json({ error: 'Failed to create client' }, { status: 400 })
    }

    // Audit log
    writeAuditLog({
      tenantId: user.tenant_id,
      userId: authUser.id,
      userEmail: authUser.email!,
      action: 'CREATE',
      resourceType: 'client',
      resourceId: client.id,
      resourceName: client.name,
      request,
    })

    return NextResponse.json(client)
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
