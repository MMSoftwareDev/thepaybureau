import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { stripe, PLANS, PlanKey } from '@/lib/stripe'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan } = (await req.json()) as { plan: PlanKey }

    if (!plan || !PLANS[plan] || !PLANS[plan].priceId) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
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

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, name, settings')
      .eq('id', user.tenant_id)
      .single()

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const settings = (tenant.settings || {}) as Record<string, unknown>
    let customerId = settings.stripe_customer_id as string | undefined

    // Create Stripe customer if needed
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: authUser.email!,
        name: tenant.name,
        metadata: { tenant_id: tenant.id },
      })
      customerId = customer.id

      await supabase
        .from('tenants')
        .update({
          settings: { ...settings, stripe_customer_id: customerId },
        })
        .eq('id', tenant.id)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: PLANS[plan].priceId!, quantity: 1 }],
      success_url: `${appUrl}/dashboard/subscription?success=true`,
      cancel_url: `${appUrl}/dashboard/subscription?cancelled=true`,
      metadata: { tenant_id: tenant.id, plan },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
