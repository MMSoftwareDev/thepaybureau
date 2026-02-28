// src/app/api/clients/route.ts
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const clientSchema = z.object({
  name: z.string().min(1).max(255),
  company_number: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    postcode: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  industry: z.string().optional(),
  employee_count: z.number().int().positive().optional(),
  status: z.enum(['active', 'inactive', 'prospect', 'onboarding']).default('onboarding'),
  notes: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    console.log('📊 GET /api/clients - Starting request')
    
    const supabase = createServerSupabaseClient()
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('🔐 Session check:', session ? 'Found' : 'Not found', sessionError ? `Error: ${sessionError.message}` : '')
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create user record
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', session.user.id)
      .single()

    console.log('👤 User lookup:', user ? 'Found' : 'Not found', userError ? `Error: ${userError.message}` : '')

    // If user doesn't exist, create a basic tenant and user
    if (!user) {
      console.log('🏗️ Creating new tenant and user...')
      
      // Create tenant first
      const { data: newTenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: session.user.email?.split('@')[0] || 'My Bureau',
          plan: 'starter'
        })
        .select()
        .single()

      if (tenantError) {
        console.error('❌ Tenant creation error:', tenantError)
        return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 })
      }

      // Create user record
      const { data: newUser, error: newUserError } = await supabase
        .from('users')
        .insert({
          id: session.user.id,
          tenant_id: newTenant.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User'
        })
        .select()
        .single()

      if (newUserError) {
        console.error('❌ User creation error:', newUserError)
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
      }

      user = newUser
      console.log('✅ Created new tenant and user')
    }

    if (!user) {
      return NextResponse.json({ error: 'Failed to resolve user' }, { status: 500 })
    }

    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', user.tenant_id)
      .order('created_at', { ascending: false })

    console.log('📋 Clients query:', clients ? `Found ${clients.length} clients` : 'No clients', clientsError ? `Error: ${clientsError.message}` : '')

    if (clientsError) {
      console.error('❌ Clients fetch error:', clientsError)
      return NextResponse.json({ error: clientsError.message }, { status: 400 })
    }

    console.log('✅ GET /api/clients - Success')
    return NextResponse.json(clients || [])
  } catch (error) {
    console.error('💥 Unexpected error in GET /api/clients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 POST /api/clients - Starting request')
    
    const supabase = createServerSupabaseClient()
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('🔐 Session check:', session ? 'Found' : 'Not found', sessionError ? `Error: ${sessionError.message}` : '')
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create user record (same logic as GET)
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', session.user.id)
      .single()

    console.log('👤 User lookup:', user ? 'Found' : 'Not found', userError ? `Error: ${userError.message}` : '')

    if (!user) {
      console.log('🏗️ Creating new tenant and user...')
      
      // Create tenant first
      const { data: newTenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: session.user.email?.split('@')[0] || 'My Bureau',
          plan: 'starter'
        })
        .select()
        .single()

      if (tenantError) {
        console.error('❌ Tenant creation error:', tenantError)
        return NextResponse.json({ error: 'Failed to create tenant' }, { status: 500 })
      }

      // Create user record
      const { data: newUser, error: newUserError } = await supabase
        .from('users')
        .insert({
          id: session.user.id,
          tenant_id: newTenant.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User'
        })
        .select()
        .single()

      if (newUserError) {
        console.error('❌ User creation error:', newUserError)
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
      }

      user = newUser
      console.log('✅ Created new tenant and user')
    }

    if (!user) {
      return NextResponse.json({ error: 'Failed to resolve user' }, { status: 500 })
    }

    const body = await request.json()
    console.log('📦 Request body received:', Object.keys(body))
    
    const validatedData = clientSchema.parse(body)
    console.log('✅ Data validation passed')

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        ...validatedData,
        tenant_id: user.tenant_id,
        created_by: session.user.id
      })
      .select()
      .single()

    console.log('📋 Client creation:', client ? 'Success' : 'Failed', clientError ? `Error: ${clientError.message}` : '')

    if (clientError) {
      console.error('❌ Client creation error:', clientError)
      return NextResponse.json({ error: clientError.message }, { status: 400 })
    }

    // Skip onboarding creation for now - debugging
    console.log('⏭️ Skipping onboarding record creation for debugging')

    console.log('✅ POST /api/clients - Success')
    return NextResponse.json(client)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error:', error.errors)
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    
    console.error('💥 Unexpected error in POST /api/clients:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}