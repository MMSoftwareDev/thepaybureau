'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import {
  TrendingUp,
  BarChart3,
  Target,
  ArrowUp,
  ArrowDown,
  Minus,
  Users,
  PoundSterling,
  AlertCircle,
  Award,
  RefreshCw
} from 'lucide-react'

const benchmarkMetrics = [
  {
    title: 'Revenue per Client',
    yourValue: '£185',
    industryAvg: '£142',
    unit: '/month',
    comparison: 'above',
    percentage: '+30.3%',
    description: 'Your average monthly revenue per client compared to industry standard',
    icon: PoundSterling,
    color: '#10B981'
  },
  {
    title: 'Clients per Staff',
    yourValue: '31',
    industryAvg: '25',
    unit: ' clients',
    comparison: 'above',
    percentage: '+24.0%',
    description: 'Number of active clients managed per staff member',
    icon: Users,
    color: '#10B981'
  },
  {
    title: 'Payroll Error Rate',
    yourValue: '2.1%',
    industryAvg: '3.8%',
    unit: '',
    comparison: 'below',
    percentage: '-44.7%',
    description: 'Percentage of payroll runs requiring corrections (lower is better)',
    icon: Target,
    color: '#10B981'
  },
  {
    title: 'Client Retention',
    yourValue: '94.2%',
    industryAvg: '87.5%',
    unit: '',
    comparison: 'above',
    percentage: '+7.7%',
    description: 'Annual client retention rate compared to sector average',
    icon: TrendingUp,
    color: '#10B981'
  },
]

const detailedMetrics = [
  { metric: 'Average Fee per Payslip', yours: '£5.50', industry: '£4.80', diff: '+14.6%', status: 'above' },
  { metric: 'Average Fee per Payroll', yours: '£87.70', industry: '£72.00', diff: '+21.8%', status: 'above' },
  { metric: 'Processing Time (avg)', yours: '1.8 days', industry: '2.4 days', diff: '-25.0%', status: 'below' },
  { metric: 'First-Time Accuracy', yours: '97.9%', industry: '96.2%', diff: '+1.8%', status: 'above' },
  { metric: 'Client Satisfaction', yours: '4.7/5', industry: '4.2/5', diff: '+11.9%', status: 'above' },
  { metric: 'Onboarding Time', yours: '5 days', industry: '8 days', diff: '-37.5%', status: 'below' },
  { metric: 'Compliance Score', yours: '98.5%', industry: '94.0%', diff: '+4.8%', status: 'above' },
  { metric: 'Staff Utilization', yours: '86%', industry: '78%', diff: '+10.3%', status: 'above' },
]

const getComparisonIcon = (comparison: string, isGoodDirection: boolean) => {
  if (comparison === 'above') return isGoodDirection ? ArrowUp : ArrowDown
  if (comparison === 'below') return isGoodDirection ? ArrowDown : ArrowUp
  return Minus
}

