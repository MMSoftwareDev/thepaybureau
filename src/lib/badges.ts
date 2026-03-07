// src/lib/badges.ts - Badge definitions, stat tracking, and award logic
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// ── Badge Definitions ──────────────────────────────────────────────────────────

export interface BadgeTier {
  tier: 'bronze' | 'silver' | 'gold'
  threshold: number
  description: string
}

export interface BadgeDefinition {
  key: string
  name: string
  icon: string // lucide icon name
  statField: keyof UserStatsFields
  tiers: BadgeTier[]
}

interface UserStatsFields {
  payrolls_completed: number
  early_completions: number
  steps_completed: number
  early_steps: number
  current_streak_weeks: number
  perfect_months: number
  zero_overdue_months: number
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    key: 'payroll_pro',
    name: 'Payroll Pro',
    icon: 'Award',
    statField: 'payrolls_completed',
    tiers: [
      { tier: 'bronze', threshold: 10, description: 'Complete 10 payroll runs' },
      { tier: 'silver', threshold: 50, description: 'Complete 50 payroll runs' },
      { tier: 'gold', threshold: 200, description: 'Complete 200 payroll runs' },
    ],
  },
  {
    key: 'speed_demon',
    name: 'Speed Demon',
    icon: 'Zap',
    statField: 'early_completions',
    tiers: [
      { tier: 'bronze', threshold: 1, description: 'Complete a payroll 3+ days early' },
      { tier: 'silver', threshold: 10, description: 'Complete 10 payrolls early' },
      { tier: 'gold', threshold: 50, description: 'Complete 50 payrolls early' },
    ],
  },
  {
    key: 'perfect_month',
    name: 'Perfect Month',
    icon: 'CalendarCheck',
    statField: 'perfect_months',
    tiers: [
      { tier: 'bronze', threshold: 1, description: '100% on-time in a month' },
      { tier: 'silver', threshold: 3, description: '3 perfect months' },
      { tier: 'gold', threshold: 12, description: '12 perfect months' },
    ],
  },
  {
    key: 'streak_master',
    name: 'Streak Master',
    icon: 'Flame',
    statField: 'current_streak_weeks',
    tiers: [
      { tier: 'bronze', threshold: 2, description: '2-week activity streak' },
      { tier: 'silver', threshold: 4, description: '4-week streak' },
      { tier: 'gold', threshold: 12, description: '12-week streak' },
    ],
  },
  {
    key: 'early_bird',
    name: 'Early Bird',
    icon: 'Sun',
    statField: 'early_steps',
    tiers: [
      { tier: 'bronze', threshold: 1, description: 'Complete a step before 9am' },
      { tier: 'silver', threshold: 10, description: '10 early morning completions' },
      { tier: 'gold', threshold: 50, description: '50 early morning completions' },
    ],
  },
  {
    key: 'zero_overdue',
    name: 'Zero Overdue',
    icon: 'ShieldCheck',
    statField: 'zero_overdue_months',
    tiers: [
      { tier: 'bronze', threshold: 1, description: 'No overdue payrolls for a month' },
      { tier: 'silver', threshold: 3, description: '3 months with zero overdue' },
      { tier: 'gold', threshold: 6, description: '6 months with zero overdue' },
    ],
  },
  {
    key: 'diligent',
    name: 'Diligent',
    icon: 'CheckCheck',
    statField: 'steps_completed',
    tiers: [
      { tier: 'bronze', threshold: 50, description: 'Complete 50 checklist steps' },
      { tier: 'silver', threshold: 250, description: 'Complete 250 steps' },
      { tier: 'gold', threshold: 1000, description: 'Complete 1000 steps' },
    ],
  },
]

export const TIER_COLORS = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
} as const

export const TOTAL_BADGES = BADGE_DEFINITIONS.length * 3 // 7 badges × 3 tiers = 21

// ── Stat Updates ────────────────────────────────────────────────────────────────

type StatsAction =
  | { type: 'step_completed'; isEarlyMorning: boolean }
  | { type: 'payroll_completed'; daysEarly: number }

