import { cn } from '@/lib/utils'

interface HeroStat {
  value: string
  label: string
}

interface HeroStatsProps {
  stats: HeroStat[]
  className?: string
}

export function HeroStats({ stats, className }: HeroStatsProps) {
  return (
    <div
      className={cn(
        'flex w-fit rounded-xl border overflow-hidden',
        'max-sm:flex-col max-sm:w-full',
        className
      )}
      style={{
        background: 'var(--mkt-surface)',
        borderColor: 'var(--mkt-border)',
        boxShadow: 'var(--mkt-card-shadow)',
      }}
    >
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={cn(
            'px-7 py-4 text-center',
            i < stats.length - 1 && 'border-r max-sm:border-r-0 max-sm:border-b'
          )}
          style={{ borderColor: 'var(--mkt-border)' }}
        >
          <strong
            className="block text-[2rem] font-extrabold leading-none tracking-[-0.04em] mb-0.5"
            style={{ color: 'var(--mkt-purple)' }}
          >
            {stat.value}
          </strong>
          <span
            className="text-[0.62rem] font-semibold uppercase tracking-[0.09em]"
            style={{ color: 'var(--mkt-text-3)' }}
          >
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  )
}
