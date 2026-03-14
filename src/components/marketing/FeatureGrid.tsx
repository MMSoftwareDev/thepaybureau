import {
  CheckSquare,
  Bell,
  Users,
  ShieldCheck,
  Bot,
  ClipboardList,
} from 'lucide-react'

const FEATURES = [
  {
    icon: CheckSquare,
    title: 'Payroll Checklists',
    description: 'Pre-built for monthly, weekly, and 4-weekly payrolls. Year-end, new starters, leavers — all ready to use.',
  },
  {
    icon: Bell,
    title: 'HMRC Deadline Tracking',
    description: 'Never miss RTI, FPS, or EPS deadlines. Auto-calculated from your pay dates and frequencies.',
  },
  {
    icon: Users,
    title: 'Client Management',
    description: 'Full CRM for payroll bureaux. Track contacts, PAYE references, pension details, and billing in one place.',
  },
  {
    icon: ShieldCheck,
    title: 'Pension & Auto-Enrolment',
    description: 'Track postponement dates, opt-outs, and re-enrolment cycles. Never miss a pension declaration.',
  },
  {
    icon: Bot,
    title: 'AI Assistant',
    description: 'Ask questions about your clients, deadlines, and payroll processes. Powered by Claude AI.',
  },
  {
    icon: ClipboardList,
    title: 'Audit Trail',
    description: 'Every action logged automatically. Export audit reports for compliance and peace of mind.',
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
            Everything you actually need
          </h2>
          <p
            className="text-base max-w-[480px] mx-auto"
            style={{ color: 'var(--mkt-text-2)', fontFamily: 'var(--font-body)' }}
          >
            Built specifically for payroll professionals. No bloat, no complexity — just the tools that matter.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl p-6 border transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: 'var(--mkt-surface)',
                borderColor: 'var(--mkt-border)',
                boxShadow: 'var(--mkt-card-shadow)',
              }}
            >
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
