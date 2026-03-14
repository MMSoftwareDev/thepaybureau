import { Clock, ShieldCheck, Users } from 'lucide-react'

const STATS = [
  { icon: Clock, value: '58s', label: 'Average setup time' },
  { icon: ShieldCheck, value: '0', label: 'Missed deadlines last month' },
  { icon: Users, value: '500+', label: 'Bureau specialists' },
]

export function TrustBar() {
  return (
    <section style={{ background: 'var(--mkt-bg-alt)' }}>
      <div className="max-w-[1200px] mx-auto px-5 py-12 md:py-14">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 md:gap-16">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'color-mix(in srgb, var(--mkt-purple) 8%, transparent)' }}
              >
                <stat.icon className="w-5 h-5" style={{ color: 'var(--mkt-purple)' }} />
              </div>
              <div>
                <div className="text-xl font-bold" style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-inter)' }}>
                  {stat.value}
                </div>
                <div className="text-xs font-medium" style={{ color: 'var(--mkt-text-3)', fontFamily: 'var(--font-inter)' }}>
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
