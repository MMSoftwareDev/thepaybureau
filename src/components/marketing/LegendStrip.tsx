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
    <div className={cn('bg-white border-t border-gray-100 border-b border-b-gray-200 py-3.5 px-10 max-[880px]:px-5', className)}>
      <div className="max-w-[1160px] mx-auto flex items-center gap-2 flex-wrap">
        <span className="text-[0.62rem] font-bold uppercase tracking-[0.1em] text-gray-400 mr-1.5">
          Tiers
        </span>
        {items.map((item) => (
          <div
            key={item.label}
            className="inline-flex items-center gap-1.5 text-[0.72rem] font-medium text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md"
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
