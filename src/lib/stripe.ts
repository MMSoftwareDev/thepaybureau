import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-06-30.basil',
    })
  }
  return _stripe
}

export const PLANS = {
  free: {
    name: 'Free',
    priceId: null,
    price: 0,
    annualPrice: 0,
    annualPriceId: null,
    clients: 50,
    features: [
      'Up to 50 clients',
      'Payroll runs',
      'Pension declarations',
      'Audit log',
      'Feature requests',
      'Email support',
    ],
  },
  unlimited: {
    name: 'Unlimited',
    priceId: process.env.STRIPE_PRICE_UNLIMITED_MONTHLY || null,
    price: 9,
    annualPrice: 7,
    annualPriceId: process.env.STRIPE_PRICE_UNLIMITED_ANNUAL || null,
    clients: Infinity,
    features: [
      'Everything in Free',
      'Unlimited clients',
      'AI Assistant',
      'Training & CPD tracking',
      'Priority support',
    ],
  },
} as const

export type PlanKey = keyof typeof PLANS

/** Routes that require a paid plan */
export const PAID_ONLY_ROUTES = [
  '/dashboard/ai-assistant',
  '/dashboard/training',
]

/** Check if a route requires a paid plan */
export function isRoutePaidOnly(pathname: string): boolean {
  return PAID_ONLY_ROUTES.some(route => pathname.startsWith(route))
}

/** Features that require a paid (unlimited) plan */
export const PAID_FEATURES = ['ai_assistant', 'training'] as const
export type PaidFeature = (typeof PAID_FEATURES)[number]

/**
 * Check if a tenant has access to a paid feature.
 * Returns true if the tenant is on a paid plan, false otherwise.
 */
export function hasPaidFeature(plan: string | null | undefined): boolean {
  return plan === 'unlimited'
}
