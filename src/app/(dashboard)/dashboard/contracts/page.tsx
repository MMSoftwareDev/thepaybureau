'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import {
  FileText,
  Calendar,
  PoundSterling,
  Search,
  Plus,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react'

const summaryCards = [
  { title: 'Active Contracts', value: '189', icon: FileText, color: '#401D6C', change: '+12 this quarter' },
  { title: 'Expiring Soon', value: '12', icon: AlertTriangle, color: '#F59E0B', change: 'Within 30 days' },
  { title: 'Total Value', value: '£156,780', icon: PoundSterling, color: '#10B981', change: '+8.3% vs last quarter' },
]

const contracts = [
  { id: 1, client: 'Acme Corporation Ltd', type: 'Full Service', start: '01 Jan 2025', end: '31 Dec 2025', value: '£2,400/mo', status: 'Active' },
  { id: 2, client: 'TechStart Industries', type: 'Payroll Only', start: '15 Mar 2025', end: '14 Mar 2026', value: '£1,800/mo', status: 'Active' },
  { id: 3, client: 'Regional Health Trust', type: 'Full Service', start: '01 Jun 2024', end: '31 May 2025', value: '£4,200/mo', status: 'Expiring' },
  { id: 4, client: 'Greenfield Estates', type: 'Basic Payroll', start: '01 Sep 2025', end: '31 Aug 2026', value: '£850/mo', status: 'Active' },
  { id: 5, client: 'Metro Logistics Group', type: 'Full Service', start: '01 Feb 2025', end: '31 Jan 2026', value: '£3,100/mo', status: 'Active' },
  { id: 6, client: 'Coastal Hospitality Ltd', type: 'Payroll Only', start: '15 Apr 2025', end: '14 Apr 2026', value: '£1,200/mo', status: 'Active' },
  { id: 7, client: 'Pinnacle Financial Services', type: 'Full Service + Compliance', start: '01 Jan 2025', end: '31 Mar 2026', value: '£5,500/mo', status: 'Active' },
  { id: 8, client: 'Northern Manufacturing Co', type: 'Payroll Only', start: '01 Jul 2024', end: '30 Jun 2025', value: '£2,800/mo', status: 'Expiring' },
  { id: 9, client: 'Summit Education Group', type: 'Basic Payroll', start: '01 Oct 2025', end: '30 Sep 2026', value: '£650/mo', status: 'Active' },
  { id: 10, client: 'Heritage Care Homes', type: 'Full Service', start: '01 Nov 2024', end: '31 Oct 2025', value: '£3,800/mo', status: 'Renewal Due' },
]

const getStatusStyle = (status: string, colors: ReturnType<typeof getThemeColors>) => {
  switch (status) {
    case 'Active':
      return { backgroundColor: '#10B98120', color: '#10B981', border: '1px solid #10B98130' }
    case 'Expiring':
      return { backgroundColor: '#F59E0B20', color: '#F59E0B', border: '1px solid #F59E0B30' }
    case 'Renewal Due':
      return { backgroundColor: `${colors.primary}20`, color: colors.primary, border: `1px solid ${colors.primary}30` }
    default:
      return { backgroundColor: `${colors.text.muted}20`, color: colors.text.muted, border: `1px solid ${colors.text.muted}30` }
  }
}

export default function ContractsPage() {
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
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

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = c.client.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'All' || c.type === typeFilter
    return matchesSearch && matchesType
  })

  const uniqueTypes = ['All', ...Array.from(new Set(contracts.map(c => c.type)))]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 transition-colors duration-300" style={{ color: colors.text.primary }}>
            Contracts
          </h1>
          <p className="text-lg transition-colors duration-300" style={{ color: colors.text.secondary }}>
            Manage service agreements and contract renewals
          </p>
        </div>
        <Button
          className="text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl border-0"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
            boxShadow: `0 10px 25px ${colors.primary}30`
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Contract
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <p className="text-xs font-medium" style={{ color: colors.text.muted }}>{card.change}</p>
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

      {/* Contracts Table */}
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
              All Contracts
            </CardTitle>
            <div className="flex items-center space-x-3">
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
                    border: `1px solid ${colors.borderElevated}`
                  }}
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-sm rounded-xl px-4 py-2 focus:outline-none font-medium transition-all duration-300"
                style={{
                  backgroundColor: colors.glass.surface,
                  color: colors.text.primary,
                  border: `1px solid ${colors.borderElevated}`
                }}
              >
                {uniqueTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl font-semibold"
                style={{ borderColor: colors.borderElevated, color: colors.text.secondary, backgroundColor: colors.glass.surface }}
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
                  {['Client', 'Type', 'Start Date', 'End Date', 'Monthly Value', 'Status'].map((header) => (
                    <th key={header} className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: colors.text.muted }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredContracts.map((contract) => (
                  <tr
                    key={contract.id}
                    className="transition-all duration-200 cursor-pointer"
                    style={{ borderBottom: `1px solid ${colors.border}` }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.glass.surfaceHover }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <td className="py-4 px-4">
                      <span className="text-sm font-semibold" style={{ color: colors.text.primary }}>{contract.client}</span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className="text-xs font-medium px-2.5 py-1 rounded-full border-0" style={{ backgroundColor: `${colors.primary}15`, color: colors.primary }}>
                        {contract.type}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-medium" style={{ color: colors.text.secondary }}>{contract.start}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-medium" style={{ color: colors.text.secondary }}>{contract.end}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-bold" style={{ color: colors.text.primary }}>{contract.value}</span>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className="text-xs font-bold px-3 py-1 rounded-full border-0" style={getStatusStyle(contract.status, colors)}>
                        {contract.status === 'Active' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {contract.status === 'Expiring' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {contract.status === 'Renewal Due' && <Clock className="w-3 h-3 mr-1" />}
                        {contract.status}
                      </Badge>
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
