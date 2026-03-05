import { getStripe, PLANS } from '@/lib/stripe'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// In-memory idempotency cache to prevent duplicate webhook processing.
// Stripe may deliver the same event multiple times — this ensures we only
// process each event ID once. TTL-based cleanup prevents unbounded growth.
const processedEvents = new Map<string, number>()
const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000 // 5 minutes

function hasProcessed(eventId: string): boolean {
  const timestamp = processedEvents.get(eventId)
  if (!timestamp) return false
  if (Date.now() - timestamp > IDEMPOTENCY_TTL_MS) {
    processedEvents.delete(eventId)
    return false
  }
  return true
}

function markProcessed(eventId: string): void {
  processedEvents.set(eventId, Date.now())

  // Periodic cleanup: remove expired entries when map grows large
  if (processedEvents.size > 1000) {
    const now = Date.now()
    for (const [id, ts] of processedEvents) {
      if (now - ts > IDEMPOTENCY_TTL_MS) processedEvents.delete(id)
    }
  }
}

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

  // Idempotency check — skip already-processed events
  if (hasProcessed(event.id)) {
    return NextResponse.json({ received: true, deduplicated: true })
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

      // Find tenant by stripe customer ID using indexed JSONB query
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('settings->>stripe_customer_id', customerId)
        .single()

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

      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('settings->>stripe_customer_id', customerId)
        .single()

      if (tenant) {
        await supabase.from('tenants').update({ plan: 'starter' }).eq('id', tenant.id)
      }
      break
    }
  }

  markProcessed(event.id)
  return NextResponse.json({ received: true })
}
