'use client'

import { Suspense, useEffect, useState } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import {
  Building2,
  Users,
  Search,
  Plus,
  Filter,
  Download,
  Edit,
  Eye,
  Trash2,
  Loader2,
  ArrowUp,
  ArrowDown,
  FileText,
  Phone,
  Mail,
  Calendar
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/components/ui/toast'

// Interface for the latestRun attached to each client
interface LatestRun {
  id: string
  pay_date: string
  status: string
}

// Interface for real client data from API
interface Client {
  id: string
  name: string
  company_number?: string
  email?: string | null
  phone?: string | null
  industry?: string
  employee_count?: number | null
  pay_frequency?: string | null
  paye_reference?: string | null
  status: 'active' | 'inactive' | 'prospect'
  notes?: string
  created_at: string
  updated_at: string
  contracts?: { count: number }[]
  latestRun?: LatestRun | null
}

// Format pay frequency for display
const formatFrequency = (freq: string | null | undefined): string => {
  if (!freq) return '-'
  const map: Record<string, string> = {
    weekly: 'Weekly',
    fortnightly: 'Fortnightly',
    four_weekly: '4-Weekly',
    monthly: 'Monthly',
  }
  return map[freq] || freq
}

// Get payroll status badge classes (matching payrolls page pattern)
function getPayrollStatusBadgeClasses(status: string): string {
  switch (status) {
    case 'complete':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'in_progress':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'due_soon':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'overdue':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    case 'not_started':
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }
}

// Get payroll status label for display
function getPayrollStatusLabel(status: string): string {
  switch (status) {
    case 'complete':
      return 'Complete'
    case 'in_progress':
      return 'In Progress'
    case 'due_soon':
      return 'Due Soon'
    case 'overdue':
      return 'Overdue'
    case 'not_started':
      return 'Not Started'
    default:
      return status
  }
}

// Format a date string safely
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    return format(parseISO(dateStr), 'd MMM yyyy')
  } catch {
    return '-'
  }
}

export default function ClientsPage() {
  return (
    <Suspense>
      <ClientsContent />
    </Suspense>
  )
}