export async function updateUserStats(
  supabase: SupabaseClient<Database>,
  userId: string,
  tenantId: string,
  action: StatsAction,
): Promise<Database['public']['Tables']['user_stats']['Row']> {
  // Ensure stats row exists
  const { data: existing } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  const today = new Date().toISOString().split('T')[0]

  if (!existing) {
    const initial: Database['public']['Tables']['user_stats']['Insert'] = {
      user_id: userId,
      tenant_id: tenantId,
      payrolls_completed: 0,
      early_completions: 0,
      steps_completed: 0,
      early_steps: 0,
      current_streak_weeks: 0,
      longest_streak_weeks: 0,
      perfect_months: 0,
      consecutive_perfect_months: 0,
      zero_overdue_months: 0,
      last_activity_date: today,
    }

    if (action.type === 'step_completed') {
      initial.steps_completed = 1
      if (action.isEarlyMorning) initial.early_steps = 1
    } else if (action.type === 'payroll_completed') {
      initial.payrolls_completed = 1
      if (action.daysEarly >= 3) initial.early_completions = 1
    }

    const { data } = await supabase
      .from('user_stats')
      .insert(initial)
      .select()
      .single()

    if (!data) throw new Error('Failed to create user stats')
    return data
  }

  // Build incremental updates
  const updates: Partial<Database['public']['Tables']['user_stats']['Update']> = {
    last_activity_date: today,
    updated_at: new Date().toISOString(),
  }

  if (action.type === 'step_completed') {
    updates.steps_completed = existing.steps_completed + 1
    if (action.isEarlyMorning) {
      updates.early_steps = existing.early_steps + 1
    }
  } else if (action.type === 'payroll_completed') {
    updates.payrolls_completed = existing.payrolls_completed + 1
    if (action.daysEarly >= 3) {
      updates.early_completions = existing.early_completions + 1
    }
  }

  // Update streak — if last activity was within the same or previous week, maintain streak
  if (existing.last_activity_date) {
    const lastDate = new Date(existing.last_activity_date)
    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff <= 7 && daysDiff > 0) {
      // Check if we crossed a week boundary
      const lastWeek = getWeekNumber(lastDate)
      const thisWeek = getWeekNumber(now)
      if (thisWeek !== lastWeek) {
        updates.current_streak_weeks = existing.current_streak_weeks + 1
        if ((updates.current_streak_weeks ?? 0) > existing.longest_streak_weeks) {
          updates.longest_streak_weeks = updates.current_streak_weeks
        }
      }
    } else if (daysDiff > 14) {
      // Streak broken — more than 2 weeks inactive
      updates.current_streak_weeks = 1
    }
  } else {
    updates.current_streak_weeks = 1
    updates.longest_streak_weeks = Math.max(1, existing.longest_streak_weeks)
  }

  const { data } = await supabase
    .from('user_stats')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (!data) throw new Error('Failed to update user stats')
  return data
}

function getWeekNumber(date: Date): number {
  const d = new Date(date.getTime())
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7)
  const week1 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
}

// ── Badge Checking ──────────────────────────────────────────────────────────────

export interface NewBadge {
  badge_key: string
  badge_tier: string
  badge_name: string
  badge_icon: string
}

export async function checkAndAwardBadges(
  supabase: SupabaseClient<Database>,
  userId: string,
  tenantId: string,
): Promise<NewBadge[]> {
  // Get current stats
  const { data: stats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!stats) return []

  // Get existing badges
  const { data: existingBadges } = await supabase
    .from('user_badges')
    .select('badge_key, badge_tier')
    .eq('user_id', userId)

  const earned = new Set(
    (existingBadges ?? []).map((b) => `${b.badge_key}:${b.badge_tier}`)
  )

  const newBadges: NewBadge[] = []

  for (const badge of BADGE_DEFINITIONS) {
    const currentValue = stats[badge.statField] as number

    for (const tier of badge.tiers) {
      const key = `${badge.key}:${tier.tier}`
      if (earned.has(key)) continue

      if (currentValue >= tier.threshold) {
        // Award badge
        await supabase.from('user_badges').insert({
          user_id: userId,
          tenant_id: tenantId,
          badge_key: badge.key,
          badge_tier: tier.tier,
        })

        newBadges.push({
          badge_key: badge.key,
          badge_tier: tier.tier,
          badge_name: badge.name,
          badge_icon: badge.icon,
        })
      }
    }
  }

  return newBadges
}
