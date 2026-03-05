import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

export const PLANS = {
  starter: {
    name: 'Starter',
    priceId: null,
    price: 0,
    clients: 5,
    features: [
      'Up to 5 clients',
      'Payroll checklists',
      'HMRC deadline tracking',
      'Basic dashboard',
    ],
  },
  professional: {
    name: 'Professional',
    priceId: process.env.STRIPE_PRICE_PROFESSIONAL || null,
    price: 29,
    clients: 50,
    features: [
      'Up to 50 clients',
      'Everything in Starter',
      'CSV import & export',
      'Audit log',
      'Pension tracking',
      'Priority support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_PRICE_ENTERPRISE || null,
    price: 79,
    clients: Infinity,
    features: [
      'Unlimited clients',
      'Everything in Professional',
      'Training & CPD tracking',
      'Custom checklist templates',
      'Dedicated support',
    ],
  },
} as const

export type PlanKey = keyof typeof PLANS
