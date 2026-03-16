'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { useToast } from '@/components/ui/toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useTrainingRecords, useSubscription } from '@/lib/swr'
import { useDebounce } from '@/hooks/useDebounce'
import UpgradePrompt from '@/components/ui/UpgradePrompt'
import { mutate } from 'swr'
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  Download,
  Settings2,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  Loader2,
  FileText,
  Clock,
  Award,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Circle,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  TrendingUp,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface TrainingRecord {
  id: string
  title: string
  provider: string | null
  category: string | null
  url: string | null
  notes: string | null
  completed: boolean
  completed_date: string | null
  cpd_hours: number | null
  expiry_date: string | null
  certificate_url: string | null
  status: 'not_started' | 'in_progress' | 'completed'
  created_at: string
  updated_at: string
}

type Category = 'hmrc_webinar' | 'cipp_webinar' | 'online_course' | 'conference' | 'workshop' | 'self_study' | 'other'
type StatusFilter = 'all' | 'not_started' | 'in_progress' | 'completed' | 'expiring'
type SortField = 'title' | 'provider' | 'category' | 'cpd_hours' | 'status' | 'completed_date' | 'expiry_date'
type SortDirection = 'asc' | 'desc'
type RAGStatus = 'green' | 'amber' | 'red'

// ── Constants ──────────────────────────────────────────────────────────────────

const CPD_ANNUAL_TARGET = 21 // CIPP recommended hours/year for payroll professionals

const CATEGORY_LABELS: Record<string, string> = {
  hmrc_webinar: 'HMRC Webinar',
  cipp_webinar: 'CIPP Webinar',
  online_course: 'Online Course',
  conference: 'Conference',
  workshop: 'Workshop',
  self_study: 'Self Study',
  other: 'Other',
}

function getCategoryColor(cat: string | null, isDark: boolean): { bg: string; text: string; border: string } {
  switch (cat) {
    case 'hmrc_webinar':
      return { bg: isDark ? 'rgba(124,92,191,0.15)' : '#F5F3FF', text: isDark ? '#A78BFA' : '#7C3AED', border: isDark ? 'rgba(124,92,191,0.3)' : '#DDD6FE' }
    case 'cipp_webinar':
      return { bg: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF', text: isDark ? '#60A5FA' : '#2563EB', border: isDark ? 'rgba(59,130,246,0.3)' : '#BFDBFE' }
    case 'online_course':
      return { bg: isDark ? 'rgba(34,197,94,0.15)' : '#F0FDF4', text: isDark ? '#4ADE80' : '#16A34A', border: isDark ? 'rgba(34,197,94,0.3)' : '#BBF7D0' }
    case 'conference':
      return { bg: isDark ? 'rgba(245,158,11,0.15)' : '#FFFBEB', text: isDark ? '#FBBF24' : '#D97706', border: isDark ? 'rgba(245,158,11,0.3)' : '#FDE68A' }
    case 'workshop':
      return { bg: isDark ? 'rgba(236,56,93,0.15)' : '#FFF1F2', text: isDark ? '#F06082' : '#E11D48', border: isDark ? 'rgba(236,56,93,0.3)' : '#FECDD3' }
    case 'self_study':
      return { bg: isDark ? 'rgba(99,102,241,0.15)' : '#EEF2FF', text: isDark ? '#818CF8' : '#6366F1', border: isDark ? 'rgba(99,102,241,0.3)' : '#C7D2FE' }
    default:
      return { bg: isDark ? 'rgba(156,163,175,0.15)' : '#F9FAFB', text: isDark ? '#9CA3AF' : '#6B7280', border: isDark ? 'rgba(156,163,175,0.3)' : '#E5E7EB' }
  }
}

const STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
}

function getStatusColor(status: string, isDark: boolean): { bg: string; text: string; border: string; dot: string } {
  switch (status) {
    case 'completed':
      return { bg: isDark ? 'rgba(34,197,94,0.15)' : '#F0FDF4', text: isDark ? '#4ADE80' : '#16A34A', border: isDark ? 'rgba(34,197,94,0.3)' : '#BBF7D0', dot: '#22C55E' }
    case 'in_progress':
      return { bg: isDark ? 'rgba(245,158,11,0.15)' : '#FFFBEB', text: isDark ? '#FBBF24' : '#D97706', border: isDark ? 'rgba(245,158,11,0.3)' : '#FDE68A', dot: '#F59E0B' }
    default:
      return { bg: isDark ? 'rgba(156,163,175,0.15)' : '#F9FAFB', text: isDark ? '#9CA3AF' : '#6B7280', border: isDark ? 'rgba(156,163,175,0.3)' : '#E5E7EB', dot: '#9CA3AF' }
  }
}

const RECOMMENDED_TRAINING = [
  { title: 'CIPP Payroll Technician Certificate', provider: 'CIPP', category: 'cipp_webinar' as Category, hours: 40 },
  { title: 'HMRC Basic PAYE Tools Training', provider: 'HMRC', category: 'hmrc_webinar' as Category, hours: 2 },
  { title: 'Auto Enrolment Essentials', provider: 'The Pensions Regulator', category: 'online_course' as Category, hours: 3 },
  { title: 'Payroll Year-End Procedures', provider: 'HMRC', category: 'hmrc_webinar' as Category, hours: 1.5 },
  { title: 'RTI Compliance Update', provider: 'HMRC', category: 'hmrc_webinar' as Category, hours: 1 },
  { title: 'National Minimum Wage Update', provider: 'HMRC', category: 'hmrc_webinar' as Category, hours: 1 },
  { title: 'Statutory Payments (SSP/SMP/SPP)', provider: 'CIPP', category: 'cipp_webinar' as Category, hours: 2 },
  { title: 'GDPR for Payroll Professionals', provider: 'CIPP', category: 'online_course' as Category, hours: 2 },
]

