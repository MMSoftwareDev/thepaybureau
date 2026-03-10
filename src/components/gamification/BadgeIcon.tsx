'use client'

import {
  Award,
  Zap,
  CalendarCheck,
  Flame,
  Sun,
  ShieldCheck,
  CheckCheck,
  Trophy,
} from 'lucide-react'
import { TIER_COLORS } from '@/lib/badges'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Award,
  Zap,
  CalendarCheck,
  Flame,
  Sun,
  ShieldCheck,
  CheckCheck,
  Trophy,
}

interface BadgeIconProps {
  icon: string
  tier: 'bronze' | 'silver' | 'gold'
  size?: 'sm' | 'md' | 'lg'
  locked?: boolean
}

export default function BadgeIcon({ icon, tier, size = 'md', locked = false }: BadgeIconProps) {
  const Icon = ICON_MAP[icon] ?? Award
  const tierColor = TIER_COLORS[tier]

  const sizeMap = {
    sm: { outer: 32, inner: 14, ring: 2 },
    md: { outer: 44, inner: 20, ring: 2.5 },
    lg: { outer: 56, inner: 26, ring: 3 },
  }

  const s = sizeMap[size]

  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        width: s.outer,
        height: s.outer,
        border: `${s.ring}px solid ${locked ? '#D1D5DB' : tierColor}`,
        background: locked
          ? 'rgba(209, 213, 219, 0.1)'
          : `linear-gradient(135deg, ${tierColor}15, ${tierColor}30)`,
        opacity: locked ? 0.4 : 1,
      }}
    >
      <Icon
        className="flex-shrink-0"
        style={{
          width: s.inner,
          height: s.inner,
          color: locked ? '#9CA3AF' : tierColor,
        }}
      />
    </div>
  )
}