export default function BenchmarkingPage() {
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
        <div className="grid grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 transition-colors duration-300" style={{ color: colors.text.primary }}>
            Bureau Benchmarking
          </h1>
          <p className="text-lg transition-colors duration-300" style={{ color: colors.text.secondary }}>
            Compare your bureau performance against industry averages
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge
            className="text-sm font-bold px-4 py-2 rounded-xl border-0"
            style={{ backgroundColor: '#10B98120', color: '#10B981' }}
          >
            <Award className="w-4 h-4 mr-2" />
            Above Average Overall
          </Badge>
          <Button
            variant="outline"
            className="font-semibold py-3 px-6 rounded-xl transition-all duration-300"
            style={{ borderColor: colors.borderElevated, color: colors.text.secondary, backgroundColor: colors.glass.surface }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Primary Benchmark Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {benchmarkMetrics.map((metric, index) => {
          const isPositive = metric.color === '#10B981'
          return (
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
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                      style={{ backgroundColor: `${metric.color}20`, boxShadow: `0 8px 25px ${metric.color}30` }}
                    >
                      <metric.icon className="w-6 h-6" style={{ color: metric.color }} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold" style={{ color: colors.text.primary }}>{metric.title}</h3>
                      <Badge
                        className="text-xs font-bold px-2 py-0.5 rounded-full border-0 mt-1"
                        style={{ backgroundColor: `${metric.color}20`, color: metric.color }}
                      >
                        {metric.comparison === 'above' ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                        {metric.percentage} vs industry
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Comparison Bars */}
                <div className="space-y-4">
                  {/* Your Bureau */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.text.secondary }}>
                        Your Bureau
                      </span>
                      <span className="text-lg font-bold" style={{ color: colors.text.primary }}>
                        {metric.yourValue}{metric.unit}
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: `${colors.text.muted}15` }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: '85%',
                          background: `linear-gradient(90deg, ${colors.primary}, ${colors.secondary})`,
                          boxShadow: `0 2px 8px ${colors.primary}30`
                        }}
                      />
                    </div>
                  </div>

                  {/* Industry Average */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: colors.text.muted }}>
                        Industry Average
                      </span>
                      <span className="text-lg font-semibold" style={{ color: colors.text.muted }}>
                        {metric.industryAvg}{metric.unit}
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full overflow-hidden" style={{ backgroundColor: `${colors.text.muted}15` }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: '60%',
                          backgroundColor: `${colors.text.muted}40`
                        }}
                      />
                    </div>
                  </div>
                </div>

                <p className="text-xs mt-4 pt-4 font-medium" style={{ color: colors.text.muted, borderTop: `1px solid ${colors.border}` }}>
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Detailed Metrics Table */}
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
              Detailed Performance Metrics
            </CardTitle>
            <Badge className="text-xs font-bold px-3 py-1 rounded-full border-0" style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
              {detailedMetrics.filter(m => m.status === 'above' || (m.status === 'below' && (m.metric.includes('Time') || m.metric.includes('Error')))).length} / {detailedMetrics.length} Above Average
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.borderElevated}` }}>
                  {['Metric', 'Your Bureau', 'Industry Average', 'Difference', 'Performance'].map((header) => (
                    <th key={header} className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: colors.text.muted }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detailedMetrics.map((metric, index) => {
                  // For time and error metrics, "below" is good
                  const isTimeOrError = metric.metric.includes('Time') || metric.metric.includes('Error')
                  const isGood = isTimeOrError
                    ? metric.status === 'below'
                    : metric.status === 'above'
                  const indicatorColor = isGood ? '#10B981' : '#EF4444'

                  return (
                    <tr
                      key={index}
                      className="transition-all duration-200"
                      style={{ borderBottom: `1px solid ${colors.border}` }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.glass.surfaceHover }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <td className="py-4 px-4">
                        <span className="text-sm font-semibold" style={{ color: colors.text.primary }}>{metric.metric}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-bold" style={{ color: colors.text.primary }}>{metric.yours}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-medium" style={{ color: colors.text.muted }}>{metric.industry}</span>
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          className="text-xs font-bold px-2.5 py-1 rounded-full border-0"
                          style={{ backgroundColor: `${indicatorColor}20`, color: indicatorColor }}
                        >
                          {isGood ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                          {metric.diff}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-24 h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${colors.text.muted}15` }}>
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: isGood ? '85%' : '45%',
                                backgroundColor: indicatorColor
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold" style={{ color: indicatorColor }}>
                            {isGood ? 'Above' : 'Below'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
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
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                boxShadow: `0 10px 25px ${colors.primary}30`
              }}
            >
              <Award className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>
                Overall Bureau Rating: Excellent
              </h3>
              <p className="text-base" style={{ color: colors.text.secondary }}>
                Your bureau outperforms the industry average across all key metrics. Revenue per client and error rates are
                particularly strong. Consider focusing on further reducing processing times to maintain your competitive edge.
              </p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold" style={{ color: colors.primary }}>A+</div>
              <p className="text-sm font-medium mt-1" style={{ color: colors.text.muted }}>Top 10% of bureaus</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
