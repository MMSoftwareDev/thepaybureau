'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { useToast } from '@/components/ui/toast'
import {
  CreditCard,
  Check,
  Crown,
  Loader2,
  ExternalLink,
  Sparkles,
} from 'lucide-react'

interface SubscriptionInfo {
  plan: string
  planName: string
  subscription: {
    id: string
    status: string
    currentPeriodEnd: number
    cancelAtPeriodEnd: boolean
  } | null
  hasStripeCustomer: boolean
}

const PLAN_TIERS = [
  {
    key: 'starter',
    name: 'Starter',
    price: 0,
    period: 'Free forever',
    clients: '5 clients',
    features: [
      'Up to 5 clients',
      'Payroll checklists',
      'HMRC deadline tracking',
      'Basic dashboard',
    ],
  },
  {
    key: 'professional',
    name: 'Professional',
    price: 29,
    period: '/month',
    clients: '50 clients',
    popular: true,
    features: [
      'Up to 50 clients',
      'Everything in Starter',
      'CSV import & export',
      'Audit log',
      'Pension tracking',
      'Priority support',
    ],
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: 79,
    period: '/month',
    clients: 'Unlimited clients',
    features: [
      'Unlimited clients',
      'Everything in Professional',
      'Training & CPD tracking',
      'Custom checklist templates',
      'Dedicated support',
    ],
  },
]

export default function SubscriptionPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
      <SubscriptionPage />
    </Suspense>
  )
}

function SubscriptionPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { toast } = useToast()
  const searchParams = useSearchParams()

  useEffect(() => {
    setMounted(true)
    fetchSubscription()
  }, [])

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast('Subscription activated! Welcome aboard.', 'success')
      fetchSubscription()
    } else if (searchParams.get('cancelled') === 'true') {
      toast('Checkout cancelled', 'error')
    }
  }, [searchParams])

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/stripe/subscription')
      if (res.ok) {
        setSubscription(await res.json())
      }
    } catch {
      console.error('Failed to fetch subscription')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckout = async (plan: string) => {
    setCheckoutLoading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast(data.error || 'Failed to start checkout', 'error')
      }
    } catch {
      toast('Failed to start checkout', 'error')
    } finally {
      setCheckoutLoading(null)
    }
  }

  const handlePortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast(data.error || 'Failed to open billing portal', 'error')
      }
    } catch {
      toast('Failed to open billing portal', 'error')
    } finally {
      setPortalLoading(false)
    }
  }

  const cardStyle = {
    backgroundColor: colors.glass.card,
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    border: `1px solid ${colors.border}`,
    boxShadow: `0 4px 20px ${colors.shadow.light}`,
  }

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse max-w-5xl mx-auto">
        <div className="h-10 w-64 rounded-xl" style={{ background: colors.border }} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 rounded-2xl" style={{ background: colors.border }} />
          ))}
        </div>
      </div>
    )
  }

  const currentPlan = subscription?.plan || 'starter'

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1
          className="text-3xl md:text-4xl font-bold"
          style={{ color: colors.text.primary }}
        >
          Subscription
        </h1>
        <p className="text-base md:text-lg mt-2" style={{ color: colors.text.secondary }}>
          {subscription?.subscription
            ? 'Manage your subscription and billing'
            : 'Choose the plan that fits your bureau'}
        </p>
      </div>

      {/* Current Plan Banner */}
      {!loading && subscription?.subscription && (
        <Card className="border-0" style={{
          ...cardStyle,
          borderLeft: `3px solid ${colors.primary}`,
        }}>
          <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                }}
              >
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: colors.text.primary }}>
                  {subscription.planName} Plan
                </p>
                <p className="text-xs" style={{ color: colors.text.muted }}>
                  {subscription.subscription.cancelAtPeriodEnd
                    ? `Cancels ${new Date(subscription.subscription.currentPeriodEnd * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : `Renews ${new Date(subscription.subscription.currentPeriodEnd * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                </p>
              </div>
            </div>
            <Button
              onClick={handlePortal}
              disabled={portalLoading}
              variant="outline"
              className="rounded-xl font-semibold"
              style={{
                borderColor: colors.border,
                color: colors.text.primary,
                backgroundColor: colors.surface,
              }}
            >
              {portalLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              Manage Billing
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLAN_TIERS.map((tier) => {
          const isCurrent = currentPlan === tier.key
          const isUpgrade = PLAN_TIERS.findIndex(t => t.key === currentPlan) < PLAN_TIERS.findIndex(t => t.key === tier.key)
          const isDowngrade = PLAN_TIERS.findIndex(t => t.key === currentPlan) > PLAN_TIERS.findIndex(t => t.key === tier.key)

          return (
            <Card
              key={tier.key}
              className="border-0 relative overflow-hidden"
              style={{
                ...cardStyle,
                border: isCurrent
                  ? `2px solid ${colors.primary}`
                  : tier.popular
                    ? `2px solid ${colors.secondary}40`
                    : `1px solid ${colors.border}`,
                boxShadow: isCurrent
                  ? `0 8px 30px ${colors.primary}20`
                  : cardStyle.boxShadow,
              }}
            >
              {/* Popular badge */}
              {tier.popular && !isCurrent && (
                <div
                  className="absolute top-0 right-0 px-3 py-1 text-[0.68rem] font-bold text-white rounded-bl-xl"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                  }}
                >
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  Popular
                </div>
              )}

              {/* Current badge */}
              {isCurrent && (
                <div
                  className="absolute top-0 right-0 px-3 py-1 text-[0.68rem] font-bold text-white rounded-bl-xl"
                  style={{ backgroundColor: colors.primary }}
                >
                  Current Plan
                </div>
              )}

              <CardContent className="p-6">
                {/* Plan name & price */}
                <div className="mb-6">
                  <h3
                    className="text-lg font-bold mb-1"
                    style={{ color: colors.text.primary }}
                  >
                    {tier.name}
                  </h3>
                  <p className="text-xs font-medium mb-4" style={{ color: colors.text.muted }}>
                    {tier.clients}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-4xl font-bold"
                      style={{ color: colors.text.primary }}
                    >
                      {tier.price === 0 ? 'Free' : `£${tier.price}`}
                    </span>
                    {tier.price > 0 && (
                      <span className="text-sm" style={{ color: colors.text.muted }}>
                        {tier.period}
                      </span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-8">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: colors.success }}
                      />
                      <span className="text-[0.82rem]" style={{ color: colors.text.secondary }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Action button */}
                {isCurrent ? (
                  <Button
                    disabled
                    className="w-full rounded-xl font-semibold py-5"
                    style={{
                      backgroundColor: `${colors.primary}15`,
                      color: colors.primary,
                    }}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Current Plan
                  </Button>
                ) : isUpgrade ? (
                  <Button
                    onClick={() => handleCheckout(tier.key)}
                    disabled={loading || checkoutLoading === tier.key}
                    className="w-full rounded-xl font-semibold py-5 text-white border-0"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                      boxShadow: `0 4px 15px ${colors.primary}30`,
                    }}
                  >
                    {checkoutLoading === tier.key ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    Upgrade to {tier.name}
                  </Button>
                ) : isDowngrade && subscription?.subscription ? (
                  <Button
                    onClick={handlePortal}
                    disabled={portalLoading}
                    variant="outline"
                    className="w-full rounded-xl font-semibold py-5"
                    style={{
                      borderColor: colors.border,
                      color: colors.text.secondary,
                    }}
                  >
                    {portalLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Downgrade
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* FAQ / info */}
      <Card className="border-0" style={cardStyle}>
        <CardContent className="p-6">
          <h3 className="text-base font-bold mb-4" style={{ color: colors.text.primary }}>
            Frequently Asked Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: 'Can I change plan at any time?',
                a: 'Yes. Upgrades take effect immediately and you only pay the prorated difference. Downgrades apply at the end of your current billing period.',
              },
              {
                q: 'What happens if I exceed my client limit?',
                a: "You won't lose any data. You'll be prompted to upgrade when adding new clients beyond your plan's limit.",
              },
              {
                q: 'How does billing work?',
                a: 'Plans are billed monthly via Stripe. You can cancel anytime from the billing portal and your plan will remain active until the end of the period.',
              },
              {
                q: 'Is my payment information secure?',
                a: 'All payments are processed by Stripe. We never store your card details — they go directly to Stripe\'s PCI-compliant infrastructure.',
              },
            ].map((faq) => (
              <div key={faq.q}>
                <p className="text-[0.82rem] font-semibold mb-1" style={{ color: colors.text.primary }}>
                  {faq.q}
                </p>
                <p className="text-[0.78rem] leading-relaxed" style={{ color: colors.text.muted }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