function ClientsContent() {
  const searchParams = useSearchParams()
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState('all')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [employeeSizeFilter, setEmployeeSizeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  useEffect(() => {
    setMounted(true)
    fetchClients()
  }, [])

  // Sync search term from URL params (e.g. when sidebar search navigates here)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || ''
    if (urlSearch !== searchTerm) {
      setSearchTerm(urlSearch)
    }
  }, [searchParams])

  // Fetch clients from API
  const fetchClients = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/clients')
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error(`Failed to fetch clients: ${response.status}`)
      }
      
      const data = await response.json()
      setClients(data || [])
    } catch (err) {
      console.error('Error fetching clients:', err)
      setError(err instanceof Error ? err.message : 'Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  // Delete client
  const deleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return
    
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete client')
      }
      
      setClients(prev => prev.filter(client => client.id !== clientId))
      toast('Client deleted successfully')
    } catch (err) {
      console.error('Error deleting client:', err)
      toast(err instanceof Error ? err.message : 'Failed to delete client', 'error')
    }
  }

  // Filter clients based on search and filters
  useEffect(() => {
    let filtered = clients

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.paye_reference?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === statusFilter)
    }

    // Industry filter
    if (industryFilter !== 'all') {
      filtered = filtered.filter(client => client.industry === industryFilter)
    }

    // Employee size filter
    if (employeeSizeFilter !== 'all') {
      filtered = filtered.filter(client => {
        const count = client.employee_count || 0
        switch (employeeSizeFilter) {
          case 'small': return count <= 10
          case 'medium': return count > 10 && count <= 50
          case 'large': return count > 50 && count <= 250
          case 'enterprise': return count > 250
          default: return true
        }
      })
    }

    // Sort clients
    filtered.sort((a, b) => {
      let aValue = ''
      let bValue = ''
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'created':
          aValue = a.created_at
          bValue = b.created_at
          break
        case 'employees':
          return sortOrder === 'asc' 
            ? (a.employee_count || 0) - (b.employee_count || 0)
            : (b.employee_count || 0) - (a.employee_count || 0)
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    setFilteredClients(filtered)
  }, [searchTerm, statusFilter, industryFilter, employeeSizeFilter, sortBy, sortOrder, clients])

  // Get unique industries for filter
  const uniqueIndustries = [...new Set(clients.map(c => c.industry).filter(Boolean))].sort()

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: colors.success, text: 'Active' }
      case 'prospect':
        return { bg: colors.primary, text: 'Prospect' }
      case 'inactive':
        return { bg: colors.text.muted, text: 'Inactive' }
      default:
        return { bg: colors.text.muted, text: status }
    }
  }

  // Get summary statistics
  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    onboarding: clients.filter(c => c.status === 'prospect').length,
    disengaged: clients.filter(c => c.status === 'inactive').length,
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg }}></div>
        <div className="grid grid-cols-4 gap-8">
          <div className="h-32 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg }}></div>
          <div className="h-32 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg }}></div>
          <div className="h-32 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg }}></div>
          <div className="h-32 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg }}></div>
        </div>
        <div className="h-96 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg }}></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div
            className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
          >
            <Users className="w-6 h-6 text-white animate-pulse" />
          </div>
          <p className="text-[0.9rem] font-medium" style={{ color: colors.text.secondary }}>
            Loading clients...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card
          className="max-w-sm border-0"
          style={{
            backgroundColor: colors.surface,
            borderRadius: '12px',
            border: `1px solid ${colors.border}`,
          }}
        >
          <CardContent className="p-6 text-center">
            <h3 className="text-base font-bold mb-2" style={{ color: colors.text.primary }}>
              Error Loading Clients
            </h3>
            <p className="text-[0.85rem] mb-4" style={{ color: colors.text.secondary }}>
              {error}
            </p>
            <Button
              onClick={fetchClients}
              className="text-white font-semibold px-5 py-2 rounded-lg border-0 text-[0.85rem]"
              style={{
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              }}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>
            Clients
          </h1>
          <p className="text-[0.82rem] mt-0.5" style={{ color: colors.text.muted }}>
            Manage your payroll bureau clients.
          </p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/clients/add')}
          className="text-white font-semibold py-2 px-5 rounded-lg border-0 text-[0.85rem]"
          style={{
            background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { title: 'Total Clients', value: stats.total, icon: Users, iconColor: colors.primary },
          { title: 'Active', value: stats.active, icon: Building2, iconColor: colors.success },
          { title: 'Onboarding', value: stats.onboarding, icon: Eye, iconColor: colors.secondary },
          { title: 'Disengaged', value: stats.disengaged, icon: FileText, iconColor: colors.text.muted },
        ].map((stat, index) => (
          <Card
            key={index}
            className="border-0"
            style={{
              backgroundColor: colors.surface,
              borderRadius: '12px',
              border: `1px solid ${colors.border}`,
            }}
          >
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[0.68rem] md:text-[0.72rem] font-semibold uppercase tracking-[0.04em] mb-1" style={{ color: colors.text.muted }}>
                    {stat.title}
                  </p>
                  <p className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>
                    {stat.value}
                  </p>
                </div>
                <div
                  className="w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${stat.iconColor}10` }}
                >
                  <stat.icon className="w-4 h-4 md:w-5 md:h-5" style={{ color: stat.iconColor }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <Card
        className="border-0"
        style={{
          backgroundColor: colors.surface,
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
        }}
      >
        <CardContent className="p-4 md:p-5">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                style={{ color: colors.text.muted }}
              />
              <Input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9 text-[0.85rem] rounded-lg font-medium"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg,
                  color: colors.text.primary,
                  border: `1px solid ${colors.border}`,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = `${colors.primary}50`
                  e.target.style.boxShadow = `0 0 0 3px ${colors.primary}10`
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.border
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 h-9 rounded-lg text-[0.82rem] font-medium focus:outline-none"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg,
                  color: colors.text.primary,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="prospect">Onboarding</option>
                <option value="inactive">Disengaged</option>
              </select>

              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="px-3 h-9 rounded-lg text-[0.82rem] font-medium focus:outline-none"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg,
                  color: colors.text.primary,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <option value="all">All Industries</option>
                {uniqueIndustries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>

              <select
                value={employeeSizeFilter}
                onChange={(e) => setEmployeeSizeFilter(e.target.value)}
                className="px-3 h-9 rounded-lg text-[0.82rem] font-medium focus:outline-none"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg,
                  color: colors.text.primary,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <option value="all">All Sizes</option>
                <option value="small">Small (1-10)</option>
                <option value="medium">Medium (11-50)</option>
                <option value="large">Large (51-250)</option>
                <option value="enterprise">Enterprise (250+)</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 h-9 rounded-lg text-[0.82rem] font-medium focus:outline-none"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg,
                  color: colors.text.primary,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <option value="name">Sort: Name</option>
                <option value="created">Sort: Date</option>
                <option value="employees">Sort: Size</option>
                <option value="status">Sort: Status</option>
              </select>

              <Button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                variant="outline"
                className="h-9 px-2.5 rounded-lg"
                style={{
                  borderColor: colors.border,
                  color: colors.text.secondary,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg,
                }}
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
          
          {/* Filter Summary */}
          <div className="mt-3 flex items-center justify-between">
            <div className="text-[0.78rem] font-medium" style={{ color: colors.text.secondary }}>
              Showing {filteredClients.length} of {clients.length} clients
              {(statusFilter !== 'all' || industryFilter !== 'all' || employeeSizeFilter !== 'all') && (
                <span className="ml-2" style={{ color: colors.text.muted }}>
                  • Filtered by {[
                    statusFilter !== 'all' && `Status: ${statusFilter}`,
                    industryFilter !== 'all' && `Industry: ${industryFilter}`,
                    employeeSizeFilter !== 'all' && `Size: ${employeeSizeFilter}`
                  ].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
            
            {(searchTerm || statusFilter !== 'all' || industryFilter !== 'all' || employeeSizeFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setIndustryFilter('all')
                  setEmployeeSizeFilter('all')
                  setSortBy('name')
                  setSortOrder('asc')
                }}
                className="rounded-lg text-[0.78rem] font-medium"
                style={{
                  borderColor: colors.border,
                  color: colors.text.muted,
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Client Table */}
      <Card
        className="border-0"
        style={{
          backgroundColor: colors.surface,
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
        }}
      >
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center justify-between text-[0.9rem] font-bold" style={{ color: colors.text.primary }}>
            <span>Client Directory</span>
            <Badge
              className="text-[0.7rem] font-semibold px-2 py-0.5"
              style={{
                backgroundColor: `${colors.primary}10`,
                color: colors.primary,
                border: `1px solid ${colors.primary}20`,
              }}
            >
              {filteredClients.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: colors.border }}>
                  <TableHead className="font-bold" style={{ color: colors.text.secondary }}>Client</TableHead>
                  <TableHead className="font-bold" style={{ color: colors.text.secondary }}>Pay Frequency</TableHead>
                  <TableHead className="font-bold" style={{ color: colors.text.secondary }}>Employees</TableHead>
                  <TableHead className="font-bold" style={{ color: colors.text.secondary }}>PAYE Ref</TableHead>
                  <TableHead className="font-bold" style={{ color: colors.text.secondary }}>Payroll Status</TableHead>
                  <TableHead className="font-bold" style={{ color: colors.text.secondary }}>Next Pay Date</TableHead>
                  <TableHead className="text-right font-bold" style={{ color: colors.text.secondary }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => {
                  const statusBadge = getStatusBadge(client.status)
                  return (
                    <TableRow
                      key={client.id}
                      className="group cursor-pointer transition-colors duration-150"
                      style={{ borderColor: colors.border }}
                      onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.03)' : colors.lightBg
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${colors.primary}10` }}
                          >
                            <Building2 className="w-4 h-4" style={{ color: colors.primary }} />
                          </div>
                          <div>
                            <div
                              className="font-bold transition-colors duration-300 cursor-pointer hover:underline"
                              style={{ color: colors.text.primary }}
                              onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/clients/${client.id}`) }}
                            >
                              {client.name}
                            </div>
                            {client.paye_reference && (
                              <div className="text-xs font-medium transition-colors duration-300" style={{ color: colors.text.muted }}>
                                {client.email || ''}
                              </div>
                            )}
                            {!client.paye_reference && client.company_number && (
                              <div className="text-xs font-medium transition-colors duration-300" style={{ color: colors.text.muted }}>
                                {client.company_number}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm font-medium transition-colors duration-300" style={{ color: colors.text.primary }}>
                          {formatFrequency(client.pay_frequency)}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm font-bold transition-colors duration-300" style={{ color: colors.text.primary }}>
                          {client.employee_count != null ? client.employee_count : '-'}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="text-sm font-medium transition-colors duration-300" style={{ color: colors.text.primary }}>
                          {client.paye_reference || '-'}
                        </span>
                      </TableCell>

                      <TableCell>
                        {client.latestRun ? (
                          <Badge
                            className={cn(
                              'text-xs font-bold px-3 py-1 border-0',
                              getPayrollStatusBadgeClasses(client.latestRun.status)
                            )}
                          >
                            {getPayrollStatusLabel(client.latestRun.status)}
                          </Badge>
                        ) : (
                          <Badge
                            className="text-xs font-bold px-3 py-1 border-0 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          >
                            No payroll
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        {client.latestRun ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 flex-shrink-0" style={{ color: colors.text.muted }} />
                            <span className="text-sm font-medium transition-colors duration-300" style={{ color: colors.text.primary }}>
                              {formatDate(client.latestRun.pay_date)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-medium transition-colors duration-300" style={{ color: colors.text.muted }}>
                            -
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/payrolls?client=${client.id}`)}
                            className="rounded-lg text-[0.75rem] font-medium"
                            style={{
                              borderColor: colors.border,
                              color: colors.primary,
                            }}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Payroll
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/clients/${client.id}/edit`)}
                            className="rounded-lg"
                            style={{
                              borderColor: colors.border,
                              color: colors.text.secondary,
                            }}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteClient(client.id)}
                            className="rounded-lg"
                            style={{
                              borderColor: colors.border,
                              color: colors.error,
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          
          {/* Empty State */}
          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <div
                className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${colors.primary}10` }}
              >
                <Users className="w-6 h-6" style={{ color: colors.primary }} />
              </div>
              <h3 className="text-base font-bold mb-1" style={{ color: colors.text.primary }}>
                No clients found
              </h3>
              <p className="text-[0.85rem] mb-5" style={{ color: colors.text.muted }}>
                {searchTerm || statusFilter !== 'all'
                  ? "Try adjusting your search or filters."
                  : "Add your first client to get started."
                }
              </p>
              <Button
                onClick={() => router.push('/dashboard/clients/add')}
                className="text-white font-semibold px-5 py-2 rounded-lg border-0 text-[0.85rem]"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}