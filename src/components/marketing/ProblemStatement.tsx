import { AlertTriangle } from 'lucide-react'

const PAIN_POINTS = [
  'Spending 3 hours updating spreadsheets that should take 10 minutes',
  'Waking up at 3am wondering if you missed an RTI submission',
  "Your manager asks for an update — and you're scrambling through 15 spreadsheets",
  "Racing against HMRC deadlines with no single view of what's due",
]

export function ProblemStatement() {
  return (
    <section style={{ background: 'var(--mkt-bg)' }}>
      <div className="max-w-[680px] mx-auto px-5 py-20 md:py-28">
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

        {/* Headline — emotional, personal */}
        <h2
          className="text-3xl md:text-[2.5rem] font-bold tracking-tight mb-10 leading-tight"
          style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-display), DM Serif Display, serif' }}
        >
          You know the feeling.
        </h2>

        {/* Pain points list — tighter, 4 items */}
        <ul className="space-y-5">
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

        {/* Transition line */}
        <p
          className="mt-10 text-lg font-semibold"
          style={{ color: 'var(--mkt-purple)', fontFamily: 'var(--font-inter)' }}
        >
          There&apos;s a better way.
        </p>
      </div>
    </section>
  )
}
