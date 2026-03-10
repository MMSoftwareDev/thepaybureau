import { cn } from '@/lib/utils'

interface HeroBadgeProps {
  children: React.ReactNode
  className?: string
}

export function HeroBadge({ children, className }: HeroBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 bg-[rgba(64,29,108,0.06)] border border-[rgba(64,29,108,0.15)] text-[#401D6C] text-[0.72rem] font-semibold tracking-[0.06em] px-3.5 py-1.5 rounded-full mb-6',
        className
      )}
    >
      <span className="w-1.5 h-1.5 bg-[#FF8073] rounded-full animate-[pulse-dot_2.4s_ease_infinite]" />
      {children}
    </div>
  )
}
