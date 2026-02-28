'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import {
  BarChart3,
  FileText,
  Download,
  TrendingUp,
  Users,
  PoundSterling,
  Shield,
  Calendar,
  Clock,
  ArrowRight,
  Search
} from 'lucide-react'

const reportCategories = [
  {
    title: 'Revenue Reports',
    description: 'Track income, fee analysis, revenue per client and growth trends across your bureau',
    icon: PoundSterling,
    color: '#10B981',
    reports: ['Monthly Revenue Summary', 'Fee Breakdown by Client', 'Revenue Growth Analysis', 'Payment Collection Report'],
    count: 4
  },
  {
    title: 'Client Reports',
    description: 'Client portfolio insights including retention, acquisition and satisfaction metrics',
    icon: Users,
    color: '#401D6C',
    reports: ['Client Retention Report', 'New Client Acquisition', 'Client Satisfaction Summary', 'Service Level Compliance'],
    count: 4
  },
  {
    title: 'Payroll Reports',
    description: 'Operational payroll metrics, processing times, error rates and volumes',
    icon: BarChart3,
    color: '#EC385D',
    reports: ['Payroll Processing Summary', 'Error Rate Analysis', 'Volume Trends', 'Cost per Payslip Report'],
    count: 4
  },
  {
    title: 'Compliance Reports',
    description: 'HMRC submission status, pension compliance, and regulatory deadline tracking',
    icon: Shield,
    color: '#F59E0B',
    reports: ['HMRC Submission History', 'Pension Compliance Summary', 'RTI Filing Report', 'Year-End Compliance Pack'],
    count: 4
  },
]

const recentReports = [
  { name: 'Monthly Revenue Summary - Feb 2026', category: 'Revenue', generatedDate: '25 Feb 2026', size: '245 KB', format: 'PDF' },
  { name: 'Client Retention Report - Q1 2026', category: 'Client', generatedDate: '20 Feb 2026', size: '180 KB', format: 'PDF' },
  { name: 'Payroll Error Analysis - Feb 2026', category: 'Payroll', generatedDate: '22 Feb 2026', size: '312 KB', format: 'Excel' },
  { name: 'HMRC RTI Filing Summary', category: 'Compliance', generatedDate: '19 Feb 2026', size: '156 KB', format: 'PDF' },
  { name: 'Fee Breakdown by Client - Feb 2026', category: 'Revenue', generatedDate: '18 Feb 2026', size: '198 KB', format: 'Excel' },
  { name: 'Pension Compliance Pack - Feb 2026', category: 'Compliance', generatedDate: '15 Feb 2026', size: '520 KB', format: 'PDF' },
]

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'Revenue': return '#10B981'
    case 'Client': return '#401D6C'
    case 'Payroll': return '#EC385D'
    case 'Compliance': return '#F59E0B'
    default: return '#6B7280'
  }
}

export default function ReportsPage() {
  const [mounted, setMounted] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
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
            Reports
          </h1>
          <p className="text-lg transition-colors duration-300" style={{ color: colors.text.secondary }}>
            Generate and manage analytics, insights, and business reports
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            className="font-semibold py-3 px-6 rounded-xl transition-all duration-300"
            style={{ borderColor: colors.borderElevated, color: colors.text.secondary, backgroundColor: colors.glass.surface }}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Report
          </Button>
          <Button
            className="text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl border-0"
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
              boxShadow: `0 10px 25px ${colors.primary}30`
            }}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Custom Report
          </Button>
        </div>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCategories.map((category, index) => (
          <Card
            key={index}
            className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] group cursor-pointer"
            style={{
              backgroundColor: colors.glass.card,
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: `1px solid ${selectedCategory === category.title ? category.color : colors.borderElevated}`,
              boxShadow: selectedCategory === category.title
                ? `0 10px 30px ${category.color}20`
                : isDark ? `0 10px 30px ${colors.shadow.medium}` : `0 10px 25px ${colors.shadow.light}`
            }}
            onClick={() => setSelectedCategory(selectedCategory === category.title ? null : category.title)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${category.color}20`, boxShadow: `0 8px 25px ${category.color}30` }}
                  >
                    <category.icon className="w-7 h-7" style={{ color: category.color }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: colors.text.primary }}>{category.title}</h3>
                    <Badge className="text-xs font-medium px-2 py-0.5 rounded-full border-0 mt-1" style={{ backgroundColor: `${category.color}15`, color: category.color }}>
                      {category.count} reports available
                    </Badge>
                  </div>
                </div>
                <ArrowRight
                  className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1"
                  style={{
                    color: colors.text.muted,
                    transform: selectedCategory === category.title ? 'rotate(90deg)' : 'none'
                  }}
                />
              </div>

              <p className="text-sm mb-4" style={{ color: colors.text.muted }}>
                {category.description}
              </p>

              {/* Expandable report list */}
              {selectedCategory === category.title && (
                <div className="space-y-2 pt-4" style={{ borderTop: `1px solid ${colors.borderElevated}` }}>
                  {category.reports.map((report, rIndex) => (
                    <div
                      key={rIndex}
                      className="flex items-center justify-between p-3 rounded-xl transition-all duration-200"
                      style={{ backgroundColor: `${colors.text.muted}05` }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.glass.surfaceHover }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${colors.text.muted}05` }}
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4" style={{ color: category.color }} />
                        <span className="text-sm font-medium" style={{ color: colors.text.primary }}>{report}</span>
                      </div>
                      <Button
                        size="sm"
                        className="rounded-lg text-xs font-semibold text-white border-0 h-8"
                        style={{
                          background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                          boxShadow: `0 4px 15px ${colors.primary}20`
                        }}
                      >
                        Generate
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Reports */}
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
              Recently Generated Reports
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: colors.text.muted }} />
              <input
                type="text"
                placeholder="Search reports..."
                className="pl-9 pr-4 py-2 rounded-xl text-sm font-medium focus:outline-none transition-all duration-300"
                style={{
                  backgroundColor: colors.glass.surface,
                  color: colors.text.primary,
                  border: `1px solid ${colors.borderElevated}`
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentReports.map((report, index) => {
              const categoryColor = getCategoryColor(report.category)
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl transition-all duration-300 cursor-pointer group"
                  style={{ backgroundColor: `${colors.text.muted}05`, border: `1px solid ${colors.border}` }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = colors.glass.surfaceHover
                    e.currentTarget.style.boxShadow = `0 4px 15px ${colors.shadow.light}`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = `${colors.text.muted}05`
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${categoryColor}15` }}
                    >
                      <FileText className="w-5 h-5" style={{ color: categoryColor }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>{report.name}</p>
                      <div className="flex items-center space-x-3 mt-1">
                        <Badge className="text-xs font-medium px-2 py-0.5 rounded-full border-0" style={{ backgroundColor: `${categoryColor}15`, color: categoryColor }}>
                          {report.category}
                        </Badge>
                        <span className="text-xs font-medium" style={{ color: colors.text.muted }}>
                          {report.generatedDate}
                        </span>
                        <span className="text-xs font-medium" style={{ color: colors.text.muted }}>
                          {report.size}
                        </span>
                        <Badge className="text-xs font-medium px-2 py-0.5 rounded-full border-0" style={{ backgroundColor: `${colors.text.muted}15`, color: colors.text.muted }}>
                          {report.format}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xl font-semibold transition-all duration-300 group-hover:translate-x-1"
                    style={{ color: colors.primary }}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
