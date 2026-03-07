import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { getStripe, PLANS } from '@/lib/stripe'
import { NextResponse } from 'next/server'

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

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, plan, settings')
      .eq('id', user.tenant_id)
      .single()

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const settings = (tenant.settings || {}) as Record<string, unknown>
    const customerId = settings.stripe_customer_id as string | undefined
    const currentPlan = (tenant.plan || 'free') as keyof typeof PLANS
    const planInfo = PLANS[currentPlan] || PLANS.free

    let subscription = null

    if (customerId) {
      const subscriptions = await getStripe().subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1,
      })

      if (subscriptions.data.length > 0) {
        const sub = subscriptions.data[0]
        // In the basil API, current_period_end is on subscription items
        const itemPeriodEnd = sub.items?.data?.[0]?.current_period_end ?? null
        subscription = {
          id: sub.id,
          status: sub.status,
          currentPeriodEnd: itemPeriodEnd ?? sub.cancel_at ?? sub.billing_cycle_anchor,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        }
      }
    }

    return NextResponse.json({
      plan: currentPlan,
      planName: planInfo.name,
      subscription,
      hasStripeCustomer: !!customerId,
    })
  } catch (error) {
    console.error('Subscription fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
  }
}
