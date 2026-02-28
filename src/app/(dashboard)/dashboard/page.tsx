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
import { cn } from '@/lib/utils'
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

function KpiSkeleton({ colors, isDark }: { colors: ReturnType<typeof getThemeColors>; isDark: boolean }) {
  return (
    <Card
      className="border-0 shadow-xl"
      style={{
        backgroundColor: colors.glass.card,
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        border: `1px solid ${colors.borderElevated}`,
        boxShadow: isDark
          ? `0 10px 30px ${colors.shadow.medium}`
          : `0 10px 25px ${colors.shadow.light}`,
      }}
    >
      <CardContent className="p-8">
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div
              className="h-4 w-28 rounded animate-pulse"
              style={{ backgroundColor: colors.border }}
            />
            <div
              className="h-10 w-16 rounded animate-pulse"
              style={{ backgroundColor: colors.border }}
            />
          </div>
          <div
            className="w-16 h-16 rounded-2xl animate-pulse"
            style={{ backgroundColor: colors.border }}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function TableSkeleton({ colors }: { colors: ReturnType<typeof getThemeColors> }) {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-12 rounded-xl animate-pulse"
          style={{ backgroundColor: colors.border }}
        />
      ))}
    </div>
  )
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
    // Fetch user name for greeting
    const fetchUser = async () => {
      const supabase = createClientSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserName(
          user.user_metadata?.name || user.email?.split('@')[0] || ''
        )
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/dashboard/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
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

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="h-40 bg-gray-200 rounded-xl" />
          <div className="h-40 bg-gray-200 rounded-xl" />
          <div className="h-40 bg-gray-200 rounded-xl" />
          <div className="h-40 bg-gray-200 rounded-xl" />
        </div>
      </div>
    )
  }

  const kpiCards = [
    {
      title: 'Total Clients',
      value: stats?.totalClients ?? 0,
      icon: Users,
      iconColor: colors.primary,
      iconBg: `${colors.primary}20`,
      accentColor: null as string | null,
    },
    {
      title: 'Due This Week',
      value: stats?.dueThisWeek ?? 0,
      icon: Clock,
      iconColor: (stats?.dueThisWeek ?? 0) > 0 ? colors.warning : colors.primary,
      iconBg:
        (stats?.dueThisWeek ?? 0) > 0
          ? `${colors.warning}20`
          : `${colors.primary}20`,
      accentColor: (stats?.dueThisWeek ?? 0) > 0 ? colors.warning : null,
    },
    {
      title: 'Overdue',
      value: stats?.overdue ?? 0,
      icon: AlertTriangle,
      iconColor: (stats?.overdue ?? 0) > 0 ? colors.error : colors.primary,
      iconBg:
        (stats?.overdue ?? 0) > 0
          ? `${colors.error}20`
          : `${colors.primary}20`,
      accentColor: (stats?.overdue ?? 0) > 0 ? colors.error : null,
    },
    {
      title: 'Completed This Month',
      value: stats?.completedThisMonth ?? 0,
      icon: CheckCircle2,
      iconColor: colors.success,
      iconBg: `${colors.success}20`,
      accentColor: colors.success,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-4xl font-bold mb-2 transition-colors duration-300"
            style={{ color: colors.text.primary }}
          >
            {getGreeting()}{userName ? `, ${userName}` : ''}
          </h1>
          <p
            className="text-lg transition-colors duration-300"
            style={{ color: colors.text.secondary }}
          >
            {format(new Date(), 'EEEE, d MMMM yyyy')}
          </p>
        </div>
      </div>

      {/* Empty state */}
      {!loading && isEmptyState && (
        <Card
          className="border-0 shadow-xl"
          style={{
            backgroundColor: colors.glass.card,
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: `1px solid ${colors.borderElevated}`,
            boxShadow: isDark
              ? `0 15px 35px ${colors.shadow.medium}`
              : `0 10px 25px ${colors.shadow.light}`,
          }}
        >
          <CardContent className="p-12 text-center">
            <div
              className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor: `${colors.primary}15`,
              }}
            >
              <Users
                className="w-10 h-10"
                style={{ color: colors.primary }}
              />
            </div>
            <h2
              className="text-2xl font-bold mb-3"
              style={{ color: colors.text.primary }}
            >
              Welcome to ThePayBureau Pro!
            </h2>
            <p
              className="text-lg mb-8 max-w-md mx-auto"
              style={{ color: colors.text.secondary }}
            >
              Add your first client to get started.
            </p>
            <Button
              onClick={() => router.push('/dashboard/clients/add')}
              className="text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl border-0"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                boxShadow: isDark
                  ? `0 10px 25px ${colors.primary}50`
                  : `0 10px 25px ${colors.primary}30`,
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {loading
          ? [1, 2, 3, 4].map((i) => (
              <KpiSkeleton key={i} colors={colors} isDark={isDark} />
            ))
          : kpiCards.map((kpi, index) => (
              <Card
                key={index}
                className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] group"
                style={{
                  backgroundColor: colors.glass.card,
                  backdropFilter: 'blur(20px)',
                  borderRadius: '20px',
                  border: `1px solid ${colors.borderElevated}`,
                  boxShadow: isDark
                    ? `0 10px 30px ${colors.shadow.medium}`
                    : `0 10px 25px ${colors.shadow.light}`,
                }}
              >
                <CardContent className="p-6 lg:p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="text-sm font-semibold mb-2 transition-colors duration-300"
                        style={{ color: colors.text.secondary }}
                      >
                        {kpi.title}
                      </p>
                      <p
                        className="text-3xl lg:text-4xl font-bold transition-colors duration-300"
                        style={{
                          color: kpi.accentColor || colors.text.primary,
                        }}
                      >
                        {kpi.value}
                      </p>
                    </div>
                    <div
                      className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                      style={{
                        backgroundColor: kpi.iconBg,
                        boxShadow: `0 8px 25px ${kpi.iconColor}30`,
                      }}
                    >
                      <kpi.icon
                        className="w-7 h-7 lg:w-8 lg:h-8 transition-transform duration-300 group-hover:scale-110"
                        style={{ color: kpi.iconColor }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Upcoming Deadlines */}
      {!isEmptyState && (
        <Card
          className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300"
          style={{
            backgroundColor: colors.glass.card,
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: `1px solid ${colors.borderElevated}`,
            boxShadow: isDark
              ? `0 15px 35px ${colors.shadow.medium}`
              : `0 10px 25px ${colors.shadow.light}`,
          }}
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <CalendarClock
                className="w-5 h-5"
                style={{ color: colors.primary }}
              />
              <CardTitle
                className="text-xl font-bold transition-colors duration-300"
                style={{ color: colors.text.primary }}
              >
                Upcoming Deadlines
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TableSkeleton colors={colors} />
            ) : stats &&
              stats.upcomingDeadlines &&
              stats.upcomingDeadlines.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      style={{
                        borderBottom: `1px solid ${colors.borderElevated}`,
                      }}
                    >
                      {['Client', 'Deadline', 'Due Date', 'Days Left'].map(
                        (header) => (
                          <th
                            key={header}
                            className="text-left py-3 px-4 text-sm font-semibold"
                            style={{ color: colors.text.muted }}
                          >
                            {header}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.upcomingDeadlines.map((deadline, index) => {
                      const dueDate = parseISO(deadline.date)
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const daysLeft = differenceInDays(dueDate, today)
                      const daysLeftColor = getDaysLeftColor(daysLeft)

                      return (
                        <tr
                          key={`${deadline.payrollRunId}-${deadline.type}-${index}`}
                          className="transition-colors duration-200"
                          style={{
                            borderBottom:
                              index < stats.upcomingDeadlines.length - 1
                                ? `1px solid ${colors.border}`
                                : undefined,
                          }}
                        >
                          <td
                            className="py-3 px-4 text-sm font-medium"
                            style={{ color: colors.text.primary }}
                          >
                            {deadline.clientName}
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              className="font-semibold text-xs border-0"
                              style={{
                                backgroundColor:
                                  deadline.type === 'FPS'
                                    ? `${colors.primary}20`
                                    : `${colors.secondary}20`,
                                color:
                                  deadline.type === 'FPS'
                                    ? colors.primary
                                    : colors.secondary,
                              }}
                            >
                              {deadline.type}
                            </Badge>
                          </td>
                          <td
                            className="py-3 px-4 text-sm"
                            style={{ color: colors.text.secondary }}
                          >
                            {format(dueDate, 'd MMM yyyy')}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className="text-sm font-semibold"
                              style={{ color: daysLeftColor }}
                            >
                              {daysLeft === 0
                                ? 'Today'
                                : daysLeft === 1
                                  ? '1 day'
                                  : `${daysLeft} days`}
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
                <CheckCircle2
                  className="w-10 h-10 mx-auto mb-3"
                  style={{ color: colors.success }}
                />
                <p
                  className="text-base font-medium"
                  style={{ color: colors.text.secondary }}
                >
                  No upcoming deadlines — you&apos;re all caught up!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      {!isEmptyState && (
        <Card
          className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300"
          style={{
            backgroundColor: colors.glass.card,
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: `1px solid ${colors.borderElevated}`,
            boxShadow: isDark
              ? `0 15px 35px ${colors.shadow.medium}`
              : `0 10px 25px ${colors.shadow.light}`,
          }}
        >
          <CardHeader>
            <CardTitle
              className="text-xl font-bold transition-colors duration-300"
              style={{ color: colors.text.primary }}
            >
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={() => router.push('/dashboard/clients/add')}
                className="text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl border-0"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                  boxShadow: isDark
                    ? `0 10px 25px ${colors.primary}50`
                    : `0 10px 25px ${colors.primary}30`,
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
              <Button
                onClick={() => router.push('/dashboard/payrolls')}
                variant="outline"
                className="font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
                style={{
                  borderColor: colors.borderElevated,
                  color: colors.text.primary,
                  backgroundColor: colors.glass.surface,
                  backdropFilter: 'blur(10px)',
                }}
              >
                View All Payrolls
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
