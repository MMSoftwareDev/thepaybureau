// src/app/api/badges/route.ts - Fetch user badges and stats
import { createServerSupabaseClient, getAuthUser } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { BADGE_DEFINITIONS, TOTAL_BADGES } from '@/lib/badges'

export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    const { data: user } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', authUser.id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch badges and stats in parallel
    const [badgesResult, statsResult] = await Promise.all([
      supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', authUser.id)
        .order('earned_at', { ascending: false }),
      supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', authUser.id)
        .single(),
    ])

    const badges = badgesResult.data ?? []
    const stats = statsResult.data

    // Compute next badges (closest unearned thresholds)
    const earnedSet = new Set(badges.map((b) => `${b.badge_key}:${b.badge_tier}`))
    const nextBadges = BADGE_DEFINITIONS.map((def) => {
      const statValue = stats ? (stats[def.statField as keyof typeof stats] as number) ?? 0 : 0
      const nextTier = def.tiers.find((t) => !earnedSet.has(`${def.key}:${t.tier}`))
      if (!nextTier) return null
      return {
        badge_key: def.key,
        badge_name: def.name,
        badge_icon: def.icon,
        next_tier: nextTier.tier,
        threshold: nextTier.threshold,
        current: statValue,
        progress: Math.min(100, Math.round((statValue / nextTier.threshold) * 100)),
        description: nextTier.description,
      }
    }).filter(Boolean)

    return NextResponse.json({
      badges,
      stats,
      nextBadges,
      totalEarned: badges.length,
      totalPossible: TOTAL_BADGES,
    })
  } catch (error) {
    console.error('Error fetching badges:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