const PAGE_SIZE = 25
const LOCALSTORAGE_KEY = 'tpb_training_columns'

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return '-'
  }
}

function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

function isExpiringSoon(dateStr: string | null): boolean {
  if (!dateStr) return false
  const exp = new Date(dateStr)
  const in90 = new Date()
  in90.setDate(in90.getDate() + 90)
  return exp >= new Date() && exp <= in90
}

// ── RAG Status Calculator ────────────────────────────────────────────────────

interface RAGResult {
  status: RAGStatus
  label: string
  reasons: string[]
}

function getTrainingRAGStatus(
  records: TrainingRecord[],
  cpdHoursThisYear: number,
  recommendedCompletion: { completed: number; total: number },
): RAGResult {
  const now = new Date()
  const monthsElapsed = now.getMonth() + 1
  const proRatedTarget = CPD_ANNUAL_TARGET * (monthsElapsed / 12)

  const expiredCerts = records.filter(r => isExpired(r.expiry_date)).length
  const expiringSoonCerts = records.filter(r => isExpiringSoon(r.expiry_date)).length
  const recommendedNotStarted = recommendedCompletion.total - recommendedCompletion.completed

  const reasons: string[] = []

  // RED conditions
  if (expiredCerts > 0) {
    reasons.push(`${expiredCerts} expired certification${expiredCerts > 1 ? 's' : ''}`)
  }
  if (cpdHoursThisYear < proRatedTarget * 0.5) {
    const behind = (proRatedTarget - cpdHoursThisYear).toFixed(1)
    reasons.push(`${behind} CPD hrs behind target`)
  }

  if (reasons.length > 0) {
    return { status: 'red', label: 'Action Required', reasons }
  }

  // AMBER conditions
  if (expiringSoonCerts > 0) {
    reasons.push(`${expiringSoonCerts} cert${expiringSoonCerts > 1 ? 's' : ''} expiring within 90 days`)
  }
  if (cpdHoursThisYear < proRatedTarget * 0.75) {
    const behind = (proRatedTarget - cpdHoursThisYear).toFixed(1)
    reasons.push(`${behind} CPD hrs behind target`)
  }
  if (recommendedNotStarted > 0 && recommendedCompletion.total > 0) {
    reasons.push(`${recommendedNotStarted} recommended training not started`)
  }

  if (reasons.length > 0) {
    return { status: 'amber', label: 'Needs Attention', reasons }
  }

  return { status: 'green', label: 'Training Up to Date', reasons: [] }
}

function getRAGColors(status: RAGStatus, colors: ReturnType<typeof getThemeColors>, isDark: boolean) {
  switch (status) {
    case 'red': return {
      bg: isDark ? 'rgba(239,68,68,0.08)' : '#FEF2F2',
      border: isDark ? 'rgba(239,68,68,0.3)' : '#FECACA',
      text: isDark ? '#F87171' : '#DC2626',
      icon: ShieldX,
    }
    case 'amber': return {
      bg: isDark ? 'rgba(245,158,11,0.08)' : '#FFFBEB',
      border: isDark ? 'rgba(245,158,11,0.3)' : '#FDE68A',
      text: isDark ? '#FBBF24' : '#D97706',
      icon: ShieldAlert,
    }
    case 'green': return {
      bg: isDark ? 'rgba(34,197,94,0.08)' : '#F0FDF4',
      border: isDark ? 'rgba(34,197,94,0.3)' : '#BBF7D0',
      text: colors.success,
      icon: ShieldCheck,
    }
  }
}

// ── Column Definitions ────────────────────────────────────────────────────────

interface ColumnDef {
  id: string
  label: string
  sortField?: SortField
  defaultVisible: boolean
  getValue: (r: TrainingRecord) => string
}

const ALL_COLUMNS: ColumnDef[] = [
  { id: 'title', label: 'Title', sortField: 'title', defaultVisible: true, getValue: (r) => r.title },
  { id: 'provider', label: 'Provider', sortField: 'provider', defaultVisible: true, getValue: (r) => r.provider || '-' },
  { id: 'category', label: 'Category', sortField: 'category', defaultVisible: true, getValue: (r) => CATEGORY_LABELS[r.category || ''] || '-' },
  { id: 'cpd_hours', label: 'CPD Hours', sortField: 'cpd_hours', defaultVisible: true, getValue: (r) => r.cpd_hours ? r.cpd_hours.toFixed(1) : '-' },
  { id: 'status', label: 'Status', sortField: 'status', defaultVisible: true, getValue: (r) => STATUS_LABELS[r.status] || r.status },
  { id: 'completed_date', label: 'Completed', sortField: 'completed_date', defaultVisible: true, getValue: (r) => formatDate(r.completed_date) },
  { id: 'expiry_date', label: 'Expiry', sortField: 'expiry_date', defaultVisible: true, getValue: (r) => formatDate(r.expiry_date) },
]

const DEFAULT_VISIBLE = ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.id)
const DEFAULT_ORDER = ALL_COLUMNS.map(c => c.id)

// ── SortableHeader ───────────────────────────────────────────────────────────

