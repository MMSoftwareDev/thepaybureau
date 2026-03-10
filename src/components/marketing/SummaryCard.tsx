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
        'bg-white border border-gray-200 rounded-xl px-5 py-[22px] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(64,29,108,0.07)]',
        className
      )}
    >
      <div className={barVariants({ phase })} />
      <div className="text-[0.58rem] font-bold tracking-[0.12em] uppercase text-gray-400 mb-1.5">
        {version}
      </div>
      <div className="text-[0.9rem] font-bold text-gray-800 mb-1">{name}</div>
      <div className="text-[0.75rem] text-gray-500">{description}</div>
    </div>
  )
}
