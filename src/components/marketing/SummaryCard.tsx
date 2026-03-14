import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const barVariants = cva('h-[3px] rounded-sm mb-4', {
  variants: {
    phase: {
      v1: 'bg-[#401D6C]',
      v2: 'bg-[#EC385D]',
      v3: 'bg-[#FF8073]',
      fv: 'bg-gradient-to-r from-[#2B0F4E] to-[#401D6C]',
    },
  },
  defaultVariants: {
    phase: 'v1',
  },
})

interface SummaryCardProps extends VariantProps<typeof barVariants> {
  version: string
  name: string
  description: string
  className?: string
}

export function SummaryCard({ phase, version, name, description, className }: SummaryCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl px-5 py-[22px] border transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5',
        className
      )}
      style={{
        background: 'var(--mkt-surface)',
        borderColor: 'var(--mkt-border)',
        boxShadow: 'var(--mkt-card-shadow)',
      }}
    >
      <div className={barVariants({ phase })} />
      <div
        className="text-[0.58rem] font-bold tracking-[0.12em] uppercase mb-1.5"
        style={{ color: 'var(--mkt-text-3)' }}
      >
        {version}
      </div>
      <div
        className="text-[0.9rem] font-bold mb-1"
        style={{ color: 'var(--mkt-text)' }}
      >
        {name}
      </div>
      <div
        className="text-[0.75rem]"
        style={{ color: 'var(--mkt-text-2)' }}
      >
        {description}
      </div>
    </div>
  )
}
