import { getStripe, PLANS } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServerSupabaseClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const tenantId = session.metadata?.tenant_id
      const plan = session.metadata?.plan

      if (tenantId && plan) {
        await supabase
          .from('tenants')
          .update({ plan })
          .eq('id', tenantId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      // Find tenant by stripe customer ID
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, settings')

      const tenant = tenants?.find((t) => {
        const settings = (t.settings || {}) as Record<string, unknown>
        return settings.stripe_customer_id === customerId
      })

      if (tenant) {
        // Determine plan from price ID
        const priceId = subscription.items.data[0]?.price?.id
        let newPlan = 'starter'
        for (const [key, planDef] of Object.entries(PLANS)) {
          if (planDef.priceId === priceId) {
            newPlan = key
            break
          }
        }

        if (subscription.status === 'active') {
          await supabase.from('tenants').update({ plan: newPlan }).eq('id', tenant.id)
        }
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const { data: tenants } = await supabase
        .from('tenants')
        .select('id, settings')

      const tenant = tenants?.find((t) => {
        const settings = (t.settings || {}) as Record<string, unknown>
        return settings.stripe_customer_id === customerId
      })

      if (tenant) {
        await supabase.from('tenants').update({ plan: 'starter' }).eq('id', tenant.id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
