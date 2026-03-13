'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useClients } from '@/lib/swr'
import { useDebounce } from '@/hooks/useDebounce'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Building2,
  UserCheck,
  UserX,
  MapPin,
  Phone,
  UserPlus,
  Calculator,
  Filter,
  X,
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { mutate } from 'swr'
import { format } from 'date-fns'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Client {
  id: string
  name: string
  company_number?: string | null
  email?: string | null
  phone?: string | null
  address?: { street?: string; city?: string; postcode?: string } | null
  industry?: string | null
  employee_count?: number | null
  status: string
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  notes?: string | null
  domain?: string | null
  secondary_contact_name?: string | null
  secondary_contact_email?: string | null
  secondary_contact_phone?: string | null
  accountant_name?: string | null
  accountant_email?: string | null
  accountant_phone?: string | null
  created_at: string
}

type StatusFilter = 'all' | 'active' | 'inactive'
type SortOption = 'name-asc' | 'name-desc' | 'date-newest' | 'date-oldest' | 'employees-high' | 'employees-low'

// ── Collapsible Form Section ───────────────────────────────────────────────────

function FormSection({
  title,
  icon: Icon,
  defaultOpen = true,
  colors,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  defaultOpen?: boolean
  colors: ReturnType<typeof getThemeColors>
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderBottom: `1px solid ${colors.border}` }}>
      <button
        type="button"
        className="flex w-full items-center gap-2 px-5 py-3 text-left text-sm font-semibold font-[family-name:var(--font-inter)] transition-colors"
        style={{ color: colors.text.primary }}
        onClick={() => setOpen(!open)}
      >
        <Icon className="w-4 h-4" />
        {title}
        <span className="ml-auto">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
      </button>
      {open && <div className="px-5 pb-4 space-y-3">{children}</div>}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { toast } = useToast()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Data
  const { data: clients, isLoading } = useClients()

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [industryFilter, setIndustryFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('name-asc')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Sidebar state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [saving, setSaving] = useState(false)

  // Form fields
  const [formName, setFormName] = useState('')
  const [formCompanyNumber, setFormCompanyNumber] = useState('')
  const [formIndustry, setFormIndustry] = useState('')
  const [formEmployeeCount, setFormEmployeeCount] = useState('')
  const [formStatus, setFormStatus] = useState('active')
  const [formDomain, setFormDomain] = useState('')
  const [formStreet, setFormStreet] = useState('')
  const [formCity, setFormCity] = useState('')
  const [formPostcode, setFormPostcode] = useState('')
  const [formContactName, setFormContactName] = useState('')
  const [formContactEmail, setFormContactEmail] = useState('')
  const [formContactPhone, setFormContactPhone] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formSecondaryContactName, setFormSecondaryContactName] = useState('')
  const [formSecondaryContactEmail, setFormSecondaryContactEmail] = useState('')
  const [formSecondaryContactPhone, setFormSecondaryContactPhone] = useState('')
  const [formAccountantName, setFormAccountantName] = useState('')
  const [formAccountantEmail, setFormAccountantEmail] = useState('')
  const [formAccountantPhone, setFormAccountantPhone] = useState('')

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // ── Form Handlers ────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setFormName('')
    setFormCompanyNumber('')
    setFormIndustry('')
    setFormEmployeeCount('')
    setFormStatus('active')
    setFormDomain('')
    setFormStreet('')
    setFormCity('')
    setFormPostcode('')
    setFormContactName('')
    setFormContactEmail('')
    setFormContactPhone('')
    setFormNotes('')
    setFormSecondaryContactName('')
    setFormSecondaryContactEmail('')
    setFormSecondaryContactPhone('')
    setFormAccountantName('')
    setFormAccountantEmail('')
    setFormAccountantPhone('')
    setEditingClient(null)
  }, [])

  const openAdd = useCallback(() => {
    resetForm()
    setSheetOpen(true)
  }, [resetForm])

  const openEdit = useCallback((client: Client) => {
    setEditingClient(client)
    setFormName(client.name || '')
    setFormCompanyNumber(client.company_number || '')
    setFormIndustry(client.industry || '')
    setFormEmployeeCount(client.employee_count?.toString() || '')
    setFormStatus(client.status || 'active')
    setFormDomain(client.domain || '')
    const addr = client.address as { street?: string; city?: string; postcode?: string } | null
    setFormStreet(addr?.street || '')
    setFormCity(addr?.city || '')
    setFormPostcode(addr?.postcode || '')
    setFormContactName(client.contact_name || '')
    setFormContactEmail(client.contact_email || '')
    setFormContactPhone(client.contact_phone || '')
    setFormNotes(client.notes || '')
    setFormSecondaryContactName(client.secondary_contact_name || '')
    setFormSecondaryContactEmail(client.secondary_contact_email || '')
    setFormSecondaryContactPhone(client.secondary_contact_phone || '')
    setFormAccountantName(client.accountant_name || '')
    setFormAccountantEmail(client.accountant_email || '')
    setFormAccountantPhone(client.accountant_phone || '')
    setSheetOpen(true)
  }, [])

  const handleSave = async () => {
    if (!formName.trim()) {
      toast('Company name is required', 'error')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: formName.trim(),
        company_number: formCompanyNumber.trim() || undefined,
        industry: formIndustry.trim() || undefined,
        employee_count: formEmployeeCount ? parseInt(formEmployeeCount) : undefined,
        status: formStatus,
        domain: formDomain.trim() || undefined,
        address: (formStreet || formCity || formPostcode) ? {
          street: formStreet.trim() || undefined,
          city: formCity.trim() || undefined,
          postcode: formPostcode.trim() || undefined,
        } : undefined,
        contact_name: formContactName.trim() || undefined,
        contact_email: formContactEmail.trim() || undefined,
        contact_phone: formContactPhone.trim() || undefined,
        notes: formNotes.trim() || undefined,
        secondary_contact_name: formSecondaryContactName.trim() || undefined,
        secondary_contact_email: formSecondaryContactEmail.trim() || undefined,
        secondary_contact_phone: formSecondaryContactPhone.trim() || undefined,
        accountant_name: formAccountantName.trim() || undefined,
        accountant_email: formAccountantEmail.trim() || undefined,
        accountant_phone: formAccountantPhone.trim() || undefined,
      }

      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients'
      const method = editingClient ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save client')
      }

      toast(editingClient ? 'Client updated' : 'Client created')
      mutate('/api/clients')
      setSheetOpen(false)
      resetForm()
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (client: Client) => {
    if (!confirm(`Delete "${client.name}"? This will also delete all their payrolls and payroll runs.`)) return
    setDeletingId(client.id)
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast('Client deleted')
      mutate('/api/clients')
    } catch {
      toast('Failed to delete client', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  // ── Derived Data ─────────────────────────────────────────────────────────

  const industries = useMemo(() => {
    if (!clients) return []
    const allClients = clients as Client[]
    const unique = [...new Set(allClients.map((c) => c.industry).filter(Boolean))] as string[]
    return unique.sort()
  }, [clients])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (industryFilter !== 'all') count++
    if (sortBy !== 'name-asc') count++
    if (dateFrom) count++
    if (dateTo) count++
    return count
  }, [industryFilter, sortBy, dateFrom, dateTo])

  const clearFilters = useCallback(() => {
    setIndustryFilter('all')
    setSortBy('name-asc')
    setDateFrom('')
    setDateTo('')
  }, [])

  const clientList: Client[] = useMemo(() => {
    if (!clients) return []
    let filtered = clients as Client[]

    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter)
    }
    if (industryFilter !== 'all') {
      filtered = filtered.filter((c) => c.industry === industryFilter)
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      filtered = filtered.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.contact_email?.toLowerCase().includes(q) ||
        c.contact_name?.toLowerCase().includes(q) ||
        c.domain?.toLowerCase().includes(q) ||
        c.company_number?.toLowerCase().includes(q)
      )
    }
    if (dateFrom) {
      const from = new Date(dateFrom)
      filtered = filtered.filter((c) => new Date(c.created_at) >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      filtered = filtered.filter((c) => new Date(c.created_at) <= to)
    }

    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name)
        case 'name-desc': return b.name.localeCompare(a.name)
        case 'date-newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'date-oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'employees-high': return (b.employee_count || 0) - (a.employee_count || 0)
        case 'employees-low': return (a.employee_count || 0) - (b.employee_count || 0)
        default: return 0
      }
    })

    return filtered
  }, [clients, statusFilter, industryFilter, debouncedSearch, sortBy, dateFrom, dateTo])

  const counts = useMemo(() => {
    const all = (clients || []) as Client[]
    return {
      total: all.length,
      active: all.filter((c) => c.status === 'active').length,
      inactive: all.filter((c) => c.status === 'inactive').length,
    }
  }, [clients])

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="text-xs" style={{ backgroundColor: `${colors.success}20`, color: colors.success, border: `1px solid ${colors.success}40` }}>Active</Badge>
      case 'inactive':
        return <Badge className="text-xs" style={{ backgroundColor: `${colors.text.muted}20`, color: colors.text.muted, border: `1px solid ${colors.text.muted}40` }}>Inactive</Badge>
      default:
        return <Badge className="text-xs">{status}</Badge>
    }
  }

  // ── Skeleton ───────────────────────────────────────────────────────────────

  if (!mounted || isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 rounded-lg animate-pulse" style={{ backgroundColor: colors.border }} />
          <div className="h-9 w-28 rounded-lg animate-pulse" style={{ backgroundColor: colors.border }} />
        </div>
        <div className="flex items-center gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 w-24 rounded-lg animate-pulse" style={{ backgroundColor: `${colors.border}60` }} />
          ))}
        </div>
        <div className="space-y-0">
          <div className="h-10 animate-pulse" style={{ backgroundColor: `${colors.border}30` }} />
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse" style={{ backgroundColor: 'transparent', borderBottom: `1px solid ${colors.border}30` }} />
          ))}
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1
          className="text-xl md:text-2xl font-bold tracking-tight font-[family-name:var(--font-inter)]"
          style={{ color: colors.text.primary }}
        >
          Clients
        </h1>
        <Button
          onClick={openAdd}
          className="text-white text-sm"
          style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Client
        </Button>
      </div>

      {/* KPI Pills + Search Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: 'Total', count: counts.total, icon: Users, color: colors.primary, filterKey: 'all' as StatusFilter },
            { label: 'Active', count: counts.active, icon: UserCheck, color: colors.success, filterKey: 'active' as StatusFilter },
            { label: 'Inactive', count: counts.inactive, icon: UserX, color: colors.text.muted, filterKey: 'inactive' as StatusFilter },
          ].map((kpi) => {
            const isActive = statusFilter === kpi.filterKey
            return (
              <button
                key={kpi.label}
                onClick={() => setStatusFilter(kpi.filterKey === statusFilter ? 'all' : kpi.filterKey)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium font-[family-name:var(--font-inter)] transition-colors"
                style={{
                  backgroundColor: isActive ? `${kpi.color}15` : 'transparent',
                  color: isActive ? kpi.color : colors.text.secondary,
                  border: `1px solid ${isActive ? kpi.color : colors.border}`,
                }}
              >
                <kpi.icon className="w-3.5 h-3.5" />
                {kpi.label}: <span className="font-bold">{kpi.count}</span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: colors.text.muted }} />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 text-sm h-8 w-[200px] lg:w-[260px]"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1 h-8"
            style={{ borderColor: colors.border, color: colors.text.secondary }}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-3 h-3" />
            Filters
            {activeFilterCount > 0 && (
              <span
                className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white"
                style={{ backgroundColor: colors.primary }}
              >
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <Card className="rounded-lg shadow-sm" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-3">
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[150px]">
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)] mb-1 block" style={{ color: colors.text.muted }}>Industry</Label>
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <SelectTrigger className="text-sm h-8" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}>
                    <SelectValue placeholder="All Industries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    {industries.map((ind) => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[170px]">
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)] mb-1 block" style={{ color: colors.text.muted }}>Sort By</Label>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="text-sm h-8" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="date-newest">Date Added (Newest)</SelectItem>
                    <SelectItem value="date-oldest">Date Added (Oldest)</SelectItem>
                    <SelectItem value="employees-high">Employees (High-Low)</SelectItem>
                    <SelectItem value="employees-low">Employees (Low-High)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[130px]">
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)] mb-1 block" style={{ color: colors.text.muted }}>Added From</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="text-sm h-8" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div className="min-w-[130px]">
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)] mb-1 block" style={{ color: colors.text.muted }}>Added To</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="text-sm h-8" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs gap-1 h-8" style={{ color: colors.error }} onClick={clearFilters}>
                  <X className="w-3 h-3" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {clientList.length === 0 ? (
        <div className="py-20 text-center">
          <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: `${colors.primary}12` }}>
            <Users className="w-6 h-6" style={{ color: colors.primary }} />
          </div>
          <h3 className="text-sm font-semibold mb-1 font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
            No clients found
          </h3>
          <p className="text-xs mb-4 font-[family-name:var(--font-body)]" style={{ color: colors.text.muted }}>
            {debouncedSearch || activeFilterCount > 0 ? 'Try adjusting your search or filters.' : 'Add your first client to get started.'}
          </p>
          {!debouncedSearch && activeFilterCount === 0 && (
            <Button onClick={openAdd} size="sm" className="text-white text-xs" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Client
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow style={{ backgroundColor: colors.lightBg, borderBottom: `1px solid ${colors.border}` }}>
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>Client Name</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)] hidden md:table-cell" style={{ color: colors.text.muted }}>Status</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)] hidden lg:table-cell" style={{ color: colors.text.muted }}>Contact</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)] hidden lg:table-cell" style={{ color: colors.text.muted }}>Email</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)] hidden xl:table-cell" style={{ color: colors.text.muted }}>Phone</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)] hidden xl:table-cell" style={{ color: colors.text.muted }}>Industry</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)] hidden 2xl:table-cell" style={{ color: colors.text.muted }}>Domain</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)] hidden xl:table-cell" style={{ color: colors.text.muted }}>Employees</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)] hidden 2xl:table-cell" style={{ color: colors.text.muted }}>Date Added</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientList.map((client) => (
                <TableRow
                  key={client.id}
                  className="cursor-pointer transition-colors hover:bg-[var(--login-purple)]/[0.03]"
                  style={{ borderBottom: `1px solid ${colors.border}` }}
                  onClick={() => openEdit(client)}
                >
                  <TableCell className="px-4 py-3 font-medium text-sm font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
                    {client.name}
                  </TableCell>
                  <TableCell className="px-4 py-3 hidden md:table-cell">
                    {statusBadge(client.status)}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm hidden lg:table-cell font-[family-name:var(--font-body)]" style={{ color: colors.text.secondary }}>
                    {client.contact_name || '-'}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm hidden lg:table-cell font-[family-name:var(--font-body)]" style={{ color: colors.text.secondary }}>
                    {client.contact_email || '-'}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm hidden xl:table-cell font-[family-name:var(--font-body)]" style={{ color: colors.text.secondary }}>
                    {client.contact_phone || '-'}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm hidden xl:table-cell font-[family-name:var(--font-body)]" style={{ color: colors.text.secondary }}>
                    {client.industry || '-'}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm hidden 2xl:table-cell font-[family-name:var(--font-body)]" style={{ color: colors.text.secondary }}>
                    {client.domain || '-'}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm hidden xl:table-cell font-[family-name:var(--font-body)]" style={{ color: colors.text.secondary }}>
                    {client.employee_count || '-'}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm hidden 2xl:table-cell font-[family-name:var(--font-body)]" style={{ color: colors.text.muted }}>
                    {client.created_at ? format(new Date(client.created_at), 'dd MMM yyyy') : '-'}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Edit client"
                        onClick={() => openEdit(client)}
                      >
                        <Edit className="w-3.5 h-3.5" style={{ color: colors.text.muted }} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={deletingId === client.id}
                        onClick={() => handleDelete(client)}
                      >
                        {deletingId === client.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: colors.text.muted }} />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" style={{ color: colors.error }} />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add/Edit Sidebar */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) resetForm() }}>
        <SheetContent side="right" className="w-full sm:max-w-[480px] overflow-y-auto p-0" style={{ backgroundColor: colors.surface }}>
          <SheetHeader className="px-5 pt-5 pb-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
            <SheetTitle className="text-lg font-bold font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
              {editingClient ? 'Edit Client' : 'Add Client'}
            </SheetTitle>
            <SheetDescription className="text-xs font-[family-name:var(--font-body)]" style={{ color: colors.text.muted }}>
              {editingClient ? 'Update the client details below.' : 'Fill in the details to add a new client.'}
            </SheetDescription>
          </SheetHeader>

          <div className="divide-y" style={{ borderColor: colors.border }}>
            <FormSection title="Company Details" icon={Building2} colors={colors}>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>
                  Company Name <span style={{ color: colors.error }}>*</span>
                </Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Acme Ltd" className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Company Number</Label>
                <Input value={formCompanyNumber} onChange={(e) => setFormCompanyNumber(e.target.value)} placeholder="e.g. 12345678" className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Industry</Label>
                <Input value={formIndustry} onChange={(e) => setFormIndustry(e.target.value)} placeholder="e.g. Construction" className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Domain</Label>
                <Input value={formDomain} onChange={(e) => setFormDomain(e.target.value)} placeholder="e.g. acme.co.uk" className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Employee Count</Label>
                <Input type="number" value={formEmployeeCount} onChange={(e) => setFormEmployeeCount(e.target.value)} placeholder="e.g. 25" className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Status</Label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </FormSection>

            <FormSection title="Address" icon={MapPin} defaultOpen={false} colors={colors}>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Street</Label>
                <Input value={formStreet} onChange={(e) => setFormStreet(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>City</Label>
                <Input value={formCity} onChange={(e) => setFormCity(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Postcode</Label>
                <Input value={formPostcode} onChange={(e) => setFormPostcode(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
            </FormSection>

            <FormSection title="Primary Contact" icon={Phone} defaultOpen={false} colors={colors}>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Contact Name</Label>
                <Input value={formContactName} onChange={(e) => setFormContactName(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Contact Email</Label>
                <Input type="email" value={formContactEmail} onChange={(e) => setFormContactEmail(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Contact Phone</Label>
                <Input value={formContactPhone} onChange={(e) => setFormContactPhone(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Notes</Label>
                <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={3} className="mt-1 text-sm resize-none" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
            </FormSection>

            <FormSection title="Secondary Contact" icon={UserPlus} defaultOpen={false} colors={colors}>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Name</Label>
                <Input value={formSecondaryContactName} onChange={(e) => setFormSecondaryContactName(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Email</Label>
                <Input type="email" value={formSecondaryContactEmail} onChange={(e) => setFormSecondaryContactEmail(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Phone</Label>
                <Input value={formSecondaryContactPhone} onChange={(e) => setFormSecondaryContactPhone(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
            </FormSection>

            <FormSection title="Accountant Contact" icon={Calculator} defaultOpen={false} colors={colors}>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Name</Label>
                <Input value={formAccountantName} onChange={(e) => setFormAccountantName(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Email</Label>
                <Input type="email" value={formAccountantEmail} onChange={(e) => setFormAccountantEmail(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Phone</Label>
                <Input value={formAccountantPhone} onChange={(e) => setFormAccountantPhone(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
            </FormSection>
          </div>

          <div className="px-5 py-4" style={{ borderTop: `1px solid ${colors.border}` }}>
            <Button
              onClick={handleSave}
              disabled={saving || !formName.trim()}
              className="w-full text-white text-sm"
              style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : editingClient ? 'Update Client' : 'Add Client'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
