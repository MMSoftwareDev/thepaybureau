import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { adminRegistrationSchema } from '@/lib/validations'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/resend'
import { welcomeEmail } from '@/lib/email-templates'
import { z } from 'zod'
import dns from 'dns/promises'

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 registration attempts per IP per 15 minutes
    const ip = getClientIp(request)
    const limiter = await rateLimit(`register:${ip}`, { limit: 5, windowSeconds: 900 })
    if (!limiter.success) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((limiter.resetAt - Date.now()) / 1000)) } }
      )
    }

    const supabase = createServerSupabaseClient()
    const body = await request.json()
    
    // Validate input data
    const validatedData = adminRegistrationSchema.parse(body)
    
    // Extract company domain
    const companyDomain = validatedData.email.split('@')[1]

    // Verify the domain has valid MX records (can actually receive email)
    // Timeout after 5 seconds to prevent hanging on slow/malicious DNS
    try {
      const mxRecords = await Promise.race([
        dns.resolveMx(companyDomain),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('DNS lookup timed out')), 5000)
        ),
      ])
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
    
    // Check if user already exists — use a generic message to prevent email enumeration
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', validatedData.email)
      .single()

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'If this email is not already registered, you will receive a verification email shortly.'
      })
    }
    
    // Build the callback URL — validate origin against allowed domains
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const requestOrigin = request.headers.get('origin') || request.headers.get('referer')?.replace(/\/[^/]*$/, '') || ''
    const allowedOrigins = [appUrl, 'http://localhost:3000', 'http://localhost:3001'].filter(Boolean)
    const origin = allowedOrigins.includes(requestOrigin) ? requestOrigin : appUrl

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          name: validatedData.adminName,
          company: validatedData.companyName,
          phone: validatedData.phone,
          ...(validatedData.utm ? { signup_utm: validatedData.utm } : {}),
        },
        emailRedirectTo: `${origin}/auth/callback`
      }
    })
    
    if (authError) {
      console.error('Auth user creation failed:', authError)
      return NextResponse.json({
        error: 'Failed to create account. Please try again.'
      }, { status: 400 })
    }
    
    if (!authData.user) {
      return NextResponse.json({ 
        error: 'Failed to create account' 
      }, { status: 500 })
    }
    
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
          ...(validatedData.utm ? { signup_utm: validatedData.utm } : {}),
          checklist_templates: [{
            id: crypto.randomUUID(),
            name: 'Standard Payroll',
            is_default: true,
            steps: [
              { name: 'Receive payroll changes', sort_order: 0 },
              { name: 'Process payroll', sort_order: 1 },
              { name: 'Review & approve', sort_order: 2 },
              { name: 'Send payslips', sort_order: 3 },
              { name: 'Submit RTI to HMRC', sort_order: 4 },
              { name: 'BACS payment', sort_order: 5 },
              { name: 'Pension submission', sort_order: 6 }
            ]
          }]
        }
      })
      .select()
      .single()
    
    if (tenantError) {
      console.error('Tenant creation failed:', tenantError)
      // Cleanup: remove auth user since tenant creation failed
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({
        error: 'Failed to setup company account'
      }, { status: 500 })
    }

    // Create user profile record
    const { error: userError } = await supabase
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
      console.error('User profile creation failed:', userError)
      // Cleanup: remove tenant and auth user
      await supabase.from('tenants').delete().eq('id', tenant.id)
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({
        error: 'Failed to setup user profile'
      }, { status: 500 })
    }
    
    // Send welcome email (must await — Vercel terminates after response)
    const welcome = welcomeEmail({ userName: validatedData.adminName, signupSource: validatedData.utm?.campaign })
    try {
      await sendEmail({ to: validatedData.email, ...welcome })
    } catch (err) {
      console.error('Welcome email failed:', err)
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Please check your email to verify your account.',
    })

  } catch (error) {
    console.error('Registration error:', error)
    
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
