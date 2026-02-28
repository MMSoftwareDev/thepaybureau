'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import {
  UserCheck,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Filter
} from 'lucide-react'

const myPayrolls = [
  {
    id: 1,
    client: 'Acme Corporation Ltd',
    period: '1-28 Feb 2026',
    status: 'In Progress',
    employees: 150,
    deadline: '28 Feb 2026',
    progress: 65,
    lastUpdated: '2 hours ago',
    priority: 'high'
  },
  {
    id: 2,
    client: 'TechStart Industries',
    period: '1-28 Feb 2026',
    status: 'Pending Review',
    employees: 89,
    deadline: '28 Feb 2026',
    progress: 90,
    lastUpdated: '30 min ago',
    priority: 'medium'
  },
  {
    id: 3,
    client: 'Regional Health Trust',
    period: '1-28 Feb 2026',
    status: 'Completed',
    employees: 312,
    deadline: '25 Feb 2026',
    progress: 100,
    lastUpdated: '1 day ago',
    priority: 'low'
  },
  {
    id: 4,
    client: 'Greenfield Estates',
    period: '1-28 Feb 2026',
    status: 'In Progress',
    employees: 45,
    deadline: '28 Feb 2026',
    progress: 40,
    lastUpdated: '4 hours ago',
    priority: 'high'
  },
  {
    id: 5,
    client: 'Metro Logistics Group',
    period: '1-28 Feb 2026',
    status: 'Completed',
    employees: 203,
    deadline: '25 Feb 2026',
    progress: 100,
    lastUpdated: '2 days ago',
    priority: 'low'
  },
  {
    id: 6,
    client: 'Coastal Hospitality Ltd',
    period: '1-28 Feb 2026',
    status: 'Pending Review',
    employees: 78,
    deadline: '27 Feb 2026',
    progress: 85,
    lastUpdated: '1 hour ago',
    priority: 'medium'
  },
  {
    id: 7,
    client: 'Pinnacle Financial Services',
    period: '1-28 Feb 2026',
    status: 'In Progress',
    employees: 134,
    deadline: '28 Feb 2026',
    progress: 55,
    lastUpdated: '5 hours ago',
    priority: 'high'
  },
  {
    id: 8,
    client: 'Northern Manufacturing Co',
    period: '1-28 Feb 2026',
    status: 'Completed',
    employees: 236,
    deadline: '24 Feb 2026',
    progress: 100,
    lastUpdated: '3 days ago',
    priority: 'low'
  },
]

const tabs = ['All', 'In Progress', 'Pending Review', 'Completed']

const getStatusStyle = (status: string, colors: ReturnType<typeof getThemeColors>) => {
  switch (status) {
    case 'In Progress':
      return { bg: `${colors.primary}20`, color: colors.primary, border: `${colors.primary}30` }
    case 'Pending Review':
      return { bg: '#F59E0B20', color: '#F59E0B', border: '#F59E0B30' }
    case 'Completed':
      return { bg: '#10B98120', color: '#10B981', border: '#10B98130' }
    default:
      return { bg: `${colors.text.muted}20`, color: colors.text.muted, border: `${colors.text.muted}30` }
  }
}

const getPriorityStyle = (priority: string) => {
  switch (priority) {
    case 'high': return { bg: '#EF444420', color: '#EF4444' }
    case 'medium': return { bg: '#F59E0B20', color: '#F59E0B' }
    case 'low': return { bg: '#10B98120', color: '#10B981' }
    default: return { bg: '#6B728020', color: '#6B7280' }
  }
}

