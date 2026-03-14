import { cn } from '@/lib/utils'
import { PhaseTag } from './PhaseTag'
import { FeaturePill } from './FeaturePill'

type Phase = 'v1' | 'v2' | 'v3' | 'fv'
type Tier = 'free' | 'unlimited' | 'team' | 'business' | 'enterprise' | 'vision'

interface TierSection {
  label: string
  tier: Tier
  features: string[]
}

interface PhaseCardProps {
  phase: Phase
  tag: string
  title: string
  description: string
  priceChip?: string
  tiers: TierSection[]
  className?: string
}

const topBarColors: Record<Phase, string> = {
  v1: 'bg-[#401D6C]',
  v2: 'bg-[#EC385D]',
  v3: 'bg-[#FF8073]',
  fv: 'bg-gradient-to-r from-[#2B0F4E] to-[#401D6C]',
}

const titleColors: Record<Phase, string> = {
  v1: 'text-[#401D6C]',
  v2: 'text-[#9B1234]',
  v3: 'text-[#7A3028]',
  fv: 'text-[#2B0F4E]',
}

const circleGlows: Record<Phase, string> = {
  v1: 'bg-[radial-gradient(circle,rgba(64,29,108,0.05)_0%,transparent_70%)]',
  v2: 'bg-[radial-gradient(circle,rgba(236,56,93,0.05)_0%,transparent_70%)]',
  v3: 'bg-[radial-gradient(circle,rgba(255,128,115,0.06)_0%,transparent_70%)]',
  fv: 'bg-[radial-gradient(circle,rgba(43,15,78,0.05)_0%,transparent_70%)]',
}

export function PhaseCard({ phase, tag, title, description, priceChip, tiers, className }: PhaseCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-7 relative overflow-hidden border transition-[transform,box-shadow] duration-200 hover:-translate-y-[3px]',
        className
      )}
      style={{
        background: 'var(--mkt-surface)',
        borderColor: 'var(--mkt-border)',
        boxShadow: 'var(--mkt-card-shadow)',
      }}
    >
      {/* Top colour bar */}
      <div className={cn('absolute top-0 left-0 right-0 h-[3px]', topBarColors[phase])} />

      {/* Circle glow */}
      <div className={cn('absolute -top-[60px] -right-[60px] w-[200px] h-[200px] rounded-full pointer-events-none', circleGlows[phase])} />

      <PhaseTag phase={phase}>{tag}</PhaseTag>

      <div
        className={cn('text-[1.7rem] font-extrabold tracking-[-0.03em] leading-[1.1] mb-2.5 relative z-[1]', titleColors[phase])}
        dangerouslySetInnerHTML={{ __html: title }}
      />

      <p
        className="text-[0.925rem] leading-[1.72] mb-[18px] max-w-[400px] relative z-[1]"
        style={{ color: 'var(--mkt-text-2)' }}
      >
        {description}
      </p>

      {priceChip && (
        <div
          className="inline-flex items-center gap-1.5 text-[0.78rem] font-semibold border px-3 py-[5px] rounded-lg mb-[22px] relative z-[1]"
          style={{
            color: 'var(--mkt-text)',
            background: 'var(--mkt-bg-alt)',
            borderColor: 'var(--mkt-border)',
          }}
        >
          {priceChip}
        </div>
      )}

      {tiers.map((tierSection) => (
        <div key={tierSection.label} className="mt-[18px] relative z-[1]">
          <div
            className="text-[0.68rem] font-bold tracking-[0.1em] uppercase mb-2.5 flex items-center gap-2.5"
            style={{ color: 'var(--mkt-text-3)' }}
          >
            {tierSection.label}
            <span className="flex-1 h-px" style={{ background: 'var(--mkt-border)' }} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tierSection.features.map((feature) => (
              <FeaturePill key={feature} tier={tierSection.tier}>
                {feature}
              </FeaturePill>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
