// src/app/(dashboard)/dashboard/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { 
  Building2, 
  Users, 
  FileText, 
  Plus, 
  UserPlus, 
  Clock, 
  BarChart3, 
  ArrowUp,
  Shield,
  AlertTriangle,
  Activity,
  PoundSterling
} from 'lucide-react'
import { useRouter } from 'next/navigation'

// Dashboard data
const dashboardData = {
  // Primary metrics
  totalClients: 247,
  monthlyRevenue: 45670,
  activeContracts: 189,
  
  // Key performance indicators
  kpis: {
    clientRetentionRate: 94.2,
    payrollErrorRate: 2.1,
    averageFeePerPayroll: 87.70,
    averageFeePerPayslip: 5.50,
    averageFeePerClient: 107.68,
    clientSatisfaction: 4.7,
  },
  
  // Operational status
  operations: {
    activePayrolls: 15,
    pendingOnboarding: 8,
    contractRenewals: 12,
    complianceIssues: 3,
  },
  
  // Chart data for revenue trend (last 6 months)
  revenueChart: [
    { month: 'Aug', revenue: 1000, clients: 229 },
    { month: 'Sep', revenue: 3500, clients: 235 },
    { month: 'Oct', revenue: 6200, clients: 238 },
    { month: 'Nov', revenue: 9100, clients: 242 },
    { month: 'Dec', revenue: 12300, clients: 245 },
    { month: 'Jan', revenue: 15800, clients: 247 },
  ],
  
  // KPI trends for mini charts
  kpiTrends: {
    retention: [92.1, 93.2, 93.8, 94.5, 94.2, 94.2],
    errorRate: [3.2, 2.8, 2.5, 2.3, 2.4, 2.1],
    satisfaction: [4.5, 4.6, 4.6, 4.7, 4.8, 4.7],
  },
  
  // Recent activity
  recentActivity: [
    {
      id: 1,
      type: 'client_onboarded',
      client: 'Acme Corporation Ltd',
      message: 'Successfully onboarded with 150 employees',
      amount: '£2,400/month',
      time: '2 hours ago',
      status: 'success'
    },
    {
      id: 2,
      type: 'contract_signed',
      client: 'TechStart Industries',
      message: 'Annual service contract activated',
      amount: '£1,800/month',
      time: '4 hours ago',
      status: 'success'
    },
    {
      id: 3,
      type: 'compliance_check',
      client: 'Regional Health Trust',
      message: 'Pension compliance review required',
      amount: '',
      time: '1 day ago',
      status: 'warning'
    }
  ]
}