export default function YourPayrollsPage() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('All')
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    )
  }

  const filteredPayrolls = myPayrolls.filter(p => {
    if (activeTab === 'All') return true
    return p.status === activeTab
  })

  const statusCounts = {
    'All': myPayrolls.length,
    'In Progress': myPayrolls.filter(p => p.status === 'In Progress').length,
    'Pending Review': myPayrolls.filter(p => p.status === 'Pending Review').length,
    'Completed': myPayrolls.filter(p => p.status === 'Completed').length,
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 transition-colors duration-300" style={{ color: colors.text.primary }}>
            Your Payrolls
          </h1>
          <p className="text-lg transition-colors duration-300" style={{ color: colors.text.secondary }}>
            Manage your assigned payroll runs
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge
            className="text-sm font-bold px-4 py-2 rounded-xl border-0"
            style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}
          >
            <UserCheck className="w-4 h-4 mr-2" />
            {myPayrolls.filter(p => p.status !== 'Completed').length} Active Assignments
          </Badge>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2">
        {tabs.map((tab) => (
          <Button
            key={tab}
            variant="outline"
            size="sm"
            onClick={() => setActiveTab(tab)}
            className="rounded-xl font-semibold transition-all duration-300 border-0"
            style={{
              backgroundColor: activeTab === tab
                ? colors.primary
                : colors.glass.surface,
              color: activeTab === tab ? 'white' : colors.text.secondary,
              boxShadow: activeTab === tab ? `0 8px 25px ${colors.primary}30` : 'none'
            }}
          >
            {tab}
            <Badge
              className="ml-2 text-xs font-bold rounded-full border-0 h-5 w-5 flex items-center justify-center p-0"
              style={{
                backgroundColor: activeTab === tab ? 'rgba(255,255,255,0.3)' : `${colors.text.muted}20`,
                color: activeTab === tab ? 'white' : colors.text.muted
              }}
            >
              {statusCounts[tab as keyof typeof statusCounts]}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Payroll Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPayrolls.map((payroll) => {
          const statusStyle = getStatusStyle(payroll.status, colors)
          const priorityStyle = getPriorityStyle(payroll.priority)

          return (
            <Card
              key={payroll.id}
              className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] group cursor-pointer"
              style={{
                backgroundColor: colors.glass.card,
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                border: `1px solid ${colors.borderElevated}`,
                boxShadow: isDark ? `0 10px 30px ${colors.shadow.medium}` : `0 10px 25px ${colors.shadow.light}`
              }}
            >
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1 transition-colors duration-300" style={{ color: colors.text.primary }}>
                      {payroll.client}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5" style={{ color: colors.text.muted }} />
                      <span className="text-sm font-medium" style={{ color: colors.text.muted }}>{payroll.period}</span>
                    </div>
                  </div>
                  <Badge
                    className="text-xs font-bold px-2.5 py-1 rounded-full capitalize border-0"
                    style={{ backgroundColor: priorityStyle.bg, color: priorityStyle.color }}
                  >
                    {payroll.priority}
                  </Badge>
                </div>

                {/* Status Badge */}
                <Badge
                  className="text-xs font-bold px-3 py-1 rounded-full mb-4 border-0"
                  style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                >
                  {payroll.status === 'In Progress' && <Clock className="w-3 h-3 mr-1" />}
                  {payroll.status === 'Pending Review' && <AlertCircle className="w-3 h-3 mr-1" />}
                  {payroll.status === 'Completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {payroll.status}
                </Badge>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: colors.text.secondary }}>Progress</span>
                    <span className="text-xs font-bold" style={{ color: colors.text.primary }}>{payroll.progress}%</span>
                  </div>
                  <div
                    className="w-full h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: `${colors.text.muted}20` }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${payroll.progress}%`,
                        background: payroll.progress === 100
                          ? '#10B981'
                          : `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`
                      }}
                    />
                  </div>
                </div>

                {/* Details */}
                <div className="flex items-center justify-between mb-4 py-3 rounded-xl px-3" style={{ backgroundColor: `${colors.text.muted}08` }}>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" style={{ color: colors.text.muted }} />
                    <span className="text-sm font-semibold" style={{ color: colors.text.secondary }}>
                      {payroll.employees} employees
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" style={{ color: colors.text.muted }} />
                    <span className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                      Due {payroll.deadline.split(' ').slice(0, 2).join(' ')}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: colors.text.muted }}>
                    Updated {payroll.lastUpdated}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-xs font-semibold group-hover:translate-x-1 transition-all duration-300"
                    style={{ color: colors.primary }}
                  >
                    View Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
