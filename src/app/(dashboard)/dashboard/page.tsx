// src/app/(dashboard)/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { createClientSupabaseClient } from '@/lib/supabase'
import {
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowRight,
  CalendarClock,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format, parseISO, differenceInDays } from 'date-fns'

interface UpcomingDeadline {
  clientName: string
  type: 'FPS' | 'EPS'
  date: string
  payrollRunId: string
}

interface DashboardStats {
  totalClients: number
  dueThisWeek: number
  overdue: number
  completedThisMonth: number
  upcomingDeadlines: UpcomingDeadline[]
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [userName, setUserName] = useState('')
  const router = useRouter()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  useEffect(() => {
    setMounted(true)
    const fetchUser = async () => {
      const supabase = createClientSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserName(user.user_metadata?.name || user.email?.split('@')[0] || '')
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/dashboard/stats')
        if (res.ok) setStats(await res.json())
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const getDaysLeftColor = (daysLeft: number): string => {
    if (daysLeft <= 2) return colors.error
    if (daysLeft <= 5) return colors.warning
    return colors.success
  }

  const isEmptyState =
    stats &&
    stats.totalClients === 0 &&
    stats.dueThisWeek === 0 &&
    stats.overdue === 0 &&
    stats.completedThisMonth === 0

  // Card style helper — clean, minimal
  const cardStyle = {
    backgroundColor: colors.surface,
    borderRadius: '16px',
    border: `1px solid ${colors.border}`,
  }

  if (!mounted) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-16 rounded-2xl" style={{ background: colors.border }} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 rounded-2xl" style={{ background: colors.border }} />)}
        </div>
      </div>
    )
  }

  const kpiCards = [
    { title: 'Total Clients', value: stats?.totalClients ?? 0, icon: Users, iconColor: colors.primary, accentColor: null as string | null },
    { title: 'Due This Week', value: stats?.dueThisWeek ?? 0, icon: Clock, iconColor: (stats?.dueThisWeek ?? 0) > 0 ? colors.warning : colors.text.muted, accentColor: (stats?.dueThisWeek ?? 0) > 0 ? colors.warning : null },
    { title: 'Overdue', value: stats?.overdue ?? 0, icon: AlertTriangle, iconColor: (stats?.overdue ?? 0) > 0 ? colors.error : colors.text.muted, accentColor: (stats?.overdue ?? 0) > 0 ? colors.error : null },
    { title: 'Completed This Month', value: stats?.completedThisMonth ?? 0, icon: CheckCircle2, iconColor: colors.success, accentColor: colors.success },
  ]

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: colors.text.primary }}>
          {getGreeting()}{userName ? `, ${userName}` : ''}
        </h1>
        <p className="text-[0.9rem] mt-1" style={{ color: colors.text.muted }}>
          {format(new Date(), 'EEEE, d MMMM yyyy')}
        </p>
      </div>

      {/* Empty state */}
      {!loading && isEmptyState && (
        <Card className="border-0" style={cardStyle}>
          <CardContent className="p-10 text-center">
            <div
              className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${colors.primary}12` }}
            >
              <Users className="w-8 h-8" style={{ color: colors.primary }} />
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: colors.text.primary }}>
              Welcome to ThePayBureau
            </h2>
            <p className="text-[0.9rem] mb-6 max-w-sm mx-auto" style={{ color: colors.text.secondary }}>
              Add your first client to get started.
            </p>
            <Button
              onClick={() => router.push('/dashboard/clients/add')}
              className="text-white font-semibold py-2.5 px-6 rounded-xl border-0 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, var(--login-purple), var(--login-pink))',
                boxShadow: '0 8px 24px rgba(64, 29, 108, 0.25)',
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {loading
          ? [1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-0" style={cardStyle}>
                <CardContent className="p-6">
                  <div className="space-y-3 animate-pulse">
                    <div className="h-3.5 w-24 rounded" style={{ background: colors.border }} />
                    <div className="h-8 w-14 rounded" style={{ background: colors.border }} />
                  </div>
                </CardContent>
              </Card>
            ))
          : kpiCards.map((kpi, index) => (
              <Card key={index} className="border-0 group" style={cardStyle}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[0.78rem] font-semibold uppercase tracking-[0.04em] mb-1.5" style={{ color: colors.text.muted }}>
                        {kpi.title}
                      </p>
                      <p className="text-3xl font-bold" style={{ color: kpi.accentColor || colors.text.primary }}>
                        {kpi.value}
                      </p>
                    </div>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${kpi.iconColor}12` }}
                    >
                      <kpi.icon className="w-6 h-6" style={{ color: kpi.iconColor }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Upcoming Deadlines */}
      {!isEmptyState && (
        <Card className="border-0" style={cardStyle}>
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2.5 text-base font-bold" style={{ color: colors.text.primary }}>
              <CalendarClock className="w-[18px] h-[18px]" style={{ color: colors.primary }} />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => <div key={i} className="h-10 rounded-lg" style={{ background: colors.border }} />)}
              </div>
            ) : stats?.upcomingDeadlines?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                      {['Client', 'Deadline', 'Due Date', 'Days Left'].map((h) => (
                        <th key={h} className="text-left py-2.5 px-4 text-[0.72rem] font-bold uppercase tracking-[0.06em]" style={{ color: colors.text.muted }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.upcomingDeadlines.map((deadline, index) => {
                      const dueDate = parseISO(deadline.date)
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const daysLeft = differenceInDays(dueDate, today)

                      return (
                        <tr
                          key={`${deadline.payrollRunId}-${deadline.type}-${index}`}
                          style={{ borderBottom: index < stats.upcomingDeadlines.length - 1 ? `1px solid ${colors.border}` : undefined }}
                        >
                          <td className="py-3 px-4 text-[0.82rem] font-semibold" style={{ color: colors.text.primary }}>
                            {deadline.clientName}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              className="font-bold text-[0.68rem] border-0 px-2.5 py-0.5"
                              style={{
                                backgroundColor: deadline.type === 'FPS' ? `${colors.primary}12` : `${colors.secondary}12`,
                                color: deadline.type === 'FPS' ? colors.primary : colors.secondary,
                              }}
                            >
                              {deadline.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-[0.82rem]" style={{ color: colors.text.secondary }}>
                            {format(dueDate, 'd MMM yyyy')}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[0.82rem] font-bold" style={{ color: getDaysLeftColor(daysLeft) }}>
                              {daysLeft === 0 ? 'Today' : daysLeft === 1 ? '1 day' : `${daysLeft} days`}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2" style={{ color: colors.success }} />
                <p className="text-[0.88rem] font-medium" style={{ color: colors.text.secondary }}>
                  No upcoming deadlines — you&apos;re all caught up!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {!isEmptyState && (
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => router.push('/dashboard/clients/add')}
            className="text-white font-semibold py-2.5 px-5 rounded-xl border-0 transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, var(--login-purple), var(--login-pink))',
              boxShadow: '0 8px 24px rgba(64, 29, 108, 0.25)',
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
          <Button
            onClick={() => router.push('/dashboard/payrolls')}
            variant="outline"
            className="font-semibold py-2.5 px-5 rounded-xl transition-all duration-200"
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
