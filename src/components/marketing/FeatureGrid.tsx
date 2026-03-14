import {
  CheckSquare,
  Bell,
  Users,
  ShieldCheck,
  ClipboardList,
  Bot,
} from 'lucide-react'

const FEATURES = [
  {
    icon: CheckSquare,
    title: 'Payroll Checklists',
    description: 'Stop building checklists from scratch. Get pre-built templates for every payroll cycle — monthly, weekly, year-end, new starters.',
  },
  {
    icon: Bell,
    title: 'HMRC Deadline Tracking',
    description: 'Every RTI, FPS, and EPS deadline auto-calculated from your pay dates. See what\u2019s due today, tomorrow, and next week.',
    popular: true,
  },
  {
    icon: Users,
    title: 'Client Management',
    description: 'One place for every client — contacts, PAYE references, pension status, billing. No more switching between spreadsheets.',
  },
  {
    icon: ShieldCheck,
    title: 'Pension & Auto-Enrolment',
    description: 'Track auto-enrolment status, postponement dates, and re-enrolment cycles. Get alerts before you miss a declaration.',
  },
  {
    icon: ClipboardList,
    title: 'Audit Trail',
    description: 'Every change logged automatically. Export audit reports in one click for compliance reviews.',
  },
  {
    icon: Bot,
    title: 'AI Assistant',
    description: "Ask \u2018Which clients are due this week?\u2019 and get instant answers. Your AI-powered payroll assistant.",
  },
]

export function FeatureGrid() {
  return (
    <section id="features" style={{ background: 'var(--mkt-bg-alt)' }}>
      <div className="max-w-[1200px] mx-auto px-5 py-20 md:py-28">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="w-5 h-0.5 rounded-sm" style={{ background: 'var(--mkt-pink)' }} />
            <span
              className="text-xs font-bold tracking-[0.1em] uppercase"
              style={{ color: 'var(--mkt-pink)', fontFamily: 'var(--font-inter)' }}
            >
              Features
            </span>
          </div>
          <h2
            className="text-2xl md:text-[2.5rem] font-bold tracking-tight leading-tight mb-4"
            style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-display), DM Serif Display, serif' }}
          >
            Built for how you actually work
          </h2>
          <p
            className="text-base max-w-[480px] mx-auto"
            style={{ color: 'var(--mkt-text-2)', fontFamily: 'var(--font-body)' }}
          >
            Purpose-built for payroll professionals. No bloat, no complexity — just the tools that matter.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl p-6 border transition-all duration-200 hover:-translate-y-0.5 relative"
              style={{
                background: 'var(--mkt-surface)',
                borderColor: 'var(--mkt-border)',
                boxShadow: 'var(--mkt-card-shadow)',
              }}
            >
              {/* Popular badge */}
              {feature.popular && (
                <span
                  className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                  style={{ background: 'var(--mkt-purple)', fontFamily: 'var(--font-inter)' }}
                >
                  Popular
                </span>
              )}

              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ background: 'color-mix(in srgb, var(--mkt-purple) 8%, transparent)' }}
              >
                <feature.icon className="w-5 h-5" style={{ color: 'var(--mkt-purple)' }} />
              </div>
              <h3
                className="text-[15px] font-semibold mb-2"
                style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-inter)' }}
              >
                {feature.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--mkt-text-2)', fontFamily: 'var(--font-body)' }}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
