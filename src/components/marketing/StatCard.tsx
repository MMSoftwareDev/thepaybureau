import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const statNumVariants = cva(
  'text-[3.4rem] font-extrabold leading-none tracking-[-0.04em] mb-2',
  {
    variants: {
      phase: {
        v1: 'text-[#401D6C]',
        v2: 'text-[#EC385D]',
        v3: 'text-[#FF8073]',
        fv: 'text-[#2B0F4E]',
      },
    },
    defaultVariants: {
      phase: 'v1',
    },
  }
)

interface StatCardProps extends VariantProps<typeof statNumVariants> {
  value: string | number
  label: string
  note?: string
  className?: string
}

export function StatCard({ phase, value, label, note, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl px-6 py-7 text-center max-w-[200px] border transition-shadow duration-200',
        className
      )}
      style={{
        background: 'var(--mkt-surface)',
        borderColor: 'var(--mkt-border)',
        boxShadow: 'var(--mkt-card-shadow)',
      }}
    >
      <div className={statNumVariants({ phase })}>{value}</div>
      <div
        className="text-[0.78rem] leading-[1.5]"
        style={{ color: 'var(--mkt-text-2)' }}
        dangerouslySetInnerHTML={{ __html: label }}
      />
      {note && (
        <div
          className="mt-2.5 text-[0.64rem] italic leading-[1.5]"
          style={{ color: 'var(--mkt-text-3)' }}
          dangerouslySetInnerHTML={{ __html: note }}
        />
      )}
    </div>
  )
}
