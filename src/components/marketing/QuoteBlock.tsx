import { cn } from '@/lib/utils'

interface QuoteBlockProps {
  quote: string
  linkText?: string
  linkHref?: string
  className?: string
}

export function QuoteBlock({ quote, linkText, linkHref, className }: QuoteBlockProps) {
  return (
    <div
      className={cn(
        'bg-[#401D6C] rounded-2xl px-10 py-9 flex justify-between items-center gap-8 flex-wrap relative overflow-hidden',
        className
      )}
    >
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_120%_at_100%_50%,rgba(236,56,93,0.15)_0%,transparent_60%)]" />
      <div className="text-lg font-bold text-white leading-[1.45] tracking-[-0.015em] max-w-[520px] relative">
        <span className="text-[#FF8073] text-5xl font-serif leading-none align-[-0.5em] mr-1">&ldquo;</span>
        {quote}
      </div>
      {linkText && linkHref && (
        <div className="text-right relative shrink-0">
          <a
            href={linkHref}
            className="text-[0.75rem] font-bold tracking-[0.08em] uppercase text-white/60 no-underline hover:text-white/90 transition-colors"
          >
            {linkText}
          </a>
        </div>
      )}
    </div>
  )
}
