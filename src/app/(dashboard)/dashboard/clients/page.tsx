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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  ChevronLeft,
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
  ArrowUp,
  ArrowDown,
  Download,
  ClipboardList,
  Shield,
  CreditCard,
  Settings,
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
  address?: { street?: string; city?: string; postcode?: string; country?: string } | null
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
  // Payroll Contact
  payroll_contact_name?: string | null
  payroll_contact_email?: string | null
  payroll_contact_phone?: string | null
  // Tax & Compliance
  vat_number?: string | null
  utr?: string | null
  cis_registered?: boolean | null
  sic_code?: string | null
  hmrc_agent_authorised?: boolean | null
  tpas_authorised?: boolean | null
  auto_enrolment_status?: string | null
  // Company Details
  company_type?: string | null
  incorporation_date?: string | null
  registered_address?: { street?: string; city?: string; postcode?: string; country?: string } | null
  director_name?: string | null
  // Billing
  fee?: string | null
  billing_frequency?: string | null
  payment_method?: string | null
  // Operational
  start_date?: string | null
  contract_end_date?: string | null
  assigned_to?: string | null
  referral_source?: string | null
  bacs_bureau_number?: string | null
  tags?: string[] | null
  document_storage_url?: string | null
  portal_access_enabled?: boolean | null
  created_at: string
}

interface TenantUser {
  id: string
  name: string
  email: string
}

type StatusFilter = 'all' | 'active' | 'inactive'
type SortField = 'name' | 'status' | 'contact_name' | 'contact_email' | 'industry' | 'employee_count' | 'created_at' | 'company_type' | 'start_date' | 'assigned_to'
type SortDirection = 'asc' | 'desc'

const PAGE_SIZE = 25

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

// ── Sortable Table Header ─────────────────────────────────────────────────────

