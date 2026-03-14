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
      <div
        className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.1em] uppercase mb-3"
        style={{ color: 'var(--mkt-pink)', fontFamily: 'var(--font-inter)' }}
      >
        <span className="w-5 h-0.5 rounded-sm" style={{ background: 'var(--mkt-pink)' }} />
        {eyebrow}
      </div>
      <h2
        className="text-[clamp(1.6rem,3vw,2.2rem)] font-bold tracking-[-0.025em] leading-[1.15] mb-3"
        style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-display), DM Serif Display, serif' }}
      >
        {title}
      </h2>
      {description && (
        <p
          className="text-base max-w-[520px] leading-relaxed"
          style={{ color: 'var(--mkt-text-2)', fontFamily: 'var(--font-body)' }}
        >
          {description}
        </p>
      )}
    </div>
  )
}
