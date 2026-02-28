'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import {
  Receipt,
  CreditCard,
  AlertCircle,
  Search,
  Plus,
  Download,
  CheckCircle2,
  Clock,
  Send,
  Eye
} from 'lucide-react'

const summaryCards = [
  { title: 'Outstanding', value: '£12,450', icon: Clock, color: '#F59E0B', change: '8 invoices pending' },
  { title: 'Paid This Month', value: '£38,200', icon: CreditCard, color: '#10B981', change: '+15.2% vs last month' },
  { title: 'Overdue', value: '£3,100', icon: AlertCircle, color: '#EF4444', change: '3 invoices overdue' },
]

const invoices = [
  { id: 'INV-2026-001', client: 'Acme Corporation Ltd', amount: '£2,400.00', date: '01 Feb 2026', dueDate: '28 Feb 2026', status: 'Paid', paidDate: '15 Feb 2026' },
  { id: 'INV-2026-002', client: 'TechStart Industries', amount: '£1,800.00', date: '01 Feb 2026', dueDate: '28 Feb 2026', status: 'Pending', paidDate: null },
  { id: 'INV-2026-003', client: 'Regional Health Trust', amount: '£4,200.00', date: '01 Feb 2026', dueDate: '28 Feb 2026', status: 'Paid', paidDate: '12 Feb 2026' },
  { id: 'INV-2026-004', client: 'Greenfield Estates', amount: '£850.00', date: '01 Feb 2026', dueDate: '28 Feb 2026', status: 'Pending', paidDate: null },
  { id: 'INV-2026-005', client: 'Metro Logistics Group', amount: '£3,100.00', date: '01 Jan 2026', dueDate: '31 Jan 2026', status: 'Overdue', paidDate: null },
  { id: 'INV-2026-006', client: 'Coastal Hospitality Ltd', amount: '£1,200.00', date: '01 Feb 2026', dueDate: '28 Feb 2026', status: 'Paid', paidDate: '18 Feb 2026' },
  { id: 'INV-2026-007', client: 'Pinnacle Financial Services', amount: '£5,500.00', date: '01 Feb 2026', dueDate: '28 Feb 2026', status: 'Paid', paidDate: '10 Feb 2026' },
  { id: 'INV-2026-008', client: 'Northern Manufacturing Co', amount: '£2,800.00', date: '01 Jan 2026', dueDate: '31 Jan 2026', status: 'Overdue', paidDate: null },
  { id: 'INV-2026-009', client: 'Summit Education Group', amount: '£650.00', date: '01 Feb 2026', dueDate: '28 Feb 2026', status: 'Pending', paidDate: null },
  { id: 'INV-2026-010', client: 'Heritage Care Homes', amount: '£3,800.00', date: '01 Feb 2026', dueDate: '28 Feb 2026', status: 'Paid', paidDate: '20 Feb 2026' },
]

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'Paid':
      return { backgroundColor: '#10B98120', color: '#10B981' }
    case 'Pending':
      return { backgroundColor: '#F59E0B20', color: '#F59E0B' }
    case 'Overdue':
      return { backgroundColor: '#EF444420', color: '#EF4444' }
    default:
      return { backgroundColor: '#6B728020', color: '#6B7280' }
  }
}

export default function InvoicesPage() {
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
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-36 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    )
  }

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.client.toLowerCase().includes(searchTerm.toLowerCase()) || inv.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 transition-colors duration-300" style={{ color: colors.text.primary }}>
            Invoicing
          </h1>
          <p className="text-lg transition-colors duration-300" style={{ color: colors.text.secondary }}>
            Manage billing, payments and outstanding invoices
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            className="font-semibold py-3 px-6 rounded-xl transition-all duration-300"
            style={{ borderColor: colors.borderElevated, color: colors.text.secondary, backgroundColor: colors.glass.surface }}
          >
            <Send className="w-4 h-4 mr-2" />
            Send Reminders
          </Button>
          <Button
            className="text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl border-0"
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
              boxShadow: `0 10px 25px ${colors.primary}30`
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </div>
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

      {/* Invoice Table */}
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
              All Invoices
            </CardTitle>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: colors.text.muted }} />
                <input
                  type="text"
                  placeholder="Search invoices..."
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
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
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
                  {['Invoice #', 'Client', 'Amount', 'Date Issued', 'Due Date', 'Status', 'Actions'].map((header) => (
                    <th key={header} className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider" style={{ color: colors.text.muted }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => {
                  const statusStyle = getStatusStyle(invoice.status)
                  return (
                    <tr
                      key={invoice.id}
                      className="transition-all duration-200 cursor-pointer"
                      style={{ borderBottom: `1px solid ${colors.border}` }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.glass.surfaceHover }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <td className="py-4 px-4">
                        <span className="text-sm font-bold" style={{ color: colors.primary }}>{invoice.id}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-semibold" style={{ color: colors.text.primary }}>{invoice.client}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-bold" style={{ color: colors.text.primary }}>{invoice.amount}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-medium" style={{ color: colors.text.secondary }}>{invoice.date}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-medium" style={{ color: invoice.status === 'Overdue' ? '#EF4444' : colors.text.secondary }}>
                          {invoice.dueDate}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className="text-xs font-bold px-3 py-1 rounded-full border-0" style={statusStyle}>
                          {invoice.status === 'Paid' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {invoice.status === 'Pending' && <Clock className="w-3 h-3 mr-1" />}
                          {invoice.status === 'Overdue' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-lg h-8 w-8 p-0"
                            style={{ color: colors.text.muted }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-lg h-8 w-8 p-0"
                            style={{ color: colors.text.muted }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
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
    </div>
  )
}
