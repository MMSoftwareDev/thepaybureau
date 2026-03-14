import { cn } from '@/lib/utils'

interface LegendItem {
  color: string
  label: string
}

interface LegendStripProps {
  items: LegendItem[]
  className?: string
}

export function LegendStrip({ items, className }: LegendStripProps) {
  return (
    <div
      className={cn('border-y py-3.5 px-10 max-[880px]:px-5', className)}
      style={{ background: 'var(--mkt-surface)', borderColor: 'var(--mkt-border)' }}
    >
      <div className="max-w-[1160px] mx-auto flex items-center gap-2 flex-wrap">
        <span
          className="text-[0.62rem] font-bold uppercase tracking-[0.1em] mr-1.5"
          style={{ color: 'var(--mkt-text-3)' }}
        >
          Tiers
        </span>
        {items.map((item) => (
          <div
            key={item.label}
            className="inline-flex items-center gap-1.5 text-[0.72rem] font-medium border px-2.5 py-1 rounded-md"
            style={{
              color: 'var(--mkt-text-2)',
              background: 'var(--mkt-bg-alt)',
              borderColor: 'var(--mkt-border)',
            }}
          >
            <span
              className="w-[7px] h-[7px] rounded-sm shrink-0"
              style={{ background: item.color }}
            />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}
