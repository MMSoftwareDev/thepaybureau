import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const pillVariants = cva(
  'text-[0.8rem] font-medium px-3 py-1.5 rounded-md border border-transparent leading-none cursor-default whitespace-nowrap transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(0,0,0,0.07)]',
  {
    variants: {
      tier: {
        free: 'text-[#401D6C] bg-[#F8F4FF] border-[rgba(64,29,108,0.14)]',
        unlimited: 'text-[#401D6C] bg-white border-[#401D6C] font-semibold',
        team: 'text-[#9B1234] bg-[#FEE9EE] border-[rgba(236,56,93,0.14)]',
        bureau: 'text-[#9B1234] bg-white border-[#EC385D] font-semibold',
        enterprise: 'text-[#7A3028] bg-[#FFF3F1] border-[rgba(255,128,115,0.22)]',
        vision: 'text-[#2B0F4E] bg-[#EDE8F5] border-[rgba(43,15,78,0.16)]',
      },
    },
    defaultVariants: {
      tier: 'free',
    },
  }
)

interface FeaturePillProps extends VariantProps<typeof pillVariants> {
  children: React.ReactNode
  className?: string
}

export function FeaturePill({ tier, children, className }: FeaturePillProps) {
  return (
    <span className={cn(pillVariants({ tier }), className)}>
      {tier === 'unlimited' && <span className="text-[#FF8073] text-[0.65em] mr-0.5">✦ </span>}
      {children}
    </span>
  )
}
