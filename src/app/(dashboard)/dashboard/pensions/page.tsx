'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { usePensions } from '@/lib/swr'
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
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import {
  Shield,
  Search,
  Edit,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Filter,
  ArrowUp,
  ArrowDown,
  Download,
  Settings2,
  CalendarDays,
  ExternalLink,
  HelpCircle,
  ClipboardCheck,
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { mutate } from 'swr'
import { parseISO, isBefore, addDays, addMonths, addYears, startOfDay, format } from 'date-fns'
import Link from 'next/link'

// ── Types ──────────────────────────────────────────────────────────────────────

interface PensionPayroll {
  payroll_id: string
  payroll_name: string
  pension_provider: string | null
}

interface PensionClient {
  id: string
  name: string
  status: string
  auto_enrolment_status: string | null
  tpr_dashboard_status: string | null
  pension_staging_date: string | null
  pension_reenrolment_date: string | null
  declaration_of_compliance_deadline: string | null
  pension_providers: PensionPayroll[]
}

type PensionFilter = 'all' | 'overdue' | 'due_soon' | 'ready' | 'exempt'
type AEFilter = 'all' | 'exempt' | 'currently_not_required' | 'enrolled'
type SortField = 'name' | 'auto_enrolment_status' | 'tpr_dashboard_status' | 'staging_date' | 'reenrolment_date' | 'declaration_deadline' | 'status_indicator'
type SortDirection = 'asc' | 'desc'

const PAGE_SIZE = 25
const LOCALSTORAGE_KEY = 'tpb_pension_columns'

// ── Helpers ────────────────────────────────────────────────────────────────────

type OverallStatus = 'overdue' | 'due_soon' | 'ready' | 'waiting' | 'missing' | 'exempt'

function getOverallStatus(client: PensionClient): OverallStatus {
  if (client.auto_enrolment_status === 'exempt') return 'exempt'
  // Must have re-enrolment date and declaration deadline to determine status
  if (!client.pension_reenrolment_date || !client.declaration_of_compliance_deadline) return 'missing'
  const today = startOfDay(new Date())
  const declarationDate = parseISO(client.declaration_of_compliance_deadline)
  // Overdue: only if declaration deadline has passed
  if (isBefore(declarationDate, today)) return 'overdue'
  // Due soon: declaration deadline within 30 days
  if (isBefore(declarationDate, addDays(today, 30))) return 'due_soon'
  // Ready: re-enrolment date has passed, declaration can be completed
  const reenrolmentDate = parseISO(client.pension_reenrolment_date)
  if (isBefore(reenrolmentDate, today) || reenrolmentDate.getTime() === today.getTime()) return 'ready'
  // Waiting: re-enrolment date in the future
  return 'waiting'
}

const STATUS_PRIORITY: Record<string, number> = { overdue: 0, due_soon: 1, ready: 2, waiting: 3, missing: 4, exempt: 5 }

const AE_LABELS: Record<string, string> = {
  exempt: 'Exempt',
  currently_not_required: 'Currently Not Required',
  enrolled: 'Enrolled',
}

const TPR_LABELS: Record<string, string> = {
  not_added: 'Not Added',
  waiting: 'Waiting',
  added: 'Added',
}

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

// ── Column Definitions ────────────────────────────────────────────────────────

interface ColumnDef {
  id: string
  label: string
  sortField?: SortField
  defaultVisible: boolean
  getValue: (client: PensionClient) => string
}

const ALL_COLUMNS: ColumnDef[] = [
  {
    id: 'pension_providers',
    label: 'Pension Provider(s)',
    defaultVisible: true,
    getValue: (c) => {
      const providers = c.pension_providers.filter(p => p.pension_provider).map(p => p.pension_provider!)
      if (providers.length === 0) return c.pension_providers.length === 0 ? 'No payrolls' : 'Not set'
      if (providers.length === 1) return providers[0]
      return `${providers[0]} (+${providers.length - 1} more)`
    },
  },
  {
    id: 'auto_enrolment_status',
    label: 'AE Status',
    sortField: 'auto_enrolment_status',
    defaultVisible: true,
    getValue: (c) => c.auto_enrolment_status ? AE_LABELS[c.auto_enrolment_status] || c.auto_enrolment_status : '-',
  },
  {
    id: 'tpr_dashboard_status',
    label: 'TPR Dashboard',
    sortField: 'tpr_dashboard_status',
    defaultVisible: true,
    getValue: (c) => c.tpr_dashboard_status ? TPR_LABELS[c.tpr_dashboard_status] || c.tpr_dashboard_status : 'Not Added',
  },
  {
    id: 'staging_date',
    label: 'Staging Date',
    sortField: 'staging_date',
    defaultVisible: true,
    getValue: (c) => c.pension_staging_date ? format(new Date(c.pension_staging_date), 'dd MMM yyyy') : '-',
  },
  {
    id: 'reenrolment_date',
    label: 'Re-enrolment Date',
    sortField: 'reenrolment_date',
    defaultVisible: true,
    getValue: (c) => c.pension_reenrolment_date ? format(new Date(c.pension_reenrolment_date), 'dd MMM yyyy') : '-',
  },
  {
    id: 'declaration_deadline',
    label: 'Declaration Deadline',
    sortField: 'declaration_deadline',
    defaultVisible: true,
    getValue: (c) => c.declaration_of_compliance_deadline ? format(new Date(c.declaration_of_compliance_deadline), 'dd MMM yyyy') : '-',
  },
  {
    id: 'status_indicator',
    label: 'Status',
    sortField: 'status_indicator',
    defaultVisible: true,
    getValue: (c) => {
      const status = getOverallStatus(c)
      if (status === 'exempt') return 'Exempt'
      if (status === 'overdue') return 'Overdue'
      if (status === 'due_soon') return 'Due Soon'
      if (status === 'ready') return 'Ready'
      if (status === 'waiting') return 'Waiting'
      return 'Missing Info'
    },
  },
  {
    id: 'client_status',
    label: 'Client Status',
    defaultVisible: false,
    getValue: (c) => c.status || '-',
  },
]

const DEFAULT_VISIBLE = ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.id)
const DEFAULT_ORDER = ALL_COLUMNS.map(c => c.id)

