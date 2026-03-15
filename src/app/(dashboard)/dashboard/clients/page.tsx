'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
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
  Shield,
  CreditCard,
  Settings,
  Settings2,
  Landmark,
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
  // Tax & Compliance
  vat_number?: string | null
  utr?: string | null
  cis_registered?: boolean | null
  sic_code?: string | null
  hmrc_agent_authorised?: boolean | null
  auto_enrolment_status?: string | null
  // Company Details
  company_type?: string | null
  incorporation_date?: string | null
  // Billing
  fee?: string | null
  billing_frequency?: string | null
  payment_method?: string | null
  // Contract
  contract_type?: string | null
  start_date?: string | null
  contract_end_date?: string | null
  notice_period_value?: number | null
  notice_period_unit?: string | null
  assigned_to?: string | null
  referral_source?: string | null
  bacs_bureau_number?: string | null
  tags?: string[] | null
  document_storage_url?: string | null
  portal_access_enabled?: boolean | null
  // Pension
  pension_provider?: string | null
  pension_staging_date?: string | null
  pension_reenrolment_date?: string | null
  declaration_of_compliance_deadline?: string | null
  created_at: string
}

interface TenantUser {
  id: string
  name: string
  email: string
}

type StatusFilter = 'all' | 'active' | 'inactive'
type SortField = 'name' | 'status' | 'contact_name' | 'contact_email' | 'industry' | 'employee_count' | 'created_at' | 'company_type' | 'start_date' | 'assigned_to' | 'contract_type'
type SortDirection = 'asc' | 'desc'

const PAGE_SIZE = 25
const LOCALSTORAGE_KEY = 'tpb_client_columns'

// ── Column Definitions ────────────────────────────────────────────────────────

interface ColumnDef {
  id: string
  label: string
  sortField?: SortField
  defaultVisible: boolean
  getValue: (client: Client, tenantUsers: TenantUser[]) => string
}

const COMPANY_TYPE_LABELS: Record<string, string> = {
  ltd: 'Ltd', llp: 'LLP', sole_trader: 'Sole Trader', charity: 'Charity',
  public_sector: 'Public Sector', partnership: 'Partnership',
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bacs: 'BACS', standing_order: 'Standing Order', card: 'Card',
  invoice: 'Invoice', direct_debit: 'Direct Debit',
}

// Parse numeric fee from string (strips £, commas, suffixes like /month)
function parseFee(fee: string | null | undefined): number | null {
  if (!fee) return null
  const cleaned = fee.replace(/[£,]/g, '').replace(/\/(month|mo|yr|year|run|quarter).*$/i, '').trim()
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

// Normalize a fee to monthly based on billing frequency
function normalizeToMonthly(fee: number, billingFreq: string | null | undefined): number {
  switch (billingFreq) {
    case 'annually': return fee / 12
    case 'quarterly': return fee / 3
    case 'per_run':
    case 'monthly':
    default: return fee
  }
}

const currencyFormat = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0, maximumFractionDigits: 0 })

const PENSION_PROVIDERS = [
  'NEST', 'NOW Pensions', 'Smart Pension', 'The People\'s Pension',
  'Aviva', 'Royal London', 'Scottish Widows', 'Legal & General',
  'Aegon', 'Standard Life', 'Hargreaves Lansdown', 'AJ Bell',
  'Fidelity', 'Other', 'Exempt',
]

const AUTO_ENROLMENT_OPTIONS = [
  { value: 'exempt', label: 'Exempt' },
  { value: 'currently_not_required', label: 'Currently Not Required' },
  { value: 'enrolled', label: 'Enrolled' },
]

const UK_INDUSTRIES = [
  'Agriculture',
  'Charity & Non-Profit',
  'Construction',
  'Education',
  'Energy & Utilities',
  'Finance & Insurance',
  'Healthcare',
  'Hospitality & Leisure',
  'IT & Technology',
  'Legal Services',
  'Manufacturing',
  'Media & Creative',
  'Mining & Quarrying',
  'Professional Services',
  'Public Sector & Defence',
  'Real Estate & Property',
  'Recreation & Sport',
  'Retail & Wholesale',
  'Transport & Logistics',
  'Other',
]

// Deterministic avatar color from name
const AVATAR_COLORS = [
  '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
  '#F43F5E', '#EF4444', '#F97316', '#EAB308', '#84CC16',
  '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6', '#2563EB',
]
function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

