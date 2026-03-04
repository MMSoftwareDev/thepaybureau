import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { adminRegistrationSchema } from '@/lib/validations'
import { z } from 'zod'
import dns from 'dns/promises'

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

    // Verify the domain has valid MX records (can actually receive email)
    try {
      const mxRecords = await dns.resolveMx(companyDomain)
      if (!mxRecords || mxRecords.length === 0) {
        return NextResponse.json({
          error: 'This email domain does not appear to accept emails. Please use a valid business email.'
        }, { status: 400 })
      }
    } catch {
      return NextResponse.json({
        error: 'We could not verify this email domain. Please check the address and try again.'
      }, { status: 400 })
    }
    
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
    
    // Build the callback URL from the request origin
    const origin = request.headers.get('origin') || request.headers.get('referer')?.replace(/\/[^/]*$/, '') || ''

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          name: validatedData.adminName,
          company: validatedData.companyName,
          phone: validatedData.phone
        },
        emailRedirectTo: `${origin}/auth/callback`
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
          setup_completed: false,
          default_checklist: [
            { name: 'Receive payroll changes', sort_order: 0 },
            { name: 'Process payroll', sort_order: 1 },
            { name: 'Review & approve', sort_order: 2 },
            { name: 'Send payslips', sort_order: 3 },
            { name: 'Submit RTI to HMRC', sort_order: 4 },
            { name: 'BACS payment', sort_order: 5 },
            { name: 'Pension submission', sort_order: 6 }
          ]
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
