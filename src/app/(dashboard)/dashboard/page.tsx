// src/app/(dashboard)/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { createClientSupabaseClient } from '@/lib/supabase'
import { useDashboardStats } from '@/lib/swr'
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowRight,
  CalendarClock,
  Activity,
  UserPlus,
  PlayCircle,
  FilePlus,
  ExternalLink,
  AlertCircle,
  Shield,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format, parseISO, formatDistanceToNow } from 'date-fns'

interface ActionItem {
  id: string
  clientName: string
  clientId: string
  payDate: string
  severity: 'red' | 'amber' | 'neutral'
  reason: string
  daysOverdue?: number
  daysUntil?: number
}

interface RunSummary {
  id: string
  clientName: string
  clientId: string
  payDate: string
  status: string
  totalSteps: number
  completedSteps: number
  daysOverdue?: number
  daysUntil?: number
  currentStep?: string | null
}

interface PeriodProgress {
  total: number
  complete: number
  inProgress: number
  notStarted: number
}

interface ActivityItem {
  id: string
  type: 'client_added' | 'payroll_completed' | 'payroll_started' | 'payroll_created'
  description: string
  timestamp: string
}

interface DashboardStats {
  todayRuns: RunSummary[]
  overdueRuns: RunSummary[]
  thisWeekRuns: RunSummary[]
  actionRequired: ActionItem[]
  periodProgress: PeriodProgress
  totalClients: number
  totalEmployees: number
  dueThisWeek: number
  overdue: number
  completedThisMonth: number
  recentActivity: ActivityItem[]
  pensionOverdue: number
  pensionDueSoon: number
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

const ACTIVITY_CONFIG: Record<
  ActivityItem['type'],
  { icon: typeof UserPlus; color: (c: ReturnType<typeof getThemeColors>) => string }
> = {
  client_added: { icon: UserPlus, color: (c) => c.primary },
  payroll_completed: { icon: CheckCircle2, color: (c) => c.success },
  payroll_started: { icon: PlayCircle, color: (c) => c.warning },
  payroll_created: { icon: FilePlus, color: (c) => c.secondary },
}

export default function DashboardPage() {
  const { data: stats, isLoading: loading } = useDashboardStats() as { data: DashboardStats | undefined, isLoading: boolean }
  const [mounted, setMounted] = useState(false)
  const [userName, setUserName] = useState('')
  const router = useRouter()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  useEffect(() => {
    setMounted(true)
    const supabase = createClientSupabaseClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserName(user.user_metadata?.name || user.email?.split('@')[0] || '')
      }
    })
  }, [])

  const isEmptyState =
    stats &&
    stats.totalClients === 0 &&
    stats.dueThisWeek === 0 &&
    stats.overdue === 0

  const cardStyle = {
    backgroundColor: colors.surface,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
  }

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-14 rounded-xl" style={{ background: colors.border }} />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl" style={{ background: colors.border }} />
          ))}
        </div>
      </div>
    )
  }

  // Period progress percentage
  const periodPct = stats?.periodProgress?.total
    ? Math.round((stats.periodProgress.complete / stats.periodProgress.total) * 100)
    : 0

  return (
    <div className="space-y-5">
      {/* ── Greeting ── */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>
          {getGreeting()}
          {userName ? `, ${userName}` : ''}. Here&apos;s your day.
        </h1>
        <p className="text-[0.82rem] mt-0.5" style={{ color: colors.text.muted }}>
          {format(new Date(), 'EEEE, d MMMM yyyy')}
        </p>
      </div>

      {/* ── Empty state ── */}
      {!loading && isEmptyState && (
        <Card className="border-0" style={cardStyle}>
          <CardContent className="p-8 text-center">
            <div
              className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${colors.primary}12` }}
            >
              <Users className="w-6 h-6" style={{ color: colors.primary }} />
            </div>
            <h2 className="text-lg font-bold mb-1.5" style={{ color: colors.text.primary }}>
              Welcome to ThePayBureau
            </h2>
            <p className="text-[0.85rem] mb-5 max-w-sm mx-auto" style={{ color: colors.text.secondary }}>
              Add your first client to get started.
            </p>
            <Button
              onClick={() => router.push('/dashboard/clients/add')}
              className="text-white font-semibold py-2 px-5 rounded-lg border-0 text-[0.85rem]"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Top 3 Summary Cards ── */}
      {!loading && !isEmptyState && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {/* Due Today */}
          <Card
            className="border-0 cursor-pointer transition-colors duration-150"
            style={{
              ...cardStyle,
              borderLeft: `3px solid ${(stats?.todayRuns?.length ?? 0) > 0 ? colors.warning : colors.success}`,
            }}
            onClick={() => router.push('/dashboard/payrolls')}
          >
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between mb-2">
                <p
                  className="text-[0.72rem] font-semibold uppercase tracking-[0.04em]"
                  style={{ color: colors.text.muted }}
                >
                  Due Today
                </p>
                <Clock className="w-4 h-4" style={{ color: colors.text.muted }} />
              </div>
              <p className="text-2xl md:text-3xl font-bold" style={{ color: colors.text.primary }}>
                {stats?.todayRuns?.length ?? 0}
                <span className="text-[0.82rem] font-normal ml-1.5" style={{ color: colors.text.muted }}>
                  run{(stats?.todayRuns?.length ?? 0) !== 1 ? 's' : ''}
                </span>
              </p>
              {(stats?.overdue ?? 0) > 0 && (
                <p className="text-[0.78rem] font-semibold mt-1.5 flex items-center gap-1" style={{ color: colors.error }}>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {stats?.overdue} overdue
                </p>
              )}
            </CardContent>
          </Card>

          {/* BACS / Pay Day Summary */}
          <Card
            className="border-0 cursor-pointer transition-colors duration-150"
            style={{
              ...cardStyle,
              borderLeft: `3px solid ${colors.primary}`,
            }}
            onClick={() => router.push('/dashboard/payrolls')}
          >
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between mb-2">
                <p
                  className="text-[0.72rem] font-semibold uppercase tracking-[0.04em]"
                  style={{ color: colors.text.muted }}
                >
                  This Week
                </p>
                <CalendarClock className="w-4 h-4" style={{ color: colors.text.muted }} />
              </div>
              <p className="text-2xl md:text-3xl font-bold" style={{ color: colors.text.primary }}>
                {stats?.dueThisWeek ?? 0}
                <span className="text-[0.82rem] font-normal ml-1.5" style={{ color: colors.text.muted }}>
                  payroll{(stats?.dueThisWeek ?? 0) !== 1 ? 's' : ''} due
                </span>
              </p>
              <p className="text-[0.78rem] mt-1.5" style={{ color: colors.text.secondary }}>
                {stats?.totalClients ?? 0} clients total
              </p>
            </CardContent>
          </Card>

          {/* Pension Declarations */}
          <Card
            className="border-0 cursor-pointer transition-colors duration-150"
            style={{
              ...cardStyle,
              borderLeft: `3px solid ${(stats?.pensionOverdue ?? 0) > 0 ? colors.error : (stats?.pensionDueSoon ?? 0) > 0 ? colors.warning : colors.success}`,
            }}
            onClick={() => router.push('/dashboard/pensions')}
          >
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between mb-2">
                <p
                  className="text-[0.72rem] font-semibold uppercase tracking-[0.04em]"
                  style={{ color: colors.text.muted }}
                >
                  Pensions
                </p>
                <Shield className="w-4 h-4" style={{ color: colors.text.muted }} />
              </div>
              {(stats?.pensionOverdue ?? 0) > 0 ? (
                <>
                  <p className="text-2xl md:text-3xl font-bold" style={{ color: colors.error }}>
                    {stats?.pensionOverdue}
                    <span className="text-[0.82rem] font-normal ml-1.5" style={{ color: colors.text.muted }}>
                      overdue
                    </span>
                  </p>
                  {(stats?.pensionDueSoon ?? 0) > 0 && (
                    <p className="text-[0.78rem] mt-1.5" style={{ color: colors.warning }}>
                      {stats?.pensionDueSoon} due within 30 days
                    </p>
                  )}
                </>
              ) : (stats?.pensionDueSoon ?? 0) > 0 ? (
                <p className="text-2xl md:text-3xl font-bold" style={{ color: colors.warning }}>
                  {stats?.pensionDueSoon}
                  <span className="text-[0.82rem] font-normal ml-1.5" style={{ color: colors.text.muted }}>
                    due soon
                  </span>
                </p>
              ) : (
                <p className="text-2xl md:text-3xl font-bold" style={{ color: colors.success }}>
                  All clear
                </p>
              )}
            </CardContent>
          </Card>

          {/* Period Progress */}
          <Card
            className="border-0 cursor-pointer transition-colors duration-150"
            style={{
              ...cardStyle,
              borderLeft: `3px solid ${colors.success}`,
            }}
            onClick={() => router.push('/dashboard/payrolls')}
          >
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between mb-2">
                <p
                  className="text-[0.72rem] font-semibold uppercase tracking-[0.04em]"
                  style={{ color: colors.text.muted }}
                >
                  Period Progress
                </p>
                <CheckCircle2 className="w-4 h-4" style={{ color: colors.text.muted }} />
              </div>
              <div className="flex items-baseline gap-1.5 mb-2.5">
                <p className="text-2xl md:text-3xl font-bold" style={{ color: colors.text.primary }}>
                  {stats?.periodProgress?.complete ?? 0}
                  <span className="text-[0.82rem] font-normal" style={{ color: colors.text.muted }}>
                    /{stats?.periodProgress?.total ?? 0}
                  </span>
                </p>
                <span className="text-[0.82rem] font-normal" style={{ color: colors.text.muted }}>
                  complete
                </span>
              </div>
              <div className="relative">
                <Progress
                  value={periodPct}
                  className="h-2.5 rounded-full"
                  style={{
                    backgroundColor: `${colors.border}`,
                  }}
                />
                <div
                  className="absolute top-0 left-0 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    width: `${periodPct}%`,
                    background: periodPct === 100
                      ? colors.success
                      : `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                  }}
                />
              </div>
              <p className="text-[0.72rem] mt-1.5" style={{ color: colors.text.muted }}>
                {periodPct}%
                {(stats?.periodProgress?.inProgress ?? 0) > 0 &&
                  ` — ${stats?.periodProgress?.inProgress} in progress`}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Action Required ── */}
      {!loading && !isEmptyState && (stats?.actionRequired?.length ?? 0) > 0 && (
        <Card className="border-0" style={cardStyle}>
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4.5 h-4.5" style={{ color: colors.error }} />
              <h2 className="text-[0.9rem] font-bold" style={{ color: colors.text.primary }}>
                Action Required
              </h2>
              <Badge
                className="ml-auto text-[0.68rem] font-bold border-0 px-2 py-0.5"
                style={{
                  backgroundColor: `${colors.error}12`,
                  color: colors.error,
                }}
              >
                {stats?.actionRequired?.length} item{(stats?.actionRequired?.length ?? 0) !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="space-y-0.5">
              {stats?.actionRequired?.map((item, index) => {
                const severityColor = item.severity === 'red' ? colors.error : colors.warning
                const bgColor = item.severity === 'red' ? `${colors.error}08` : `${colors.warning}06`

                return (
                  <div
                    key={`${item.id}-${index}`}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-lg cursor-pointer transition-colors duration-150"
                    style={{
                      backgroundColor: bgColor,
                    }}
                    onClick={() => router.push(item.id.startsWith('pension-') ? '/dashboard/pensions' : `/dashboard/payrolls/${item.id}`)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = item.severity === 'red'
                        ? `${colors.error}14`
                        : `${colors.warning}12`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = bgColor
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: severityColor }}
                    />
                    <div className="min-w-0 flex-1">
                      <span
                        className="text-[0.82rem] font-semibold"
                        style={{ color: colors.text.primary }}
                      >
                        {item.clientName}
                      </span>
                      <span className="text-[0.82rem] mx-1.5" style={{ color: colors.text.muted }}>
                        —
                      </span>
                      <span className="text-[0.82rem]" style={{ color: colors.text.secondary }}>
                        {item.reason}
                      </span>
                    </div>
                    <ExternalLink
                      className="w-3.5 h-3.5 flex-shrink-0 opacity-40"
                      style={{ color: colors.text.muted }}
                    />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── All Clear banner ── */}
      {!loading && !isEmptyState && (stats?.actionRequired?.length ?? 0) === 0 && (stats?.totalClients ?? 0) > 0 && (
        <Card
          className="border-0"
          style={{
            ...cardStyle,
            borderLeft: `3px solid ${colors.success}`,
          }}
        >
          <CardContent className="p-4 md:p-5 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: colors.success }} />
            <div>
              <p className="text-[0.88rem] font-semibold" style={{ color: colors.text.primary }}>
                All clear — nothing needs your attention right now.
              </p>
              <p className="text-[0.78rem]" style={{ color: colors.text.muted }}>
                {stats?.completedThisMonth ?? 0} payroll{(stats?.completedThisMonth ?? 0) !== 1 ? 's' : ''} completed this month.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── This Week's Runs + Recent Activity ── */}
      {!loading && !isEmptyState && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          {/* This Week's Runs */}
          <Card className="border-0" style={cardStyle}>
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <h2
                  className="flex items-center gap-2 text-[0.9rem] font-bold"
                  style={{ color: colors.text.primary }}
                >
                  <CalendarClock className="w-4 h-4" style={{ color: colors.primary }} />
                  This Week
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[0.75rem] h-7 px-2"
                  style={{ color: colors.primary }}
                  onClick={() => router.push('/dashboard/payrolls')}
                >
                  View All
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>

              {(stats?.thisWeekRuns?.length ?? 0) > 0 ? (
                <div className="space-y-2">
                  {stats?.thisWeekRuns?.map((run) => {
                    const pct = run.totalSteps > 0
                      ? Math.round((run.completedSteps / run.totalSteps) * 100)
                      : 0
                    const dayLabel = run.daysUntil === 0
                      ? 'Today'
                      : run.daysUntil === 1
                        ? 'Tomorrow'
                        : `${run.daysUntil} days`

                    return (
                      <div
                        key={run.id}
                        className="flex items-center gap-3 py-2.5 px-3 rounded-lg cursor-pointer transition-colors duration-150"
                        style={{ backgroundColor: `${colors.border}40` }}
                        onClick={() => router.push(`/dashboard/payrolls/${run.id}`)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = `${colors.border}80`
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = `${colors.border}40`
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-[0.82rem] font-semibold truncate"
                            style={{ color: colors.text.primary }}
                          >
                            {run.clientName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div
                              className="flex-1 h-1.5 rounded-full overflow-hidden"
                              style={{ backgroundColor: colors.border }}
                            >
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: pct === 100 ? colors.success : colors.primary,
                                }}
                              />
                            </div>
                            <span
                              className="text-[0.68rem] font-medium flex-shrink-0"
                              style={{ color: colors.text.muted }}
                            >
                              {run.completedSteps}/{run.totalSteps}
                            </span>
                          </div>
                        </div>
                        <Badge
                          className="text-[0.65rem] font-bold border-0 px-2 py-0.5 flex-shrink-0"
                          style={{
                            backgroundColor: run.daysUntil === 0
                              ? `${colors.warning}18`
                              : `${colors.text.muted}10`,
                            color: run.daysUntil === 0 ? colors.warning : colors.text.secondary,
                          }}
                        >
                          {dayLabel}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <CheckCircle2 className="w-7 h-7 mx-auto mb-2" style={{ color: colors.success }} />
                  <p className="text-[0.82rem] font-medium" style={{ color: colors.text.secondary }}>
                    No runs due this week
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-0" style={cardStyle}>
            <CardContent className="p-4 md:p-5">
              <h2
                className="flex items-center gap-2 text-[0.9rem] font-bold mb-3"
                style={{ color: colors.text.primary }}
              >
                <Activity className="w-4 h-4" style={{ color: colors.primary }} />
                Recent Activity
              </h2>

              {loading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg" style={{ background: colors.border }} />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-3/4 rounded" style={{ background: colors.border }} />
                        <div className="h-2.5 w-20 rounded" style={{ background: colors.border }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : stats?.recentActivity?.length ? (
                <div className="space-y-0.5">
                  {stats.recentActivity.map((item) => {
                    const config = ACTIVITY_CONFIG[item.type]
                    const IconComponent = config.icon
                    const iconColor = config.color(colors)
                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 py-2.5"
                        style={{ borderBottom: `1px solid ${colors.border}` }}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: `${iconColor}12` }}
                        >
                          <IconComponent className="w-3.5 h-3.5" style={{ color: iconColor }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className="text-[0.82rem] font-medium truncate"
                            style={{ color: colors.text.primary }}
                          >
                            {item.description}
                          </p>
                          <p className="text-[0.7rem]" style={{ color: colors.text.muted }}>
                            {formatDistanceToNow(parseISO(item.timestamp), { addSuffix: true })}
                          </p>
                        </div>
                        {item.type === 'payroll_completed' && (
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: colors.success }} />
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <Activity className="w-7 h-7 mx-auto mb-2" style={{ color: colors.text.muted }} />
                  <p className="text-[0.82rem] font-medium" style={{ color: colors.text.secondary }}>
                    No recent activity yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Quick Actions ── */}
      {!isEmptyState && (
        <div className="flex flex-col sm:flex-row flex-wrap gap-2.5">
          <Button
            onClick={() => router.push('/dashboard/clients/add')}
            className="text-white font-semibold py-2 px-5 rounded-lg border-0 text-[0.85rem]"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
          <Button
            onClick={() => router.push('/dashboard/payrolls')}
            variant="outline"
            className="font-semibold py-2 px-5 rounded-lg text-[0.85rem]"
            style={{
              borderColor: colors.border,
              color: colors.text.primary,
              backgroundColor: colors.surface,
            }}
          >
            View All Payrolls
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )
}
