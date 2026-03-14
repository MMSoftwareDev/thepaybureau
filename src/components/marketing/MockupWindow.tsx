import { cn } from '@/lib/utils'

interface MockupWindowProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function MockupWindow({ title, children, className }: MockupWindowProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border overflow-hidden',
        'bg-[var(--mkt-surface)] border-[var(--mkt-border)]',
        'shadow-[var(--mkt-card-shadow)]',
        className
      )}
    >
      {/* Title bar */}
      <div
        className="px-5 py-3.5 border-b flex items-center gap-3"
        style={{ borderColor: 'var(--mkt-border)', background: 'var(--mkt-bg-alt)' }}
      >
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <span className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <span
          className="text-sm font-semibold"
          style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-inter)' }}
        >
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}