const ALL_COLUMNS: ColumnDef[] = [
  { id: 'status', label: 'Status', sortField: 'status', defaultVisible: true, getValue: (c) => c.status },
  { id: 'contact_name', label: 'Contact', sortField: 'contact_name', defaultVisible: true, getValue: (c) => c.contact_name || '-' },
  { id: 'contact_email', label: 'Email', sortField: 'contact_email', defaultVisible: true, getValue: (c) => c.contact_email || '-' },
  { id: 'contact_phone', label: 'Phone', sortField: undefined, defaultVisible: false, getValue: (c) => c.contact_phone || '-' },
  { id: 'industry', label: 'Industry', sortField: 'industry', defaultVisible: true, getValue: (c) => c.industry || '-' },
  { id: 'domain', label: 'Domain', sortField: undefined, defaultVisible: false, getValue: (c) => c.domain || '-' },
  { id: 'employee_count', label: 'Employees', sortField: 'employee_count', defaultVisible: false, getValue: (c) => c.employee_count?.toString() || '-' },
  { id: 'company_type', label: 'Type', sortField: 'company_type', defaultVisible: true, getValue: (c) => c.company_type ? COMPANY_TYPE_LABELS[c.company_type] || c.company_type : '-' },
  { id: 'start_date', label: 'Start Date', sortField: 'start_date', defaultVisible: true, getValue: (c) => c.start_date ? format(new Date(c.start_date), 'dd MMM yyyy') : '-' },
  { id: 'contract_type', label: 'Contract', sortField: 'contract_type', defaultVisible: false, getValue: (c) => c.contract_type === 'fixed_term' ? 'Fixed Term' : c.contract_type === 'rolling' ? 'Rolling' : '-' },
  { id: 'assigned_to', label: 'Assigned To', sortField: 'assigned_to', defaultVisible: false, getValue: (c, users) => c.assigned_to ? users.find(u => u.id === c.assigned_to)?.name || '-' : '-' },
  { id: 'created_at', label: 'Date Added', sortField: 'created_at', defaultVisible: false, getValue: (c) => c.created_at ? format(new Date(c.created_at), 'dd MMM yyyy') : '-' },
  { id: 'fee', label: 'Fee', sortField: undefined, defaultVisible: false, getValue: (c) => c.fee || '-' },
  { id: 'billing_frequency', label: 'Billing', sortField: undefined, defaultVisible: false, getValue: (c) => c.billing_frequency ? { monthly: 'Monthly', per_run: 'Per Run', quarterly: 'Quarterly', annually: 'Annually' }[c.billing_frequency] || c.billing_frequency : '-' },
  { id: 'payment_method', label: 'Payment', sortField: undefined, defaultVisible: false, getValue: (c) => c.payment_method ? PAYMENT_METHOD_LABELS[c.payment_method] || c.payment_method : '-' },
]

const DEFAULT_VISIBLE = ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.id)
const DEFAULT_ORDER = ALL_COLUMNS.map(c => c.id)

function loadColumnPrefs(): { visible: string[]; order: string[] } {
  try {
    const stored = localStorage.getItem(LOCALSTORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Validate — remove any IDs that no longer exist, add any new ones
      const validIds = new Set(ALL_COLUMNS.map(c => c.id))
      const visible = (parsed.visible as string[]).filter(id => validIds.has(id))
      const order = (parsed.order as string[]).filter(id => validIds.has(id))
      // Add any new columns not in stored order
      for (const col of ALL_COLUMNS) {
        if (!order.includes(col.id)) order.push(col.id)
      }
      return { visible, order }
    }
  } catch { /* ignore */ }
  return { visible: DEFAULT_VISIBLE, order: DEFAULT_ORDER }
}

