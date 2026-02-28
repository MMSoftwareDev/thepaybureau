'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Download
} from 'lucide-react'

const summaryCards = [
  { title: 'Active Payrolls', value: '15', icon: Calendar, color: '#401D6C', change: '+2 this week' },
  { title: 'Pending Submissions', value: '3', icon: Clock, color: '#F59E0B', change: 'Due today: 1' },
  { title: 'Completed This Month', value: '42', icon: CheckCircle2, color: '#10B981', change: '+8 vs last month' },
  { title: 'Employees Processed', value: '1,247', icon: Users, color: '#EC385D', change: '+56 new' },
]

const recentPayrolls = [
  { id: 1, client: 'Acme Corporation Ltd', period: '1-28 Feb 2026', status: 'Processing', employees: 150, amount: '£45,200.00', dueDate: '28 Feb 2026' },
  { id: 2, client: 'TechStart Industries', period: '1-28 Feb 2026', status: 'Submitted', employees: 89, amount: '£28,750.00', dueDate: '28 Feb 2026' },
  { id: 3, client: 'Regional Health Trust', period: '1-28 Feb 2026', status: 'Completed', employees: 312, amount: '£112,400.00', dueDate: '25 Feb 2026' },
  { id: 4, client: 'Greenfield Estates', period: '1-28 Feb 2026', status: 'Processing', employees: 45, amount: '£14,890.00', dueDate: '28 Feb 2026' },
  { id: 5, client: 'Metro Logistics Group', period: '1-28 Feb 2026', status: 'Completed', employees: 203, amount: '£67,320.00', dueDate: '25 Feb 2026' },
  { id: 6, client: 'Coastal Hospitality Ltd', period: '1-28 Feb 2026', status: 'Submitted', employees: 78, amount: '£21,540.00', dueDate: '27 Feb 2026' },
  { id: 7, client: 'Pinnacle Financial Services', period: '1-28 Feb 2026', status: 'Processing', employees: 134, amount: '£52,100.00', dueDate: '28 Feb 2026' },
  { id: 8, client: 'Northern Manufacturing Co', period: '1-28 Feb 2026', status: 'Completed', employees: 236, amount: '£78,650.00', dueDate: '24 Feb 2026' },
]

const getStatusStyle = (status: string, colors: ReturnType<typeof getThemeColors>) => {
  switch (status) {
    case 'Processing':
      return { backgroundColor: `${colors.primary}20`, color: colors.primary, border: `1px solid ${colors.primary}30` }
    case 'Submitted':
      return { backgroundColor: '#F59E0B20', color: '#F59E0B', border: '1px solid #F59E0B30' }
    case 'Completed':
      return { backgroundColor: '#10B98120', color: '#10B981', border: '1px solid #10B98130' }
    default:
      return { backgroundColor: `${colors.text.muted}20`, color: colors.text.muted, border: `1px solid ${colors.text.muted}30` }
  }
}

export default function PayrollOverviewPage() {
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-36 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    )
  }

  const filteredPayrolls = recentPayrolls.filter(p => {
    const matchesSearch = p.client.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 transition-colors duration-300" style={{ color: colors.text.primary }}>
            Payroll Overview
          </h1>
          <p className="text-lg transition-colors duration-300" style={{ color: colors.text.secondary }}>
            Monitor all payroll runs across your bureau
          </p>
        </div>
        <Button
          className="text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl border-0"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
            boxShadow: `0 10px 25px ${colors.primary}30`
          }}
        >
          <Calendar className="w-4 h-4 mr-2" />
          New Payroll Run
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryCards.map((card, index) => (
          <Card
            key={index}
            className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] group"
            style={{
              backgroundColor: colors.glass.card,
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: `1px solid ${colors.borderElevated}`,
              boxShadow: isDark ? `0 10px 30px ${colors.shadow.medium}` : `0 10px 25px ${colors.shadow.light}`
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold mb-2 transition-colors duration-300" style={{ color: colors.text.secondary }}>
                    {card.title}
                  </p>
                  <p className="text-4xl font-bold mb-2 transition-colors duration-300" style={{ color: colors.text.primary }}>
                    {card.value}
                  </p>
                  <p className="text-xs font-medium transition-colors duration-300" style={{ color: colors.text.muted }}>
                    {card.change}
                  </p>
                </div>
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${card.color}20`, boxShadow: `0 8px 25px ${card.color}30` }}
                >
                  <card.icon className="w-8 h-8" style={{ color: card.color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Payrolls Table */}
      <Card
        className="border-0 shadow-xl transition-all duration-300"
        style={{
          backgroundColor: colors.glass.card,
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: `1px solid ${colors.borderElevated}`,
          boxShadow: isDark ? `0 15px 35px ${colors.shadow.medium}` : `0 10px 25px ${colors.shadow.light}`
        }}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold transition-colors duration-300" style={{ color: colors.text.primary }}>
              Recent Payrolls
            </CardTitle>
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: colors.text.muted }} />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl text-sm font-medium focus:outline-none transition-all duration-300"
                  style={{
                    backgroundColor: colors.glass.surface,
                    color: colors.text.primary,
                    border: `1px solid ${colors.borderElevated}`,
                    backdropFilter: 'blur(10px)'
                  }}
                />
              </div>
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm rounded-xl px-4 py-2 focus:outline-none font-medium transition-all duration-300"
                style={{
                  backgroundColor: colors.glass.surface,
                  color: colors.text.primary,
                  border: `1px solid ${colors.borderElevated}`
                }}
              >
                <option value="All">All Status</option>
                <option value="Processing">Processing</option>
                <option value="Submitted">Submitted</option>
                <option value="Completed">Completed</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl font-semibold transition-all duration-300"
                style={{
                  borderColor: colors.borderElevated,
                  color: colors.text.secondary,
                  backgroundColor: colors.glass.surface
                }}
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.borderElevated}` }}>
                  {['Client', 'Period', 'Status', 'Employees', 'Amount', 'Due Date'].map((header) => (
                    <th
                      key={header}
                      className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider"
                      style={{ color: colors.text.muted }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPayrolls.map((payroll) => (
                  <tr
                    key={payroll.id}
                    className="transition-all duration-200 cursor-pointer"
                    style={{ borderBottom: `1px solid ${colors.border}` }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = colors.glass.surfaceHover
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <td className="py-4 px-4">
                      <span className="text-sm font-semibold" style={{ color: colors.text.primary }}>{payroll.client}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-medium" style={{ color: colors.text.secondary }}>{payroll.period}</span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        className="text-xs font-bold px-3 py-1 rounded-full border-0"
                        style={getStatusStyle(payroll.status, colors)}
                      >
                        {payroll.status === 'Processing' && <Clock className="w-3 h-3 mr-1" />}
                        {payroll.status === 'Submitted' && <AlertCircle className="w-3 h-3 mr-1" />}
                        {payroll.status === 'Completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {payroll.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-medium" style={{ color: colors.text.secondary }}>{payroll.employees}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-bold" style={{ color: colors.text.primary }}>{payroll.amount}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-medium" style={{ color: colors.text.secondary }}>{payroll.dueDate}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
