import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const phaseTagVariants = cva(
  'inline-flex items-center gap-1.5 text-[0.7rem] font-bold tracking-[0.08em] uppercase px-2.5 py-1 rounded-full border relative z-[1]',
  {
    variants: {
      phase: {
        v1: 'text-[#401D6C] bg-[#F8F4FF] border-[rgba(64,29,108,0.18)]',
        v2: 'text-[#9B1234] bg-[#FEE9EE] border-[rgba(236,56,93,0.18)]',
        v3: 'text-[#7A3028] bg-[#FFF3F1] border-[rgba(255,128,115,0.22)]',
        fv: 'text-[#2B0F4E] bg-[#EDE8F5] border-[rgba(43,15,78,0.18)]',
      },
    },
    defaultVariants: {
      phase: 'v1',
    },
  }
)

const dotColors = {
  v1: 'bg-[#401D6C]',
  v2: 'bg-[#EC385D]',
  v3: 'bg-[#FF8073]',
  fv: 'bg-[#2B0F4E]',
}

interface PhaseTagProps extends VariantProps<typeof phaseTagVariants> {
  children: React.ReactNode
  className?: string
}

export function PhaseTag({ phase, children, className }: PhaseTagProps) {
  return (
    <span className={cn(phaseTagVariants({ phase }), 'mb-3.5', className)}>
      <span className={cn('w-[5px] h-[5px] rounded-full shrink-0', dotColors[phase ?? 'v1'])} />
      {children}
    </span>
  )
}