function SortableHeader({
  label,
  field,
  currentField,
  currentDirection,
  onSort,
  colors,
  className = '',
}: {
  label: string
  field: SortField
  currentField: SortField
  currentDirection: SortDirection
  onSort: (field: SortField) => void
  colors: ReturnType<typeof getThemeColors>
  className?: string
}) {
  const isActive = currentField === field
  return (
    <TableHead
      className={`px-4 py-3 text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)] cursor-pointer select-none ${className}`}
      style={{ color: isActive ? colors.primary : colors.text.muted }}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive && (
          currentDirection === 'asc'
            ? <ArrowUp className="w-3 h-3" />
            : <ArrowDown className="w-3 h-3" />
        )}
      </div>
    </TableHead>
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
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Sort
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

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
  // Payroll Contact
  const [formPayrollContactName, setFormPayrollContactName] = useState('')
  const [formPayrollContactEmail, setFormPayrollContactEmail] = useState('')
  const [formPayrollContactPhone, setFormPayrollContactPhone] = useState('')
  // Tax & Compliance
  const [formVatNumber, setFormVatNumber] = useState('')
  const [formUtr, setFormUtr] = useState('')
  const [formCisRegistered, setFormCisRegistered] = useState('no')
  const [formSicCode, setFormSicCode] = useState('')
  const [formHmrcAgentAuthorised, setFormHmrcAgentAuthorised] = useState('no')
  const [formTpasAuthorised, setFormTpasAuthorised] = useState('no')
  const [formAutoEnrolmentStatus, setFormAutoEnrolmentStatus] = useState('')
  // Company Details (new)
  const [formCompanyType, setFormCompanyType] = useState('')
  const [formIncorporationDate, setFormIncorporationDate] = useState('')
  const [formRegisteredStreet, setFormRegisteredStreet] = useState('')
  const [formRegisteredCity, setFormRegisteredCity] = useState('')
  const [formRegisteredPostcode, setFormRegisteredPostcode] = useState('')
  const [formRegisteredCountry, setFormRegisteredCountry] = useState('')
  const [formDirectorName, setFormDirectorName] = useState('')
  // Billing
  const [formFee, setFormFee] = useState('')
  const [formBillingFrequency, setFormBillingFrequency] = useState('')
  const [formPaymentMethod, setFormPaymentMethod] = useState('')
  // Operational
  const [formStartDate, setFormStartDate] = useState('')
  const [formContractEndDate, setFormContractEndDate] = useState('')
  const [formAssignedTo, setFormAssignedTo] = useState('')
  const [formReferralSource, setFormReferralSource] = useState('')
  const [formBacsBureauNumber, setFormBacsBureauNumber] = useState('')
  const [formTags, setFormTags] = useState('')
  const [formDocumentStorageUrl, setFormDocumentStorageUrl] = useState('')
  const [formPortalAccessEnabled, setFormPortalAccessEnabled] = useState('no')

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)

  // Export state
  const [exporting, setExporting] = useState(false)

  // Tenant users for Assigned To dropdown
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([])
  useEffect(() => {
    fetch('/api/users')
      .then(res => res.ok ? res.json() : [])
      .then(data => setTenantUsers(Array.isArray(data) ? data : []))
      .catch(() => setTenantUsers([]))
  }, [])

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
    setFormPayrollContactName('')
    setFormPayrollContactEmail('')
    setFormPayrollContactPhone('')
    setFormVatNumber('')
    setFormUtr('')
    setFormCisRegistered('no')
    setFormSicCode('')
    setFormHmrcAgentAuthorised('no')
    setFormTpasAuthorised('no')
    setFormAutoEnrolmentStatus('')
    setFormCompanyType('')
    setFormIncorporationDate('')
    setFormRegisteredStreet('')
    setFormRegisteredCity('')
    setFormRegisteredPostcode('')
    setFormRegisteredCountry('')
    setFormDirectorName('')
    setFormFee('')
    setFormBillingFrequency('')
    setFormPaymentMethod('')
    setFormStartDate('')
    setFormContractEndDate('')
    setFormAssignedTo('')
    setFormReferralSource('')
    setFormBacsBureauNumber('')
    setFormTags('')
    setFormDocumentStorageUrl('')
    setFormPortalAccessEnabled('no')
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
    setFormPayrollContactName(client.payroll_contact_name || '')
    setFormPayrollContactEmail(client.payroll_contact_email || '')
    setFormPayrollContactPhone(client.payroll_contact_phone || '')
    setFormVatNumber(client.vat_number || '')
    setFormUtr(client.utr || '')
    setFormCisRegistered(client.cis_registered ? 'yes' : 'no')
    setFormSicCode(client.sic_code || '')
    setFormHmrcAgentAuthorised(client.hmrc_agent_authorised ? 'yes' : 'no')
    setFormTpasAuthorised(client.tpas_authorised ? 'yes' : 'no')
    setFormAutoEnrolmentStatus(client.auto_enrolment_status || '')
    setFormCompanyType(client.company_type || '')
    setFormIncorporationDate(client.incorporation_date || '')
    const regAddr = client.registered_address as { street?: string; city?: string; postcode?: string; country?: string } | null
    setFormRegisteredStreet(regAddr?.street || '')
    setFormRegisteredCity(regAddr?.city || '')
    setFormRegisteredPostcode(regAddr?.postcode || '')
    setFormRegisteredCountry(regAddr?.country || '')
    setFormDirectorName(client.director_name || '')
    setFormFee(client.fee || '')
    setFormBillingFrequency(client.billing_frequency || '')
    setFormPaymentMethod(client.payment_method || '')
    setFormStartDate(client.start_date || '')
    setFormContractEndDate(client.contract_end_date || '')
    setFormAssignedTo(client.assigned_to || '')
    setFormReferralSource(client.referral_source || '')
    setFormBacsBureauNumber(client.bacs_bureau_number || '')
    setFormTags(client.tags?.join(', ') || '')
    setFormDocumentStorageUrl(client.document_storage_url || '')
    setFormPortalAccessEnabled(client.portal_access_enabled ? 'yes' : 'no')
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
        // Payroll Contact
        payroll_contact_name: formPayrollContactName.trim() || undefined,
        payroll_contact_email: formPayrollContactEmail.trim() || undefined,
        payroll_contact_phone: formPayrollContactPhone.trim() || undefined,
        // Tax & Compliance
        vat_number: formVatNumber.trim() || undefined,
        utr: formUtr.trim() || undefined,
        cis_registered: formCisRegistered === 'yes',
        sic_code: formSicCode.trim() || undefined,
        hmrc_agent_authorised: formHmrcAgentAuthorised === 'yes',
        tpas_authorised: formTpasAuthorised === 'yes',
        auto_enrolment_status: formAutoEnrolmentStatus || undefined,
        // Company Details
        company_type: formCompanyType || undefined,
        incorporation_date: formIncorporationDate || undefined,
        registered_address: (formRegisteredStreet || formRegisteredCity || formRegisteredPostcode || formRegisteredCountry) ? {
          street: formRegisteredStreet.trim() || undefined,
          city: formRegisteredCity.trim() || undefined,
          postcode: formRegisteredPostcode.trim() || undefined,
          country: formRegisteredCountry.trim() || undefined,
        } : undefined,
        director_name: formDirectorName.trim() || undefined,
        // Billing
        fee: formFee.trim() || undefined,
        billing_frequency: formBillingFrequency || undefined,
        payment_method: formPaymentMethod.trim() || undefined,
        // Operational
        start_date: formStartDate || undefined,
        contract_end_date: formContractEndDate || undefined,
        assigned_to: formAssignedTo || undefined,
        referral_source: formReferralSource.trim() || undefined,
        bacs_bureau_number: formBacsBureauNumber.trim() || undefined,
        tags: formTags.trim() ? formTags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        document_storage_url: formDocumentStorageUrl.trim() || undefined,
        portal_access_enabled: formPortalAccessEnabled === 'yes',
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
    setDeletingId(client.id)
    setClientToDelete(null)
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

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (industryFilter !== 'all') params.set('industry', industryFilter)

      const res = await fetch(`/api/clients/export?${params}`)
      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `clients-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast('Clients exported')
    } catch {
      toast('Failed to export clients', 'error')
    } finally {
      setExporting(false)
    }
  }

  // ── Sort handler ───────────────────────────────────────────────────────

  const handleSort = useCallback((field: SortField) => {
    setSortDirection(prev => sortField === field ? (prev === 'asc' ? 'desc' : 'asc') : 'asc')
    setSortField(field)
  }, [sortField])

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
    if (dateFrom) count++
    if (dateTo) count++
    return count
  }, [industryFilter, dateFrom, dateTo])

  const clearFilters = useCallback(() => {
    setIndustryFilter('all')
    setDateFrom('')
    setDateTo('')
  }, [])

  const filteredSorted: Client[] = useMemo(() => {
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
      const dir = sortDirection === 'asc' ? 1 : -1

      switch (sortField) {
        case 'name':
          return dir * a.name.localeCompare(b.name)
        case 'status':
          return dir * a.status.localeCompare(b.status)
        case 'contact_name':
          return dir * (a.contact_name || '').localeCompare(b.contact_name || '')
        case 'contact_email':
          return dir * (a.contact_email || '').localeCompare(b.contact_email || '')
        case 'industry':
          return dir * (a.industry || '').localeCompare(b.industry || '')
        case 'employee_count': {
          const aVal = a.employee_count ?? -1
          const bVal = b.employee_count ?? -1
          return dir * (aVal - bVal)
        }
        case 'created_at':
          return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        case 'company_type':
          return dir * (a.company_type || '').localeCompare(b.company_type || '')
        case 'start_date':
          return dir * ((a.start_date || '').localeCompare(b.start_date || ''))
        case 'assigned_to': {
          const aName = tenantUsers.find(u => u.id === a.assigned_to)?.name || ''
          const bName = tenantUsers.find(u => u.id === b.assigned_to)?.name || ''
          return dir * aName.localeCompare(bName)
        }
        default:
          return 0
      }
    })

    return filtered
  }, [clients, statusFilter, industryFilter, debouncedSearch, sortField, sortDirection, dateFrom, dateTo, tenantUsers])

  // Reset page when filters/sort change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, industryFilter, debouncedSearch, sortField, sortDirection, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE))
  const paginatedClients = filteredSorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const showingFrom = filteredSorted.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(currentPage * PAGE_SIZE, filteredSorted.length)

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
      <div className="space-y-5">
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1
          className="text-xl md:text-2xl font-bold tracking-tight font-[family-name:var(--font-inter)]"
          style={{ color: colors.text.primary }}
        >
          Clients
        </h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-sm gap-1.5"
            style={{ borderColor: colors.border, color: colors.text.secondary }}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export
          </Button>
          <Button
            onClick={openAdd}
            className="text-white text-sm"
            style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Client
          </Button>
        </div>
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
      {filteredSorted.length === 0 ? (
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
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ backgroundColor: colors.lightBg, borderBottom: `1px solid ${colors.border}` }}>
                  <SortableHeader label="Client Name" field="name" currentField={sortField} currentDirection={sortDirection} onSort={handleSort} colors={colors} />
                  <SortableHeader label="Status" field="status" currentField={sortField} currentDirection={sortDirection} onSort={handleSort} colors={colors} className="hidden md:table-cell" />
                  <SortableHeader label="Contact" field="contact_name" currentField={sortField} currentDirection={sortDirection} onSort={handleSort} colors={colors} className="hidden lg:table-cell" />
                  <SortableHeader label="Email" field="contact_email" currentField={sortField} currentDirection={sortDirection} onSort={handleSort} colors={colors} className="hidden lg:table-cell" />
                  <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)] hidden xl:table-cell" style={{ color: colors.text.muted }}>Phone</TableHead>
                  <SortableHeader label="Industry" field="industry" currentField={sortField} currentDirection={sortDirection} onSort={handleSort} colors={colors} className="hidden xl:table-cell" />
                  <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)] hidden 2xl:table-cell" style={{ color: colors.text.muted }}>Domain</TableHead>
                  <SortableHeader label="Employees" field="employee_count" currentField={sortField} currentDirection={sortDirection} onSort={handleSort} colors={colors} className="hidden xl:table-cell" />
                  <SortableHeader label="Type" field="company_type" currentField={sortField} currentDirection={sortDirection} onSort={handleSort} colors={colors} className="hidden xl:table-cell" />
                  <SortableHeader label="Start Date" field="start_date" currentField={sortField} currentDirection={sortDirection} onSort={handleSort} colors={colors} className="hidden xl:table-cell" />
                  <SortableHeader label="Assigned To" field="assigned_to" currentField={sortField} currentDirection={sortDirection} onSort={handleSort} colors={colors} className="hidden 2xl:table-cell" />
                  <SortableHeader label="Date Added" field="created_at" currentField={sortField} currentDirection={sortDirection} onSort={handleSort} colors={colors} className="hidden 2xl:table-cell" />
                  <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClients.map((client) => (
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
                    <TableCell className="px-4 py-3 text-sm hidden xl:table-cell font-[family-name:var(--font-body)]" style={{ color: colors.text.secondary }}>
                      {client.company_type ? { ltd: 'Ltd', llp: 'LLP', sole_trader: 'Sole Trader', charity: 'Charity', public_sector: 'Public Sector', partnership: 'Partnership' }[client.company_type] || client.company_type : '-'}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm hidden xl:table-cell font-[family-name:var(--font-body)]" style={{ color: colors.text.secondary }}>
                      {client.start_date ? format(new Date(client.start_date), 'dd MMM yyyy') : '-'}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm hidden 2xl:table-cell font-[family-name:var(--font-body)]" style={{ color: colors.text.secondary }}>
                      {client.assigned_to ? tenantUsers.find(u => u.id === client.assigned_to)?.name || '-' : '-'}
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
                          onClick={() => setClientToDelete(client)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-1 py-2">
              <p className="text-xs font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>
                Showing {showingFrom}–{showingTo} of {filteredSorted.length} clients
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1"
                  style={{ borderColor: colors.border, color: colors.text.secondary }}
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </Button>
                <span className="text-xs font-medium font-[family-name:var(--font-inter)] px-2" style={{ color: colors.text.secondary }}>
                  {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 gap-1"
                  style={{ borderColor: colors.border, color: colors.text.secondary }}
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={clientToDelete !== null} onOpenChange={(open) => { if (!open) setClientToDelete(null) }}>
        <DialogContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
              Delete Client
            </DialogTitle>
            <DialogDescription className="font-[family-name:var(--font-body)]" style={{ color: colors.text.secondary }}>
              Delete &ldquo;{clientToDelete?.name}&rdquo;? This will also delete all their payrolls and payroll runs. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setClientToDelete(null)}
              style={{ borderColor: colors.border, color: colors.text.secondary }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-white"
              style={{ backgroundColor: colors.error }}
              disabled={deletingId !== null}
              onClick={() => clientToDelete && handleDelete(clientToDelete)}
            >
              {deletingId === clientToDelete?.id ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Company Type</Label>
                <Select value={formCompanyType} onValueChange={setFormCompanyType}>
                  <SelectTrigger className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}><SelectValue placeholder="Select type..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ltd">Ltd</SelectItem>
                    <SelectItem value="llp">LLP</SelectItem>
                    <SelectItem value="sole_trader">Sole Trader</SelectItem>
                    <SelectItem value="charity">Charity</SelectItem>
                    <SelectItem value="public_sector">Public Sector</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Industry</Label>
                <Input value={formIndustry} onChange={(e) => setFormIndustry(e.target.value)} placeholder="e.g. Construction" className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Director Name</Label>
                <Input value={formDirectorName} onChange={(e) => setFormDirectorName(e.target.value)} placeholder="e.g. John Smith" className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>SIC Code</Label>
                <Input value={formSicCode} onChange={(e) => setFormSicCode(e.target.value)} placeholder="e.g. 62020" className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
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

            <FormSection title="Payroll Contact" icon={ClipboardList} defaultOpen={false} colors={colors}>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Name</Label>
                <Input value={formPayrollContactName} onChange={(e) => setFormPayrollContactName(e.target.value)} placeholder="Person who sends timesheets" className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Email</Label>
                <Input type="email" value={formPayrollContactEmail} onChange={(e) => setFormPayrollContactEmail(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Phone</Label>
                <Input value={formPayrollContactPhone} onChange={(e) => setFormPayrollContactPhone(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
            </FormSection>

            <FormSection title="Registered Address" icon={MapPin} defaultOpen={false} colors={colors}>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Street</Label>
                <Input value={formRegisteredStreet} onChange={(e) => setFormRegisteredStreet(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>City</Label>
                <Input value={formRegisteredCity} onChange={(e) => setFormRegisteredCity(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Postcode</Label>
                <Input value={formRegisteredPostcode} onChange={(e) => setFormRegisteredPostcode(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Country</Label>
                <Input value={formRegisteredCountry} onChange={(e) => setFormRegisteredCountry(e.target.value)} placeholder="e.g. United Kingdom" className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
            </FormSection>

            <FormSection title="Tax & Compliance" icon={Shield} defaultOpen={false} colors={colors}>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>VAT Number</Label>
                <Input value={formVatNumber} onChange={(e) => setFormVatNumber(e.target.value)} placeholder="e.g. GB123456789" className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>UTR (Unique Taxpayer Reference)</Label>
                <Input value={formUtr} onChange={(e) => setFormUtr(e.target.value)} placeholder="e.g. 1234567890" className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>CIS Registered</Label>
                <Select value={formCisRegistered} onValueChange={setFormCisRegistered}>
                  <SelectTrigger className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>HMRC Agent Authorised (64-8)</Label>
                <Select value={formHmrcAgentAuthorised} onValueChange={setFormHmrcAgentAuthorised}>
                  <SelectTrigger className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>TPAS Authorised</Label>
                <Select value={formTpasAuthorised} onValueChange={setFormTpasAuthorised}>
                  <SelectTrigger className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Auto Enrolment Status</Label>
                <Select value={formAutoEnrolmentStatus} onValueChange={setFormAutoEnrolmentStatus}>
                  <SelectTrigger className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enrolled">Enrolled</SelectItem>
                    <SelectItem value="exempt">Exempt</SelectItem>
                    <SelectItem value="postponed">Postponed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </FormSection>

            <FormSection title="Billing & Contract" icon={CreditCard} defaultOpen={false} colors={colors}>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Fee</Label>
                <Input value={formFee} onChange={(e) => setFormFee(e.target.value)} placeholder="e.g. £150/month or £5 per employee" className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Billing Frequency</Label>
                <Select value={formBillingFrequency} onValueChange={setFormBillingFrequency}>
                  <SelectTrigger className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="per_run">Per Payroll Run</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Payment Method</Label>
                <Input value={formPaymentMethod} onChange={(e) => setFormPaymentMethod(e.target.value)} placeholder="e.g. BACS, Standing Order, Card" className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Start Date</Label>
                <Input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Contract End Date</Label>
                <Input type="date" value={formContractEndDate} onChange={(e) => setFormContractEndDate(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
            </FormSection>

            <FormSection title="Additional Details" icon={Settings} defaultOpen={false} colors={colors}>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Incorporation Date</Label>
                <Input type="date" value={formIncorporationDate} onChange={(e) => setFormIncorporationDate(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Assigned To</Label>
                <Select value={formAssignedTo} onValueChange={setFormAssignedTo}>
                  <SelectTrigger className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}><SelectValue placeholder="Select team member..." /></SelectTrigger>
                  <SelectContent>
                    {tenantUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Referral Source</Label>
                <Input value={formReferralSource} onChange={(e) => setFormReferralSource(e.target.value)} placeholder="e.g. Website, Referral, Accountant" className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>BACS Bureau Number</Label>
                <Input value={formBacsBureauNumber} onChange={(e) => setFormBacsBureauNumber(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Tags</Label>
                <Input value={formTags} onChange={(e) => setFormTags(e.target.value)} placeholder="e.g. CIS, monthly, priority (comma-separated)" className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Document Storage URL</Label>
                <Input value={formDocumentStorageUrl} onChange={(e) => setFormDocumentStorageUrl(e.target.value)} placeholder="e.g. https://drive.google.com/..." className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Portal Access Enabled</Label>
                <Select value={formPortalAccessEnabled} onValueChange={setFormPortalAccessEnabled}>
                  <SelectTrigger className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                  </SelectContent>
                </Select>
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
