import Link from 'next/link'
import { cn } from '@/lib/utils'

interface MarketingFooterProps {
  className?: string
}

export function MarketingFooter({ className }: MarketingFooterProps) {
  return (
    <footer className={cn('bg-gray-900 py-9 px-10 max-[880px]:px-5 max-[880px]:py-7', className)}>
      <div className="max-w-[1160px] mx-auto flex justify-between items-center flex-wrap gap-4">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-[30px] h-[30px] bg-white/10 rounded-[7px] flex items-center justify-center text-[0.9rem]">
            🏢
          </div>
          <div>
            <div className="text-[0.85rem] font-bold text-white">ThePayBureau</div>
            <div className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-white/35">
              The UK&apos;s First Payroll CRM Powered by AI
            </div>
          </div>
        </Link>
        <div className="text-[0.72rem] text-white/35 leading-[1.7] text-right max-[880px]:text-left">
          View this roadmap online:<br />
          <Link href="/roadmap" className="text-white/60 no-underline font-semibold hover:text-white/90 transition-colors">
            thepaybureau.com/roadmap
          </Link>
        </div>
      </div>
    </footer>
  )
}
