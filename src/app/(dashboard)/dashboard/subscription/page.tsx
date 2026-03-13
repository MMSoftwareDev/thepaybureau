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
  Users,
  Lock,
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
    key: 'free',
    name: 'Free',
    tagline: 'Free forever',
    price: 0,
    annualPrice: 0,
    annualTotal: 0,
    clients: 'Up to 50 clients',
    icon: Users,
    features: [
      'Payroll runs',
      'Pension declarations',
      'Audit log',
      'Feature requests',
      'Email support',
    ],
  },
  {
    key: 'unlimited',
    name: 'Unlimited',
    tagline: 'For serious payrollers',
    price: 9,
    annualPrice: 7,
    annualTotal: 84,
    clients: 'Unlimited clients',
    icon: Crown,
    popular: true,
    features: [
      'Everything in Free',
      'Unlimited clients',
      'AI Assistant',
      'Training & CPD tracking',
      'Priority support',
    ],
  },
  {
    key: 'team',
    name: 'Team',
    tagline: 'Coming soon',
    price: null,
    annualPrice: null,
    annualTotal: null,
    clients: 'Unlimited clients',
    icon: Sparkles,
    comingSoon: true,
    features: [
      'Dedicated support',
      'Bureau dashboard',
      'White labelling',
      'Reporting',
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
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

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
        body: JSON.stringify({ plan, billingCycle }),
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
    backgroundColor: colors.surface,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
  }

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse max-w-5xl mx-auto">
        <div className="h-10 w-64 rounded-xl" style={{ background: colors.border }} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 rounded-lg" style={{ background: colors.border }} />
          ))}
        </div>
      </div>
    )
  }

  const currentPlan = subscription?.plan || 'free'

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1
          className="text-xl md:text-2xl font-bold"
          style={{ color: colors.text.primary }}
        >
          Choose your plan
        </h1>
        <p className="text-[0.82rem] mt-1" style={{ color: colors.text.muted }}>
          Simple pricing that grows with your bureau
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
              className="rounded-lg font-semibold"
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

      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center">
        <div
          className="flex items-center gap-1 p-1 rounded-xl"
          style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
        >
          <button
            onClick={() => setBillingCycle('monthly')}
            className="text-sm font-semibold px-5 py-2 rounded-lg transition-all"
            style={{
              backgroundColor: billingCycle === 'monthly' ? colors.surface : 'transparent',
              color: billingCycle === 'monthly' ? colors.text.primary : colors.text.muted,
              boxShadow: billingCycle === 'monthly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className="text-sm font-semibold px-5 py-2 rounded-lg transition-all flex items-center gap-2"
            style={{
              backgroundColor: billingCycle === 'annual' ? colors.surface : 'transparent',
              color: billingCycle === 'annual' ? colors.text.primary : colors.text.muted,
              boxShadow: billingCycle === 'annual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            Annual
            <span
              className="text-[0.68rem] font-bold px-1.5 py-0.5 rounded-md"
              style={{
                backgroundColor: `${colors.success}15`,
                color: colors.success,
              }}
            >
              Save 22%
            </span>
          </button>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLAN_TIERS.map((tier) => {
          const isCurrent = currentPlan === tier.key
          const isUpgrade = !tier.comingSoon && PLAN_TIERS.filter(t => !t.comingSoon).findIndex(t => t.key === currentPlan) < PLAN_TIERS.filter(t => !t.comingSoon).findIndex(t => t.key === tier.key)
          const isDowngrade = !tier.comingSoon && PLAN_TIERS.filter(t => !t.comingSoon).findIndex(t => t.key === currentPlan) > PLAN_TIERS.filter(t => !t.comingSoon).findIndex(t => t.key === tier.key)
          const displayPrice = billingCycle === 'annual' ? tier.annualPrice : tier.price
          const IconComponent = tier.icon

          return (
            <Card
              key={tier.key}
              className="border-0 relative overflow-hidden flex flex-col"
              style={{
                ...cardStyle,
                border: isCurrent
                  ? `2px solid ${colors.primary}`
                  : tier.popular
                    ? `2px solid ${colors.secondary}40`
                    : `1px solid ${colors.border}`,
                boxShadow: isCurrent
                  ? `0 8px 30px ${colors.primary}20`
                  : tier.popular
                    ? `0 4px 20px ${colors.secondary}10`
                    : 'none',
                opacity: tier.comingSoon ? 0.75 : 1,
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

              {/* Coming Soon badge */}
              {tier.comingSoon && (
                <div
                  className="absolute top-0 right-0 px-3 py-1 text-[0.68rem] font-bold rounded-bl-xl"
                  style={{
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                    color: colors.text.muted,
                  }}
                >
                  <Lock className="w-3 h-3 inline mr-1" />
                  Coming Soon
                </div>
              )}

              <CardContent className="p-6 flex flex-col flex-1">
                {/* Icon & Plan name */}
                <div className="mb-5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{
                      background: tier.comingSoon
                        ? isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
                        : tier.popular
                          ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                          : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    }}
                  >
                    <IconComponent
                      className="w-5 h-5"
                      style={{
                        color: tier.popular && !tier.comingSoon ? '#fff' : colors.text.muted,
                      }}
                    />
                  </div>
                  <h3
                    className="text-lg font-bold"
                    style={{ color: colors.text.primary }}
                  >
                    {tier.name}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: colors.text.muted }}>
                    {tier.tagline}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-5">
                  {tier.comingSoon ? (
                    <div className="flex items-baseline gap-1">
                      <span
                        className="text-2xl font-bold"
                        style={{ color: colors.text.muted }}
                      >
                        TBC
                      </span>
                    </div>
                  ) : displayPrice === 0 ? (
                    <div className="flex items-baseline gap-1">
                      <span
                        className="text-3xl font-bold"
                        style={{ color: colors.text.primary }}
                      >
                        £0
                      </span>
                      <span className="text-sm" style={{ color: colors.text.muted }}>
                        /month
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span
                          className="text-3xl font-bold"
                          style={{ color: colors.text.primary }}
                        >
                          £{displayPrice}
                        </span>
                        <span className="text-sm" style={{ color: colors.text.muted }}>
                          /month
                        </span>
                      </div>
                      {billingCycle === 'annual' && (
                        <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
                          £{tier.annualTotal}/year billed annually
                        </p>
                      )}
                      {billingCycle === 'monthly' && (
                        <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
                          or £{tier.annualTotal}/year with annual billing
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Clients */}
                <p
                  className="text-xs font-semibold mb-4 pb-4"
                  style={{
                    color: colors.text.secondary,
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                >
                  {tier.clients}
                </p>

                {/* Features */}
                <ul className="space-y-2.5 mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: tier.comingSoon ? colors.text.muted : colors.success }}
                      />
                      <span className="text-[0.82rem]" style={{ color: colors.text.secondary }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Action button */}
                {tier.comingSoon ? (
                  <Button
                    disabled
                    className="w-full rounded-lg font-semibold py-5"
                    style={{
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      color: colors.text.muted,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    Coming Soon
                  </Button>
                ) : tier.key === 'free' ? (
                  <Button
                    disabled
                    className="w-full rounded-lg font-semibold py-5"
                    style={{
                      backgroundColor: `${colors.primary}15`,
                      color: colors.primary,
                    }}
                  >
                    {isCurrent ? (
                      <><Check className="w-4 h-4 mr-2" />Current Plan</>
                    ) : (
                      'Free Forever'
                    )}
                  </Button>
                ) : isCurrent ? (
                  <Button
                    disabled
                    className="w-full rounded-lg font-semibold py-5"
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
                    className="w-full rounded-lg font-semibold py-5 text-white border-0"
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
                    className="w-full rounded-lg font-semibold py-5"
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

      {/* FAQ */}
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
                q: 'What happens if I reach my client limit?',
                a: "You won't lose any data. The Free plan allows up to 50 clients. When you reach the limit, you'll be prompted to upgrade to continue adding clients.",
              },
              {
                q: 'How does billing work?',
                a: 'Plans are billed monthly or annually via Stripe. You can cancel anytime from the billing portal and your plan will remain active until the end of the period.',
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
