import { UserPlus, Upload, ShieldCheck } from 'lucide-react'

const STEPS = [
  {
    icon: UserPlus,
    number: '1',
    title: 'Sign up in 60 seconds',
    description: 'Create your account. No credit card, no complex setup.',
  },
  {
    icon: Upload,
    number: '2',
    title: 'Add your clients',
    description: 'Import via CSV or add one by one. Deadlines auto-generate.',
  },
  {
    icon: ShieldCheck,
    number: '3',
    title: 'Never miss a deadline',
    description: 'Checklists, deadlines, and pension tracking — all handled.',
  },
]

export function HowItWorks() {
  return (
    <section style={{ background: 'var(--mkt-bg)' }}>
      <div className="max-w-[900px] mx-auto px-5 py-20 md:py-28">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="w-5 h-0.5 rounded-sm" style={{ background: 'var(--mkt-pink)' }} />
            <span
              className="text-xs font-bold tracking-[0.1em] uppercase"
              style={{ color: 'var(--mkt-pink)', fontFamily: 'var(--font-inter)' }}
            >
              How It Works
            </span>
          </div>
          <h2
            className="text-2xl md:text-[2.5rem] font-bold tracking-tight leading-tight"
            style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-display), DM Serif Display, serif' }}
          >
            Up and running in 3 steps
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 relative">
          {/* Connecting line (desktop only) */}
          <div
            className="hidden md:block absolute top-[28px] left-[16.67%] right-[16.67%] h-px"
            style={{ background: 'var(--mkt-border)' }}
          />

          {STEPS.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center relative">
              {/* Number circle */}
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-5 relative z-10 border-4"
                style={{
                  background: 'color-mix(in srgb, var(--mkt-purple) 8%, var(--mkt-bg))',
                  borderColor: 'var(--mkt-bg)',
                }}
              >
                <step.icon className="w-6 h-6" style={{ color: 'var(--mkt-purple)' }} />
              </div>

              {/* Step number */}
              <div
                className="text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: 'var(--mkt-purple)', fontFamily: 'var(--font-inter)' }}
              >
                Step {step.number}
              </div>

              {/* Title */}
              <h3
                className="text-[15px] font-semibold mb-2"
                style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-inter)' }}
              >
                {step.title}
              </h3>

              {/* Description */}
              <p
                className="text-sm leading-relaxed max-w-[250px]"
                style={{ color: 'var(--mkt-text-2)', fontFamily: 'var(--font-body)' }}
              >
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