function loadColumnPrefs(): { visible: string[]; order: string[] } {
  try {
    const stored = localStorage.getItem(LOCALSTORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      const validIds = new Set(ALL_COLUMNS.map(c => c.id))
      const visible = (parsed.visible as string[]).filter(id => validIds.has(id))
      const order = (parsed.order as string[]).filter(id => validIds.has(id))
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

export default function PensionDeclarationsPage() {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { toast } = useToast()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Data
  const { data: pensionClients, isLoading } = usePensions()

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [pensionFilter, setPensionFilter] = useState<PensionFilter>('all')
  const [aeFilter, setAeFilter] = useState<AEFilter>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Sort
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

  // Sidebar state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<PensionClient | null>(null)
  const [saving, setSaving] = useState(false)

  // Form fields
  const [formAutoEnrolmentStatus, setFormAutoEnrolmentStatus] = useState('')
  const [formTprDashboardStatus, setFormTprDashboardStatus] = useState('')
  const [formStagingDate, setFormStagingDate] = useState('')
  const [formReenrolmentDate, setFormReenrolmentDate] = useState('')
  const [formDeclarationDeadline, setFormDeclarationDeadline] = useState('')
  // Track whether dates were auto-calculated (so we can show helper text)
  const [datesAutoCalculated, setDatesAutoCalculated] = useState(false)

  // Export
  const [exporting, setExporting] = useState(false)

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
    setFormAutoEnrolmentStatus('')
    setFormTprDashboardStatus('')
    setFormStagingDate('')
    setFormReenrolmentDate('')
    setFormDeclarationDeadline('')
    setDatesAutoCalculated(false)
    setEditingClient(null)
  }, [])

  const openEdit = useCallback((client: PensionClient) => {
    setEditingClient(client)
    setFormAutoEnrolmentStatus(client.auto_enrolment_status || '')
    setFormTprDashboardStatus(client.tpr_dashboard_status || 'not_added')
    setFormStagingDate(client.pension_staging_date || '')
    setFormReenrolmentDate(client.pension_reenrolment_date || '')
    setFormDeclarationDeadline(client.declaration_of_compliance_deadline || '')
    setDatesAutoCalculated(false)
    setSheetOpen(true)
  }, [])

  const handleSave = async () => {
    if (!editingClient) return

    setSaving(true)
    try {
      const payload = {
        client_id: editingClient.id,
        auto_enrolment_status: formAutoEnrolmentStatus || null,
        tpr_dashboard_status: formTprDashboardStatus || null,
        pension_staging_date: formStagingDate || null,
        pension_reenrolment_date: formReenrolmentDate || null,
        declaration_of_compliance_deadline: formDeclarationDeadline || null,
      }

      const res = await fetch('/api/pensions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update pension details')
      }

      toast('Pension details updated')
      mutate('/api/pensions')
      setSheetOpen(false)
      resetForm()
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/pensions/export')
      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pensions-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast('Pensions exported')
    } catch {
      toast('Failed to export pension data', 'error')
    } finally {
      setExporting(false)
    }
  }

  // ── Staging date auto-calculation ────────────────────────────────────────
  const handleStagingDateChange = useCallback((newDate: string) => {
    setFormStagingDate(newDate)
    if (newDate) {
      const staging = parseISO(newDate)
      // Declaration deadline = staging date + 5 calendar months
      const deadline = addMonths(staging, 5)
      setFormDeclarationDeadline(format(deadline, 'yyyy-MM-dd'))
      // Re-enrolment date = staging date + 3 years
      const reenrolment = addYears(staging, 3)
      setFormReenrolmentDate(format(reenrolment, 'yyyy-MM-dd'))
      setDatesAutoCalculated(true)
    }
  }, [])

  // ── Sort handler ───────────────────────────────────────────────────────

  const handleSort = useCallback((field: SortField) => {
    setSortDirection(prev => sortField === field ? (prev === 'asc' ? 'desc' : 'asc') : 'asc')
    setSortField(field)
  }, [sortField])

  // ── Derived Data ─────────────────────────────────────────────────────────

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (aeFilter !== 'all') count++
    return count
  }, [aeFilter])

  const clearFilters = useCallback(() => {
    setAeFilter('all')
  }, [])

  const filteredSorted: PensionClient[] = useMemo(() => {
    if (!pensionClients) return []
    let filtered = pensionClients as PensionClient[]

    // Pension status filter (from KPI cards)
    if (pensionFilter === 'exempt') {
      filtered = filtered.filter(c => c.auto_enrolment_status === 'exempt')
    } else if (pensionFilter === 'overdue') {
      filtered = filtered.filter(c => getOverallStatus(c) === 'overdue')
    } else if (pensionFilter === 'due_soon') {
      filtered = filtered.filter(c => getOverallStatus(c) === 'due_soon')
    } else if (pensionFilter === 'ready') {
      filtered = filtered.filter(c => getOverallStatus(c) === 'ready')
    }

    // AE status filter (from expandable filters)
    if (aeFilter !== 'all') {
      filtered = filtered.filter(c => c.auto_enrolment_status === aeFilter)
    }

    // Search
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.pension_providers.some(p => p.pension_provider?.toLowerCase().includes(q))
      )
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1
      switch (sortField) {
        case 'name':
          return dir * a.name.localeCompare(b.name)
        case 'auto_enrolment_status':
          return dir * (a.auto_enrolment_status || '').localeCompare(b.auto_enrolment_status || '')
        case 'tpr_dashboard_status':
          return dir * (a.tpr_dashboard_status || '').localeCompare(b.tpr_dashboard_status || '')
        case 'staging_date':
          return dir * ((a.pension_staging_date || '').localeCompare(b.pension_staging_date || ''))
        case 'reenrolment_date':
          return dir * ((a.pension_reenrolment_date || '').localeCompare(b.pension_reenrolment_date || ''))
        case 'declaration_deadline':
          return dir * ((a.declaration_of_compliance_deadline || '').localeCompare(b.declaration_of_compliance_deadline || ''))
        case 'status_indicator': {
          const aPriority = STATUS_PRIORITY[getOverallStatus(a)] ?? 5
          const bPriority = STATUS_PRIORITY[getOverallStatus(b)] ?? 5
          return dir * (aPriority - bPriority)
        }
        default:
          return 0
      }
    })

    return filtered
  }, [pensionClients, pensionFilter, aeFilter, debouncedSearch, sortField, sortDirection])

  // Reset page when filters/sort change
  useEffect(() => {
    setCurrentPage(1)
  }, [pensionFilter, aeFilter, debouncedSearch, sortField, sortDirection])

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE))
  const paginatedClients = filteredSorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const showingFrom = filteredSorted.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(currentPage * PAGE_SIZE, filteredSorted.length)

  const counts = useMemo(() => {
    const all = (pensionClients || []) as PensionClient[]
    const nonExempt = all.filter(c => c.auto_enrolment_status !== 'exempt')
    return {
      total: nonExempt.length,
      exempt: all.filter(c => c.auto_enrolment_status === 'exempt').length,
      overdue: nonExempt.filter(c => getOverallStatus(c) === 'overdue').length,
      dueSoon: nonExempt.filter(c => getOverallStatus(c) === 'due_soon').length,
      ready: nonExempt.filter(c => getOverallStatus(c) === 'ready').length,
    }
  }, [pensionClients])

  // Status badge renderer
  const statusBadge = (client: PensionClient) => {
    const status = getOverallStatus(client)
    switch (status) {
      case 'overdue':
        return <Badge className="text-xs" style={{ backgroundColor: `${colors.error}20`, color: colors.error, border: `1px solid ${colors.error}40` }}>Overdue</Badge>
      case 'due_soon':
        return <Badge className="text-xs" style={{ backgroundColor: '#F59E0B20', color: '#F59E0B', border: '1px solid #F59E0B40' }}>Due Soon</Badge>
      case 'ready':
        return <Badge className="text-xs" style={{ backgroundColor: `${colors.primary}20`, color: colors.primary, border: `1px solid ${colors.primary}40` }}>Ready</Badge>
      case 'waiting':
        return <Badge className="text-xs" style={{ backgroundColor: '#3B82F620', color: '#3B82F6', border: '1px solid #3B82F640' }}>Waiting</Badge>
      case 'exempt':
        return <Badge className="text-xs" style={{ backgroundColor: `${colors.text.muted}20`, color: colors.text.muted, border: `1px solid ${colors.text.muted}40` }}>Exempt</Badge>
      default:
        return <Badge className="text-xs" style={{ backgroundColor: `${colors.text.muted}20`, color: colors.text.muted, border: `1px solid ${colors.text.muted}40` }}>Missing Info</Badge>
    }
  }

  // TPR dashboard badge renderer
  const tprBadge = (status: string | null) => {
    const tprStatus = status || 'not_added'
    const label = TPR_LABELS[tprStatus] || tprStatus
    switch (tprStatus) {
      case 'added':
        return <Badge className="text-xs" style={{ backgroundColor: `${colors.success}20`, color: colors.success, border: `1px solid ${colors.success}40` }}>{label}</Badge>
      case 'waiting':
        return <Badge className="text-xs" style={{ backgroundColor: '#F59E0B20', color: '#F59E0B', border: '1px solid #F59E0B40' }}>{label}</Badge>
      default:
        return <Badge className="text-xs" style={{ backgroundColor: `${colors.text.muted}20`, color: colors.text.muted, border: `1px solid ${colors.text.muted}40` }}>{label}</Badge>
    }
  }

  // AE status badge renderer
  const aeBadge = (status: string | null) => {
    if (!status) return <span className="text-sm font-[family-name:var(--font-body)]" style={{ color: colors.text.muted }}>-</span>
    const label = AE_LABELS[status] || status
    switch (status) {
      case 'enrolled':
        return <Badge className="text-xs" style={{ backgroundColor: `${colors.success}20`, color: colors.success, border: `1px solid ${colors.success}40` }}>{label}</Badge>
      case 'exempt':
        return <Badge className="text-xs" style={{ backgroundColor: `${colors.text.muted}20`, color: colors.text.muted, border: `1px solid ${colors.text.muted}40` }}>{label}</Badge>
      default:
        return <Badge className="text-xs" style={{ backgroundColor: '#F59E0B20', color: '#F59E0B', border: '1px solid #F59E0B40' }}>{label}</Badge>
    }
  }

  // ── Skeleton ───────────────────────────────────────────────────────────────

  if (!mounted || isLoading) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 rounded-lg animate-pulse" style={{ backgroundColor: colors.border }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-[72px] rounded-xl animate-pulse" style={{ backgroundColor: `${colors.border}60` }} />
          ))}
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
          Pensions
        </h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
        {[
          { label: 'Total Clients', value: counts.total.toString(), color: colors.primary, filterKey: 'all' as PensionFilter },
          { label: 'Overdue', value: counts.overdue.toString(), color: colors.error, filterKey: 'overdue' as PensionFilter },
          { label: 'Due Soon', value: counts.dueSoon.toString(), color: '#F59E0B', filterKey: 'due_soon' as PensionFilter },
          { label: 'Ready', value: counts.ready.toString(), color: colors.primary, filterKey: 'ready' as PensionFilter },
          { label: 'Exempt', value: counts.exempt.toString(), color: colors.text.muted, filterKey: 'exempt' as PensionFilter },
        ].map((kpi) => {
          const isActive = pensionFilter === kpi.filterKey
          return (
            <button
              key={kpi.label}
              onClick={() => setPensionFilter(kpi.filterKey === pensionFilter ? 'all' : kpi.filterKey)}
              className="rounded-xl p-3 text-left transition-all duration-150 cursor-pointer"
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
              placeholder="Search by client or provider..."
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
            <div className="min-w-[180px]">
              <Label className="text-xs font-medium font-[family-name:var(--font-inter)] mb-1 block" style={{ color: colors.text.muted }}>Auto Enrolment Status</Label>
              <Select value={aeFilter} onValueChange={(v) => setAeFilter(v as AEFilter)}>
                <SelectTrigger className="text-sm h-8" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="exempt">Exempt</SelectItem>
                  <SelectItem value="currently_not_required">Currently Not Required</SelectItem>
                  <SelectItem value="enrolled">Enrolled</SelectItem>
                </SelectContent>
              </Select>
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

      {/* Legend */}
      <div
        className="flex flex-wrap items-center gap-4 px-4 py-2.5 rounded-lg text-[0.7rem] font-medium font-[family-name:var(--font-inter)]"
        style={{
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          border: `1px solid ${colors.border}`,
          color: colors.text.muted,
        }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: colors.error }} />
          Overdue (declaration deadline passed)
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }} />
          Due Soon (within 30 days)
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: colors.primary }} />
          Ready (can complete declaration)
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: '#3B82F6' }} />
          Waiting (re-enrolment not yet due)
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: colors.text.muted }} />
          Missing Info / Exempt
        </div>
      </div>

      {/* Table */}
      {filteredSorted.length === 0 ? (
        <Card className="rounded-xl shadow-sm" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: `${colors.primary}12` }}>
              <Shield className="w-6 h-6" style={{ color: colors.primary }} />
            </div>
            <h3 className="text-sm font-semibold mb-1 font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
              No pension records found
            </h3>
            <p className="text-xs font-[family-name:var(--font-body)]" style={{ color: colors.text.muted }}>
              {debouncedSearch || pensionFilter !== 'all' || activeFilterCount > 0
                ? 'Try adjusting your search or filters.'
                : 'Add clients to start tracking pension declarations.'}
            </p>
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
                  const isExempt = client.auto_enrolment_status === 'exempt'
                  return (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer transition-colors group"
                      style={{
                        borderBottom: `1px solid ${colors.border}`,
                        opacity: isExempt ? 0.6 : 1,
                      }}
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
                      {activeColumns.map((col) => (
                        <TableCell
                          key={col.id}
                          className={`px-4 py-2.5 text-sm font-[family-name:var(--font-body)] ${col.id === 'pension_providers' ? 'max-w-[200px] truncate' : ''}`}
                          style={{ color: colors.text.secondary }}
                          title={col.id === 'pension_providers' ? col.getValue(client) : undefined}
                        >
                          {col.id === 'status_indicator' ? statusBadge(client)
                            : col.id === 'auto_enrolment_status' ? aeBadge(client.auto_enrolment_status)
                            : col.id === 'tpr_dashboard_status' ? tprBadge(client.tpr_dashboard_status)
                            : col.id === 'client_status' ? (
                              <Badge className="text-xs" style={{
                                backgroundColor: client.status === 'active' ? `${colors.success}20` : `${colors.text.muted}20`,
                                color: client.status === 'active' ? colors.success : colors.text.muted,
                                border: `1px solid ${client.status === 'active' ? `${colors.success}40` : `${colors.text.muted}40`}`,
                              }}>
                                {client.status === 'active' ? 'Active' : 'Inactive'}
                              </Badge>
                            )
                            : col.getValue(client)}
                        </TableCell>
                      ))}
                      <TableCell className="px-4 py-2.5">
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Edit pension details"
                            onClick={() => openEdit(client)}
                          >
                            <Edit className="w-3.5 h-3.5" style={{ color: colors.text.muted }} />
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

      {/* Edit Sidebar */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) resetForm() }}>
        <SheetContent side="right" className="w-full sm:max-w-[480px] overflow-y-auto p-0" style={{ backgroundColor: colors.surface }}>
          <SheetHeader className="px-5 pt-5 pb-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
            <SheetTitle className="text-lg font-bold font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
              {editingClient?.name}
            </SheetTitle>
            <SheetDescription className="text-xs font-[family-name:var(--font-body)]" style={{ color: colors.text.muted }}>
              Update pension declarations and auto enrolment status.
            </SheetDescription>
          </SheetHeader>

          <div className="divide-y" style={{ borderColor: colors.border }}>
            <FormSection title="Auto Enrolment" icon={Shield} colors={colors}>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>
                  AE Status
                </Label>
                <Select value={formAutoEnrolmentStatus} onValueChange={setFormAutoEnrolmentStatus}>
                  <SelectTrigger className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}>
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exempt">Exempt</SelectItem>
                    <SelectItem value="currently_not_required">Currently Not Required</SelectItem>
                    <SelectItem value="enrolled">Enrolled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </FormSection>

            <FormSection title="TPR Dashboard" icon={ClipboardCheck} colors={colors}>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>
                  Status
                </Label>
                <Select value={formTprDashboardStatus} onValueChange={setFormTprDashboardStatus}>
                  <SelectTrigger className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}>
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_added">Not Added</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="added">Added</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[0.7rem] mt-1 font-[family-name:var(--font-body)]" style={{ color: colors.text.muted }}>
                  Client must be added to The Pension Regulator dashboard before completing declaration.
                </p>
              </div>
            </FormSection>

            <FormSection title="Pension Dates" icon={CalendarDays} colors={colors}>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>
                  Staging Date
                </Label>
                <Input
                  type="date"
                  value={formStagingDate}
                  onChange={(e) => handleStagingDateChange(e.target.value)}
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
                <p className="text-[0.7rem] mt-1 font-[family-name:var(--font-body)]" style={{ color: colors.text.muted }}>
                  Start date for pensions. Changing this will auto-calculate the dates below.
                </p>
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>
                  Re-enrolment Date
                </Label>
                <Input
                  type="date"
                  value={formReenrolmentDate}
                  onChange={(e) => { setFormReenrolmentDate(e.target.value); setDatesAutoCalculated(false) }}
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
                {datesAutoCalculated && (
                  <p className="text-[0.7rem] mt-1 font-[family-name:var(--font-body)]" style={{ color: colors.primary }}>
                    Auto-calculated (staging date + 3 years). You can override this.
                  </p>
                )}
                <p className="text-[0.7rem] mt-0.5 font-[family-name:var(--font-body)]" style={{ color: colors.text.muted }}>
                  Happens every 3 years. Update manually after each re-enrolment exercise.
                </p>
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>
                  Declaration of Compliance Deadline
                </Label>
                <Input
                  type="date"
                  value={formDeclarationDeadline}
                  onChange={(e) => { setFormDeclarationDeadline(e.target.value); setDatesAutoCalculated(false) }}
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
                {datesAutoCalculated && (
                  <p className="text-[0.7rem] mt-1 font-[family-name:var(--font-body)]" style={{ color: colors.primary }}>
                    Auto-calculated (staging date + 5 months). You can override this.
                  </p>
                )}
                <p className="text-[0.7rem] mt-0.5 font-[family-name:var(--font-body)]" style={{ color: colors.text.muted }}>
                  Must be completed or receive a &pound;400 penalty.
                </p>
              </div>
            </FormSection>

            <FormSection title="Pension Providers" icon={HelpCircle} defaultOpen={true} colors={colors}>
              {editingClient && editingClient.pension_providers.length > 0 ? (
                <div className="space-y-2">
                  {editingClient.pension_providers.map((p) => (
                    <div
                      key={p.payroll_id}
                      className="flex items-center justify-between p-2.5 rounded-lg"
                      style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FAFAFA', border: `1px solid ${colors.border}` }}
                    >
                      <div>
                        <p className="text-sm font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
                          {p.payroll_name}
                        </p>
                        <p className="text-xs font-[family-name:var(--font-body)]" style={{ color: colors.text.muted }}>
                          {p.pension_provider || 'No provider set'}
                        </p>
                      </div>
                    </div>
                  ))}
                  <Link
                    href="/dashboard/payrolls"
                    className="inline-flex items-center gap-1 text-xs font-medium transition-colors hover:underline"
                    style={{ color: colors.primary }}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Manage on Payrolls page
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="text-xs font-[family-name:var(--font-body)]" style={{ color: colors.text.muted }}>
                    {editingClient && editingClient.pension_providers.length === 0
                      ? 'No payrolls configured for this client.'
                      : 'No providers set.'}
                  </p>
                  <Link
                    href="/dashboard/payrolls"
                    className="inline-flex items-center gap-1 text-xs font-medium mt-2 transition-colors hover:underline"
                    style={{ color: colors.primary }}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Go to Payrolls
                  </Link>
                </div>
              )}
            </FormSection>
          </div>

          {/* Save button */}
          <div className="px-5 py-4" style={{ borderTop: `1px solid ${colors.border}` }}>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full text-white"
              style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
