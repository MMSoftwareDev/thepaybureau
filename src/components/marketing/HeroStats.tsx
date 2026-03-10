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
        'flex w-fit bg-white border border-gray-200 rounded-xl shadow-[0_1px_8px_rgba(0,0,0,0.05)] overflow-hidden',
        'max-sm:flex-col max-sm:w-full',
        className
      )}
    >
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={cn(
            'px-7 py-4 text-center',
            i < stats.length - 1 && 'border-r border-gray-100 max-sm:border-r-0 max-sm:border-b max-sm:border-gray-100'
          )}
        >
          <strong className="block text-[2rem] font-extrabold text-[#401D6C] leading-none tracking-[-0.04em] mb-0.5">
            {stat.value}
          </strong>
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.09em] text-gray-400">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  )
}
