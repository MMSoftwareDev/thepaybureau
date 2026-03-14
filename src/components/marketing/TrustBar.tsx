const STATS = [
  { value: '60s', label: 'Setup time' },
  { value: '0', label: 'Deadlines missed' },
  { value: 'UK', label: 'Built & hosted' },
  { value: 'Free', label: 'Forever for individuals' },
]

export function TrustBar() {
  return (
    <section
      className="border-y"
      style={{ background: 'var(--mkt-bg-alt)', borderColor: 'var(--mkt-border)' }}
    >
      <div className="max-w-[1200px] mx-auto px-5 py-8 md:py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center text-center md:border-r md:last:border-r-0"
              style={{ borderColor: 'var(--mkt-border)' }}
            >
              <div
                className="text-2xl md:text-3xl font-bold tracking-tight"
                style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-inter)' }}
              >
                {stat.value}
              </div>
              <div
                className="text-xs font-medium mt-1"
                style={{ color: 'var(--mkt-text-3)', fontFamily: 'var(--font-inter)' }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