// Enhanced theme-aware chart components
const MiniLineChart = ({ data, color }: { data: number[], color: string }) => {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min
  
  return (
    <div className="flex items-end h-8 space-x-1">
      {data.map((value, index) => {
        const height = range === 0 ? 50 : ((value - min) / range) * 100
        return (
          <div
            key={index}
            className="w-1.5 rounded-t-sm transition-all duration-300 hover:opacity-90"
            style={{
              height: `${Math.max(height, 10)}%`,
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}40`
            }}
          />
        )
      })}
    </div>
  )
}

const RevenueChart = ({ data, colors }: { data: typeof dashboardData.revenueChart, colors: any }) => {
  const scaleMax = 16000
  
  return (
    <div className="flex items-end justify-between h-32 px-2">
      {data.map((item, index) => {
        const heightPercent = (item.revenue / scaleMax) * 100
        const heightPx = Math.max((heightPercent / 100) * 128, 8)
        
        return (
          <div key={item.month} className="flex flex-col items-center space-y-2 group">
            <div
              className="w-8 rounded-t-lg transition-all duration-300 cursor-pointer group-hover:opacity-80 group-hover:scale-105"
              style={{
                height: `${heightPx}px`,
                background: `linear-gradient(to top, ${colors.secondary}, ${colors.accent})`,
                boxShadow: `0 4px 15px ${colors.secondary}30`
              }}
              title={`${item.month}: £${item.revenue.toLocaleString()}`}
            />
            <span className="text-xs font-medium transition-colors duration-300" style={{ color: colors.text.muted }}>
              {item.month}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activityFilter, setActivityFilter] = useState('All')
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createClientSupabaseClient()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  useEffect(() => {
    setMounted(true)
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      setUser(session.user)
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'client_onboarded':
        return <UserPlus className="w-4 h-4 text-green-600" />
      case 'contract_signed':
        return <FileText className="w-4 h-4 text-blue-600" />
      case 'compliance_check':
        return <Shield className="w-4 h-4 text-orange-600" />
      default:
        return <Building2 className="w-4 h-4 text-gray-600" />
    }
  }

  const filteredActivity = dashboardData.recentActivity.filter(activity => {
    if (activityFilter === 'All') return true
    if (activityFilter === 'Success') return activity.status === 'success'
    if (activityFilter === 'Warning') return activity.status === 'warning'
    if (activityFilter === 'Today') {
      // For demo purposes, show all as "today"
      return true
    }
    return true
  })

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-gray-200 rounded-xl"></div>
        <div className="grid grid-cols-3 gap-8">
          <div className="h-40 bg-gray-200 rounded-xl"></div>
          <div className="h-40 bg-gray-200 rounded-xl"></div>
          <div className="h-40 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center transition-colors duration-300" 
        style={{ backgroundColor: colors.lightBg }}
      >
        <div className="text-center">
          <div 
            className="w-20 h-20 mx-auto mb-6 rounded-2xl shadow-xl flex items-center justify-center"
            style={{ 
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              boxShadow: isDark 
                ? `0 25px 50px ${colors.shadow.heavy}` 
                : `0 20px 40px ${colors.primary}30`
            }}
          >
            <Building2 className="w-10 h-10 text-white animate-pulse" />
          </div>
          <p className="text-xl font-semibold transition-colors duration-300" style={{ color: colors.text.primary }}>
            Loading your bureau...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Better Dark Mode */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 transition-colors duration-300" style={{ 
            color: colors.text.primary 
          }}>
            Dashboard
          </h1>
          <p className="text-lg transition-colors duration-300" style={{ 
            color: colors.text.secondary 
          }}>
            Welcome back! Your bureau is performing excellently.
          </p>
        </div>
        <Button 
          onClick={() => router.push('/dashboard/clients/add')}
          className="text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl border-0"
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
            boxShadow: isDark 
              ? `0 10px 25px ${colors.primary}50` 
              : `0 10px 25px ${colors.primary}30`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
            e.currentTarget.style.boxShadow = isDark
              ? `0 20px 40px ${colors.primary}60`
              : `0 20px 40px ${colors.primary}40`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0px) scale(1)'
            e.currentTarget.style.boxShadow = isDark
              ? `0 10px 25px ${colors.primary}50`
              : `0 10px 25px ${colors.primary}30`
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Enhanced Primary Metrics with True Dark Mode */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            title: 'Total Clients',
            value: dashboardData.totalClients,
            change: '+5.2%',
            icon: Users,
            iconColor: colors.primary,
            iconBg: `${colors.primary}20`
          },
          {
            title: 'Monthly Revenue',
            value: `£${dashboardData.monthlyRevenue.toLocaleString()}`,
            change: '+12.3%',
            icon: PoundSterling,
            iconColor: colors.success,
            iconBg: `${colors.success}20`
          },
          {
            title: 'Active Contracts',
            value: dashboardData.activeContracts,
            change: '+3.4%',
            icon: FileText,
            iconColor: colors.secondary,
            iconBg: `${colors.secondary}20`
          }
        ].map((metric, index) => (
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
                : `0 10px 25px ${colors.shadow.light}`
            }}
          >
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold mb-3 transition-colors duration-300" style={{ 
                    color: colors.text.secondary 
                  }}>
                    {metric.title}
                  </p>
                  <p className="text-5xl font-bold mb-4 transition-colors duration-300" style={{ 
                    color: colors.text.primary 
                  }}>
                    {metric.value}
                  </p>
                  <div className="flex items-center">
                    <ArrowUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-sm font-medium text-green-600">{metric.change}</span>
                    <span className="text-sm ml-1 transition-colors duration-300" style={{ 
                      color: colors.text.muted 
                    }}>
                      vs last month
                    </span>
                  </div>
                </div>
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110" 
                  style={{ 
                    backgroundColor: metric.iconBg,
                    boxShadow: `0 8px 25px ${metric.iconColor}30`
                  }}
                >
                  <metric.icon className="w-10 h-10 transition-transform duration-300 group-hover:scale-110" style={{ color: metric.iconColor }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Charts Layout with Glass Morphism */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Enhanced Revenue Chart */}
        <Card 
          className="lg:col-span-2 border-0 shadow-xl hover:shadow-2xl transition-all duration-300"
          style={{
            backgroundColor: colors.glass.card,
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: `1px solid ${colors.borderElevated}`,
            boxShadow: isDark 
              ? `0 15px 35px ${colors.shadow.medium}` 
              : `0 10px 25px ${colors.shadow.light}`
          }}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold transition-colors duration-300" style={{ 
                color: colors.text.primary 
              }}>
                Revenue Trend
              </CardTitle>
              <Badge 
                className="text-green-700 border-green-200 bg-green-50 font-semibold px-3 py-1"
                style={{
                  backgroundColor: `${colors.success}20`,
                  color: colors.success,
                  border: `1px solid ${colors.success}30`
                }}
              >
                +12.3% this month
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <RevenueChart data={dashboardData.revenueChart} colors={colors} />
            <div className="mt-6 pt-6 transition-colors duration-300" style={{ 
              borderTop: `1px solid ${colors.borderElevated}` 
            }}>
              <div className="grid grid-cols-3 gap-6 text-center">
                {[
                  { label: 'Per Payroll', value: `£${dashboardData.kpis.averageFeePerPayroll}` },
                  { label: 'Per Payslip', value: `£${dashboardData.kpis.averageFeePerPayslip}` },
                  { label: 'Per Client/Month', value: `£${dashboardData.kpis.averageFeePerClient}` }
                ].map((item, index) => (
                  <div key={index} className="group cursor-pointer p-3 rounded-xl transition-all duration-300 hover:scale-105"
                       style={{ backgroundColor: 'transparent' }}
                       onMouseEnter={(e) => {
                         e.currentTarget.style.backgroundColor = colors.glass.surfaceHover
                       }}
                       onMouseLeave={(e) => {
                         e.currentTarget.style.backgroundColor = 'transparent'
                       }}>
                    <p className="text-2xl font-bold transition-colors duration-300" style={{ 
                      color: colors.text.primary 
                    }}>
                      {item.value}
                    </p>
                    <p className="text-sm font-medium transition-colors duration-300" style={{ 
                      color: colors.text.secondary 
                    }}>
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced KPIs Card */}
        <Card 
          className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300"
          style={{
            backgroundColor: colors.glass.card,
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: `1px solid ${colors.borderElevated}`,
            boxShadow: isDark 
              ? `0 15px 35px ${colors.shadow.medium}` 
              : `0 10px 25px ${colors.shadow.light}`
          }}
        >
          <CardHeader>
            <CardTitle className="text-xl font-bold transition-colors duration-300" style={{ 
              color: colors.text.primary 
            }}>
              Key Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {[
              { 
                label: 'Client Retention', 
                value: `${dashboardData.kpis.clientRetentionRate}%`, 
                data: dashboardData.kpiTrends.retention, 
                color: colors.success 
              },
              { 
                label: 'Payroll Error Rate', 
                value: `${dashboardData.kpis.payrollErrorRate}%`, 
                data: dashboardData.kpiTrends.errorRate, 
                color: colors.error 
              },
              { 
                label: 'Client Satisfaction', 
                value: `${dashboardData.kpis.clientSatisfaction}/5`, 
                data: dashboardData.kpiTrends.satisfaction, 
                color: colors.primary 
              }
            ].map((kpi, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:scale-102 group"
                   style={{ backgroundColor: 'transparent' }}
                   onMouseEnter={(e) => {
                     e.currentTarget.style.backgroundColor = colors.glass.surfaceHover
                   }}
                   onMouseLeave={(e) => {
                     e.currentTarget.style.backgroundColor = 'transparent'
                   }}>
                <div>
                  <p className="text-sm font-semibold transition-colors duration-300" style={{ 
                    color: colors.text.secondary 
                  }}>
                    {kpi.label}
                  </p>
                  <p className="text-3xl font-bold transition-colors duration-300" style={{ 
                    color: colors.text.primary 
                  }}>
                    {kpi.value}
                  </p>
                </div>
                <div className="transition-transform duration-300 group-hover:scale-110">
                  <MiniLineChart data={kpi.data} color={kpi.color} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Quick Actions */}
      <Card 
        className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300"
        style={{
          backgroundColor: colors.glass.card,
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: `1px solid ${colors.borderElevated}`,
          boxShadow: isDark 
            ? `0 15px 35px ${colors.shadow.medium}` 
            : `0 10px 25px ${colors.shadow.light}`
        }}
      >
        <CardHeader>
          <CardTitle className="text-xl font-bold transition-colors duration-300" style={{ 
            color: colors.text.primary 
          }}>
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Add Client',
                subtitle: 'Start new client onboarding',
                icon: Plus,
                onClick: () => router.push('/dashboard/clients/add'),
                primary: true
              },
              {
                title: 'Create Contract',
                subtitle: 'Setup service agreement',
                icon: FileText,
                onClick: () => {},
                primary: false
              },
              {
                title: 'View Reports',
                subtitle: 'Business analytics',
                icon: BarChart3,
                onClick: () => {},
                primary: false
              }
            ].map((action, index) => (
              <Button 
                key={index}
                onClick={action.onClick}
                variant="outline"
                className="h-16 justify-start transition-all duration-300 shadow-lg hover:shadow-xl text-base font-semibold rounded-xl border group"
                style={{
                  background: action.primary 
                    ? `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` 
                    : colors.glass.surface,
                  color: action.primary ? 'white' : colors.text.primary,
                  borderColor: action.primary ? 'transparent' : colors.borderElevated,
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                  if (!action.primary) {
                    e.currentTarget.style.backgroundColor = colors.glass.surfaceHover
                    e.currentTarget.style.borderColor = colors.primary
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px) scale(1)'
                  if (!action.primary) {
                    e.currentTarget.style.backgroundColor = colors.glass.surface
                    e.currentTarget.style.borderColor = colors.borderElevated
                  }
                }}
              >
                <action.icon className="w-5 h-5 mr-3 transition-transform duration-300 group-hover:scale-110" />
                <div className="text-left">
                  <div className="font-bold">{action.title}</div>
                  <div className="text-sm opacity-80">{action.subtitle}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Enhanced Operations Status */}
        <Card 
          className="lg:col-span-2 border-0 shadow-xl hover:shadow-2xl transition-all duration-300"
          style={{
            backgroundColor: colors.glass.card,
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: `1px solid ${colors.borderElevated}`,
            boxShadow: isDark 
              ? `0 15px 35px ${colors.shadow.medium}` 
              : `0 10px 25px ${colors.shadow.light}`
          }}
        >
          <CardHeader>
            <CardTitle className="text-xl font-bold transition-colors duration-300" style={{ 
              color: colors.text.primary 
            }}>
              Operations Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              {
                title: 'Active Payrolls',
                subtitle: 'Currently processing',
                value: dashboardData.operations.activePayrolls,
                icon: Activity,
                color: colors.primary
              },
              {
                title: 'Onboarding',
                subtitle: 'New clients in progress',
                value: dashboardData.operations.pendingOnboarding,
                icon: UserPlus,
                color: colors.success
              },
              {
                title: 'Renewals Due',
                subtitle: 'This month',
                value: dashboardData.operations.contractRenewals,
                icon: Clock,
                color: colors.secondary
              },
              ...(dashboardData.operations.complianceIssues > 0 ? [{
                title: 'Compliance',
                subtitle: 'Require attention',
                value: dashboardData.operations.complianceIssues,
                icon: AlertTriangle,
                color: colors.warning
              }] : [])
            ].map((item, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 rounded-xl transition-all duration-300 cursor-pointer group hover:scale-[1.02]"
                style={{ 
                  backgroundColor: `${item.color}10`,
                  borderLeft: `4px solid ${item.color}`,
                  border: `1px solid ${item.color}20`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${item.color}20`
                  e.currentTarget.style.boxShadow = `0 8px 25px ${item.color}30`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${item.color}10`
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div className="flex items-center">
                  <item.icon 
                    className="w-6 h-6 mr-4 transition-transform duration-300 group-hover:scale-110" 
                    style={{ color: item.color }} 
                  />
                  <div>
                    <p className="text-sm font-semibold transition-colors duration-300" style={{ 
                      color: colors.text.primary 
                    }}>
                      {item.title}
                    </p>
                    <p className="text-xs transition-colors duration-300" style={{ 
                      color: colors.text.muted 
                    }}>
                      {item.subtitle}
                    </p>
                  </div>
                </div>
                <Badge 
                  className="text-white font-bold px-3 py-1 shadow-lg" 
                  style={{ 
                    backgroundColor: item.color,
                    boxShadow: `0 4px 15px ${item.color}40`
                  }}
                >
                  {item.value}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Enhanced Recent Activity */}
        <Card 
          className="lg:col-span-3 border-0 shadow-xl hover:shadow-2xl transition-all duration-300"
          style={{
            backgroundColor: colors.glass.card,
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: `1px solid ${colors.borderElevated}`,
            boxShadow: isDark 
              ? `0 15px 35px ${colors.shadow.medium}` 
              : `0 10px 25px ${colors.shadow.light}`
          }}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold transition-colors duration-300" style={{ 
                color: colors.text.primary 
              }}>
                Recent Activity
              </CardTitle>
              <div className="flex items-center space-x-4">
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  className="text-sm rounded-xl px-4 py-2 focus:outline-none font-medium transition-all duration-300 shadow-sm"
                  style={{
                    backgroundColor: colors.glass.surface,
                    color: colors.text.primary,
                    border: `1px solid ${colors.borderElevated}`,
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <option value="All">All Activity</option>
                  <option value="Success">Successful</option>
                  <option value="Warning">Warnings</option>
                  <option value="Today">Today</option>
                </select>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                  style={{
                    borderColor: colors.borderElevated,
                    color: colors.text.secondary,
                    backgroundColor: colors.glass.surface,
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  View All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredActivity.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-start space-x-4 p-4 rounded-xl transition-all duration-300 cursor-pointer group hover:scale-[1.01]"
                  style={{ backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.glass.surfaceHover
                    e.currentTarget.style.boxShadow = `0 4px 15px ${colors.shadow.light}`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div 
                    className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${colors.primary}15` }}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-bold transition-colors duration-300" style={{ 
                          color: colors.text.primary 
                        }}>
                          {activity.client}
                        </p>
                        <p className="text-sm mt-1 transition-colors duration-300" style={{ 
                          color: colors.text.secondary 
                        }}>
                          {activity.message}
                        </p>
                        <div className="flex items-center space-x-4 mt-3">
                          {activity.amount && (
                            <span className="text-sm font-semibold" style={{ color: colors.success }}>
                              {activity.amount}
                            </span>
                          )}
                          <span className="text-xs font-medium transition-colors duration-300" style={{ 
                            color: colors.text.muted 
                          }}>
                            {activity.time}
                          </span>
                        </div>
                      </div>
                      
                      <Badge 
                        className="text-white border-0 text-xs font-bold shadow-lg"
                        style={{
                          backgroundColor: 
                            activity.status === 'success' ? colors.success :
                            activity.status === 'warning' ? colors.warning :
                            colors.primary,
                          boxShadow: `0 4px 15px ${
                            activity.status === 'success' ? colors.success :
                            activity.status === 'warning' ? colors.warning :
                            colors.primary
                          }40`
                        }}
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}