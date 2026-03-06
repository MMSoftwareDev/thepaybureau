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
    clients: 100,
    features: [
      'Up to 100 clients',
      'Payroll checklists',
      'HMRC deadline tracking',
      'Dashboard & reporting',
      'CSV import & export',
      'Audit log',
      'Pension tracking',
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
      'Unlimited clients',
      'Everything in Free',
      'Training & CPD tracking',
      'Custom checklist templates',
      'Priority support',
    ],
  },
} as const

export type PlanKey = keyof typeof PLANS
