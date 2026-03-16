import { Check, X } from 'lucide-react'
import { APP_DOMAIN } from '@/lib/domains'

interface PlanFeature {
  label: string
  free: boolean | string
  unlimited: boolean | string
}

const FEATURES: PlanFeature[] = [
  { label: 'Client management', free: 'Up to 50 clients', unlimited: 'Unlimited' },
  { label: 'Payroll tracking & status', free: true, unlimited: true },
  { label: 'Deadline management with alerts', free: true, unlimited: true },
  { label: 'CSV import & export', free: true, unlimited: true },
  { label: 'AI Payroll Assistant', free: false, unlimited: true },
  { label: 'Training & CPD tracking', free: false, unlimited: true },
  { label: 'Email reminders', free: false, unlimited: true },
  { label: 'Audit trail', free: 'Basic', unlimited: true },
  { label: 'Priority support', free: false, unlimited: true },
]

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span className="text-sm" style={{ color: 'var(--mkt-text-2)', fontFamily: 'var(--font-inter)' }}>{value}</span>
  }
  if (value) {
    return (
      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'color-mix(in srgb, #188038 10%, transparent)' }}>
        <Check className="w-3.5 h-3.5" style={{ color: '#188038' }} />
      </div>
    )
  }
  return (
    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'color-mix(in srgb, var(--mkt-text-3) 10%, transparent)' }}>
      <X className="w-3.5 h-3.5" style={{ color: 'var(--mkt-text-3)' }} />
    </div>
  )
}

export function PricingSection() {
  return (
    <section id="pricing" style={{ background: 'var(--mkt-bg)' }}>
      <div className="max-w-[900px] mx-auto px-5 py-20 md:py-28">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="w-5 h-0.5 rounded-sm" style={{ background: 'var(--mkt-pink)' }} />
            <span
              className="text-xs font-bold tracking-[0.1em] uppercase"
              style={{ color: 'var(--mkt-pink)', fontFamily: 'var(--font-inter)' }}
            >
              Pricing
            </span>
          </div>
          <h2
            className="text-2xl md:text-[2.5rem] font-bold tracking-tight leading-tight mb-4"
            style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-display), DM Serif Display, serif' }}
          >
            Simple, transparent pricing
          </h2>
          <p
            className="text-base max-w-[440px] mx-auto"
            style={{ color: 'var(--mkt-text-2)', fontFamily: 'var(--font-body)' }}
          >
            Start free. Upgrade when you need more.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Free */}
          <div
            className="rounded-xl border p-6 md:p-8"
            style={{
              background: 'var(--mkt-surface)',
              borderColor: 'var(--mkt-border)',
            }}
          >
            <div className="mb-6">
              <h3
                className="text-lg font-bold mb-1"
                style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-inter)' }}
              >
                Free
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--mkt-text-3)', fontFamily: 'var(--font-inter)' }}>
                For individual consultants
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold" style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-inter)' }}>
                  &pound;0
                </span>
                <span className="text-sm" style={{ color: 'var(--mkt-text-3)' }}>/month</span>
              </div>
            </div>
            <a
              href={`${APP_DOMAIN}/signup`}
              className="w-full inline-flex items-center justify-center h-10 rounded-lg text-sm font-semibold border transition-colors duration-150 hover:opacity-90"
              style={{
                color: 'var(--mkt-purple)',
                borderColor: 'var(--mkt-border)',
                fontFamily: 'var(--font-inter)',
              }}
            >
              Start with Free
            </a>
          </div>

          {/* Unlimited */}
          <div
            className="rounded-xl border-2 p-6 md:p-8 relative"
            style={{
              background: 'color-mix(in srgb, var(--mkt-purple) 3%, var(--mkt-surface))',
              borderColor: 'var(--mkt-purple)',
              boxShadow: '0 4px 24px color-mix(in srgb, var(--mkt-purple) 10%, transparent)',
            }}
          >
            <div
              className="absolute -top-3 left-6 px-3 py-0.5 rounded-full text-xs font-bold text-white"
              style={{ background: 'var(--mkt-purple)', fontFamily: 'var(--font-inter)' }}
            >
              Most Popular
            </div>
            <div className="mb-6">
              <h3
                className="text-lg font-bold mb-1"
                style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-inter)' }}
              >
                Unlimited
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--mkt-text-3)', fontFamily: 'var(--font-inter)' }}>
                For Payroll Pros
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold" style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-inter)' }}>
                  &pound;19
                </span>
                <span className="text-sm" style={{ color: 'var(--mkt-text-3)' }}>/month</span>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--mkt-text-3)', fontFamily: 'var(--font-inter)' }}>
                Less than the cost of one missed HMRC penalty
              </p>
            </div>
            <a
              href={`${APP_DOMAIN}/signup`}
              className="w-full inline-flex items-center justify-center h-10 rounded-lg text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90"
              style={{ background: 'var(--mkt-purple)', fontFamily: 'var(--font-inter)' }}
            >
              Try Unlimited Free
            </a>
          </div>
        </div>

        {/* Feature comparison table */}
        <div
          className="mt-10 rounded-xl border overflow-hidden"
          style={{ borderColor: 'var(--mkt-border)', background: 'var(--mkt-surface)' }}
        >
          {/* Header */}
          <div
            className="grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_100px_100px] md:grid-cols-[1fr_140px_140px] px-4 sm:px-5 py-3 border-b"
            style={{ borderColor: 'var(--mkt-border)', background: 'var(--mkt-bg-alt)' }}
          >
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--mkt-text-3)', fontFamily: 'var(--font-inter)' }}>Feature</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--mkt-text-3)', fontFamily: 'var(--font-inter)' }}>Free</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-center" style={{ color: 'var(--mkt-text-3)', fontFamily: 'var(--font-inter)' }}>Unlimited</span>
          </div>
          {/* Rows */}
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className="grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_100px_100px] md:grid-cols-[1fr_140px_140px] px-4 sm:px-5 py-3 border-b last:border-b-0 items-center"
              style={{ borderColor: 'color-mix(in srgb, var(--mkt-border) 50%, transparent)' }}
            >
              <span className="text-sm" style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-inter)' }}>{f.label}</span>
              <div className="flex justify-center"><FeatureValue value={f.free} /></div>
              <div className="flex justify-center"><FeatureValue value={f.unlimited} /></div>
            </div>
          ))}
        </div>

        {/* Note */}
        <p
          className="text-center text-xs mt-6"
          style={{ color: 'var(--mkt-text-3)', fontFamily: 'var(--font-inter)' }}
        >
          All plans include pension declarations and payroll checklists. Team, Bureau &amp; Enterprise tiers coming soon.
        </p>
      </div>
    </section>
  )
}