function saveColumnPrefs(prefs: { visible: string[]; order: string[] }) {
  try {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(prefs))
  } catch { /* ignore */ }
}

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
  const searchParams = useSearchParams()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Data
  const { data: clients, isLoading } = useClients()

  // Filters — initialize from URL search param (sidebar search navigates here)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')

  // Sync URL search param changes (e.g. browser back/forward)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || ''
    if (urlSearch && urlSearch !== searchQuery) {
      setSearchQuery(urlSearch)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [industryFilter, setIndustryFilter] = useState<string>('all')
  const [companyTypeFilter, setCompanyTypeFilter] = useState<string>('all')
  const [sicCodeFilter, setSicCodeFilter] = useState<string>('all')
  const [hmrcAuthFilter, setHmrcAuthFilter] = useState<string>('all')
  const [aeStatusFilter, setAeStatusFilter] = useState<string>('all')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all')
  const [contractTypeFilter, setContractTypeFilter] = useState<string>('all')
  const [portalAccessFilter, setPortalAccessFilter] = useState<string>('all')
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
  // Tax & Compliance
  const [formVatNumber, setFormVatNumber] = useState('')
  const [formUtr, setFormUtr] = useState('')
  const [formCisRegistered, setFormCisRegistered] = useState('no')
  const [formSicCode, setFormSicCode] = useState('')
  const [formHmrcAgentAuthorised, setFormHmrcAgentAuthorised] = useState('no')
  const [formAutoEnrolmentStatus, setFormAutoEnrolmentStatus] = useState('')
  // Company Details
  const [formCompanyType, setFormCompanyType] = useState('')
  const [formIncorporationDate, setFormIncorporationDate] = useState('')
  // Billing
  const [formFee, setFormFee] = useState('')
  const [formBillingFrequency, setFormBillingFrequency] = useState('')
  const [formPaymentMethod, setFormPaymentMethod] = useState('')
  // Contract
  const [formContractType, setFormContractType] = useState('rolling')
  const [formStartDate, setFormStartDate] = useState('')
  const [formContractEndDate, setFormContractEndDate] = useState('')
  const [formNoticePeriodValue, setFormNoticePeriodValue] = useState('')
  const [formNoticePeriodUnit, setFormNoticePeriodUnit] = useState('months')
  const [formAssignedTo, setFormAssignedTo] = useState('')
  const [formReferralSource, setFormReferralSource] = useState('')
  const [formBacsBureauNumber, setFormBacsBureauNumber] = useState('')
  const [formTags, setFormTags] = useState('')
  const [formDocumentStorageUrl, setFormDocumentStorageUrl] = useState('')
  const [formPortalAccessEnabled, setFormPortalAccessEnabled] = useState('no')
  // Pension
  const [formPensionProvider, setFormPensionProvider] = useState('')
  const [formPensionStagingDate, setFormPensionStagingDate] = useState('')
  const [formPensionReenrolmentDate, setFormPensionReenrolmentDate] = useState('')
  const [formDocDeadline, setFormDocDeadline] = useState('')

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

  // Column customization
  const [columnPrefs, setColumnPrefs] = useState<{ visible: string[]; order: string[] }>({ visible: DEFAULT_VISIBLE, order: DEFAULT_ORDER })
  const [columnsDialogOpen, setColumnsDialogOpen] = useState(false)
  useEffect(() => {
    setColumnPrefs(loadColumnPrefs())
  }, [])

  const activeColumns = useMemo(() => {
    return columnPrefs.order
      .filter(id => columnPrefs.visible.includes(id))
      .map(id => ALL_COLUMNS.find(c => c.id === id)!)
      .filter(Boolean)
  }, [columnPrefs])

  const toggleColumn = useCallback((id: string) => {
    setColumnPrefs(prev => {
      const visible = prev.visible.includes(id)
        ? prev.visible.filter(v => v !== id)
        : [...prev.visible, id]
      const next = { ...prev, visible }
      saveColumnPrefs(next)
      return next
    })
  }, [])

  const moveColumn = useCallback((id: string, direction: 'up' | 'down') => {
    setColumnPrefs(prev => {
      const order = [...prev.order]
      const idx = order.indexOf(id)
      if (idx < 0) return prev
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= order.length) return prev
      ;[order[idx], order[swapIdx]] = [order[swapIdx], order[idx]]
      const next = { ...prev, order }
      saveColumnPrefs(next)
      return next
    })
  }, [])

  const resetColumns = useCallback(() => {
    const next = { visible: DEFAULT_VISIBLE, order: DEFAULT_ORDER }
    setColumnPrefs(next)
    saveColumnPrefs(next)
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
    setFormVatNumber('')
    setFormUtr('')
    setFormCisRegistered('no')
    setFormSicCode('')
    setFormHmrcAgentAuthorised('no')
    setFormAutoEnrolmentStatus('')
    setFormCompanyType('')
    setFormIncorporationDate('')
    setFormFee('')
    setFormBillingFrequency('')
    setFormPaymentMethod('')
    setFormContractType('rolling')
    setFormStartDate('')
    setFormContractEndDate('')
    setFormNoticePeriodValue('')
    setFormNoticePeriodUnit('months')
    setFormAssignedTo('')
    setFormReferralSource('')
    setFormBacsBureauNumber('')
    setFormTags('')
    setFormDocumentStorageUrl('')
    setFormPortalAccessEnabled('no')
    setFormPensionProvider('')
    setFormPensionStagingDate('')
    setFormPensionReenrolmentDate('')
    setFormDocDeadline('')
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
    setFormVatNumber(client.vat_number || '')
    setFormUtr(client.utr || '')
    setFormCisRegistered(client.cis_registered ? 'yes' : 'no')
    setFormSicCode(client.sic_code || '')
    setFormHmrcAgentAuthorised(client.hmrc_agent_authorised ? 'yes' : 'no')
    setFormAutoEnrolmentStatus(client.auto_enrolment_status || '')
    setFormCompanyType(client.company_type || '')
    setFormIncorporationDate(client.incorporation_date || '')
    setFormFee(client.fee || '')
    setFormBillingFrequency(client.billing_frequency || '')
    setFormPaymentMethod(client.payment_method || '')
    setFormContractType(client.contract_type || 'rolling')
    setFormStartDate(client.start_date || '')
    setFormContractEndDate(client.contract_end_date || '')
    setFormNoticePeriodValue(client.notice_period_value?.toString() || '')
    setFormNoticePeriodUnit(client.notice_period_unit || 'months')
    setFormAssignedTo(client.assigned_to || '')
    setFormReferralSource(client.referral_source || '')
    setFormBacsBureauNumber(client.bacs_bureau_number || '')
    setFormTags(client.tags?.join(', ') || '')
    setFormDocumentStorageUrl(client.document_storage_url || '')
    setFormPortalAccessEnabled(client.portal_access_enabled ? 'yes' : 'no')
    setFormPensionProvider(client.pension_provider || '')
    setFormPensionStagingDate(client.pension_staging_date || '')
    setFormPensionReenrolmentDate(client.pension_reenrolment_date || '')
    setFormDocDeadline(client.declaration_of_compliance_deadline || '')
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
        // Tax & Compliance
        vat_number: formVatNumber.trim() || undefined,
        utr: formUtr.trim() || undefined,
        cis_registered: formCisRegistered === 'yes',
        sic_code: formSicCode.trim() || undefined,
        hmrc_agent_authorised: formHmrcAgentAuthorised === 'yes',
        auto_enrolment_status: formAutoEnrolmentStatus || undefined,
        // Company Details
        company_type: formCompanyType || undefined,
        incorporation_date: formIncorporationDate || undefined,
        // Billing
        fee: formFee.trim() || undefined,
        billing_frequency: formBillingFrequency || undefined,
        payment_method: formPaymentMethod || undefined,
        // Contract
        contract_type: formContractType || undefined,
        start_date: formStartDate || undefined,
        contract_end_date: formContractType === 'fixed_term' ? (formContractEndDate || undefined) : undefined,
        notice_period_value: formNoticePeriodValue ? parseInt(formNoticePeriodValue) : undefined,
        notice_period_unit: formNoticePeriodValue ? formNoticePeriodUnit : undefined,
        assigned_to: formAssignedTo || undefined,
        referral_source: formReferralSource.trim() || undefined,
        bacs_bureau_number: formBacsBureauNumber.trim() || undefined,
        tags: formTags.trim() ? formTags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        document_storage_url: formDocumentStorageUrl.trim() || undefined,
        portal_access_enabled: formPortalAccessEnabled === 'yes',
        // Pension
        pension_provider: formPensionProvider || undefined,
        pension_staging_date: formPensionStagingDate || undefined,
        pension_reenrolment_date: formPensionReenrolmentDate || undefined,
        declaration_of_compliance_deadline: formDocDeadline || undefined,
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

  // Use static UK_INDUSTRIES list so all options always show
  const industries = UK_INDUSTRIES

  const sicCodes = useMemo(() => {
    if (!clients) return []
    const allClients = clients as Client[]
    const unique = [...new Set(allClients.map((c) => c.sic_code).filter(Boolean))] as string[]
    return unique.sort()
  }, [clients])

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (statusFilter !== 'all') count++
    if (industryFilter !== 'all') count++
    if (companyTypeFilter !== 'all') count++
    if (sicCodeFilter !== 'all') count++
    if (hmrcAuthFilter !== 'all') count++
    if (aeStatusFilter !== 'all') count++
    if (paymentMethodFilter !== 'all') count++
    if (contractTypeFilter !== 'all') count++
    if (portalAccessFilter !== 'all') count++
    if (dateFrom) count++
    if (dateTo) count++
    return count
  }, [statusFilter, industryFilter, companyTypeFilter, sicCodeFilter, hmrcAuthFilter, aeStatusFilter, paymentMethodFilter, contractTypeFilter, portalAccessFilter, dateFrom, dateTo])

  const clearFilters = useCallback(() => {
    setStatusFilter('all')
    setIndustryFilter('all')
    setCompanyTypeFilter('all')
    setSicCodeFilter('all')
    setHmrcAuthFilter('all')
    setAeStatusFilter('all')
    setPaymentMethodFilter('all')
    setContractTypeFilter('all')
    setPortalAccessFilter('all')
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
    if (companyTypeFilter !== 'all') {
      filtered = filtered.filter((c) => c.company_type === companyTypeFilter)
    }
    if (sicCodeFilter !== 'all') {
      filtered = filtered.filter((c) => c.sic_code === sicCodeFilter)
    }
    if (hmrcAuthFilter !== 'all') {
      filtered = filtered.filter((c) => hmrcAuthFilter === 'yes' ? c.hmrc_agent_authorised === true : c.hmrc_agent_authorised !== true)
    }
    if (aeStatusFilter !== 'all') {
      filtered = filtered.filter((c) => c.auto_enrolment_status === aeStatusFilter)
    }
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter((c) => c.payment_method === paymentMethodFilter)
    }
    if (contractTypeFilter !== 'all') {
      filtered = filtered.filter((c) => c.contract_type === contractTypeFilter)
    }
    if (portalAccessFilter !== 'all') {
      filtered = filtered.filter((c) => portalAccessFilter === 'yes' ? c.portal_access_enabled === true : c.portal_access_enabled !== true)
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
        case 'contract_type':
          return dir * (a.contract_type || '').localeCompare(b.contract_type || '')
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
  }, [clients, statusFilter, industryFilter, companyTypeFilter, sicCodeFilter, hmrcAuthFilter, aeStatusFilter, paymentMethodFilter, contractTypeFilter, portalAccessFilter, debouncedSearch, sortField, sortDirection, dateFrom, dateTo, tenantUsers])

  // Reset page when filters/sort change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, industryFilter, companyTypeFilter, sicCodeFilter, hmrcAuthFilter, aeStatusFilter, paymentMethodFilter, contractTypeFilter, portalAccessFilter, debouncedSearch, sortField, sortDirection, dateFrom, dateTo])

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE))
  const paginatedClients = filteredSorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const showingFrom = filteredSorted.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(currentPage * PAGE_SIZE, filteredSorted.length)

  const counts = useMemo(() => {
    const all = (clients || []) as Client[]
    const monthlyFees = all
      .map((c) => {
        const raw = parseFee(c.fee)
        return raw !== null ? normalizeToMonthly(raw, c.billing_frequency) : null
      })
      .filter((f): f is number => f !== null)
    const totalRevenue = monthlyFees.reduce((sum, f) => sum + f, 0)
    return {
      total: all.length,
      active: all.filter((c) => c.status === 'active').length,
      inactive: all.filter((c) => c.status === 'inactive').length,
      avgFee: monthlyFees.length > 0 ? Math.round(totalRevenue / monthlyFees.length) : 0,
      totalMonthlyRevenue: Math.round(totalRevenue),
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
        <Button
          onClick={openAdd}
          className="text-white text-sm"
          style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Client
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {[
          { label: 'Total Clients', value: counts.total.toString(), color: colors.primary, filterKey: 'all' as StatusFilter | null },
          { label: 'Active', value: counts.active.toString(), color: colors.success, filterKey: 'active' as StatusFilter | null },
          { label: 'Inactive', value: counts.inactive.toString(), color: colors.text.muted, filterKey: 'inactive' as StatusFilter | null },
          { label: 'Avg Fee', value: counts.avgFee > 0 ? currencyFormat.format(counts.avgFee) : '-', color: colors.secondary, filterKey: null },
          { label: 'Monthly Revenue', value: counts.totalMonthlyRevenue > 0 ? currencyFormat.format(counts.totalMonthlyRevenue) : '-', color: colors.accent, filterKey: null },
        ].map((kpi) => {
          const isActive = kpi.filterKey !== null && statusFilter === kpi.filterKey
          const isClickable = kpi.filterKey !== null
          return (
            <button
              key={kpi.label}
              onClick={isClickable ? () => setStatusFilter(kpi.filterKey === statusFilter ? 'all' : kpi.filterKey!) : undefined}
              className={`rounded-xl p-3 text-left transition-all duration-150 ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              style={{
                backgroundColor: colors.surface,
                border: `1px solid ${isActive ? kpi.color : colors.border}`,
                boxShadow: isActive ? `0 0 0 1px ${kpi.color}` : undefined,
              }}
            >
              <p className="text-[0.7rem] font-medium font-[family-name:var(--font-inter)] truncate" style={{ color: isActive ? kpi.color : colors.text.muted }}>
                {kpi.label}
              </p>
              <p className="text-xl font-bold font-[family-name:var(--font-inter)]" style={{ color: isActive ? kpi.color : colors.text.primary }}>
                {kpi.value}
              </p>
            </button>
          )
        })}
      </div>

      {/* Toolbar: Search + Filters + Columns + Export */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.text.muted }} />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs gap-1.5"
            style={{ borderColor: colors.border, color: activeFilterCount > 0 ? colors.primary : colors.text.secondary }}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span
                className="ml-0.5 px-1.5 py-0.5 rounded-full text-[0.6rem] font-bold text-white"
                style={{ backgroundColor: colors.primary }}
              >
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setColumnsDialogOpen(true)}
            className="text-xs gap-1.5"
            style={{ borderColor: colors.border, color: colors.text.secondary }}
          >
            <Settings2 className="w-3.5 h-3.5" />
            Columns
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="text-xs gap-1.5"
            style={{ borderColor: colors.border, color: colors.text.secondary }}
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="flex flex-wrap items-end gap-3 p-3 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FAFAFA', border: `1px solid ${colors.border}` }}>
            <div className="min-w-[130px]">
              <Label className="text-xs font-medium font-[family-name:var(--font-inter)] mb-1 block" style={{ color: colors.text.muted }}>Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="text-sm h-8" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[160px]">
              <Label className="text-xs font-medium font-[family-name:var(--font-inter)] mb-1 block" style={{ color: colors.text.muted }}>Industry</Label>
              <Select value={industryFilter} onValueChange={setIndustryFilter}>
                <SelectTrigger className="text-sm h-8" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}>
                  <SelectValue placeholder="All" />
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
              <Label className="text-xs font-medium font-[family-name:var(--font-inter)] mb-1 block" style={{ color: colors.text.muted }}>Company Type</Label>
              <Select value={companyTypeFilter} onValueChange={setCompanyTypeFilter}>
                <SelectTrigger className="text-sm h-8" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {Object.entries(COMPANY_TYPE_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {sicCodes.length > 0 && (
              <div className="min-w-[120px]">
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)] mb-1 block" style={{ color: colors.text.muted }}>SIC Code</Label>
                <Select value={sicCodeFilter} onValueChange={setSicCodeFilter}>
                  <SelectTrigger className="text-sm h-8" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {sicCodes.map((code) => (
                      <SelectItem key={code} value={code}>{code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="min-w-[130px]">
              <Label className="text-xs font-medium font-[family-name:var(--font-inter)] mb-1 block" style={{ color: colors.text.muted }}>HMRC PAYE Auth</Label>
              <Select value={hmrcAuthFilter} onValueChange={setHmrcAuthFilter}>
                <SelectTrigger className="text-sm h-8" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[150px]">
              <Label className="text-xs font-medium font-[family-name:var(--font-inter)] mb-1 block" style={{ color: colors.text.muted }}>Auto Enrolment</Label>
              <Select value={aeStatusFilter} onValueChange={setAeStatusFilter}>
                <SelectTrigger className="text-sm h-8" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {AUTO_ENROLMENT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[130px]">
              <Label className="text-xs font-medium font-[family-name:var(--font-inter)] mb-1 block" style={{ color: colors.text.muted }}>Payment Method</Label>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="text-sm h-8" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[120px]">
              <Label className="text-xs font-medium font-[family-name:var(--font-inter)] mb-1 block" style={{ color: colors.text.muted }}>Contract Type</Label>
              <Select value={contractTypeFilter} onValueChange={setContractTypeFilter}>
                <SelectTrigger className="text-sm h-8" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="rolling">Rolling</SelectItem>
                  <SelectItem value="fixed_term">Fixed Term</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[130px]">
              <Label className="text-xs font-medium font-[family-name:var(--font-inter)] mb-1 block" style={{ color: colors.text.muted }}>Portal Access</Label>
              <Select value={portalAccessFilter} onValueChange={setPortalAccessFilter}>
                <SelectTrigger className="text-sm h-8" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="yes">Enabled</SelectItem>
                  <SelectItem value="no">Disabled</SelectItem>
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
              <button
                onClick={clearFilters}
                className="text-xs font-medium transition-colors"
                style={{ color: colors.primary }}
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      {filteredSorted.length === 0 ? (
        <Card className="rounded-xl shadow-sm" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-12 text-center">
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
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10">
                <TableRow style={{ backgroundColor: colors.lightBg, borderBottom: `1px solid ${colors.border}` }}>
                  <SortableHeader label="Client Name" field="name" currentField={sortField} currentDirection={sortDirection} onSort={handleSort} colors={colors} />
                  {activeColumns.map((col) => (
                    col.sortField ? (
                      <SortableHeader key={col.id} label={col.label} field={col.sortField} currentField={sortField} currentDirection={sortDirection} onSort={handleSort} colors={colors} />
                    ) : (
                      <TableHead key={col.id} className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>{col.label}</TableHead>
                    )
                  ))}
                  <TableHead className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClients.map((client) => {
                  const avatarBg = getAvatarColor(client.name)
                  return (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer transition-colors group"
                      style={{ borderBottom: `1px solid ${colors.border}` }}
                      onClick={() => openEdit(client)}
                    >
                      <TableCell className="px-4 py-2.5 font-medium text-sm font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
                        <div className="flex items-center gap-2.5" style={{ borderLeft: '3px solid transparent' }}>
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 group-hover:ring-2 group-hover:ring-offset-1 transition-shadow"
                            style={{ backgroundColor: avatarBg, ['--tw-ring-color' as string]: `${colors.primary}30` }}
                          >
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="truncate max-w-[200px]">{client.name}</span>
                        </div>
                      </TableCell>
                      {activeColumns.map((col) => {
                        const needsTruncate = ['contact_email', 'domain', 'contact_name'].includes(col.id)
                        return (
                          <TableCell
                            key={col.id}
                            className={`px-4 py-2.5 text-sm font-[family-name:var(--font-body)] ${needsTruncate ? 'max-w-[200px] truncate' : ''}`}
                            style={{ color: col.id === 'created_at' ? colors.text.muted : colors.text.secondary }}
                            title={needsTruncate ? col.getValue(client, tenantUsers) : undefined}
                          >
                            {col.id === 'status' ? statusBadge(client.status) : col.getValue(client, tenantUsers)}
                          </TableCell>
                        )
                      })}
                      <TableCell className="px-4 py-2.5">
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
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>
              Showing {showingFrom}–{showingTo} of {filteredSorted.length}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-7 text-xs"
                  style={{ borderColor: colors.border }}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <span className="text-xs font-medium px-2 font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-7 text-xs"
                  style={{ borderColor: colors.border }}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
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

      {/* Column Customizer Dialog */}
      <Dialog open={columnsDialogOpen} onOpenChange={setColumnsDialogOpen}>
        <DialogContent style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
              Customize Columns
            </DialogTitle>
            <DialogDescription className="font-[family-name:var(--font-body)]" style={{ color: colors.text.secondary }}>
              Toggle columns on or off and reorder them using the arrows.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto -mx-1">
            {/* Fixed: Client Name always first */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg mb-1"
              style={{ backgroundColor: `${colors.primary}08` }}
            >
              <input type="checkbox" checked disabled className="w-4 h-4 accent-[var(--login-purple)] opacity-50" />
              <span className="text-sm font-medium font-[family-name:var(--font-inter)] flex-1" style={{ color: colors.text.muted }}>
                Client Name
              </span>
              <span className="text-[10px] font-medium font-[family-name:var(--font-inter)] px-1.5 py-0.5 rounded" style={{ color: colors.text.muted, backgroundColor: `${colors.border}60` }}>
                Pinned
              </span>
            </div>
            {columnPrefs.order.map((id, idx) => {
              const col = ALL_COLUMNS.find(c => c.id === id)
              if (!col) return null
              const isVisible = columnPrefs.visible.includes(id)
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                  style={{ backgroundColor: isVisible ? 'transparent' : `${colors.border}20` }}
                >
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => toggleColumn(id)}
                    className="w-4 h-4 accent-[var(--login-purple)] cursor-pointer"
                  />
                  <span
                    className="text-sm font-medium font-[family-name:var(--font-inter)] flex-1"
                    style={{ color: isVisible ? colors.text.primary : colors.text.muted }}
                  >
                    {col.label}
                  </span>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      className="p-1 rounded transition-colors hover:bg-[var(--login-purple)]/10 disabled:opacity-30"
                      disabled={idx === 0}
                      onClick={() => moveColumn(id, 'up')}
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" style={{ color: colors.text.muted }} />
                    </button>
                    <button
                      type="button"
                      className="p-1 rounded transition-colors hover:bg-[var(--login-purple)]/10 disabled:opacity-30"
                      disabled={idx === columnPrefs.order.length - 1}
                      onClick={() => moveColumn(id, 'down')}
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" style={{ color: colors.text.muted }} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={resetColumns}
              style={{ borderColor: colors.border, color: colors.text.secondary }}
            >
              Reset to Default
            </Button>
            <Button
              size="sm"
              className="text-white"
              style={{ backgroundColor: colors.primary }}
              onClick={() => setColumnsDialogOpen(false)}
            >
              Done
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
                <Select value={formIndustry} onValueChange={setFormIndustry}>
                  <SelectTrigger className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}><SelectValue placeholder="Select industry..." /></SelectTrigger>
                  <SelectContent>
                    {UK_INDUSTRIES.map((ind) => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>HMRC PAYE Online Authorisation</Label>
                <Select value={formHmrcAgentAuthorised} onValueChange={setFormHmrcAgentAuthorised}>
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
                    <SelectItem value="exempt">Exempt</SelectItem>
                    <SelectItem value="currently_not_required">Currently Not Required</SelectItem>
                    <SelectItem value="enrolled">Enrolled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </FormSection>

            <FormSection title="Pension" icon={Landmark} defaultOpen={false} colors={colors}>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Pension Provider</Label>
                <Select value={formPensionProvider} onValueChange={setFormPensionProvider}>
                  <SelectTrigger className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {PENSION_PROVIDERS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Staging Date</Label>
                <Input type="date" value={formPensionStagingDate} onChange={(e) => setFormPensionStagingDate(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Re-enrolment Date</Label>
                <Input type="date" value={formPensionReenrolmentDate} onChange={(e) => setFormPensionReenrolmentDate(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Declaration of Compliance Deadline</Label>
                <Input type="date" value={formDocDeadline} onChange={(e) => setFormDocDeadline(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
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
                <Select value={formPaymentMethod} onValueChange={setFormPaymentMethod}>
                  <SelectTrigger className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bacs">BACS</SelectItem>
                    <SelectItem value="standing_order">Standing Order</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="direct_debit">Direct Debit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Contract Type</Label>
                <Select value={formContractType} onValueChange={setFormContractType}>
                  <SelectTrigger className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rolling">Rolling</SelectItem>
                    <SelectItem value="fixed_term">Fixed Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Start Date</Label>
                <Input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              {formContractType === 'fixed_term' && (
                <div>
                  <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Contract End Date</Label>
                  <Input type="date" value={formContractEndDate} onChange={(e) => setFormContractEndDate(e.target.value)} className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
                </div>
              )}
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Notice Period</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number"
                    min="1"
                    value={formNoticePeriodValue}
                    onChange={(e) => setFormNoticePeriodValue(e.target.value)}
                    placeholder="e.g. 1"
                    className="text-sm flex-1"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                  />
                  <Select value={formNoticePeriodUnit} onValueChange={setFormNoticePeriodUnit}>
                    <SelectTrigger className="text-sm w-[120px]" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
