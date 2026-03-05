'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import {
  Users, Building2, FileText, Activity,
  TrendingUp, Clock, Shield, RefreshCw, ArrowLeft,
} from 'lucide-react'
import { format, parseISO, formatDistanceToNow } from 'date-fns'

interface AnalyticsData {
  summary: {
    totalUsers: number
    totalTenants: number
    totalClients: number
    totalPayrollRuns: number
    activeUsers7d: number
    activeUsers30d: number
    newUsers30d: number
    newClients30d: number
  }
  signupTrend: { date: string; signups: number }[]
  clientTrend: { date: string; clients: number }[]
  loginTrend: { date: string; logins: number }[]
  tenantBreakdown: {
    id: string
    name: string
    plan: string
    mode: string
    created_at: string
    userCount: number
    clientCount: number
    payrollRunCount: number
    totalEmployees: number
    lastLogin: string | null
  }[]
  recentSignups: {
    id: string
    email: string
    name: string
    created_at: string
    last_sign_in_at: string | null
    tenantName: string
  }[]
  planDistribution: Record<string, number>
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const router = useRouter()

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/analytics')
      if (res.status === 403) {
        setError('You do not have access to admin analytics.')
        return
      }
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (!res.ok) throw new Error('Failed to load analytics')
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchData()
  }, [])

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-14 rounded-xl" style={{ background: colors.border }} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl" style={{ background: colors.border }} />
          ))}
        </div>
        <div className="h-80 rounded-xl" style={{ background: colors.border }} />
        <div className="h-96 rounded-xl" style={{ background: colors.border }} />
      </div>
    )
  }

  const cardStyle = {
    backgroundColor: colors.surface,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
  }

  const chartColors = {
    primary: colors.primary,
    secondary: '#8B5CF6',
    accent: colors.success,
    grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    tooltip: {
      bg: isDark ? '#1F2937' : '#FFFFFF',
      border: colors.border,
      text: colors.text.primary,
    },
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div
            className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
          >
            <Shield className="w-6 h-6 text-white animate-pulse" />
          </div>
          <p className="text-[0.9rem] font-medium" style={{ color: colors.text.secondary }}>
            Loading admin analytics...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-sm border-0" style={cardStyle}>
          <CardContent className="p-6 text-center">
            <Shield className="w-10 h-10 mx-auto mb-3" style={{ color: colors.error }} />
            <h3 className="text-base font-bold mb-2" style={{ color: colors.text.primary }}>
              {error.includes('access') ? 'Access Denied' : 'Error'}
            </h3>
            <p className="text-[0.85rem] mb-4" style={{ color: colors.text.secondary }}>{error}</p>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="outline"
                className="rounded-lg text-[0.85rem] font-semibold"
                style={{ borderColor: colors.border, color: colors.text.secondary }}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
              </Button>
              {!error.includes('access') && (
                <Button
                  onClick={fetchData}
                  className="text-white font-semibold rounded-lg border-0 text-[0.85rem]"
                  style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
                >
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const { summary } = data

  // Format chart date labels
  const formatChartDate = (dateStr: string) => {
    try { return format(parseISO(dateStr), 'd MMM') } catch { return dateStr }
  }

  // Show every ~7th label to avoid overlap
  const sparseTickFormatter = (value: string, index: number, total: number) => {
    const interval = Math.max(1, Math.floor(total / 12))
    return index % interval === 0 ? formatChartDate(value) : ''
  }

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
    if (!active || !payload?.length) return null
    return (
      <div
        className="rounded-lg p-3 shadow-lg text-[0.78rem]"
        style={{ backgroundColor: chartColors.tooltip.bg, border: `1px solid ${chartColors.tooltip.border}` }}
      >
        <p className="font-semibold mb-1" style={{ color: chartColors.tooltip.text }}>
          {label ? formatChartDate(label) : ''}
        </p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color }} className="font-medium">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
          >
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>
              Platform Analytics
            </h1>
            <p className="text-[0.78rem] mt-0.5" style={{ color: colors.text.muted }}>
              Cross-tenant usage metrics &middot; Admin only
            </p>
          </div>
        </div>
        <Button
          onClick={fetchData}
          variant="outline"
          className="rounded-lg text-[0.82rem] font-medium"
          style={{ borderColor: colors.border, color: colors.text.secondary }}
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {[
          {
            label: 'Total Users',
            value: summary.totalUsers,
            sub: `${summary.newUsers30d} new this month`,
            icon: Users,
            iconColor: colors.primary,
          },
          {
            label: 'Active Users (7d)',
            value: summary.activeUsers7d,
            sub: `${summary.activeUsers30d} in last 30d`,
            icon: Activity,
            iconColor: colors.success,
          },
          {
            label: 'Total Clients',
            value: summary.totalClients,
            sub: `${summary.newClients30d} new this month`,
            icon: Building2,
            iconColor: '#8B5CF6',
          },
          {
            label: 'Payroll Runs',
            value: summary.totalPayrollRuns,
            sub: `Across ${summary.totalTenants} tenants`,
            icon: FileText,
            iconColor: colors.secondary,
          },
        ].map((card, i) => (
          <Card key={i} className="border-0" style={cardStyle}>
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[0.68rem] md:text-[0.72rem] font-semibold uppercase tracking-[0.04em] mb-1" style={{ color: colors.text.muted }}>
                    {card.label}
                  </p>
                  <p className="text-2xl md:text-3xl font-bold" style={{ color: colors.text.primary }}>
                    {card.value}
                  </p>
                  <p className="text-[0.72rem] font-medium mt-1" style={{ color: colors.text.muted }}>
                    {card.sub}
                  </p>
                </div>
                <div
                  className="w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${card.iconColor}10` }}
                >
                  <card.icon className="w-4 h-4 md:w-5 md:h-5" style={{ color: card.iconColor }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Signup Trend */}
        <Card className="border-0" style={cardStyle}>
          <CardHeader className="pb-2">
            <CardTitle className="text-[0.88rem] font-bold flex items-center gap-2" style={{ color: colors.text.primary }}>
              <TrendingUp className="w-4 h-4" style={{ color: colors.primary }} />
              Signups (90 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.signupTrend}>
                  <defs>
                    <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: colors.text.muted }}
                    tickFormatter={(v, i) => sparseTickFormatter(v, i, data.signupTrend.length)}
                  />
                  <YAxis tick={{ fontSize: 11, fill: colors.text.muted }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone" dataKey="signups" name="Signups"
                    stroke={chartColors.primary} strokeWidth={2}
                    fill="url(#signupGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Clients Added Trend */}
        <Card className="border-0" style={cardStyle}>
          <CardHeader className="pb-2">
            <CardTitle className="text-[0.88rem] font-bold flex items-center gap-2" style={{ color: colors.text.primary }}>
              <Building2 className="w-4 h-4" style={{ color: '#8B5CF6' }} />
              Clients Added (90 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.clientTrend}>
                  <defs>
                    <linearGradient id="clientGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartColors.secondary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartColors.secondary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: colors.text.muted }}
                    tickFormatter={(v, i) => sparseTickFormatter(v, i, data.clientTrend.length)}
                  />
                  <YAxis tick={{ fontSize: 11, fill: colors.text.muted }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone" dataKey="clients" name="Clients"
                    stroke={chartColors.secondary} strokeWidth={2}
                    fill="url(#clientGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Login Activity Chart */}
      <Card className="border-0" style={cardStyle}>
        <CardHeader className="pb-2">
          <CardTitle className="text-[0.88rem] font-bold flex items-center gap-2" style={{ color: colors.text.primary }}>
            <Activity className="w-4 h-4" style={{ color: colors.success }} />
            Login Activity (30 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.loginTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: colors.text.muted }}
                  tickFormatter={(v, i) => sparseTickFormatter(v, i, data.loginTrend.length)}
                />
                <YAxis tick={{ fontSize: 11, fill: colors.text.muted }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="logins" name="Logins"
                  fill={colors.success}
                  radius={[4, 4, 0, 0]}
                  opacity={0.85}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tenant Breakdown Table */}
      <Card className="border-0" style={cardStyle}>
        <CardHeader className="pb-0">
          <CardTitle className="text-[0.9rem] font-bold flex items-center justify-between" style={{ color: colors.text.primary }}>
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ color: colors.primary }} />
              Tenant Breakdown
            </span>
            <Badge
              className="text-[0.7rem] font-semibold px-2 py-0.5"
              style={{ backgroundColor: `${colors.primary}10`, color: colors.primary, border: `1px solid ${colors.primary}20` }}
            >
              {data.tenantBreakdown.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: colors.border }}>
                  <TableHead className="font-bold" style={{ color: colors.text.secondary }}>Tenant</TableHead>
                  <TableHead className="font-bold" style={{ color: colors.text.secondary }}>Plan</TableHead>
                  <TableHead className="font-bold text-center" style={{ color: colors.text.secondary }}>Users</TableHead>
                  <TableHead className="font-bold text-center" style={{ color: colors.text.secondary }}>Clients</TableHead>
                  <TableHead className="font-bold text-center" style={{ color: colors.text.secondary }}>Employees</TableHead>
                  <TableHead className="font-bold text-center" style={{ color: colors.text.secondary }}>Runs</TableHead>
                  <TableHead className="font-bold" style={{ color: colors.text.secondary }}>Last Login</TableHead>
                  <TableHead className="font-bold" style={{ color: colors.text.secondary }}>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.tenantBreakdown.map(t => (
                  <TableRow key={t.id} style={{ borderColor: colors.border }}>
                    <TableCell>
                      <div className="font-bold text-sm" style={{ color: colors.text.primary }}>
                        {t.name}
                      </div>
                      <div className="text-[0.72rem]" style={{ color: colors.text.muted }}>
                        {t.mode}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className="text-[0.7rem] font-bold border-0 px-2 py-0.5"
                        style={{
                          backgroundColor: t.plan === 'starter' ? `${colors.primary}15` : `${colors.success}15`,
                          color: t.plan === 'starter' ? colors.primary : colors.success,
                        }}
                      >
                        {t.plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-semibold text-sm" style={{ color: colors.text.primary }}>{t.userCount}</TableCell>
                    <TableCell className="text-center font-semibold text-sm" style={{ color: colors.text.primary }}>{t.clientCount}</TableCell>
                    <TableCell className="text-center font-semibold text-sm" style={{ color: colors.text.primary }}>{t.totalEmployees}</TableCell>
                    <TableCell className="text-center font-semibold text-sm" style={{ color: colors.text.primary }}>{t.payrollRunCount}</TableCell>
                    <TableCell>
                      {t.lastLogin ? (
                        <span className="text-[0.78rem] font-medium" style={{ color: colors.text.secondary }}>
                          {formatDistanceToNow(parseISO(t.lastLogin), { addSuffix: true })}
                        </span>
                      ) : (
                        <span className="text-[0.78rem]" style={{ color: colors.text.muted }}>Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-[0.78rem] font-medium" style={{ color: colors.text.secondary }}>
                        {format(parseISO(t.created_at), 'd MMM yyyy')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {data.tenantBreakdown.length === 0 && (
            <p className="text-center py-8 text-[0.85rem]" style={{ color: colors.text.muted }}>
              No tenants yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Signups */}
      <Card className="border-0" style={cardStyle}>
        <CardHeader className="pb-0">
          <CardTitle className="text-[0.9rem] font-bold flex items-center gap-2" style={{ color: colors.text.primary }}>
            <Clock className="w-4 h-4" style={{ color: colors.secondary }} />
            Recent Signups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: colors.border }}>
                  <TableHead className="font-bold" style={{ color: colors.text.secondary }}>User</TableHead>
                  <TableHead className="font-bold" style={{ color: colors.text.secondary }}>Tenant</TableHead>
                  <TableHead className="font-bold" style={{ color: colors.text.secondary }}>Signed Up</TableHead>
                  <TableHead className="font-bold" style={{ color: colors.text.secondary }}>Last Login</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentSignups.map(u => (
                  <TableRow key={u.id} style={{ borderColor: colors.border }}>
                    <TableCell>
                      <div className="font-bold text-sm" style={{ color: colors.text.primary }}>{u.name}</div>
                      <div className="text-[0.72rem]" style={{ color: colors.text.muted }}>{u.email}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium" style={{ color: colors.text.primary }}>{u.tenantName}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[0.78rem] font-medium" style={{ color: colors.text.secondary }}>
                        {format(parseISO(u.created_at), 'd MMM yyyy')}
                      </span>
                    </TableCell>
                    <TableCell>
                      {u.last_sign_in_at ? (
                        <span className="text-[0.78rem] font-medium" style={{ color: colors.text.secondary }}>
                          {formatDistanceToNow(parseISO(u.last_sign_in_at), { addSuffix: true })}
                        </span>
                      ) : (
                        <span className="text-[0.78rem]" style={{ color: colors.text.muted }}>Never</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Plan Distribution */}
      {Object.keys(data.planDistribution).length > 0 && (
        <Card className="border-0" style={cardStyle}>
          <CardHeader>
            <CardTitle className="text-[0.9rem] font-bold" style={{ color: colors.text.primary }}>
              Plan Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(data.planDistribution).map(([plan, count]) => (
                <div
                  key={plan}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : colors.lightBg, border: `1px solid ${colors.border}` }}
                >
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-wide" style={{ color: colors.text.muted }}>
                      {plan}
                    </p>
                    <p className="text-xl font-bold" style={{ color: colors.text.primary }}>{count}</p>
                  </div>
                  <p className="text-[0.78rem]" style={{ color: colors.text.muted }}>
                    {summary.totalTenants > 0 ? Math.round((count / summary.totalTenants) * 100) : 0}%
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
