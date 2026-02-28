'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import {
  Archive,
  Users,
  PieChart,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Building2,
  TrendingUp,
  UserMinus,
  UserPlus
} from 'lucide-react'

const enrollmentStats = [
  { title: 'Enrolled', value: '892', icon: UserPlus, color: '#10B981', percentage: '93%', description: 'Currently contributing' },
  { title: 'Opted Out', value: '45', icon: UserMinus, color: '#F59E0B', percentage: '4.7%', description: 'Voluntary opt-out' },
  { title: 'Pending', value: '23', icon: AlertCircle, color: '#EC385D', percentage: '2.3%', description: 'Awaiting enrollment' },
]

const providers = [
  {
    name: 'NEST',
    enrolled: 412,
    contributions: '£28,450/mo',
    status: 'Active',
    lastSubmission: '20 Feb 2026',
    nextDue: '20 Mar 2026',
    compliance: 'Compliant'
  },
  {
    name: "People's Pension",
    enrolled: 286,
    contributions: '£19,800/mo',
    status: 'Active',
    lastSubmission: '18 Feb 2026',
    nextDue: '18 Mar 2026',
    compliance: 'Compliant'
  },
  {
    name: 'NOW: Pensions',
    enrolled: 134,
    contributions: '£9,200/mo',
    status: 'Active',
    lastSubmission: '15 Feb 2026',
    nextDue: '15 Mar 2026',
    compliance: 'Compliant'
  },
  {
    name: 'Scottish Widows',
    enrolled: 60,
    contributions: '£5,100/mo',
    status: 'Review Required',
    lastSubmission: '12 Feb 2026',
    nextDue: '12 Mar 2026',
    compliance: 'Attention Needed'
  },
]

const recentActions = [
  { employee: 'Sarah Johnson', client: 'Acme Corporation', action: 'Auto Enrolled', date: '25 Feb 2026', provider: 'NEST' },
  { employee: 'Mark Williams', client: 'TechStart Industries', action: 'Opted Out', date: '24 Feb 2026', provider: "People's Pension" },
  { employee: 'Emma Davies', client: 'Regional Health Trust', action: 'Contribution Increase', date: '23 Feb 2026', provider: 'NOW: Pensions' },
  { employee: 'James Brown', client: 'Greenfield Estates', action: 'Auto Enrolled', date: '22 Feb 2026', provider: 'NEST' },
  { employee: 'Lisa Chen', client: 'Metro Logistics', action: 'Re-enrolled', date: '21 Feb 2026', provider: "People's Pension" },
]

