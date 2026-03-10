import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  eyebrow: string
  title: string
  description?: string
  className?: string
}

export function SectionHeader({ eyebrow, title, description, className }: SectionHeaderProps) {
  return (
    <div className={cn('mb-14', className)}>
      <div className="inline-flex items-center gap-2 text-[0.68rem] font-bold tracking-[0.1em] uppercase text-[#EC385D] mb-3">
        <span className="w-5 h-0.5 bg-[#EC385D] rounded-sm" />
        {eyebrow}
      </div>
      <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold tracking-[-0.025em] text-gray-900 leading-[1.15] mb-3">
        {title}
      </h2>
      {description && (
        <p className="text-base text-gray-500 max-w-[520px] leading-[1.7]">
          {description}
        </p>
      )}
    </div>
  )
}
