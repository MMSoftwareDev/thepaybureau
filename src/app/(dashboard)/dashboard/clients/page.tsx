'use client'

import { useEffect, useState } from 'react'
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
import { useRouter } from 'next/navigation'

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
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [employeeSizeFilter, setEmployeeSizeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  useEffect(() => {
    setMounted(true)
    fetchClients()
  }, [])

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
      // TODO: Replace with proper toast notification
      alert('Client deleted successfully!')
    } catch (err) {
      console.error('Error deleting client:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete client')
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
        <div className="h-20 rounded-xl" style={{ backgroundColor: colors.glass.surface }}></div>
        <div className="grid grid-cols-4 gap-8">
          <div className="h-32 rounded-xl" style={{ backgroundColor: colors.glass.surface }}></div>
          <div className="h-32 rounded-xl" style={{ backgroundColor: colors.glass.surface }}></div>
          <div className="h-32 rounded-xl" style={{ backgroundColor: colors.glass.surface }}></div>
          <div className="h-32 rounded-xl" style={{ backgroundColor: colors.glass.surface }}></div>
        </div>
        <div className="h-96 rounded-xl" style={{ backgroundColor: colors.glass.surface }}></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center transition-colors duration-300" 
        style={{ backgroundColor: colors.lightBg }}
      >
        <div className="text-center">
          <div 
            className="w-20 h-20 mx-auto mb-6 rounded-2xl shadow-xl flex items-center justify-center"
            style={{ 
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              boxShadow: isDark 
                ? `0 25px 50px ${colors.shadow.heavy}` 
                : `0 20px 40px ${colors.primary}30`
            }}
          >
            <Users className="w-10 h-10 text-white animate-pulse" />
          </div>
          <p className="text-xl font-semibold transition-colors duration-300" style={{ color: colors.text.primary }}>
            Loading clients...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center transition-colors duration-300" 
        style={{ backgroundColor: colors.lightBg }}
      >
        <Card 
          className="max-w-md border-0 shadow-2xl"
          style={{
            backgroundColor: colors.glass.card,
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: `1px solid ${colors.borderElevated}`,
            boxShadow: isDark 
              ? `0 25px 50px ${colors.shadow.heavy}` 
              : `0 20px 40px ${colors.primary}20`
          }}
        >
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-6">❌</div>
            <h3 className="text-xl font-bold mb-3 transition-colors duration-300" style={{ color: colors.text.primary }}>
              Error Loading Clients
            </h3>
            <p className="text-base mb-6 transition-colors duration-300" style={{ color: colors.text.secondary }}>
              {error}
            </p>
            <Button 
              onClick={fetchClients}
              className="text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-300"
              style={{ 
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                boxShadow: `0 10px 25px ${colors.primary}30`
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
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 transition-colors duration-300" style={{ 
            color: colors.text.primary 
          }}>
            Client Management
          </h1>
          <p className="text-lg transition-colors duration-300" style={{ 
            color: colors.text.secondary 
          }}>
            Manage all your payroll bureau clients efficiently.
          </p>
        </div>
        <Button 
          onClick={() => router.push('/dashboard/clients/add')}
          className="text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl border-0"
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
            boxShadow: isDark 
              ? `0 10px 25px ${colors.primary}50` 
              : `0 10px 25px ${colors.primary}30`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
            e.currentTarget.style.boxShadow = isDark
              ? `0 20px 40px ${colors.primary}60`
              : `0 20px 40px ${colors.primary}40`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0px) scale(1)'
            e.currentTarget.style.boxShadow = isDark
              ? `0 10px 25px ${colors.primary}50`
              : `0 10px 25px ${colors.primary}30`
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Client
        </Button>
      </div>

      {/* Enhanced Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          {
            title: 'Total Clients',
            value: stats.total,
            change: '+5.2%',
            icon: Users,
            iconColor: colors.primary,
            iconBg: `${colors.primary}20`
          },
          {
            title: 'Active Clients',
            value: stats.active,
            change: '+12.3%',
            icon: Building2,
            iconColor: colors.success,
            iconBg: `${colors.success}20`
          },
          {
            title: 'Onboarding',
            value: stats.onboarding,
            change: '+8.1%',
            icon: Eye,
            iconColor: colors.secondary,
            iconBg: `${colors.secondary}20`
          },
          {
            title: 'Disengaged',
            value: stats.disengaged,
            change: '-2.4%',
            icon: FileText,
            iconColor: colors.text.muted,
            iconBg: `${colors.text.muted}20`
          }
        ].map((stat, index) => (
          <Card 
            key={index}
            className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] group"
            style={{
              backgroundColor: colors.glass.card,
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: `1px solid ${colors.borderElevated}`,
              boxShadow: isDark 
                ? `0 10px 30px ${colors.shadow.medium}` 
                : `0 10px 25px ${colors.shadow.light}`
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold mb-2 transition-colors duration-300" style={{ 
                    color: colors.text.secondary 
                  }}>
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold mb-3 transition-colors duration-300" style={{ 
                    color: colors.text.primary 
                  }}>
                    {stat.value}
                  </p>
                  <div className="flex items-center">
                    <ArrowUp className="w-3 h-3 text-green-600 mr-1" />
                    <span className="text-xs font-medium text-green-600">{stat.change}</span>
                    <span className="text-xs ml-1 transition-colors duration-300" style={{ 
                      color: colors.text.muted 
                    }}>
                      vs last month
                    </span>
                  </div>
                </div>
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110" 
                  style={{ 
                    backgroundColor: stat.iconBg,
                    boxShadow: `0 8px 25px ${stat.iconColor}30`
                  }}
                >
                  <stat.icon className="w-8 h-8 transition-transform duration-300 group-hover:scale-110" style={{ color: stat.iconColor }} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Search and Filters */}
      <Card 
        className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300"
        style={{
          backgroundColor: colors.glass.card,
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: `1px solid ${colors.borderElevated}`,
          boxShadow: isDark 
            ? `0 15px 35px ${colors.shadow.medium}` 
            : `0 10px 25px ${colors.shadow.light}`
        }}
      >
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Enhanced Search */}
            <div className="flex-1 relative">
              <Search 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors duration-300" 
                style={{ color: colors.text.muted }} 
              />
              <Input
                type="text"
                placeholder="Search clients by name, email, company number, or industry..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-sm border-0 shadow-lg transition-all duration-300 focus:shadow-2xl rounded-xl font-medium"
                style={{
                  background: colors.glass.surface,
                  backdropFilter: 'blur(15px)',
                  color: colors.text.primary,
                  fontSize: '14px',
                  border: `1px solid ${colors.borderElevated}`,
                  boxShadow: isDark 
                    ? `0 4px 20px ${colors.shadow.light}` 
                    : `0 4px 15px ${colors.shadow.light}`
                }}
                onFocus={(e) => {
                  e.target.style.background = colors.glass.surfaceHover
                  e.target.style.boxShadow = isDark
                    ? `0 12px 35px ${colors.shadow.medium}, 0 0 0 1px ${colors.primary}40`
                    : `0 8px 25px ${colors.primary}25, 0 0 0 1px ${colors.primary}30`
                  e.target.style.borderColor = `${colors.primary}60`
                }}
                onBlur={(e) => {
                  e.target.style.background = colors.glass.surface
                  e.target.style.boxShadow = isDark 
                    ? `0 4px 20px ${colors.shadow.light}` 
                    : `0 4px 15px ${colors.shadow.light}`
                  e.target.style.borderColor = colors.borderElevated
                }}
              />
            </div>
            
            {/* Filter Row */}
            <div className="flex flex-wrap gap-3">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all duration-300 shadow-lg min-w-[120px]"
                style={{
                  backgroundColor: colors.glass.surface,
                  color: colors.text.primary,
                  border: `1px solid ${colors.borderElevated}`,
                  backdropFilter: 'blur(15px)'
                }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="prospect">Onboarding</option>
                <option value="inactive">Disengaged</option>
              </select>

              {/* Industry Filter */}
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="px-3 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all duration-300 shadow-lg min-w-[130px]"
                style={{
                  backgroundColor: colors.glass.surface,
                  color: colors.text.primary,
                  border: `1px solid ${colors.borderElevated}`,
                  backdropFilter: 'blur(15px)'
                }}
              >
                <option value="all">All Industries</option>
                {uniqueIndustries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>

              {/* Employee Size Filter */}
              <select
                value={employeeSizeFilter}
                onChange={(e) => setEmployeeSizeFilter(e.target.value)}
                className="px-3 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all duration-300 shadow-lg min-w-[120px]"
                style={{
                  backgroundColor: colors.glass.surface,
                  color: colors.text.primary,
                  border: `1px solid ${colors.borderElevated}`,
                  backdropFilter: 'blur(15px)'
                }}
              >
                <option value="all">All Sizes</option>
                <option value="small">Small (1-10)</option>
                <option value="medium">Medium (11-50)</option>
                <option value="large">Large (51-250)</option>
                <option value="enterprise">Enterprise (250+)</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all duration-300 shadow-lg min-w-[110px]"
                style={{
                  backgroundColor: colors.glass.surface,
                  color: colors.text.primary,
                  border: `1px solid ${colors.borderElevated}`,
                  backdropFilter: 'blur(15px)'
                }}
              >
                <option value="name">Sort by Name</option>
                <option value="created">Sort by Date</option>
                <option value="employees">Sort by Size</option>
                <option value="status">Sort by Status</option>
              </select>

              {/* Sort Order Toggle */}
              <Button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                variant="outline"
                className="h-12 px-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                style={{
                  borderColor: colors.borderElevated,
                  color: colors.text.secondary,
                  backgroundColor: colors.glass.surface,
                  backdropFilter: 'blur(10px)'
                }}
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              </Button>
            </div>
            
            {/* Enhanced Action Buttons */}
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                className="h-12 px-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                onClick={fetchClients}
                style={{
                  borderColor: colors.borderElevated,
                  color: colors.text.secondary,
                  backgroundColor: colors.glass.surface,
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              
              <Button 
                variant="outline" 
                className="h-12 px-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                style={{
                  borderColor: colors.borderElevated,
                  color: colors.text.secondary,
                  backgroundColor: colors.glass.surface,
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
          
          {/* Enhanced Filter Summary */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm font-medium transition-colors duration-300" style={{ color: colors.text.secondary }}>
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
                className="rounded-xl font-semibold transition-all duration-300 hover:scale-105"
                style={{
                  borderColor: colors.borderElevated,
                  color: colors.text.muted,
                  backgroundColor: colors.glass.surfaceActive
                }}
              >
                Clear All Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Client Table */}
      <Card 
        className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300"
        style={{
          backgroundColor: colors.glass.card,
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: `1px solid ${colors.borderElevated}`,
          boxShadow: isDark 
            ? `0 15px 35px ${colors.shadow.medium}` 
            : `0 10px 25px ${colors.shadow.light}`
        }}
      >
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-xl font-bold transition-colors duration-300" style={{ 
            color: colors.text.primary 
          }}>
            <span>Client Directory</span>
            <Badge 
              className="text-xs font-bold px-3 py-1 shadow-lg"
              style={{
                backgroundColor: `${colors.secondary}20`,
                color: colors.secondary,
                border: `1px solid ${colors.secondary}30`
              }}
            >
              {filteredClients.length} clients
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: colors.borderElevated }}>
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
                      className="transition-all duration-300 hover:scale-[1.01] group"
                      style={{ borderColor: colors.borderElevated }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.glass.surfaceHover
                        e.currentTarget.style.boxShadow = `0 4px 15px ${colors.shadow.light}`
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                            style={{ backgroundColor: `${colors.primary}15` }}
                          >
                            <Building2 className="w-5 h-5" style={{ color: colors.primary }} />
                          </div>
                          <div>
                            <div className="font-bold transition-colors duration-300" style={{ color: colors.text.primary }}>
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

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/dashboard/payrolls')}
                            className="rounded-xl transition-all duration-300 hover:scale-105 text-xs font-semibold"
                            style={{
                              borderColor: `${colors.primary}40`,
                              color: colors.primary,
                              backgroundColor: `${colors.primary}10`
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = `${colors.primary}20`
                              e.currentTarget.style.borderColor = `${colors.primary}60`
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = `${colors.primary}10`
                              e.currentTarget.style.borderColor = `${colors.primary}40`
                            }}
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Payroll
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl transition-all duration-300 hover:scale-105"
                            style={{
                              borderColor: colors.borderElevated,
                              color: colors.text.secondary,
                              backgroundColor: colors.glass.surface
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteClient(client.id)}
                            className="rounded-xl transition-all duration-300 hover:scale-105"
                            style={{
                              borderColor: colors.error + '40',
                              color: colors.error,
                              backgroundColor: colors.error + '10'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = colors.error + '20'
                              e.currentTarget.style.borderColor = colors.error + '60'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = colors.error + '10'
                              e.currentTarget.style.borderColor = colors.error + '40'
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          
          {/* Enhanced Empty State */}
          {filteredClients.length === 0 && (
            <div className="text-center py-16">
              <div 
                className="w-20 h-20 mx-auto mb-6 rounded-2xl shadow-xl flex items-center justify-center"
                style={{ 
                  backgroundColor: `${colors.primary}15`,
                  border: `2px dashed ${colors.primary}30`
                }}
              >
                <Users className="w-10 h-10" style={{ color: colors.primary }} />
              </div>
              <h3 className="text-xl font-bold mb-3 transition-colors duration-300" style={{ color: colors.text.primary }}>
                No clients found
              </h3>
              <p className="text-base mb-6 transition-colors duration-300" style={{ color: colors.text.secondary }}>
                {searchTerm || statusFilter !== 'all'
                  ? "Try adjusting your search or filters to find what you're looking for"
                  : "Get started by adding your first client to begin managing your payroll bureau"
                }
              </p>
              <Button 
                onClick={() => router.push('/dashboard/clients/add')}
                className="text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl"
                style={{ 
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                  boxShadow: `0 10px 25px ${colors.primary}30`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0px) scale(1)'
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                {searchTerm || statusFilter !== 'all' ? 'Add New Client' : 'Add Your First Client'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}