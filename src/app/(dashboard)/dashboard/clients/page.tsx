'use client'

import { useEffect, useState } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Building2, Users, Search, Plus, Filter, Download, Edit, Eye, Trash2, MoreHorizontal, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

// ThePayBureau Brand Colors
const colors = {
  primary: '#401D6C',
  secondary: '#EC385D',
  accent: '#FF8073',
  lightBg: '#F8F4FF',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
}

// Interface for real client data from Supabase
interface Client {
  id: string
  name: string
  company_number?: string
  email?: string
  phone?: string
  industry?: string
  employee_count?: number
  status: 'active' | 'inactive' | 'prospect'
  notes?: string
  created_at: string
  updated_at: string
  contracts?: { count: number }[]
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const router = useRouter()

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
      alert('Client deleted successfully!')
    } catch (err) {
      console.error('Error deleting client:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete client')
    }
  }

  // Load clients on mount
  useEffect(() => {
    fetchClients()
  }, [])

  // Filter clients based on search and filters
  useEffect(() => {
    let filtered = clients

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.industry?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === statusFilter)
    }

    setFilteredClients(filtered)
  }, [searchTerm, statusFilter, clients])

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: colors.success, text: 'Active' }
      case 'prospect':
        return { bg: colors.primary, text: 'Prospect' }
      case 'inactive':
        return { bg: '#6B7280', text: 'Inactive' }
      default:
        return { bg: '#6B7280', text: status }
    }
  }

  // Get summary statistics
  const stats = {
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
    prospects: clients.filter(c => c.status === 'prospect').length,
    inactive: clients.filter(c => c.status === 'inactive').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.lightBg }}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: colors.primary }} />
          <p className="text-gray-600">Loading clients...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.lightBg }}>
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">❌</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Clients</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchClients}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.lightBg }}>
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b-2" style={{ borderColor: colors.primary }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
              >
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
                <p className="text-gray-600">Manage all your payroll bureau clients</p>
              </div>
            </div>
            
            <Button 
              onClick={() => router.push('/clients/add')}
              className="text-white shadow-lg hover:shadow-xl transition-all"
              style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Client
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold" style={{ color: colors.primary }}>{stats.total}</div>
              <div className="text-sm text-gray-600">Total Clients</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              <div className="text-sm text-gray-600">Active</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold" style={{ color: colors.secondary }}>{stats.prospects}</div>
              <div className="text-sm text-gray-600">Prospects</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
              <div className="text-sm text-gray-600">Inactive</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search clients by name, email, or company number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
              
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="prospect">Prospects</option>
                <option value="inactive">Inactive</option>
              </select>
              
              {/* Refresh Button */}
              <Button variant="outline" className="h-12" onClick={fetchClients}>
                <Download className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            {/* Filter Summary */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {filteredClients.length} of {clients.length} clients
              </div>
              
              {(searchTerm || statusFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Client Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Client List</span>
              <span className="text-sm font-normal text-gray-500">
                {filteredClients.length} clients
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Details</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Employees</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => {
                    const statusBadge = getStatusBadge(client.status)
                    return (
                      <TableRow key={client.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <div className="font-semibold text-gray-900">{client.name}</div>
                            {client.company_number && (
                              <div className="text-sm text-gray-500">{client.company_number}</div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="text-sm">
                            <div className="text-gray-900">{client.email || '-'}</div>
                            <div className="text-gray-500">{client.phone || '-'}</div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <span className="text-sm text-gray-900">{client.industry || '-'}</span>
                        </TableCell>
                        
                        <TableCell>
                          <span className="text-sm font-medium text-gray-900">
                            {client.employee_count || '-'}
                          </span>
                        </TableCell>
                        
                        <TableCell>
                          <Badge 
                            className="text-white border-0"
                            style={{ backgroundColor: statusBadge.bg }}
                          >
                            {statusBadge.text}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <span className="text-sm text-gray-500">
                            {new Date(client.created_at).toLocaleDateString()}
                          </span>
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => deleteClient(client.id)}
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
            
            {filteredClients.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? "Try adjusting your search or filters"
                    : "Get started by adding your first client"
                  }
                </p>
                <Button 
                  className="text-white"
                  style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
                  onClick={() => router.push('/clients/add')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Client
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}