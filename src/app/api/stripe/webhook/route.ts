import { writeAuditLog } from '@/lib/audit'
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

  // Database-backed idempotency — survives cold starts and multi-instance deploys.
  // Check if we've already processed this event ID.
  const { data: existing } = await supabase
    .from('stripe_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ received: true, deduplicated: true })
  }

  try {
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

          await writeAuditLog({
            tenantId,
            userId: 'system',
            userEmail: 'stripe-webhook',
            action: 'UPDATE',
            resourceType: 'tenant',
            resourceId: tenantId,
            resourceName: `Plan changed to ${plan}`,
            changes: { plan },
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id

        // Find tenant by stripe customer ID using indexed JSONB query
        const { data: tenant } = await supabase
          .from('tenants')
          .select('id')
          .eq('settings->>stripe_customer_id', customerId)
          .single()

        if (tenant) {
          // Determine plan from price ID (check both monthly and annual)
          const priceId = subscription.items.data[0]?.price?.id
          let newPlan = 'free'
          for (const [key, planDef] of Object.entries(PLANS)) {
            if (planDef.priceId === priceId || planDef.annualPriceId === priceId) {
              newPlan = key
              break
            }
          }

          if (subscription.status === 'active') {
            await supabase.from('tenants').update({ plan: newPlan }).eq('id', tenant.id)

            await writeAuditLog({
              tenantId: tenant.id,
              userId: 'system',
              userEmail: 'stripe-webhook',
              action: 'UPDATE',
              resourceType: 'tenant',
              resourceId: tenant.id,
              resourceName: `Plan changed to ${newPlan}`,
              changes: { plan: newPlan, priceId },
            })
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id

        const { data: tenant } = await supabase
          .from('tenants')
          .select('id')
          .eq('settings->>stripe_customer_id', customerId)
          .single()

        if (tenant) {
          await supabase.from('tenants').update({ plan: 'free' }).eq('id', tenant.id)

          await writeAuditLog({
            tenantId: tenant.id,
            userId: 'system',
            userEmail: 'stripe-webhook',
            action: 'UPDATE',
            resourceType: 'tenant',
            resourceId: tenant.id,
            resourceName: 'Downgraded to free (subscription deleted)',
            changes: { plan: 'free' },
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id

        const { data: tenant } = await supabase
          .from('tenants')
          .select('id, settings')
          .eq('settings->>stripe_customer_id', customerId)
          .single()

        if (tenant) {
          const settings = (tenant.settings || {}) as Record<string, unknown>
          await supabase
            .from('tenants')
            .update({
              settings: {
                ...settings,
                payment_failed_at: new Date().toISOString(),
                payment_failed_invoice_id: invoice.id,
              },
            })
            .eq('id', tenant.id)

          await writeAuditLog({
            tenantId: tenant.id,
            userId: 'system',
            userEmail: 'stripe-webhook',
            action: 'UPDATE',
            resourceType: 'tenant',
            resourceId: tenant.id,
            resourceName: 'Payment failed',
            changes: { payment_failed_invoice_id: invoice.id },
          })
        }
        break
      }
    }

    // Mark event as processed ONLY after successful handling
    await supabase.from('stripe_events').insert({
      stripe_event_id: event.id,
      event_type: event.type,
    })
  } catch (err) {
    console.error(`Webhook handler failed for ${event.type}:`, err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
