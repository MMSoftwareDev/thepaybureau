import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { adminRegistrationSchema } from '@/lib/validations'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()
    
    console.log('📝 Registration request received')
    
    // Validate input data
    const validatedData = adminRegistrationSchema.parse(body)
    
    // Extract company domain
    const companyDomain = validatedData.email.split('@')[1]
    console.log('🏢 Company domain:', companyDomain)
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', validatedData.email)
      .single()
    
    if (existingUser) {
      return NextResponse.json({ 
        error: 'An account with this email already exists' 
      }, { status: 400 })
    }
    
    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          name: validatedData.adminName,
          company: validatedData.companyName,
          phone: validatedData.phone
        }
      }
    })
    
    if (authError) {
      console.error('❌ Auth user creation failed:', authError)
      return NextResponse.json({ 
        error: authError.message 
      }, { status: 400 })
    }
    
    if (!authData.user) {
      return NextResponse.json({ 
        error: 'Failed to create account' 
      }, { status: 500 })
    }
    
    console.log('✅ Auth user created:', authData.user.id)
    
    // Create tenant record
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: validatedData.companyName,
        plan: 'trial',
        mode: 'playground',
        allowed_domains: [companyDomain],
        demo_data_active: true,
        can_switch_modes: true,
        settings: {
          industry: 'payroll_bureau',
          company_domain: companyDomain,
          setup_completed: false
        }
      })
      .select()
      .single()
    
    if (tenantError) {
      console.error('❌ Tenant creation failed:', tenantError)
      return NextResponse.json({ 
        error: 'Failed to setup company account' 
      }, { status: 500 })
    }
    
    console.log('✅ Tenant created:', tenant.id)
    
    // Create user profile record
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        tenant_id: tenant.id,
        email: validatedData.email,
        name: validatedData.adminName,
        role: 'admin',
        is_active: true
      })
      .select()
      .single()
    
    if (userError) {
      console.error('❌ User profile creation failed:', userError)
      return NextResponse.json({ 
        error: 'Failed to setup user profile' 
      }, { status: 500 })
    }
    
    console.log('✅ User profile created')
    
    // Create demo data for playground mode
    await createDemoData(supabase, tenant.id, authData.user.id)
    
    console.log('✅ Registration completed successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.',
      data: {
        userId: authData.user.id,
        tenantId: tenant.id,
        companyName: tenant.name,
        email: validatedData.email
      }
    })
    
  } catch (error) {
    console.error('💥 Registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Helper function to create demo data
async function createDemoData(supabase: any, tenantId: string, userId: string) {
  try {
    console.log('🎮 Creating demo data for tenant:', tenantId)
    
    // Get demo client template
    const { data: template } = await supabase
      .from('demo_data_templates')
      .select('data')
      .eq('name', 'default_clients')
      .single()
    
    if (template?.data) {
      const demoClients = template.data.map((client: any) => ({
        ...client,
        tenant_id: tenantId,
        created_by: userId,
        notes: 'Demo client - explore features risk-free!'
      }))
      
      // Insert demo clients
      const { data: insertedClients, error: clientError } = await supabase
        .from('clients')
        .insert(demoClients)
        .select()
      
      if (!clientError && insertedClients) {
        console.log('✅ Demo clients created:', insertedClients.length)
      }
    }
    
    console.log('✅ Demo data created')
  } catch (error) {
    console.warn('⚠️ Demo data creation failed:', error)
    // Don't fail registration for demo data issues
  }
}