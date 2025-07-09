'use client'

import { useEffect, useState } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  UserPlus, 
  Clock, 
  BarChart3, 
  ArrowUp, 
  ArrowDown,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Activity,
  PoundSterling,
  Target
} from 'lucide-react'
import { useRouter } from 'next/navigation'

// ThePayBureau Brand Colors
const colors = {
  primary: '#401D6C',
  secondary: '#EC385D',
  accent: '#FF8073',
  lightBg: '#F8F4FF',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
}

// Dashboard data
const dashboardData = {
  // Primary metrics
  totalClients: 247,
  monthlyRevenue: 45670,
  activeContracts: 189,
  
  // Key performance indicators
  kpis: {
    clientRetentionRate: 94.2,
    payrollErrorRate: 2.1, // Percentage of payrolls requiring reprocessing/rollback
    averageFeePerPayroll: 87.70, // Average fee charged per payroll run
    averageFeePerPayslip: 5.50, // Average fee per individual payslip
    averageFeePerClient: 107.68, // Average fee per client per month
    clientSatisfaction: 4.7,
  },
  
  // Operational status
  operations: {
    activePayrolls: 15,
    pendingOnboarding: 8,
    contractRenewals: 12,
    complianceIssues: 3,
  },
  
  // Chart data for revenue trend (last 6 months) - clear increasing trend
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
    errorRate: [3.2, 2.8, 2.5, 2.3, 2.4, 2.1], // Decreasing is good (lower error rate)
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

// Simple chart components
const MiniLineChart = ({ data, color = colors.primary }: { data: number[], color?: string }) => {
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
            className="w-1 rounded-t-sm opacity-80"
            style={{
              height: `${Math.max(height, 10)}%`,
              backgroundColor: color
            }}
          />
        )
      })}
    </div>
  )
}

