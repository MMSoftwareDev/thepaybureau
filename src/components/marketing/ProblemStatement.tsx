import { AlertTriangle } from 'lucide-react'

const PAIN_POINTS = [
  "Can't remember if you submitted RTI for Smith & Co",
  'Manager asking for an update whilst you scramble through 15 spreadsheets',
  "3am wake-ups wondering if you missed someone's payroll",
  'Racing against HMRC deadlines with no clear overview',
  'Spending hours updating multiple spreadsheets for the same information',
  'Getting client calls asking where their payslips are',
]

export function ProblemStatement() {
  return (
    <section style={{ background: 'var(--mkt-bg)' }}>
      <div className="max-w-[720px] mx-auto px-5 py-20 md:py-28">
        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-4">
          <span className="w-5 h-0.5 rounded-sm" style={{ background: 'var(--mkt-pink)' }} />
          <span
            className="text-xs font-bold tracking-[0.1em] uppercase"
            style={{ color: 'var(--mkt-pink)', fontFamily: 'var(--font-inter)' }}
          >
            Sound Familiar?
          </span>
        </div>

        {/* Headline */}
        <h2
          className="text-2xl md:text-3xl font-bold tracking-tight mb-10"
          style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-display), DM Serif Display, serif' }}
        >
          The daily struggles of every payroll specialist
        </h2>

        {/* Pain points list */}
        <ul className="space-y-4">
          {PAIN_POINTS.map((point) => (
            <li key={point} className="flex items-start gap-3">
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'color-mix(in srgb, var(--mkt-pink) 8%, transparent)' }}
              >
                <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--mkt-pink)' }} />
              </div>
              <span
                className="text-[15px] leading-relaxed"
                style={{ color: 'var(--mkt-text-2)', fontFamily: 'var(--font-body)' }}
              >
                {point}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
