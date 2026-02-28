'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import {
  Shield,
  FileCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  ArrowRight,
  RefreshCw
} from 'lucide-react'

const statusCards = [
  {
    title: 'RTI Submissions',
    status: 'On Track',
    icon: FileCheck,
    color: '#10B981',
    description: 'All Real Time Information submissions are current',
    lastSubmitted: '22 Feb 2026',
    nextDue: '05 Mar 2026'
  },
  {
    title: 'FPS Filings',
    status: '2 Pending',
    icon: Clock,
    color: '#F59E0B',
    description: 'Full Payment Submissions awaiting processing',
    lastSubmitted: '19 Feb 2026',
    nextDue: '28 Feb 2026'
  },
  {
    title: 'EPS Submissions',
    status: 'Up to Date',
    icon: Shield,
    color: '#10B981',
    description: 'Employer Payment Summary filings are current',
    lastSubmitted: '19 Feb 2026',
    nextDue: '19 Mar 2026'
  },
]

const complianceDeadlines = [
  { id: 1, title: 'FPS Filing - Acme Corporation', type: 'FPS', date: '28 Feb 2026', daysLeft: 0, status: 'Due Today', priority: 'critical' },
  { id: 2, title: 'FPS Filing - TechStart Industries', type: 'FPS', date: '28 Feb 2026', daysLeft: 0, status: 'Due Today', priority: 'critical' },
  { id: 3, title: 'P11D Deadline', type: 'Annual', date: '06 Jul 2026', daysLeft: 128, status: 'On Track', priority: 'low' },
  { id: 4, title: 'EPS Monthly Submission', type: 'EPS', date: '19 Mar 2026', daysLeft: 19, status: 'Upcoming', priority: 'medium' },
  { id: 5, title: 'Quarter 4 NIC Reconciliation', type: 'Quarterly', date: '05 Apr 2026', daysLeft: 36, status: 'Upcoming', priority: 'medium' },
  { id: 6, title: 'Tax Year End Processing', type: 'Annual', date: '05 Apr 2026', daysLeft: 36, status: 'Preparation', priority: 'high' },
  { id: 7, title: 'P60 Distribution Deadline', type: 'Annual', date: '31 May 2026', daysLeft: 92, status: 'On Track', priority: 'low' },
  { id: 8, title: 'RTI - Regional Health Trust', type: 'RTI', date: '05 Mar 2026', daysLeft: 5, status: 'Upcoming', priority: 'medium' },
]

const recentFilings = [
  { client: 'Acme Corporation Ltd', type: 'FPS', date: '22 Feb 2026', status: 'Accepted', reference: 'FPS-2026-0222-001' },
  { client: 'Metro Logistics Group', type: 'FPS', date: '21 Feb 2026', status: 'Accepted', reference: 'FPS-2026-0221-003' },
  { client: 'Regional Health Trust', type: 'EPS', date: '19 Feb 2026', status: 'Accepted', reference: 'EPS-2026-0219-001' },
  { client: 'Pinnacle Financial Services', type: 'FPS', date: '20 Feb 2026', status: 'Accepted', reference: 'FPS-2026-0220-002' },
  { client: 'Coastal Hospitality Ltd', type: 'FPS', date: '19 Feb 2026', status: 'Accepted', reference: 'FPS-2026-0219-004' },
]

const getPriorityStyle = (priority: string) => {
  switch (priority) {
    case 'critical': return { bg: '#EF444420', color: '#EF4444', border: '#EF444430' }
    case 'high': return { bg: '#F59E0B20', color: '#F59E0B', border: '#F59E0B30' }
    case 'medium': return { bg: '#3B82F620', color: '#3B82F6', border: '#3B82F630' }
    case 'low': return { bg: '#10B98120', color: '#10B981', border: '#10B98130' }
    default: return { bg: '#6B728020', color: '#6B7280', border: '#6B728030' }
  }
}