const RevenueChart = ({ data }: { data: typeof dashboardData.revenueChart }) => {
  // Use 16k as the scale maximum to show proper growth
  const scaleMax = 16000
  
  return (
    <div className="flex items-end justify-between h-32 px-2">
      {data.map((item, index) => {
        // Calculate height as percentage of our 16k scale
        const heightPercent = (item.revenue / scaleMax) * 100
        // Convert to actual pixels (out of 128px container height)
        const heightPx = Math.max((heightPercent / 100) * 128, 8)
        
        return (
          <div key={item.month} className="flex flex-col items-center space-y-2">
            <div
              className="w-8 rounded-t-lg transition-all hover:opacity-80 cursor-pointer"
              style={{
                height: `${heightPx}px`,
                backgroundColor: colors.secondary,
              }}
              title={`${item.month}: £${item.revenue.toLocaleString()}`}
            />
            <span className="text-xs text-gray-500 font-medium">{item.month}</span>
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
  const router = useRouter()
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    setUser(session.user)
    setLoading(false)
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

  // Filter recent activity based on selected filter
  const filteredActivity = dashboardData.recentActivity.filter(activity => {
    if (activityFilter === 'All') return true
    if (activityFilter === 'Success') return activity.status === 'success'
    if (activityFilter === 'Warning') return activity.status === 'warning'
    if (activityFilter === 'Today') {
      const today = new Date().toDateString()
      const activityDate = new Date(activity.time).toDateString()
      return today === activityDate
    }
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.primary }}></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your bureau overview.</p>
        </div>
        <Button 
          onClick={() => router.push('/dashboard/clients/add')}
          className="text-white transition-all duration-200"
          style={{ backgroundColor: colors.primary }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.secondary
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Primary Metrics - 3 main cards with larger borders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Clients</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{dashboardData.totalClients}</p>
                <div className="flex items-center mt-3">
                  <ArrowUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-sm font-medium text-green-600">5.2%</span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.primary}15` }}>
                <Users className="w-8 h-8" style={{ color: colors.primary }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Monthly Revenue</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">£{dashboardData.monthlyRevenue.toLocaleString()}</p>
                <div className="flex items-center mt-3">
                  <ArrowUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-sm font-medium text-green-600">12.3%</span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.success}15` }}>
                <PoundSterling className="w-8 h-8" style={{ color: colors.success }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Contracts</p>
                <p className="text-4xl font-bold text-gray-900 mt-2">{dashboardData.activeContracts}</p>
                <div className="flex items-center mt-3">
                  <ArrowUp className="w-4 h-4 text-green-600 mr-1" />
                  <span className="text-sm font-medium text-green-600">3.4%</span>
                  <span className="text-sm text-gray-500 ml-1">this month</span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.secondary}15` }}>
                <FileText className="w-8 h-8" style={{ color: colors.secondary }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two-column layout for charts and KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Trend Chart - takes 2 columns */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Revenue Trend</CardTitle>
              <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                +12.3% this month
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <RevenueChart data={dashboardData.revenueChart} />
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xl font-bold text-gray-900">£{dashboardData.kpis.averageFeePerPayroll}</p>
                  <p className="text-xs text-gray-600">Per Payroll</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">£{dashboardData.kpis.averageFeePerPayslip}</p>
                  <p className="text-xs text-gray-600">Per Payslip</p>
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">£{dashboardData.kpis.averageFeePerClient}</p>
                  <p className="text-xs text-gray-600">Per Client/Month</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs with mini charts - takes 1 column */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Key Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Client Retention</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.kpis.clientRetentionRate}%</p>
              </div>
              <MiniLineChart data={dashboardData.kpiTrends.retention} color={colors.success} />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Payroll Error Rate</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.kpis.payrollErrorRate}%</p>
              </div>
              <MiniLineChart data={dashboardData.kpiTrends.errorRate} color={colors.error} />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Client Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.kpis.clientSatisfaction}/5</p>
              </div>
              <MiniLineChart data={dashboardData.kpiTrends.satisfaction} color={colors.primary} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => router.push('/dashboard/clients/add')}
              className="h-14 text-white justify-start transition-all duration-200 shadow-sm hover:shadow-md"
              style={{ backgroundColor: colors.primary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.secondary
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.primary
                e.currentTarget.style.transform = 'translateY(0px)'
              }}
            >
              <Plus className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Add Client</div>
                <div className="text-xs opacity-90">Start new client onboarding</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-14 justify-start"
              style={{ borderColor: colors.secondary, color: colors.secondary }}
            >
              <FileText className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Create Contract</div>
                <div className="text-xs opacity-70">Setup service agreement</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-14 justify-start"
              style={{ borderColor: colors.accent, color: colors.accent }}
            >
              <BarChart3 className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">View Reports</div>
                <div className="text-xs opacity-70">Business analytics</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bottom section: Operations Status + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Operations Status */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Operations Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <Activity className="w-5 h-5 mr-3" style={{ color: colors.primary }} />
                <div>
                  <p className="text-sm font-medium text-gray-900">Active Payrolls</p>
                  <p className="text-xs text-gray-600">Currently processing</p>
                </div>
              </div>
              <Badge className="text-white" style={{ backgroundColor: colors.primary }}>
                {dashboardData.operations.activePayrolls}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <UserPlus className="w-5 h-5 mr-3" style={{ color: colors.success }} />
                <div>
                  <p className="text-sm font-medium text-gray-900">Onboarding</p>
                  <p className="text-xs text-gray-600">New clients in progress</p>
                </div>
              </div>
              <Badge className="text-white" style={{ backgroundColor: colors.success }}>
                {dashboardData.operations.pendingOnboarding}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-3" style={{ color: colors.secondary }} />
                <div>
                  <p className="text-sm font-medium text-gray-900">Renewals Due</p>
                  <p className="text-xs text-gray-600">This month</p>
                </div>
              </div>
              <Badge className="text-white" style={{ backgroundColor: colors.secondary }}>
                {dashboardData.operations.contractRenewals}
              </Badge>
            </div>

            {dashboardData.operations.complianceIssues > 0 && (
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-3" style={{ color: colors.warning }} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Compliance</p>
                    <p className="text-xs text-gray-600">Require attention</p>
                  </div>
                </div>
                <Badge className="text-white" style={{ backgroundColor: colors.warning }}>
                  {dashboardData.operations.complianceIssues}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3 border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
              <div className="flex items-center space-x-3">
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-gray-400"
                >
                  <option value="All">All Activity</option>
                  <option value="Success">Successful</option>
                  <option value="Warning">Warnings</option>
                  <option value="Today">Today</option>
                </select>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div 
                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${colors.primary}15` }}
                  >
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{activity.client}</p>
                        <p className="text-sm text-gray-600 mt-1">{activity.message}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          {activity.amount && (
                            <span className="text-sm font-medium" style={{ color: colors.success }}>
                              {activity.amount}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">{activity.time}</span>
                        </div>
                      </div>
                      
                      <Badge 
                        variant="outline" 
                        className="text-white border-0 text-xs"
                        style={{
                          backgroundColor: 
                            activity.status === 'success' ? colors.success :
                            activity.status === 'warning' ? colors.warning :
                            colors.primary
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