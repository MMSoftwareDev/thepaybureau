import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { getStripe } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const limiter = await rateLimit(`stripe-portal:${ip}`, { limit: 10, windowSeconds: 900 })
    if (!limiter.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }

    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', authUser.id)
      .single()

    if (userError) console.error('User lookup failed in stripe/portal:', userError)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('settings')
      .eq('id', user.tenant_id)
      .single()

    if (tenantError) console.error('Tenant lookup failed in stripe/portal:', tenantError)

    const settings = (tenant?.settings || {}) as Record<string, unknown>
    const customerId = settings.stripe_customer_id as string | undefined

    if (!customerId) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await getStripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/dashboard/subscription`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe portal error:', error)
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }
}