export default function PensionCompliancePage() {
  const [mounted, setMounted] = useState(false)
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
          {[1, 2, 3].map(i => <div key={i} className="h-36 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    )
  }

  const totalEmployees = enrollmentStats.reduce((sum, stat) => sum + parseInt(stat.value), 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 transition-colors duration-300" style={{ color: colors.text.primary }}>
            Pension Compliance
          </h1>
          <p className="text-lg transition-colors duration-300" style={{ color: colors.text.secondary }}>
            Auto enrollment management and pension provider oversight
          </p>
        </div>
        <Button
          className="text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl border-0"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
            boxShadow: `0 10px 25px ${colors.primary}30`
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Run Compliance Check
        </Button>
      </div>

      {/* Enrollment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {enrollmentStats.map((stat, index) => (
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
                    {stat.title}
                  </p>
                  <div className="flex items-baseline space-x-2 mb-1">
                    <p className="text-4xl font-bold transition-colors duration-300" style={{ color: colors.text.primary }}>
                      {stat.value}
                    </p>
                    <span className="text-lg font-semibold" style={{ color: stat.color }}>{stat.percentage}</span>
                  </div>
                  <p className="text-xs font-medium" style={{ color: colors.text.muted }}>{stat.description}</p>
                </div>
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${stat.color}20`, boxShadow: `0 8px 25px ${stat.color}30` }}
                >
                  <stat.icon className="w-8 h-8" style={{ color: stat.color }} />
                </div>
              </div>

              {/* Mini progress bar */}
              <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${colors.borderElevated}` }}>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${colors.text.muted}20` }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(parseInt(stat.value) / totalEmployees) * 100}%`,
                      backgroundColor: stat.color
                    }}
                  />
                </div>
                <p className="text-xs font-medium mt-2" style={{ color: colors.text.muted }}>
                  {((parseInt(stat.value) / totalEmployees) * 100).toFixed(1)}% of total workforce
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Provider Breakdown */}
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
            <CardTitle className="text-xl font-bold" style={{ color: colors.text.primary }}>
              Pension Provider Breakdown
            </CardTitle>
            <Badge className="text-xs font-bold px-3 py-1 rounded-full border-0" style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
              {providers.length} Providers
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {providers.map((provider, index) => (
              <div
                key={index}
                className="p-5 rounded-xl transition-all duration-300 cursor-pointer group hover:scale-[1.01]"
                style={{
                  backgroundColor: `${colors.text.muted}05`,
                  border: `1px solid ${colors.borderElevated}`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.glass.surfaceHover
                  e.currentTarget.style.boxShadow = `0 8px 25px ${colors.shadow.light}`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${colors.text.muted}05`
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${colors.primary}15` }}
                    >
                      <Building2 className="w-6 h-6" style={{ color: colors.primary }} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold" style={{ color: colors.text.primary }}>{provider.name}</h4>
                      <Badge
                        className="text-xs font-bold px-2 py-0.5 rounded-full border-0 mt-1"
                        style={{
                          backgroundColor: provider.compliance === 'Compliant' ? '#10B98120' : '#F59E0B20',
                          color: provider.compliance === 'Compliant' ? '#10B981' : '#F59E0B'
                        }}
                      >
                        {provider.compliance === 'Compliant' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {provider.compliance === 'Attention Needed' && <AlertCircle className="w-3 h-3 mr-1" />}
                        {provider.compliance}
                      </Badge>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" style={{ color: colors.text.muted }} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: `${colors.text.muted}08` }}>
                    <p className="text-xs font-medium" style={{ color: colors.text.muted }}>Enrolled</p>
                    <p className="text-lg font-bold" style={{ color: colors.text.primary }}>{provider.enrolled}</p>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: `${colors.text.muted}08` }}>
                    <p className="text-xs font-medium" style={{ color: colors.text.muted }}>Contributions</p>
                    <p className="text-lg font-bold" style={{ color: colors.text.primary }}>{provider.contributions}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: `1px solid ${colors.border}` }}>
                  <span className="text-xs font-medium" style={{ color: colors.text.muted }}>
                    Last: {provider.lastSubmission}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: colors.primary }}>
                    Next: {provider.nextDue}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Actions */}
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
          <CardTitle className="text-xl font-bold" style={{ color: colors.text.primary }}>
            Recent Pension Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.borderElevated}` }}>
                  {['Employee', 'Client', 'Action', 'Provider', 'Date'].map((header) => (
                    <th key={header} className="text-left py-3 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: colors.text.muted }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentActions.map((action, index) => (
                  <tr
                    key={index}
                    className="transition-all duration-200"
                    style={{ borderBottom: `1px solid ${colors.border}` }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.glass.surfaceHover }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <td className="py-3 px-4">
                      <span className="text-sm font-semibold" style={{ color: colors.text.primary }}>{action.employee}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium" style={{ color: colors.text.secondary }}>{action.client}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        className="text-xs font-bold px-2.5 py-1 rounded-full border-0"
                        style={{
                          backgroundColor: action.action === 'Auto Enrolled' || action.action === 'Re-enrolled' ? '#10B98120' :
                            action.action === 'Opted Out' ? '#F59E0B20' : `${colors.primary}20`,
                          color: action.action === 'Auto Enrolled' || action.action === 'Re-enrolled' ? '#10B981' :
                            action.action === 'Opted Out' ? '#F59E0B' : colors.primary
                        }}
                      >
                        {action.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium" style={{ color: colors.text.secondary }}>{action.provider}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium" style={{ color: colors.text.muted }}>{action.date}</span>
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
