import { cn } from '@/lib/utils'

interface HeroBadgeProps {
  children: React.ReactNode
  className?: string
}

export function HeroBadge({ children, className }: HeroBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 text-xs font-semibold tracking-[0.04em] px-3.5 py-1.5 rounded-full mb-6 border',
        className
      )}
      style={{
        background: 'color-mix(in srgb, var(--mkt-purple) 6%, transparent)',
        borderColor: 'color-mix(in srgb, var(--mkt-purple) 15%, transparent)',
        color: 'var(--mkt-purple)',
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-[pulse-dot_2.4s_ease_infinite]"
        style={{ background: 'var(--mkt-peach)' }}
      />
      {children}
    </div>
  )
}