export default function CompliancePage() {
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
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-200 rounded-xl" />)}
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
            HMRC Compliance
          </h1>
          <p className="text-lg transition-colors duration-300" style={{ color: colors.text.secondary }}>
            RTI submissions, FPS filings, and regulatory compliance
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
          Sync with HMRC
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statusCards.map((card, index) => (
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
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${card.color}20`, boxShadow: `0 8px 25px ${card.color}30` }}
                >
                  <card.icon className="w-7 h-7" style={{ color: card.color }} />
                </div>
                <Badge
                  className="text-xs font-bold px-3 py-1 rounded-full border-0"
                  style={{ backgroundColor: `${card.color}20`, color: card.color }}
                >
                  {card.status}
                </Badge>
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: colors.text.primary }}>{card.title}</h3>
              <p className="text-sm mb-4" style={{ color: colors.text.muted }}>{card.description}</p>
              <div className="flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${colors.borderElevated}` }}>
                <div>
                  <p className="text-xs font-medium" style={{ color: colors.text.muted }}>Last Submitted</p>
                  <p className="text-sm font-semibold" style={{ color: colors.text.secondary }}>{card.lastSubmitted}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium" style={{ color: colors.text.muted }}>Next Due</p>
                  <p className="text-sm font-semibold" style={{ color: card.color }}>{card.nextDue}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Compliance Calendar / Deadlines */}
        <Card
          className="lg:col-span-3 border-0 shadow-xl transition-all duration-300"
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
                Upcoming Deadlines
              </CardTitle>
              <Badge className="text-xs font-bold px-3 py-1 rounded-full border-0" style={{ backgroundColor: '#EF444420', color: '#EF4444' }}>
                2 Due Today
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complianceDeadlines.map((deadline) => {
                const priorityStyle = getPriorityStyle(deadline.priority)
                return (
                  <div
                    key={deadline.id}
                    className="flex items-center justify-between p-4 rounded-xl transition-all duration-300 cursor-pointer group hover:scale-[1.01]"
                    style={{
                      backgroundColor: `${priorityStyle.color}08`,
                      border: `1px solid ${priorityStyle.border}`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${priorityStyle.color}15`
                      e.currentTarget.style.boxShadow = `0 4px 15px ${priorityStyle.color}20`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = `${priorityStyle.color}08`
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: priorityStyle.bg }}
                      >
                        {deadline.priority === 'critical' ? (
                          <AlertTriangle className="w-5 h-5" style={{ color: priorityStyle.color }} />
                        ) : (
                          <Calendar className="w-5 h-5" style={{ color: priorityStyle.color }} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>{deadline.title}</p>
                        <div className="flex items-center space-x-3 mt-1">
                          <Badge className="text-xs font-medium px-2 py-0.5 rounded-full border-0" style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}>
                            {deadline.type}
                          </Badge>
                          <span className="text-xs font-medium" style={{ color: colors.text.muted }}>{deadline.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className="text-xs font-bold px-3 py-1 rounded-full border-0" style={{ backgroundColor: priorityStyle.bg, color: priorityStyle.color }}>
                        {deadline.daysLeft === 0 ? 'Today' : `${deadline.daysLeft} days`}
                      </Badge>
                      <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" style={{ color: colors.text.muted }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Filings */}
        <Card
          className="lg:col-span-2 border-0 shadow-xl transition-all duration-300"
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
              Recent Filings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentFilings.map((filing, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl transition-all duration-300"
                  style={{ backgroundColor: `${colors.text.muted}08` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold" style={{ color: colors.text.primary }}>{filing.client}</span>
                    <Badge className="text-xs font-bold px-2 py-0.5 rounded-full border-0" style={{ backgroundColor: '#10B98120', color: '#10B981' }}>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {filing.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge className="text-xs font-medium px-2 py-0.5 rounded-full border-0" style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}>
                        {filing.type}
                      </Badge>
                      <span className="text-xs font-medium" style={{ color: colors.text.muted }}>{filing.date}</span>
                    </div>
                    <span className="text-xs font-mono" style={{ color: colors.text.muted }}>{filing.reference}</span>
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
