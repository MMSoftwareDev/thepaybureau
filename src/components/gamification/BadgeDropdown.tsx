'use client'

import { useState, useEffect } from 'react'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { BADGE_DEFINITIONS, TIER_COLORS, TOTAL_BADGES } from '@/lib/badges'
import BadgeIcon from './BadgeIcon'
import { Trophy, X, Lock } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

interface EarnedBadge {
  badge_key: string
  badge_tier: string
  earned_at: string
}

interface NextBadge {
  badge_key: string
  badge_name: string
  badge_icon: string
  next_tier: string
  threshold: number
  current: number
  progress: number
  description: string
}

interface BadgeData {
  badges: EarnedBadge[]
  totalEarned: number
  totalPossible: number
  nextBadges: NextBadge[]
  stats: Record<string, number> | null
}

interface BadgeDropdownProps {
  colors: ReturnType<typeof getThemeColors>
  isDark: boolean
}

export default function BadgeDropdown({ colors, isDark }: BadgeDropdownProps) {
  const [data, setData] = useState<BadgeData | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/badges')
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="px-3 py-2 border-b" style={{ borderColor: colors.border }}>
        <div className="h-8 rounded animate-pulse" style={{ background: colors.border }} />
      </div>
    )
  }

  const totalEarned = data?.totalEarned ?? 0
  const earnedSet = new Set((data?.badges ?? []).map((b) => `${b.badge_key}:${b.badge_tier}`))

  // Get 5 most recent badges for the preview row
  const recentBadges = (data?.badges ?? []).slice(0, 5)

  return (
    <>
      {/* Inline badge preview in dropdown */}
      <div className="px-3 py-2.5 border-b" style={{ borderColor: colors.border }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" style={{ color: '#FFD700' }} />
            <span className="text-[0.72rem] font-bold" style={{ color: colors.text.primary }}>
              Badges
            </span>
          </div>
          <span className="text-[0.65rem] font-medium" style={{ color: colors.text.muted }}>
            {totalEarned} of {TOTAL_BADGES}
          </span>
        </div>

        {/* Badge preview row */}
        {recentBadges.length > 0 ? (
          <div className="flex items-center gap-1.5 mb-2">
            {recentBadges.map((badge, i) => {
              const def = BADGE_DEFINITIONS.find((d) => d.key === badge.badge_key)
              if (!def) return null
              return (
                <BadgeIcon
                  key={`${badge.badge_key}-${badge.badge_tier}-${i}`}
                  icon={def.icon}
                  tier={badge.badge_tier as 'bronze' | 'silver' | 'gold'}
                  size="sm"
                />
              )
            })}
            {totalEarned > 5 && (
              <span className="text-[0.65rem] font-medium ml-0.5" style={{ color: colors.text.muted }}>
                +{totalEarned - 5}
              </span>
            )}
          </div>
        ) : (
          <p className="text-[0.68rem] mb-2" style={{ color: colors.text.muted }}>
            Complete payrolls to earn badges
          </p>
        )}

        {/* View All button */}
        <button
          onClick={() => setSheetOpen(true)}
          className="w-full text-[0.72rem] font-semibold py-1.5 rounded-md transition-colors"
          style={{
            color: colors.primary,
            backgroundColor: isDark ? `${colors.primary}15` : `${colors.primary}08`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? `${colors.primary}25` : `${colors.primary}15`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? `${colors.primary}15` : `${colors.primary}08`
          }}
        >
          View All Badges
        </button>
      </div>

      {/* Full badge grid sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[440px] overflow-y-auto p-0" style={{ backgroundColor: colors.surface }}>
          <div className="p-6 pb-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
            <SheetHeader className="p-0">
              <SheetTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.text.primary }}>
                <Trophy className="w-5 h-5" style={{ color: '#FFD700' }} />
                Achievements
              </SheetTitle>
              <SheetDescription className="text-[0.82rem]" style={{ color: colors.text.muted }}>
                {totalEarned} of {TOTAL_BADGES} badges earned
              </SheetDescription>
            </SheetHeader>

            {/* Progress bar */}
            <div className="mt-3">
              <div
                className="w-full h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${TOTAL_BADGES > 0 ? (totalEarned / TOTAL_BADGES) * 100 : 0}%`,
                    background: 'linear-gradient(90deg, #CD7F32, #C0C0C0, #FFD700)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Badge grid */}
          <div className="p-6 space-y-6">
            {BADGE_DEFINITIONS.map((def) => {
              const earned = def.tiers.filter((t) => earnedSet.has(`${def.key}:${t.tier}`))
              const highestTier = earned.length > 0 ? earned[earned.length - 1] : null

              return (
                <div key={def.key}>
                  <div className="flex items-center gap-3 mb-3">
                    <BadgeIcon
                      icon={def.icon}
                      tier={highestTier?.tier ?? 'bronze'}
                      size="md"
                      locked={!highestTier}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.88rem] font-semibold" style={{ color: colors.text.primary }}>
                        {def.name}
                      </p>
                      {highestTier ? (
                        <p className="text-[0.72rem] font-medium" style={{ color: TIER_COLORS[highestTier.tier] }}>
                          {highestTier.tier.charAt(0).toUpperCase() + highestTier.tier.slice(1)} earned
                        </p>
                      ) : (
                        <p className="text-[0.72rem]" style={{ color: colors.text.muted }}>
                          Not yet earned
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tier breakdown */}
                  <div className="ml-[56px] space-y-1.5">
                    {def.tiers.map((tier) => {
                      const isEarned = earnedSet.has(`${def.key}:${tier.tier}`)
                      const earnedBadge = data?.badges?.find(
                        (b) => b.badge_key === def.key && b.badge_tier === tier.tier
                      )
                      const nextBadge = data?.nextBadges?.find(
                        (n) => n && n.badge_key === def.key && n.next_tier === tier.tier
                      )

                      return (
                        <div
                          key={tier.tier}
                          className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg"
                          style={{
                            backgroundColor: isEarned
                              ? isDark ? `${TIER_COLORS[tier.tier]}15` : `${TIER_COLORS[tier.tier]}10`
                              : 'transparent',
                          }}
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: isEarned ? TIER_COLORS[tier.tier] : isDark ? '#4B5563' : '#D1D5DB',
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-[0.75rem] font-medium"
                              style={{
                                color: isEarned ? colors.text.primary : colors.text.muted,
                                textDecoration: isEarned ? 'none' : 'none',
                              }}
                            >
                              {tier.description}
                            </p>
                            {nextBadge && !isEarned && (
                              <div className="flex items-center gap-2 mt-1">
                                <div
                                  className="flex-1 h-1 rounded-full overflow-hidden"
                                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
                                >
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${nextBadge.progress}%`,
                                      backgroundColor: TIER_COLORS[tier.tier],
                                    }}
                                  />
                                </div>
                                <span className="text-[0.62rem] font-medium flex-shrink-0" style={{ color: colors.text.muted }}>
                                  {nextBadge.current}/{tier.threshold}
                                </span>
                              </div>
                            )}
                          </div>
                          {isEarned && earnedBadge && (
                            <span className="text-[0.62rem] flex-shrink-0" style={{ color: colors.text.muted }}>
                              {new Date(earnedBadge.earned_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