function SortableHeader({
  label, field, currentField, currentDirection, onSort, colors, className = '',
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
      className={`px-4 py-3 text-xs font-medium uppercase tracking-wider cursor-pointer select-none font-[family-name:var(--font-inter)] ${className}`}
      style={{ color: isActive ? colors.primary : colors.text.muted }}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive && (currentDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
      </div>
    </TableHead>
  )
}

// ── FormSection ──────────────────────────────────────────────────────────────

function FormSection({
  title, icon: Icon, defaultOpen = true, colors, children,
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

// ── Wrapper (plan gate) ──────────────────────────────────────────────────────

export default function TrainingPageWrapper() {
  const { data: subscriptionData } = useSubscription()
  const currentPlan = subscriptionData?.plan || 'free'

  if (currentPlan === 'free' || currentPlan === 'trial') {
    return (
      <UpgradePrompt
        feature="Training & CPD"
        description="Track your professional development, HMRC webinars, CIPP courses, and CPD hours. Export professional PDF reports of your training record. Upgrade to Unlimited to unlock Training & CPD tracking."
        icon={GraduationCap}
      />
    )
  }

  return <TrainingPage />
}

// ── Main Page ────────────────────────────────────────────────────────────────

function TrainingPage() {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { toast } = useToast()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Data
  const { data: records = [], isLoading } = useTrainingRecords()
  const allRecords = records as TrainingRecord[]

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Sort
  const [sortField, setSortField] = useState<SortField>('completed_date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

  // Column prefs
  const [columnPrefs, setColumnPrefs] = useState<{ visible: string[]; order: string[] }>({ visible: DEFAULT_VISIBLE, order: DEFAULT_ORDER })
  const [columnsDialogOpen, setColumnsDialogOpen] = useState(false)

  // Sheet
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<TrainingRecord | null>(null)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Delete dialog
  const [recordToDelete, setRecordToDelete] = useState<TrainingRecord | null>(null)

  // Training plan expanded
  const [showTrainingPlan, setShowTrainingPlan] = useState(true)

  // Form fields
  const [formTitle, setFormTitle] = useState('')
  const [formProvider, setFormProvider] = useState('')
  const [formCategory, setFormCategory] = useState<Category | ''>('')
  const [formUrl, setFormUrl] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formStatus, setFormStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started')
  const [formCompletedDate, setFormCompletedDate] = useState('')
  const [formCpdHours, setFormCpdHours] = useState('')
  const [formExpiryDate, setFormExpiryDate] = useState('')
  const [formCertificateUrl, setFormCertificateUrl] = useState('')

  // Load column prefs
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALSTORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as { visible: string[]; order: string[] }
        const allIds = ALL_COLUMNS.map(c => c.id)
        const validVisible = parsed.visible.filter((id: string) => allIds.includes(id))
        const validOrder = parsed.order.filter((id: string) => allIds.includes(id))
        const newIds = allIds.filter(id => !validOrder.includes(id))
        setColumnPrefs({
          visible: validVisible.length > 0 ? validVisible : DEFAULT_VISIBLE,
          order: [...validOrder, ...newIds],
        })
      }
    } catch { /* ignore */ }
  }, [])

  const saveColumnPrefs = useCallback((prefs: { visible: string[]; order: string[] }) => {
    setColumnPrefs(prefs)
    try { localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(prefs)) } catch { /* ignore */ }
  }, [])

  const toggleColumn = useCallback((id: string) => {
    const next = { ...columnPrefs }
    if (next.visible.includes(id)) {
      next.visible = next.visible.filter(v => v !== id)
    } else {
      next.visible = [...next.visible, id]
    }
    saveColumnPrefs(next)
  }, [columnPrefs, saveColumnPrefs])

  const moveColumn = useCallback((id: string, dir: 'up' | 'down') => {
    const idx = columnPrefs.order.indexOf(id)
    if (idx < 0) return
    const next = [...columnPrefs.order]
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= next.length) return
    ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
    saveColumnPrefs({ ...columnPrefs, order: next })
  }, [columnPrefs, saveColumnPrefs])

  const resetColumns = useCallback(() => {
    saveColumnPrefs({ visible: DEFAULT_VISIBLE, order: DEFAULT_ORDER })
  }, [saveColumnPrefs])

  const activeColumns = useMemo(() => {
    return columnPrefs.order
      .filter(id => columnPrefs.visible.includes(id))
      .map(id => ALL_COLUMNS.find(c => c.id === id)!)
      .filter(Boolean)
  }, [columnPrefs])

  const handleSort = useCallback((field: SortField) => {
    setSortDirection(prev => sortField === field ? (prev === 'asc' ? 'desc' : 'asc') : 'asc')
    setSortField(field)
  }, [sortField])

  // ── Form handlers ──────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setFormTitle('')
    setFormProvider('')
    setFormCategory('')
    setFormUrl('')
    setFormNotes('')
    setFormStatus('not_started')
    setFormCompletedDate('')
    setFormCpdHours('')
    setFormExpiryDate('')
    setFormCertificateUrl('')
    setEditingRecord(null)
  }, [])

  const openAdd = useCallback(() => {
    resetForm()
    setSheetOpen(true)
  }, [resetForm])

  const openAddFromRecommended = useCallback((rec: typeof RECOMMENDED_TRAINING[0]) => {
    resetForm()
    setFormTitle(rec.title)
    setFormProvider(rec.provider)
    setFormCategory(rec.category)
    setFormCpdHours(rec.hours.toString())
    setSheetOpen(true)
  }, [resetForm])

  const openEdit = useCallback((record: TrainingRecord) => {
    setEditingRecord(record)
    setFormTitle(record.title)
    setFormProvider(record.provider || '')
    setFormCategory((record.category as Category) || '')
    setFormUrl(record.url || '')
    setFormNotes(record.notes || '')
    setFormStatus(record.status)
    setFormCompletedDate(record.completed_date || '')
    setFormCpdHours(record.cpd_hours ? String(record.cpd_hours) : '')
    setFormExpiryDate(record.expiry_date || '')
    setFormCertificateUrl(record.certificate_url || '')
    setSheetOpen(true)
  }, [])

  const handleSave = async () => {
    if (!formTitle.trim()) {
      toast('Title is required', 'error')
      return
    }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        title: formTitle.trim(),
        provider: formProvider.trim() || null,
        category: formCategory || null,
        url: formUrl.trim() || null,
        notes: formNotes.trim() || null,
        status: formStatus,
        completed_date: formStatus === 'completed' && formCompletedDate ? formCompletedDate : null,
        cpd_hours: formCpdHours ? parseFloat(formCpdHours) : null,
        expiry_date: formExpiryDate || null,
        certificate_url: formCertificateUrl.trim() || null,
      }

      if (editingRecord) {
        body.id = editingRecord.id
      }

      const res = await fetch('/api/training', {
        method: editingRecord ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save')
      }

      toast(editingRecord ? 'Training record updated' : 'Training record added', 'success')
      setSheetOpen(false)
      resetForm()
      mutate('/api/training')
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (record: TrainingRecord) => {
    try {
      const res = await fetch(`/api/training?id=${record.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast('Training record deleted', 'success')
      mutate('/api/training')
      setRecordToDelete(null)
    } catch {
      toast('Failed to delete training record', 'error')
    }
  }

  const handleExportPdf = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/training/export-pdf')
      if (!res.ok) throw new Error('Failed to export')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cpd-record-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast('Failed to export PDF', 'error')
    } finally {
      setExporting(false)
    }
  }

  // ── Filtered + sorted data ──────────────────────────────────────────────────

  const filteredSorted: TrainingRecord[] = useMemo(() => {
    let filtered = allRecords

    if (statusFilter === 'expiring') {
      filtered = filtered.filter(r => isExpired(r.expiry_date) || isExpiringSoon(r.expiry_date))
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter)
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(r => r.category === categoryFilter)
    }

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (r.provider || '').toLowerCase().includes(q) ||
        (r.notes || '').toLowerCase().includes(q)
      )
    }

    filtered = [...filtered].sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1
      switch (sortField) {
        case 'title': return dir * a.title.localeCompare(b.title)
        case 'provider': return dir * (a.provider || '').localeCompare(b.provider || '')
        case 'category': return dir * (a.category || '').localeCompare(b.category || '')
        case 'cpd_hours': return dir * ((a.cpd_hours || 0) - (b.cpd_hours || 0))
        case 'status': return dir * a.status.localeCompare(b.status)
        case 'completed_date': {
          if (!a.completed_date && !b.completed_date) return 0
          if (!a.completed_date) return 1
          if (!b.completed_date) return -1
          return dir * a.completed_date.localeCompare(b.completed_date)
        }
        case 'expiry_date': {
          if (!a.expiry_date && !b.expiry_date) return 0
          if (!a.expiry_date) return 1
          if (!b.expiry_date) return -1
          return dir * a.expiry_date.localeCompare(b.expiry_date)
        }
        default: return 0
      }
    })

    return filtered
  }, [allRecords, statusFilter, categoryFilter, debouncedSearch, sortField, sortDirection])

  useEffect(() => { setCurrentPage(1) }, [statusFilter, categoryFilter, debouncedSearch, sortField, sortDirection])

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE))
  const paginated = filteredSorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const showingFrom = filteredSorted.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(currentPage * PAGE_SIZE, filteredSorted.length)

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (categoryFilter !== 'all' ? 1 : 0)

  // ── KPI & RAG calculations ────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1)
    const completedThisYear = allRecords.filter(r => r.status === 'completed' && r.completed_date && new Date(r.completed_date) >= yearStart)
    const hoursThisYear = completedThisYear.reduce((sum, r) => sum + (r.cpd_hours || 0), 0)
    const monthsElapsed = now.getMonth() + 1
    const proRatedTarget = CPD_ANNUAL_TARGET * (monthsElapsed / 12)
    const inProgress = allRecords.filter(r => r.status === 'in_progress').length
    const completed = allRecords.filter(r => r.status === 'completed').length
    const expired = allRecords.filter(r => isExpired(r.expiry_date)).length
    const expiringSoon = allRecords.filter(r => isExpiringSoon(r.expiry_date)).length

    return { total: allRecords.length, inProgress, completed, completedThisYear: completedThisYear.length, hoursThisYear, proRatedTarget, expired, expiringSoon }
  }, [allRecords])

  // Recommended training cross-reference
  const recommendedStatus = useMemo(() => {
    return RECOMMENDED_TRAINING.map(rec => {
      const match = allRecords.find(r => r.title.toLowerCase() === rec.title.toLowerCase())
      return {
        ...rec,
        record: match || null,
        recordStatus: match?.status || 'not_started',
        completedDate: match?.completed_date || null,
      }
    })
  }, [allRecords])

  const recommendedCompleted = recommendedStatus.filter(r => r.recordStatus === 'completed').length
  const recommendedInProgress = recommendedStatus.filter(r => r.recordStatus === 'in_progress').length

  const ragResult = useMemo(() => {
    return getTrainingRAGStatus(allRecords, kpis.hoursThisYear, { completed: recommendedCompleted, total: RECOMMENDED_TRAINING.length })
  }, [allRecords, kpis.hoursThisYear, recommendedCompleted])

  const ragColors = getRAGColors(ragResult.status, colors, isDark)
  const RAGIcon = ragColors.icon

  // CPD progress
  const cpdPercentage = Math.min(100, (kpis.hoursThisYear / CPD_ANNUAL_TARGET) * 100)
  const cpdOnTrack = kpis.hoursThisYear >= kpis.proRatedTarget * 0.75
  const cpdBehind = kpis.proRatedTarget - kpis.hoursThisYear

  // ── Skeleton ─────────────────────────────────────────────────────────────

  if (!mounted || isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 rounded-lg animate-pulse" style={{ backgroundColor: colors.border }} />
          <div className="h-9 w-36 rounded-lg animate-pulse" style={{ backgroundColor: colors.border }} />
        </div>
        <div className="h-14 rounded-xl animate-pulse" style={{ backgroundColor: `${colors.border}60` }} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl animate-pulse" style={{ backgroundColor: `${colors.border}60` }} />
          ))}
        </div>
        <div className="h-96 rounded-xl animate-pulse" style={{ backgroundColor: `${colors.border}60` }} />
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
          Training &amp; CPD
        </h1>
        <Button
          onClick={openAdd}
          className="text-white text-sm"
          style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Training
        </Button>
      </div>

      {/* RAG Status Banner */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ backgroundColor: ragColors.bg, border: `1px solid ${ragColors.border}` }}
      >
        <RAGIcon className="w-5 h-5 flex-shrink-0" style={{ color: ragColors.text }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold font-[family-name:var(--font-inter)]" style={{ color: ragColors.text }}>
            {ragResult.label}
          </p>
          {ragResult.reasons.length > 0 && (
            <p className="text-xs font-[family-name:var(--font-body)] mt-0.5" style={{ color: ragColors.text, opacity: 0.8 }}>
              {ragResult.reasons.join(' · ')}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: ragColors.text }}>
            {kpis.hoursThisYear.toFixed(1)} / {CPD_ANNUAL_TARGET} hrs
          </p>
          <p className="text-[0.65rem]" style={{ color: ragColors.text, opacity: 0.7 }}>
            {recommendedCompleted} / {RECOMMENDED_TRAINING.length} courses
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* CPD Progress — hero card */}
        <div
          className="rounded-xl p-4 transition-all duration-150"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderLeft: `3px solid ${cpdOnTrack ? colors.success : cpdBehind > 5 ? 'var(--login-error)' : '#F59E0B'}`,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4" style={{ color: colors.primary }} />
            <p className="text-[0.7rem] font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>
              CPD Progress
            </p>
          </div>
          <p className="text-2xl font-bold font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
            {kpis.hoursThisYear.toFixed(1)}
            <span className="text-sm font-normal ml-1" style={{ color: colors.text.muted }}>/ {CPD_ANNUAL_TARGET} hrs</span>
          </p>
          {/* Progress bar */}
          <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${colors.border}` }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${cpdPercentage}%`,
                background: cpdOnTrack
                  ? `linear-gradient(90deg, ${colors.success}, #10B981)`
                  : cpdBehind > 5 ? `linear-gradient(90deg, var(--login-error), #F87171)` : `linear-gradient(90deg, #F59E0B, #FBBF24)`,
              }}
            />
          </div>
          <p className="text-[0.7rem] mt-1.5" style={{ color: cpdOnTrack ? colors.success : cpdBehind > 5 ? 'var(--login-error)' : '#D97706' }}>
            {cpdOnTrack ? 'On track' : `${cpdBehind.toFixed(1)} hrs behind`}
          </p>
        </div>

        {/* Completed */}
        <div
          className="rounded-xl p-4 transition-all duration-150"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4" style={{ color: getStatusColor('completed', isDark).text }} />
            <p className="text-[0.7rem] font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>
              Completed
            </p>
          </div>
          <p className="text-2xl font-bold font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
            {kpis.completed}
          </p>
          <p className="text-[0.7rem] mt-0.5" style={{ color: colors.text.muted }}>
            {kpis.completedThisYear} this year
          </p>
        </div>

        {/* In Progress */}
        <div
          className="rounded-xl p-4 transition-all duration-150"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderLeft: recommendedStatus.some(r => r.recordStatus === 'not_started') ? '3px solid #F59E0B' : undefined,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4" style={{ color: colors.primary }} />
            <p className="text-[0.7rem] font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>
              In Progress
            </p>
          </div>
          <p className="text-2xl font-bold font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
            {kpis.inProgress}
          </p>
          <p className="text-[0.7rem] mt-0.5" style={{ color: recommendedStatus.some(r => r.recordStatus === 'not_started') ? '#D97706' : colors.text.muted }}>
            {RECOMMENDED_TRAINING.length - recommendedCompleted - recommendedInProgress} not started
          </p>
        </div>

        {/* Certifications */}
        <div
          className="rounded-xl p-4 transition-all duration-150"
          style={{
            backgroundColor: colors.surface,
            border: `1px solid ${kpis.expired > 0 ? 'var(--login-error)' : colors.border}`,
            borderLeft: `3px solid ${kpis.expired > 0 ? 'var(--login-error)' : kpis.expiringSoon > 0 ? '#F59E0B' : colors.success}`,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4" style={{ color: kpis.expired > 0 ? 'var(--login-error)' : kpis.expiringSoon > 0 ? '#D97706' : colors.text.muted }} />
            <p className="text-[0.7rem] font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>
              Certifications
            </p>
          </div>
          {kpis.expired > 0 ? (
            <p className="text-2xl font-bold font-[family-name:var(--font-inter)]" style={{ color: 'var(--login-error)' }}>
              {kpis.expired} <span className="text-sm font-normal">expired</span>
            </p>
          ) : kpis.expiringSoon > 0 ? (
            <p className="text-2xl font-bold font-[family-name:var(--font-inter)]" style={{ color: '#D97706' }}>
              {kpis.expiringSoon} <span className="text-sm font-normal">expiring</span>
            </p>
          ) : (
            <p className="text-2xl font-bold font-[family-name:var(--font-inter)]" style={{ color: colors.success }}>
              All clear
            </p>
          )}
          <p className="text-[0.7rem] mt-0.5" style={{ color: colors.text.muted }}>
            {kpis.expired > 0 && kpis.expiringSoon > 0 ? `${kpis.expiringSoon} expiring soon` : kpis.expired > 0 ? 'Renewal needed' : kpis.expiringSoon > 0 ? 'Within 90 days' : 'No issues'}
          </p>
        </div>
      </div>

      {/* Training Plan Section */}
      <div style={{ border: `1px solid ${colors.border}`, borderRadius: '0.75rem', overflow: 'hidden' }}>
        <button
          onClick={() => setShowTrainingPlan(!showTrainingPlan)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
          style={{ backgroundColor: isDark ? `${colors.primary}06` : `${colors.primary}04` }}
        >
          <GraduationCap className="w-4 h-4" style={{ color: colors.primary }} />
          <span className="text-sm font-semibold font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
            Training Plan
          </span>
          <Badge
            className="text-[0.65rem] px-1.5 py-0"
            style={{
              backgroundColor: recommendedCompleted === RECOMMENDED_TRAINING.length ? `${colors.success}20` : `${colors.primary}15`,
              color: recommendedCompleted === RECOMMENDED_TRAINING.length ? colors.success : colors.primary,
              border: 'none',
            }}
          >
            {recommendedCompleted} / {RECOMMENDED_TRAINING.length}
          </Badge>
          <span className="text-[0.7rem] font-[family-name:var(--font-body)]" style={{ color: colors.text.muted }}>
            recommended for payroll professionals
          </span>
          <span className="ml-auto">
            {showTrainingPlan ? <ChevronDown className="w-4 h-4" style={{ color: colors.text.muted }} /> : <ChevronRight className="w-4 h-4" style={{ color: colors.text.muted }} />}
          </span>
        </button>

        {showTrainingPlan && (
          <div className="divide-y" style={{ borderTop: `1px solid ${colors.border}`, borderColor: colors.border }}>
            {recommendedStatus.map((rec) => {
              const isComplete = rec.recordStatus === 'completed'
              const isInProg = rec.recordStatus === 'in_progress'
              const catColor = getCategoryColor(rec.category, isDark)

              return (
                <div
                  key={rec.title}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors"
                  style={{ backgroundColor: isComplete ? (isDark ? 'rgba(34,197,94,0.04)' : '#FAFFF9') : colors.surface }}
                >
                  {/* Status icon */}
                  {isComplete ? (
                    <CheckCircle2 className="w-4.5 h-4.5 flex-shrink-0" style={{ color: colors.success }} />
                  ) : isInProg ? (
                    <div className="w-4 h-4 rounded-full flex-shrink-0 border-2" style={{ borderColor: '#F59E0B', backgroundColor: '#F59E0B40' }} />
                  ) : (
                    <Circle className="w-4 h-4 flex-shrink-0" style={{ color: colors.text.muted, opacity: 0.4 }} />
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium font-[family-name:var(--font-inter)] truncate"
                      style={{
                        color: isComplete ? colors.text.muted : colors.text.primary,
                        textDecoration: isComplete ? 'line-through' : 'none',
                        textDecorationColor: `${colors.text.muted}40`,
                      }}
                    >
                      {rec.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[0.7rem]" style={{ color: colors.text.muted }}>
                        {rec.provider}
                      </span>
                      <span className="text-[0.6rem]" style={{ color: colors.text.muted }}>·</span>
                      <Badge
                        className="text-[0.6rem] px-1.5 py-0"
                        style={{ backgroundColor: catColor.bg, color: catColor.text, border: `1px solid ${catColor.border}` }}
                      >
                        {CATEGORY_LABELS[rec.category]}
                      </Badge>
                      <span className="text-[0.6rem]" style={{ color: colors.text.muted }}>·</span>
                      <span className="text-[0.7rem]" style={{ color: colors.text.muted }}>
                        {rec.hours} hrs
                      </span>
                    </div>
                  </div>

                  {/* Action / Status */}
                  {isComplete ? (
                    <span className="text-[0.7rem] flex-shrink-0" style={{ color: colors.success }}>
                      {formatDate(rec.completedDate)}
                    </span>
                  ) : isInProg ? (
                    <Badge
                      className="text-[0.65rem] px-1.5 py-0 flex-shrink-0"
                      style={{ backgroundColor: '#F59E0B20', color: '#D97706', border: '1px solid #F59E0B40' }}
                    >
                      In Progress
                    </Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-7 px-2.5 flex-shrink-0"
                      style={{ borderColor: colors.primary, color: colors.primary }}
                      onClick={() => openAddFromRecommended(rec)}
                    >
                      Start
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Toolbar: Search + Filters + Columns + Export */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.text.muted }} />
            <Input
              placeholder="Search training records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-sm"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs gap-1.5 h-9"
            style={{
              borderColor: activeFilterCount > 0 ? colors.primary : colors.border,
              color: activeFilterCount > 0 ? colors.primary : colors.text.secondary,
            }}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setColumnsDialogOpen(true)}
            className="text-xs gap-1.5 h-9"
            style={{ borderColor: colors.border, color: colors.text.secondary }}
          >
            <Settings2 className="w-3.5 h-3.5" />
            Columns
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={exporting}
            className="text-xs gap-1.5 h-9"
            style={{ borderColor: colors.border, color: colors.text.secondary }}
          >
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export PDF
          </Button>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <div
            className="rounded-lg p-3 flex flex-wrap items-center gap-3"
            style={{ backgroundColor: isDark ? `${colors.primary}08` : `${colors.primary}04`, border: `1px solid ${colors.border}` }}
          >
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium" style={{ color: colors.text.secondary }}>Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="h-8 w-[140px] text-xs" style={{ borderColor: colors.border, color: colors.text.primary, backgroundColor: colors.surface }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="expiring">Expiring / Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs font-medium" style={{ color: colors.text.secondary }}>Category</Label>
              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v)}>
                <SelectTrigger className="h-8 w-[160px] text-xs" style={{ borderColor: colors.border, color: colors.text.primary, backgroundColor: colors.surface }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setStatusFilter('all'); setCategoryFilter('all') }}
                className="text-xs font-medium ml-auto"
                style={{ color: colors.primary }}
              >
                Clear All
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      {allRecords.length === 0 ? (
        <Card style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <CardContent className="p-12 text-center">
            <div
              className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: `${colors.primary}12` }}
            >
              <GraduationCap className="w-6 h-6" style={{ color: colors.primary }} />
            </div>
            <h3 className="text-sm font-semibold font-[family-name:var(--font-inter)] mb-1" style={{ color: colors.text.primary }}>
              No training records yet
            </h3>
            <p className="text-xs font-[family-name:var(--font-body)] mb-4" style={{ color: colors.text.muted }}>
              Start by logging a course from the Training Plan above, or add your own.
            </p>
            <Button
              onClick={openAdd}
              className="text-white text-sm"
              style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Training
            </Button>
          </CardContent>
        </Card>
      ) : filteredSorted.length === 0 ? (
        <Card style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <CardContent className="p-12 text-center">
            <Search className="w-8 h-8 mx-auto mb-3" style={{ color: colors.text.muted, opacity: 0.4 }} />
            <p className="text-sm font-medium" style={{ color: colors.text.secondary }}>No matching records</p>
            <p className="text-xs mt-1" style={{ color: colors.text.muted }}>Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid ${colors.border}` }}>
          <Table>
            <TableHeader>
              <TableRow style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FAFAFA' }}>
                {activeColumns.map((col) => (
                  col.sortField ? (
                    <SortableHeader
                      key={col.id}
                      label={col.label}
                      field={col.sortField}
                      currentField={sortField}
                      currentDirection={sortDirection}
                      onSort={handleSort}
                      colors={colors}
                    />
                  ) : (
                    <TableHead key={col.id} className="px-4 py-3 text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>
                      {col.label}
                    </TableHead>
                  )
                ))}
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)] w-[60px]" style={{ color: colors.text.muted }}>
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((record) => (
                <TableRow
                  key={record.id}
                  className="transition-colors duration-150 cursor-pointer group"
                  style={{ borderColor: colors.border }}
                  onClick={() => openEdit(record)}
                >
                  {activeColumns.map((col) => {
                    if (col.id === 'category') {
                      const catColor = getCategoryColor(record.category, isDark)
                      return (
                        <TableCell key={col.id} className="px-4 py-2.5">
                          {record.category ? (
                            <Badge
                              className="text-[0.7rem] font-medium px-2 py-0.5"
                              style={{ backgroundColor: catColor.bg, color: catColor.text, border: `1px solid ${catColor.border}` }}
                            >
                              {CATEGORY_LABELS[record.category] || record.category}
                            </Badge>
                          ) : (
                            <span className="text-sm" style={{ color: colors.text.muted }}>-</span>
                          )}
                        </TableCell>
                      )
                    }

                    if (col.id === 'status') {
                      const sc = getStatusColor(record.status, isDark)
                      return (
                        <TableCell key={col.id} className="px-4 py-2.5">
                          <Badge
                            className="text-[0.7rem] font-medium px-2 py-0.5"
                            style={{ backgroundColor: sc.bg, color: sc.text, border: `1px solid ${sc.border}` }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block" style={{ backgroundColor: sc.dot }} />
                            {STATUS_LABELS[record.status]}
                          </Badge>
                        </TableCell>
                      )
                    }

                    if (col.id === 'expiry_date') {
                      const expired = isExpired(record.expiry_date)
                      const expiring = isExpiringSoon(record.expiry_date)
                      return (
                        <TableCell key={col.id} className="px-4 py-2.5">
                          <span
                            className="text-sm font-[family-name:var(--font-body)]"
                            style={{
                              color: expired ? 'var(--login-error)' : expiring ? '#D97706' : colors.text.primary,
                              fontWeight: expired || expiring ? 600 : 400,
                            }}
                          >
                            {formatDate(record.expiry_date)}
                          </span>
                          {expired && (
                            <Badge className="ml-1.5 text-[0.6rem] px-1 py-0" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--login-error)', border: '1px solid rgba(239,68,68,0.2)' }}>
                              Expired
                            </Badge>
                          )}
                          {!expired && expiring && (
                            <Badge className="ml-1.5 text-[0.6rem] px-1 py-0" style={{ backgroundColor: 'rgba(217,119,6,0.1)', color: '#D97706', border: '1px solid rgba(217,119,6,0.2)' }}>
                              Soon
                            </Badge>
                          )}
                        </TableCell>
                      )
                    }

                    if (col.id === 'title') {
                      return (
                        <TableCell key={col.id} className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium font-[family-name:var(--font-inter)] truncate max-w-[300px]" style={{ color: colors.text.primary }}>
                              {record.title}
                            </span>
                            {record.url && (
                              <a
                                href={record.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0"
                                style={{ color: colors.primary }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                      )
                    }

                    return (
                      <TableCell key={col.id} className="px-4 py-2.5">
                        <span className="text-sm font-[family-name:var(--font-body)]" style={{ color: colors.text.primary }}>
                          {col.getValue(record)}
                        </span>
                      </TableCell>
                    )
                  })}
                  <TableCell className="px-4 py-2.5">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(record) }}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: colors.text.muted }}
                        title="Edit"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setRecordToDelete(record) }}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: colors.text.muted }}
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {filteredSorted.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>
            Showing {showingFrom}–{showingTo} of {filteredSorted.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              style={{ borderColor: colors.border, color: colors.text.secondary }}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs font-medium px-2 font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              style={{ borderColor: colors.border, color: colors.text.secondary }}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Columns Dialog */}
      <Dialog open={columnsDialogOpen} onOpenChange={setColumnsDialogOpen}>
        <DialogContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
              Customize Columns
            </DialogTitle>
            <DialogDescription style={{ color: colors.text.muted }}>
              Toggle visibility and reorder columns.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {columnPrefs.order.map((id) => {
              const col = ALL_COLUMNS.find(c => c.id === id)
              if (!col) return null
              const isVisible = columnPrefs.visible.includes(id)
              return (
                <div key={id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ backgroundColor: isVisible ? `${colors.primary}08` : 'transparent' }}>
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => toggleColumn(id)}
                    className="rounded"
                  />
                  <span className="flex-1 text-sm font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
                    {col.label}
                  </span>
                  <button onClick={() => moveColumn(id, 'up')} className="p-0.5" style={{ color: colors.text.muted }}>
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button onClick={() => moveColumn(id, 'down')} className="p-0.5" style={{ color: colors.text.muted }}>
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={resetColumns} style={{ borderColor: colors.border, color: colors.text.secondary }}>
              Reset
            </Button>
            <Button size="sm" onClick={() => setColumnsDialogOpen(false)} style={{ background: colors.primary }} className="text-white">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!recordToDelete} onOpenChange={(open) => !open && setRecordToDelete(null)}>
        <AlertDialogContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: colors.text.primary }}>Delete Training Record</AlertDialogTitle>
            <AlertDialogDescription style={{ color: colors.text.secondary }}>
              Are you sure you want to delete &ldquo;{recordToDelete?.title}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ borderColor: colors.border, color: colors.text.secondary }}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => recordToDelete && handleDelete(recordToDelete)}
              className="text-white"
              style={{ backgroundColor: 'var(--login-error)' }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { if (!open) { setSheetOpen(false); resetForm() } }}>
        <SheetContent
          className="w-full sm:max-w-lg overflow-y-auto p-0"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }}
        >
          <SheetHeader className="px-5 py-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
            <SheetTitle className="font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
              {editingRecord ? 'Edit Training Record' : 'Add Training Record'}
            </SheetTitle>
            <SheetDescription style={{ color: colors.text.muted }}>
              {editingRecord ? 'Update the details of this training record.' : 'Log a new training or CPD activity.'}
            </SheetDescription>
          </SheetHeader>

          {/* Details Section */}
          <FormSection title="Details" icon={FileText} defaultOpen={true} colors={colors}>
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium" style={{ color: colors.text.secondary }}>Title *</Label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. HMRC Employment Income Manual Webinar"
                  className="mt-1"
                  style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium" style={{ color: colors.text.secondary }}>Provider</Label>
                  <Input
                    value={formProvider}
                    onChange={(e) => setFormProvider(e.target.value)}
                    placeholder="e.g. HMRC, CIPP"
                    className="mt-1"
                    style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border, color: colors.text.primary }}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium" style={{ color: colors.text.secondary }}>Category</Label>
                  <Select value={formCategory || 'none'} onValueChange={(v) => setFormCategory(v === 'none' ? '' : v as Category)}>
                    <SelectTrigger className="mt-1" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border, color: colors.text.primary }}>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No category</SelectItem>
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium" style={{ color: colors.text.secondary }}>Training URL</Label>
                <Input
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1"
                  style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
              <div>
                <Label className="text-xs font-medium" style={{ color: colors.text.secondary }}>Notes</Label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Key takeaways, topics covered..."
                  rows={3}
                  className="w-full rounded-lg px-3 py-2 text-sm border resize-none mt-1"
                  style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
            </div>
          </FormSection>

          {/* Progress Section */}
          <FormSection title="Progress" icon={Clock} defaultOpen={true} colors={colors}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium" style={{ color: colors.text.secondary }}>Status</Label>
                  <Select value={formStatus} onValueChange={(v) => {
                    const newStatus = v as 'not_started' | 'in_progress' | 'completed'
                    setFormStatus(newStatus)
                    if (newStatus === 'completed' && !formCompletedDate) {
                      setFormCompletedDate(new Date().toISOString().split('T')[0])
                    }
                  }}>
                    <SelectTrigger className="mt-1" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border, color: colors.text.primary }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium" style={{ color: colors.text.secondary }}>CPD Hours</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formCpdHours}
                    onChange={(e) => setFormCpdHours(e.target.value)}
                    placeholder="e.g. 2.5"
                    className="mt-1"
                    style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border, color: colors.text.primary }}
                  />
                </div>
              </div>
              {formStatus === 'completed' && (
                <div>
                  <Label className="text-xs font-medium" style={{ color: colors.text.secondary }}>Date Completed</Label>
                  <Input
                    type="date"
                    value={formCompletedDate}
                    onChange={(e) => setFormCompletedDate(e.target.value)}
                    className="mt-1"
                    style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border, color: colors.text.primary }}
                  />
                </div>
              )}
            </div>
          </FormSection>

          {/* Certification Section */}
          <FormSection title="Certification" icon={Award} defaultOpen={false} colors={colors}>
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium" style={{ color: colors.text.secondary }}>Certificate URL</Label>
                <Input
                  value={formCertificateUrl}
                  onChange={(e) => setFormCertificateUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-1"
                  style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
              <div>
                <Label className="text-xs font-medium" style={{ color: colors.text.secondary }}>Expiry Date</Label>
                <Input
                  type="date"
                  value={formExpiryDate}
                  onChange={(e) => setFormExpiryDate(e.target.value)}
                  className="mt-1"
                  style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border, color: colors.text.primary }}
                />
                <p className="text-[0.7rem] mt-1" style={{ color: colors.text.muted }}>
                  Leave blank if no expiry. You&apos;ll be alerted 90 days before expiry.
                </p>
              </div>
            </div>
          </FormSection>

          {/* Submit buttons */}
          <div className="px-5 py-4 flex gap-2" style={{ borderTop: `1px solid ${colors.border}` }}>
            <Button
              onClick={handleSave}
              disabled={!formTitle.trim() || saving}
              className="flex-1 text-white"
              style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
            >
              {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : null}
              {saving ? 'Saving...' : editingRecord ? 'Update' : 'Add Training'}
            </Button>
            <Button
              variant="outline"
              onClick={() => { setSheetOpen(false); resetForm() }}
              style={{ borderColor: colors.border, color: colors.text.secondary }}
            >
              Cancel
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
