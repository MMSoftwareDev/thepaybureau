'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { usePayrolls, useClients } from '@/lib/swr'
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
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { format, parseISO, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'
import { getPayrollStatus, type PayrollStatus } from '@/lib/hmrc-deadlines'
import { createClientSupabaseClient } from '@/lib/supabase'
import { emitBadgeEarned } from '@/components/gamification/BadgeToast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ClipboardCheck,
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CalendarDays,
  FileText,
  Landmark,
  Shield,
  ListChecks,
  Eye,
  X,
  CheckCircle2,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Download,
  Settings2,
  Filter,
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { mutate } from 'swr'

// ── Types ──────────────────────────────────────────────────────────────────────

interface PayrollClient {
  name: string
}

interface LatestRun {
  id: string
  pay_date: string
  status: string
}

interface Payroll {
  id: string
  tenant_id: string
  client_id: string
  name: string
  paye_reference: string | null
  accounts_office_ref: string | null
  pay_frequency: string | null
  pay_day: string | null
  period_start: string | null
  period_end: string | null
  payroll_software: string | null
  employment_allowance: boolean | null
  pension_provider: string | null
  pension_staging_date: string | null
  pension_reenrolment_date: string | null
  declaration_of_compliance_deadline: string | null
  status: string
  created_at: string | null
  clients: PayrollClient
  latestRun: LatestRun | null
}

interface ClientOption {
  id: string
  name: string
}

interface RunChecklistItem {
  id: string
  payroll_run_id: string
  template_id: string | null
  name: string
  is_completed: boolean
  completed_at: string | null
  completed_by: string | null
  sort_order: number
}

interface PayrollRun {
  id: string
  client_id: string
  payroll_id: string | null
  tenant_id: string
  period_start: string
  period_end: string
  pay_date: string
  status: string
  rti_due_date: string | null
  eps_due_date: string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
  clients: { name: string; pay_frequency: string | null }
  checklist_items: RunChecklistItem[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const formatFrequency = (freq: string | null | undefined): string => {
  if (!freq) return '-'
  const map: Record<string, string> = {
    weekly: 'Weekly',
    two_weekly: 'Fortnightly',
    four_weekly: '4-Weekly',
    monthly: 'Monthly',
    annually: 'Annually',
  }
  return map[freq] || freq
}

function getFrequencyColor(freq: string | null | undefined, isDark: boolean): { bg: string; text: string; border: string } {
  switch (freq) {
    case 'weekly':
      return {
        bg: isDark ? 'rgba(34, 197, 94, 0.15)' : '#F0FDF4',
        text: isDark ? '#4ADE80' : '#16A34A',
        border: isDark ? 'rgba(34, 197, 94, 0.3)' : '#BBF7D0',
      }
    case 'two_weekly':
      return {
        bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
        text: isDark ? '#60A5FA' : '#2563EB',
        border: isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE',
      }
    case 'four_weekly':
      return {
        bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
        text: isDark ? '#FBBF24' : '#D97706',
        border: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
      }
    case 'monthly':
      return {
        bg: isDark ? 'rgba(124, 92, 191, 0.15)' : '#F5F3FF',
        text: isDark ? '#A78BFA' : '#7C3AED',
        border: isDark ? 'rgba(124, 92, 191, 0.3)' : '#DDD6FE',
      }
    case 'annually':
      return {
        bg: isDark ? 'rgba(236, 56, 93, 0.15)' : '#FFF1F2',
        text: isDark ? '#F06082' : '#E11D48',
        border: isDark ? 'rgba(236, 56, 93, 0.3)' : '#FECDD3',
      }
    default:
      return {
        bg: isDark ? 'rgba(156, 163, 175, 0.15)' : '#F9FAFB',
        text: isDark ? '#9CA3AF' : '#6B7280',
        border: isDark ? 'rgba(156, 163, 175, 0.3)' : '#E5E7EB',
      }
  }
}

// ── Column definitions ───────────────────────────────────────────────────────

type SortField = 'name' | 'client' | 'frequency' | 'pay_day' | 'paye_ref' | 'next_pay_date' | 'status' | 'pension_provider' | 'payroll_software'
type SortDirection = 'asc' | 'desc'
type FrequencyFilter = 'all' | 'weekly' | 'two_weekly' | 'four_weekly' | 'monthly' | 'annually'

interface ColumnDef {
  id: string
  label: string
  sortField?: SortField
  defaultVisible: boolean
  getValue: (p: Payroll) => string
}

const ALL_COLUMNS: ColumnDef[] = [
  { id: 'client', label: 'Client', sortField: 'client', defaultVisible: true, getValue: (p) => p.clients?.name || '-' },
  { id: 'frequency', label: 'Frequency', sortField: 'frequency', defaultVisible: true, getValue: (p) => formatFrequency(p.pay_frequency) },
  { id: 'pay_day', label: 'Pay Day', sortField: 'pay_day', defaultVisible: true, getValue: (p) => formatPayDay(p.pay_day) },
  { id: 'paye_ref', label: 'PAYE Ref', sortField: 'paye_ref', defaultVisible: true, getValue: (p) => p.paye_reference || '-' },
  { id: 'next_pay_date', label: 'Next Pay Date', sortField: 'next_pay_date', defaultVisible: true, getValue: (p) => p.latestRun ? formatDateFull(p.latestRun.pay_date) : '-' },
  { id: 'status', label: 'Status', sortField: 'status', defaultVisible: true, getValue: (p) => p.status },
  { id: 'pension_provider', label: 'Pension', sortField: 'pension_provider', defaultVisible: false, getValue: (p) => p.pension_provider || '-' },
  { id: 'payroll_software', label: 'Software', sortField: 'payroll_software', defaultVisible: false, getValue: (p) => p.payroll_software || '-' },
]

const DEFAULT_VISIBLE = ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.id)
const DEFAULT_ORDER = ALL_COLUMNS.map(c => c.id)
const LOCALSTORAGE_KEY = 'tpb_payroll_columns'
const PAGE_SIZE = 25

// ── SortableHeader ───────────────────────────────────────────────────────────

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
      className={`px-4 py-3 text-xs font-medium uppercase tracking-wider cursor-pointer select-none font-[family-name:var(--font-inter)] ${className}`}
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

function formatDateFull(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    return format(parseISO(dateStr), 'd MMM yyyy')
  } catch {
    return '-'
  }
}

function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    return format(parseISO(dateStr), 'd MMM')
  } catch {
    return '-'
  }
}

const formatPayDay = (payDay: string | null | undefined): string => {
  if (!payDay) return '-'
  if (payDay === 'last_day_of_month') return 'Last day'
  if (payDay === 'last_working_day') return 'Last working day'
  if (payDay.startsWith('last_')) return `Last ${payDay.replace('last_', '').replace(/_/g, ' ')}`
  if (payDay.includes('from_last')) return payDay.replace(/_/g, ' ')
  const num = parseInt(payDay)
  if (!isNaN(num)) {
    const suffix = num === 1 ? 'st' : num === 2 ? 'nd' : num === 3 ? 'rd' : 'th'
    return `${num}${suffix}`
  }
  return payDay.charAt(0).toUpperCase() + payDay.slice(1)
}

function computeRunStatus(run: PayrollRun): PayrollStatus {
  const items = run.checklist_items ?? []
  const completedCount = items.filter((i) => i.is_completed).length
  return getPayrollStatus(parseISO(run.pay_date), items.length, completedCount)
}

interface StatusConfig {
  label: string
  bg: string
  text: string
  border: string
  dot: string
}

function getStatusConfig(status: PayrollStatus, isDark: boolean): StatusConfig {
  switch (status) {
    case 'complete':
      return {
        label: 'Complete',
        bg: isDark ? 'rgba(34, 197, 94, 0.15)' : '#F0FDF4',
        text: isDark ? '#4ADE80' : '#16A34A',
        border: isDark ? 'rgba(34, 197, 94, 0.3)' : '#BBF7D0',
        dot: '#22C55E',
      }
    case 'in_progress':
      return {
        label: 'In Progress',
        bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
        text: isDark ? '#FBBF24' : '#D97706',
        border: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
        dot: '#F59E0B',
      }
    case 'due_soon':
      return {
        label: 'Due Soon',
        bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
        text: isDark ? '#FBBF24' : '#D97706',
        border: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
        dot: '#F59E0B',
      }
    case 'overdue':
      return {
        label: 'Overdue',
        bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
        text: isDark ? '#F87171' : '#DC2626',
        border: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
        dot: '#EF4444',
      }
    case 'not_started':
    default:
      return {
        label: 'Not Started',
        bg: isDark ? 'rgba(156, 163, 175, 0.15)' : '#F9FAFB',
        text: isDark ? '#9CA3AF' : '#6B7280',
        border: isDark ? 'rgba(156, 163, 175, 0.3)' : '#E5E7EB',
        dot: '#9CA3AF',
      }
  }
}

const PENSION_PROVIDERS = [
  'NEST', 'NOW Pensions', 'Smart Pension', 'The People\'s Pension',
  'Aviva', 'Royal London', 'Scottish Widows', 'Legal & General',
  'Aegon', 'Standard Life', 'Hargreaves Lansdown', 'AJ Bell',
  'Fidelity', 'Other', 'Exempt',
]

const DEFAULT_CHECKLIST = [
  { name: 'Receive payroll changes', sort_order: 0 },
  { name: 'Process payroll', sort_order: 1 },
  { name: 'Review & approve', sort_order: 2 },
  { name: 'Send payslips', sort_order: 3 },
  { name: 'Submit RTI to HMRC', sort_order: 4 },
  { name: 'BACS payment', sort_order: 5 },
  { name: 'Pension submission', sort_order: 6 },
]

const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

// ── Progress Dots ────────────────────────────────────────────────────────────

function ProgressDots({ items, isDark }: { items: RunChecklistItem[]; isDark: boolean }) {
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order)
  if (sorted.length === 0) {
    return <span style={{ color: isDark ? '#6B7280' : '#9CA3AF', fontSize: '0.72rem' }}>No steps</span>
  }
  const maxDots = 8
  const displayItems = sorted.length > maxDots
    ? [...sorted.slice(0, maxDots - 1), sorted[sorted.length - 1]]
    : sorted
  const hasOverflow = sorted.length > maxDots

  return (
    <div className="flex items-center gap-1">
      {displayItems.map((item, idx) => {
        if (hasOverflow && idx === maxDots - 1) {
          return (
            <div key="overflow" className="flex items-center gap-1">
              <span style={{ color: isDark ? '#6B7280' : '#9CA3AF', fontSize: '0.6rem', lineHeight: 1 }}>...</span>
              <div
                className="w-3 h-3 rounded-full flex-shrink-0 transition-all"
                style={{ backgroundColor: item.is_completed ? '#22C55E' : isDark ? '#4B5563' : '#D1D5DB' }}
              />
            </div>
          )
        }
        return (
          <div
            key={item.id}
            className="w-3 h-3 rounded-full flex-shrink-0 transition-all"
            title={`${item.name}${item.is_completed ? ' ✓' : ''}`}
            style={{ backgroundColor: item.is_completed ? '#22C55E' : isDark ? '#4B5563' : '#D1D5DB' }}
          />
        )
      })}
    </div>
  )
}

// ── Celebration Overlay ──────────────────────────────────────────────────────

function CelebrationOverlay({ clientName, onDone }: { clientName: string; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 4000)
    return () => clearTimeout(timer)
  }, [onDone])

  const particles = useMemo(() => {
    const pColors = ['#22C55E', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316']
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      color: pColors[i % pColors.length],
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      duration: 1.5 + Math.random() * 2,
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
      shape: i % 3,
    }))
  }, [])

  return (
    <div
      className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
      onClick={onDone}
      style={{ pointerEvents: 'auto' }}
    >
      <div className="absolute inset-0 bg-black/20 animate-fadeIn" />
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute top-0"
          style={{
            left: `${p.left}%`,
            width: p.shape === 2 ? p.size * 1.5 : p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === 0 ? '50%' : '2px',
            transform: `rotate(${p.rotation}deg)`,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
          }}
        />
      ))}
      <div className="relative z-10 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl text-center animate-fadeIn">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-lg font-bold mb-1">Payroll Complete!</h3>
        <p className="text-sm text-gray-500">{clientName} — all steps done</p>
      </div>
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

// ── Collapsible Section ────────────────────────────────────────────────────────

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

export default function PayrollsPage() {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { toast } = useToast()

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Data
  const { data: payrolls, isLoading } = usePayrolls()
  const { data: clientsData } = useClients()
  const clientOptions: ClientOption[] = useMemo(() => {
    if (!clientsData) return []
    return (clientsData as ClientOption[]).map((c) => ({ id: c.id, name: c.name }))
  }, [clientsData])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [frequencyFilter, setFrequencyFilter] = useState<FrequencyFilter>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Sort
  const [sortField, setSortField] = useState<SortField>('next_pay_date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

  // Column prefs
  const [columnPrefs, setColumnPrefs] = useState<{ visible: string[]; order: string[] }>({ visible: DEFAULT_VISIBLE, order: DEFAULT_ORDER })
  const [columnsDialogOpen, setColumnsDialogOpen] = useState(false)

  // Config Sheet state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null)
  const [viewingPayroll, setViewingPayroll] = useState<Payroll | null>(null)
  const [viewMode, setViewMode] = useState<'view' | 'edit'>('edit')
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Delete dialog
  const [payrollToDelete, setPayrollToDelete] = useState<Payroll | null>(null)

  // Form fields
  const [formName, setFormName] = useState('')
  const [formClientId, setFormClientId] = useState('')
  const [formPayFrequency, setFormPayFrequency] = useState('')
  const [formPayDay, setFormPayDay] = useState('')
  const [formPayeReference, setFormPayeReference] = useState('')
  const [formAccountsOfficeRef, setFormAccountsOfficeRef] = useState('')
  const [formPayrollSoftware, setFormPayrollSoftware] = useState('')
  const [formEmploymentAllowance, setFormEmploymentAllowance] = useState(false)
  const [formPensionProvider, setFormPensionProvider] = useState('')
  const [formPensionStagingDate, setFormPensionStagingDate] = useState('')
  const [formPensionReenrolmentDate, setFormPensionReenrolmentDate] = useState('')
  const [formDocDeadline, setFormDocDeadline] = useState('')
  const [formChecklist, setFormChecklist] = useState(DEFAULT_CHECKLIST)
  const [newStepName, setNewStepName] = useState('')

  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Load column prefs from localStorage
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

  // ── Runs Sheet state ────────────────────────────────────────────────────────
  const [runsSheetOpen, setRunsSheetOpen] = useState(false)
  const [runsPayroll, setRunsPayroll] = useState<Payroll | null>(null)
  const [runs, setRuns] = useState<PayrollRun[]>([])
  const [runsLoading, setRunsLoading] = useState(false)
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null)
  const [togglingItem, setTogglingItem] = useState<string | null>(null)
  const [savingNotes, setSavingNotes] = useState<string | null>(null)
  const [addingStep, setAddingStep] = useState(false)
  const [runNewStepName, setRunNewStepName] = useState('')
  const [celebration, setCelebration] = useState<string | null>(null)
  const [currentPeriod, setCurrentPeriod] = useState(startOfMonth(new Date()))
  const supabaseRef = useRef(createClientSupabaseClient())

  // ── Config Sheet handlers ───────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setFormName('')
    setFormClientId('')
    setFormPayFrequency('')
    setFormPayDay('')
    setFormPayeReference('')
    setFormAccountsOfficeRef('')
    setFormPayrollSoftware('')
    setFormEmploymentAllowance(false)
    setFormPensionProvider('')
    setFormPensionStagingDate('')
    setFormPensionReenrolmentDate('')
    setFormDocDeadline('')
    setFormChecklist(DEFAULT_CHECKLIST)
    setNewStepName('')
    setEditingPayroll(null)
  }, [])

  const openAdd = useCallback(() => {
    resetForm()
    setViewMode('edit')
    setViewingPayroll(null)
    setSheetOpen(true)
  }, [resetForm])

  const openView = useCallback((payroll: Payroll) => {
    setViewingPayroll(payroll)
    setEditingPayroll(null)
    setViewMode('view')
    setSheetOpen(true)
  }, [])

  const openEdit = useCallback((payroll: Payroll) => {
    setEditingPayroll(payroll)
    setViewingPayroll(null)
    setViewMode('edit')
    setFormName(payroll.name || '')
    setFormClientId(payroll.client_id || '')
    setFormPayFrequency(payroll.pay_frequency || '')
    setFormPayDay(payroll.pay_day || '')
    setFormPayeReference(payroll.paye_reference || '')
    setFormAccountsOfficeRef(payroll.accounts_office_ref || '')
    setFormPayrollSoftware(payroll.payroll_software || '')
    setFormEmploymentAllowance(payroll.employment_allowance || false)
    setFormPensionProvider(payroll.pension_provider || '')
    setFormPensionStagingDate(payroll.pension_staging_date || '')
    setFormPensionReenrolmentDate(payroll.pension_reenrolment_date || '')
    setFormDocDeadline(payroll.declaration_of_compliance_deadline || '')
    setSheetOpen(true)
  }, [])

  const payDayOptions = useMemo(() => {
    if (formPayFrequency === 'monthly') {
      const days = Array.from({ length: 31 }, (_, i) => ({
        value: String(i + 1),
        label: String(i + 1),
      }))
      return [
        ...days,
        { value: 'last_day_of_month', label: 'Last day of month' },
        { value: 'last_working_day', label: 'Last working day' },
      ]
    }
    if (formPayFrequency === 'annually') {
      return []
    }
    return WEEKDAYS.map((d) => ({
      value: d,
      label: d.charAt(0).toUpperCase() + d.slice(1),
    }))
  }, [formPayFrequency])

  const handleSave = async () => {
    if (!formName.trim()) {
      toast('Payroll name is required', 'error')
      return
    }
    if (!editingPayroll && !formClientId) {
      toast('Please select a client', 'error')
      return
    }
    if (!formPayFrequency) {
      toast('Pay frequency is required', 'error')
      return
    }
    if (!formPayDay) {
      toast('Pay day is required', 'error')
      return
    }

    setSaving(true)
    try {
      if (editingPayroll) {
        const payload = {
          name: formName.trim(),
          pay_frequency: formPayFrequency,
          pay_day: formPayDay,
          paye_reference: formPayeReference.trim() || undefined,
          accounts_office_ref: formAccountsOfficeRef.trim() || undefined,
          payroll_software: formPayrollSoftware.trim() || undefined,
          employment_allowance: formEmploymentAllowance,
          pension_provider: formPensionProvider || undefined,
          pension_staging_date: formPensionStagingDate || undefined,
          pension_reenrolment_date: formPensionReenrolmentDate || undefined,
          declaration_of_compliance_deadline: formDocDeadline || undefined,
        }
        const res = await fetch(`/api/payrolls/${editingPayroll.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to update payroll')
        }
      } else {
        const payload = {
          name: formName.trim(),
          client_id: formClientId,
          pay_frequency: formPayFrequency,
          pay_day: formPayDay,
          paye_reference: formPayeReference.trim() || undefined,
          accounts_office_ref: formAccountsOfficeRef.trim() || undefined,
          payroll_software: formPayrollSoftware.trim() || undefined,
          employment_allowance: formEmploymentAllowance,
          pension_provider: formPensionProvider || undefined,
          pension_staging_date: formPensionStagingDate || undefined,
          pension_reenrolment_date: formPensionReenrolmentDate || undefined,
          declaration_of_compliance_deadline: formDocDeadline || undefined,
          checklist_items: formChecklist,
        }
        const res = await fetch('/api/payrolls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to create payroll')
        }
      }

      toast(editingPayroll ? 'Payroll updated' : 'Payroll created')
      mutate('/api/payrolls')
      setSheetOpen(false)
      resetForm()
    } catch (err) {
      toast((err as Error).message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (payroll: Payroll) => {
    setDeletingId(payroll.id)
    try {
      const res = await fetch(`/api/payrolls/${payroll.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast('Payroll deleted')
      mutate('/api/payrolls')
      setPayrollToDelete(null)
    } catch {
      toast('Failed to delete payroll', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (frequencyFilter !== 'all') params.set('frequency', frequencyFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/payrolls/export?${params}`)
      if (!res.ok) throw new Error('Failed to export')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payrolls-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast('Failed to export payrolls', 'error')
    } finally {
      setExporting(false)
    }
  }

  const addChecklistStep = () => {
    if (!newStepName.trim()) return
    setFormChecklist([...formChecklist, { name: newStepName.trim(), sort_order: formChecklist.length }])
    setNewStepName('')
  }

  const removeChecklistStep = (index: number) => {
    setFormChecklist(formChecklist.filter((_, i) => i !== index).map((item, i) => ({ ...item, sort_order: i })))
  }

  // ── Runs Sheet handlers ─────────────────────────────────────────────────────

  const fetchRuns = useCallback(async (payrollId: string, period: Date) => {
    setRunsLoading(true)
    try {
      const periodStart = format(period, 'yyyy-MM-dd')
      const periodEnd = format(endOfMonth(period), 'yyyy-MM-dd')
      const supabase = supabaseRef.current

      const { data, error } = await supabase
        .from('payroll_runs')
        .select('*, clients(name, pay_frequency), checklist_items(*)')
        .eq('payroll_id', payrollId)
        .gte('pay_date', periodStart)
        .lte('pay_date', periodEnd)
        .order('pay_date', { ascending: true })

      if (error) throw error
      setRuns((data as unknown as PayrollRun[]) ?? [])
    } catch (err) {
      console.error('Error fetching payroll runs:', err)
      setRuns([])
    } finally {
      setRunsLoading(false)
    }
  }, [])

  const openRunsSheet = useCallback((payroll: Payroll) => {
    setRunsPayroll(payroll)
    setSelectedRun(null)
    setRunNewStepName('')
    setCurrentPeriod(startOfMonth(new Date()))
    setRunsSheetOpen(true)
    fetchRuns(payroll.id, startOfMonth(new Date()))
  }, [fetchRuns])

  // Refetch when period changes
  useEffect(() => {
    if (runsSheetOpen && runsPayroll) {
      fetchRuns(runsPayroll.id, currentPeriod)
    }
  }, [currentPeriod, runsSheetOpen, runsPayroll, fetchRuns])

  // Keep selectedRun in sync with runs data
  useEffect(() => {
    if (selectedRun) {
      const updated = runs.find((r) => r.id === selectedRun.id)
      if (updated) setSelectedRun(updated)
    }
  }, [runs, selectedRun])

  const toggleChecklistItem = async (item: RunChecklistItem) => {
    setTogglingItem(item.id)
    try {
      const res = await fetch('/api/payroll-runs/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_item', item_id: item.id, is_completed: !item.is_completed }),
      })
      if (!res.ok) throw new Error('Failed to toggle item')

      const resData = await res.json().catch(() => ({}))
      if (resData.newBadges?.length > 0) {
        emitBadgeEarned(resData.newBadges)
      }

      // Optimistic update
      const updatedChecklist = (runItems: RunChecklistItem[]) =>
        runItems.map((ci) =>
          ci.id === item.id
            ? { ...ci, is_completed: !item.is_completed, completed_at: !item.is_completed ? new Date().toISOString() : null }
            : ci
        )

      setRuns((prev) =>
        prev.map((r) =>
          r.id === item.payroll_run_id
            ? { ...r, checklist_items: updatedChecklist(r.checklist_items) }
            : r
        )
      )
      setSelectedRun((prev) =>
        prev && prev.id === item.payroll_run_id
          ? { ...prev, checklist_items: updatedChecklist(prev.checklist_items) }
          : prev
      )

      // Check if this was the last item — auto-generate next period
      if (!item.is_completed) {
        const parentRun = runs.find((r) => r.id === item.payroll_run_id)
        if (parentRun) {
          const allItems = parentRun.checklist_items
          const otherIncomplete = allItems.filter((ci) => ci.id !== item.id && !ci.is_completed)
          if (otherIncomplete.length === 0) {
            setCelebration(parentRun.clients?.name ?? 'Payroll')
            setSelectedRun(null)
            try {
              const genRes = await fetch('/api/payroll-runs/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payroll_id: parentRun.payroll_id }),
              })
              if (genRes.ok) {
                const newRun = await genRes.json()
                if (newRun.pay_date) {
                  const newPayDate = parseISO(newRun.pay_date)
                  const newMonth = startOfMonth(newPayDate)
                  if (newMonth.getTime() !== currentPeriod.getTime()) {
                    setCurrentPeriod(newMonth)
                    return
                  }
                }
              }
            } catch (err) {
              console.error('Auto-generate network error:', err)
            }
            if (runsPayroll) fetchRuns(runsPayroll.id, currentPeriod)
          }
        }
      }
    } catch (err) {
      console.error('Error toggling checklist item:', err)
      if (runsPayroll) fetchRuns(runsPayroll.id, currentPeriod)
    } finally {
      setTogglingItem(null)
    }
  }

  const markAllComplete = async (run: PayrollRun) => {
    const incompleteIds = run.checklist_items.filter((i) => !i.is_completed).map((i) => i.id)
    if (incompleteIds.length === 0) return
    try {
      const res = await fetch('/api/payroll-runs/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_complete', payroll_run_id: run.id }),
      })
      if (!res.ok) throw new Error('Failed to mark all complete')

      const resData = await res.json().catch(() => ({}))
      if (resData.newBadges?.length > 0) {
        emitBadgeEarned(resData.newBadges)
      }

      setCelebration(run.clients?.name ?? 'Payroll')
      setSelectedRun(null)

      // Auto-generate next period
      try {
        const genRes = await fetch('/api/payroll-runs/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payroll_id: run.payroll_id }),
        })
        if (genRes.ok) {
          const newRun = await genRes.json()
          if (newRun.pay_date) {
            const newPayDate = parseISO(newRun.pay_date)
            const newMonth = startOfMonth(newPayDate)
            if (newMonth.getTime() !== currentPeriod.getTime()) {
              setCurrentPeriod(newMonth)
              return
            }
          }
        }
      } catch (err) {
        console.error('Auto-generate network error:', err)
      }

      if (runsPayroll) fetchRuns(runsPayroll.id, currentPeriod)
    } catch (err) {
      console.error('Error marking all complete:', err)
    }
  }

  const saveRunNotes = async (runId: string, newNotes: string) => {
    setSavingNotes(runId)
    try {
      const res = await fetch('/api/payroll-runs/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_notes', payroll_run_id: runId, notes: newNotes }),
      })
      if (!res.ok) throw new Error('Failed to save notes')
    } catch (err) {
      console.error('Error saving notes:', err)
    } finally {
      setSavingNotes(null)
    }
  }

  const addRunStep = async (runId: string) => {
    if (!runNewStepName.trim()) return
    setAddingStep(true)
    try {
      const run = runs.find((r) => r.id === runId)
      const maxOrder = run ? Math.max(0, ...run.checklist_items.map((i) => i.sort_order)) : 0
      const res = await fetch('/api/payroll-runs/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_step', payroll_run_id: runId, name: runNewStepName.trim(), sort_order: maxOrder + 1 }),
      })
      if (!res.ok) throw new Error('Failed to add step')
      setRunNewStepName('')
      if (runsPayroll) fetchRuns(runsPayroll.id, currentPeriod)
    } catch (err) {
      console.error('Error adding step:', err)
    } finally {
      setAddingStep(false)
    }
  }

  // ── Filtered + sorted data ──────────────────────────────────────────────────

  const filteredSorted: Payroll[] = useMemo(() => {
    if (!payrolls) return []
    let filtered = payrolls as Payroll[]

    if (frequencyFilter !== 'all') filtered = filtered.filter((p) => p.pay_frequency === frequencyFilter)
    if (statusFilter !== 'all') filtered = filtered.filter((p) => p.status === statusFilter)
    if (clientFilter !== 'all') filtered = filtered.filter((p) => p.client_id === clientFilter)

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase()
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.clients?.name?.toLowerCase().includes(q) ||
        p.paye_reference?.toLowerCase().includes(q)
      )
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1
      switch (sortField) {
        case 'name': return dir * a.name.localeCompare(b.name)
        case 'client': return dir * (a.clients?.name || '').localeCompare(b.clients?.name || '')
        case 'frequency': return dir * (a.pay_frequency || '').localeCompare(b.pay_frequency || '')
        case 'pay_day': return dir * (a.pay_day || '').localeCompare(b.pay_day || '')
        case 'paye_ref': return dir * (a.paye_reference || '').localeCompare(b.paye_reference || '')
        case 'status': return dir * a.status.localeCompare(b.status)
        case 'pension_provider': return dir * (a.pension_provider || '').localeCompare(b.pension_provider || '')
        case 'payroll_software': return dir * (a.payroll_software || '').localeCompare(b.payroll_software || '')
        case 'next_pay_date': {
          const aDate = a.latestRun?.pay_date || ''
          const bDate = b.latestRun?.pay_date || ''
          if (!aDate && !bDate) return 0
          if (!aDate) return 1
          if (!bDate) return -1
          return dir * aDate.localeCompare(bDate)
        }
        default: return 0
      }
    })

    return filtered
  }, [payrolls, frequencyFilter, statusFilter, clientFilter, debouncedSearch, sortField, sortDirection])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [frequencyFilter, statusFilter, clientFilter, debouncedSearch, sortField, sortDirection])

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE))
  const paginatedPayrolls = filteredSorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const showingFrom = filteredSorted.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(currentPage * PAGE_SIZE, filteredSorted.length)

  const activeFilterCount = (frequencyFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (clientFilter !== 'all' ? 1 : 0)

  const counts = useMemo(() => {
    const all = (payrolls || []) as Payroll[]
    return {
      total: all.length,
      weekly: all.filter((p) => p.pay_frequency === 'weekly').length,
      fortnightly: all.filter((p) => p.pay_frequency === 'two_weekly').length,
      fourWeekly: all.filter((p) => p.pay_frequency === 'four_weekly').length,
      monthly: all.filter((p) => p.pay_frequency === 'monthly').length,
      annually: all.filter((p) => p.pay_frequency === 'annually').length,
    }
  }, [payrolls])

  // Sort runs by urgency
  const sortedRuns = useMemo(() => {
    const statusWeight: Record<PayrollStatus, number> = {
      overdue: 0,
      due_soon: 1,
      in_progress: 2,
      not_started: 3,
      complete: 4,
    }
    return [...runs].sort((a, b) => {
      const sa = computeRunStatus(a)
      const sb = computeRunStatus(b)
      if (statusWeight[sa] !== statusWeight[sb]) return statusWeight[sa] - statusWeight[sb]
      return new Date(a.pay_date).getTime() - new Date(b.pay_date).getTime()
    })
  }, [runs])

  // ── Skeleton ───────────────────────────────────────────────────────────────

  if (!mounted || isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 rounded-lg animate-pulse" style={{ backgroundColor: colors.border }} />
          <div className="h-9 w-36 rounded-lg animate-pulse" style={{ backgroundColor: colors.border }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: `${colors.border}60` }} />
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
          Payrolls
        </h1>
        <Button
          onClick={openAdd}
          className="text-white text-sm"
          style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Payroll
        </Button>
      </div>

      {/* KPI Cards — clickable frequency filters */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {[
          { label: 'Total', count: counts.total, freq: 'all' as FrequencyFilter, color: colors.primary },
          { label: 'Weekly', count: counts.weekly, freq: 'weekly' as FrequencyFilter, color: getFrequencyColor('weekly', isDark).text },
          { label: 'Fortnightly', count: counts.fortnightly, freq: 'two_weekly' as FrequencyFilter, color: getFrequencyColor('two_weekly', isDark).text },
          { label: '4-Weekly', count: counts.fourWeekly, freq: 'four_weekly' as FrequencyFilter, color: getFrequencyColor('four_weekly', isDark).text },
          { label: 'Monthly', count: counts.monthly, freq: 'monthly' as FrequencyFilter, color: getFrequencyColor('monthly', isDark).text },
          { label: 'Annually', count: counts.annually, freq: 'annually' as FrequencyFilter, color: getFrequencyColor('annually', isDark).text },
        ].map((kpi) => {
          const isActive = frequencyFilter === kpi.freq
          return (
            <button
              key={kpi.label}
              onClick={() => setFrequencyFilter(kpi.freq === frequencyFilter ? 'all' : kpi.freq)}
              className="rounded-xl p-3 text-left transition-all duration-150"
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
                {kpi.count}
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
              placeholder="Search payrolls or clients..."
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
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#FAFAFA', border: `1px solid ${colors.border}` }}>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>Status:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-7 text-xs w-[100px]" style={{ borderColor: colors.border, color: colors.text.primary }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>Client:</span>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="h-7 text-xs w-[140px]" style={{ borderColor: colors.border, color: colors.text.primary }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clientOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setStatusFilter('all'); setClientFilter('all'); setFrequencyFilter('all') }}
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
              <ClipboardCheck className="w-6 h-6" style={{ color: colors.primary }} />
            </div>
            <h3 className="text-sm font-semibold mb-1 font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
              No payrolls found
            </h3>
            <p className="text-xs mb-4 font-[family-name:var(--font-body)]" style={{ color: colors.text.muted }}>
              {debouncedSearch || activeFilterCount > 0 ? 'Try adjusting your search or filters.' : 'Add a payroll to start managing pay runs.'}
            </p>
            {!debouncedSearch && activeFilterCount === 0 && (
              <Button
                onClick={openAdd}
                size="sm"
                className="text-white text-xs"
                style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Payroll
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: colors.border }}>
                <SortableHeader label="Payroll Name" field="name" currentField={sortField} currentDirection={sortDirection} onSort={handleSort} colors={colors} />
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
                    <TableHead
                      key={col.id}
                      className="px-4 py-3 text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)]"
                      style={{ color: colors.text.muted }}
                    >
                      {col.label}
                    </TableHead>
                  )
                ))}
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPayrolls.map((payroll) => (
                <TableRow
                  key={payroll.id}
                  className="cursor-pointer transition-colors group"
                  style={{ borderColor: colors.border }}
                  onClick={() => openView(payroll)}
                >
                  <TableCell className="px-4 py-2.5 font-medium text-sm font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${colors.primary}12` }}>
                        <ClipboardCheck className="w-4 h-4" style={{ color: colors.primary }} />
                      </div>
                      <span className="truncate">{payroll.name}</span>
                    </div>
                  </TableCell>
                  {activeColumns.map((col) => (
                    <TableCell key={col.id} className="px-4 py-2.5 text-sm font-[family-name:var(--font-body)]" style={{ color: colors.text.secondary }}>
                      {col.id === 'frequency' ? (
                        (() => {
                          const fc = getFrequencyColor(payroll.pay_frequency, isDark)
                          return (
                            <Badge className="text-xs" style={{ backgroundColor: fc.bg, color: fc.text, border: `1px solid ${fc.border}` }}>
                              {formatFrequency(payroll.pay_frequency)}
                            </Badge>
                          )
                        })()
                      ) : col.id === 'status' ? (
                        <Badge className="text-xs" style={{
                          backgroundColor: payroll.status === 'active'
                            ? isDark ? 'rgba(34, 197, 94, 0.15)' : '#F0FDF4'
                            : isDark ? 'rgba(156, 163, 175, 0.15)' : '#F9FAFB',
                          color: payroll.status === 'active'
                            ? isDark ? '#4ADE80' : '#16A34A'
                            : isDark ? '#9CA3AF' : '#6B7280',
                          border: `1px solid ${payroll.status === 'active'
                            ? isDark ? 'rgba(34, 197, 94, 0.3)' : '#BBF7D0'
                            : isDark ? 'rgba(156, 163, 175, 0.3)' : '#E5E7EB'
                          }`,
                        }}>
                          {payroll.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      ) : (
                        <span className="truncate block max-w-[150px]">{col.getValue(payroll)}</span>
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="px-4 py-2.5">
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="View Runs"
                        onClick={() => openRunsSheet(payroll)}
                      >
                        <Eye className="w-3.5 h-3.5" style={{ color: colors.primary }} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Edit"
                        onClick={() => openEdit(payroll)}
                      >
                        <Edit className="w-3.5 h-3.5" style={{ color: colors.text.muted }} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Delete"
                        onClick={() => setPayrollToDelete(payroll)}
                      >
                        <Trash2 className="w-3.5 h-3.5" style={{ color: colors.error }} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

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
      <Dialog open={payrollToDelete !== null} onOpenChange={(open) => { if (!open) setPayrollToDelete(null) }}>
        <DialogContent style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>Delete Payroll</DialogTitle>
            <DialogDescription className="font-[family-name:var(--font-body)]" style={{ color: colors.text.secondary }}>
              Delete &ldquo;{payrollToDelete?.name}&rdquo;? This will also delete all payroll runs. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayrollToDelete(null)} style={{ borderColor: colors.border }}>
              Cancel
            </Button>
            <Button
              className="text-white"
              style={{ backgroundColor: colors.error }}
              onClick={() => payrollToDelete && handleDelete(payrollToDelete)}
              disabled={deletingId === payrollToDelete?.id}
            >
              {deletingId === payrollToDelete?.id ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-1.5" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Column Customizer Dialog */}
      <Dialog open={columnsDialogOpen} onOpenChange={setColumnsDialogOpen}>
        <DialogContent style={{ backgroundColor: colors.surface, borderColor: colors.border }} className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>Customize Columns</DialogTitle>
            <DialogDescription className="font-[family-name:var(--font-body)]" style={{ color: colors.text.muted }}>
              Toggle column visibility and reorder.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-1">
            {/* Pinned column */}
            <div className="flex items-center gap-2 px-2 py-1.5 rounded" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB' }}>
              <input type="checkbox" checked disabled className="rounded" />
              <span className="text-sm font-medium flex-1 font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>Payroll Name</span>
              <span className="text-[0.6rem] uppercase tracking-wider font-bold font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>Pinned</span>
            </div>
            {columnPrefs.order.map((id, idx) => {
              const col = ALL_COLUMNS.find(c => c.id === id)
              if (!col) return null
              const isVisible = columnPrefs.visible.includes(id)
              return (
                <div key={id} className="flex items-center gap-2 px-2 py-1.5">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => toggleColumn(id)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium flex-1 font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>{col.label}</span>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => moveColumn(id, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded transition-colors disabled:opacity-30"
                      style={{ color: colors.text.muted }}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveColumn(id, 'down')}
                      disabled={idx === columnPrefs.order.length - 1}
                      className="p-1 rounded transition-colors disabled:opacity-30"
                      style={{ color: colors.text.muted }}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetColumns} size="sm" style={{ borderColor: colors.border }}>
              Reset to Default
            </Button>
            <Button onClick={() => setColumnsDialogOpen(false)} size="sm" className="text-white" style={{ backgroundColor: colors.primary }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Edit Config Sidebar */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) { resetForm(); setViewingPayroll(null); setViewMode('edit') } }}>
        <SheetContent side="right" className="w-full sm:max-w-[480px] overflow-y-auto p-0" style={{ backgroundColor: colors.surface }}>
          {/* View Mode */}
          {viewMode === 'view' && viewingPayroll ? (
            <>
              <SheetHeader className="px-5 pt-5 pb-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
                <SheetTitle className="text-lg font-bold font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
                  {viewingPayroll.name}
                </SheetTitle>
                <SheetDescription className="text-xs font-[family-name:var(--font-body)]" style={{ color: colors.text.muted }}>
                  {viewingPayroll.clients?.name}
                </SheetDescription>
              </SheetHeader>
              <div className="divide-y" style={{ borderColor: colors.border }}>
                {/* Details */}
                <div className="px-5 py-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>Details</p>
                  <ViewRow label="Client" value={viewingPayroll.clients?.name || '-'} colors={colors} />
                  <ViewRow label="Status" value={viewingPayroll.status === 'active' ? 'Active' : 'Inactive'} colors={colors} />
                </div>
                {/* Pay Schedule */}
                <div className="px-5 py-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>Pay Schedule</p>
                  <ViewRow label="Frequency" value={formatFrequency(viewingPayroll.pay_frequency)} colors={colors} />
                  <ViewRow label="Pay Day" value={formatPayDay(viewingPayroll.pay_day)} colors={colors} />
                  <ViewRow label="Next Pay Date" value={viewingPayroll.latestRun ? formatDateFull(viewingPayroll.latestRun.pay_date) : '-'} colors={colors} />
                </div>
                {/* HMRC */}
                {(viewingPayroll.paye_reference || viewingPayroll.accounts_office_ref || viewingPayroll.payroll_software) && (
                  <div className="px-5 py-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>HMRC</p>
                    {viewingPayroll.paye_reference && <ViewRow label="PAYE Reference" value={viewingPayroll.paye_reference} colors={colors} />}
                    {viewingPayroll.accounts_office_ref && <ViewRow label="Accounts Office Ref" value={viewingPayroll.accounts_office_ref} colors={colors} />}
                    {viewingPayroll.payroll_software && <ViewRow label="Payroll Software" value={viewingPayroll.payroll_software} colors={colors} />}
                    <ViewRow label="Employment Allowance" value={viewingPayroll.employment_allowance ? 'Yes' : 'No'} colors={colors} />
                  </div>
                )}
                {/* Pension */}
                {(viewingPayroll.pension_provider || viewingPayroll.pension_staging_date) && (
                  <div className="px-5 py-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>Pension</p>
                    {viewingPayroll.pension_provider && <ViewRow label="Provider" value={viewingPayroll.pension_provider} colors={colors} />}
                    {viewingPayroll.pension_staging_date && <ViewRow label="Staging Date" value={formatDateFull(viewingPayroll.pension_staging_date)} colors={colors} />}
                    {viewingPayroll.pension_reenrolment_date && <ViewRow label="Re-enrolment Date" value={formatDateFull(viewingPayroll.pension_reenrolment_date)} colors={colors} />}
                    {viewingPayroll.declaration_of_compliance_deadline && <ViewRow label="DoC Deadline" value={formatDateFull(viewingPayroll.declaration_of_compliance_deadline)} colors={colors} />}
                  </div>
                )}
              </div>
              <div className="px-5 py-4 flex gap-2" style={{ borderTop: `1px solid ${colors.border}` }}>
                <Button
                  onClick={() => { openEdit(viewingPayroll) }}
                  className="flex-1 text-white text-sm"
                  style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
                >
                  <Edit className="w-4 h-4 mr-1.5" />
                  Edit Payroll
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { openRunsSheet(viewingPayroll); setSheetOpen(false) }}
                  className="text-sm"
                  style={{ borderColor: colors.border, color: colors.primary }}
                >
                  <Eye className="w-4 h-4 mr-1.5" />
                  Runs
                </Button>
              </div>
            </>
          ) : (
            /* Edit Mode */
            <>
          <SheetHeader className="px-5 pt-5 pb-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
            <SheetTitle className="text-lg font-bold font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
              {editingPayroll ? 'Edit Payroll' : 'Add Payroll'}
            </SheetTitle>
            <SheetDescription className="text-xs font-[family-name:var(--font-body)]" style={{ color: colors.text.muted }}>
              {editingPayroll ? 'Update the payroll configuration below.' : 'Set up a new payroll for a client.'}
            </SheetDescription>
          </SheetHeader>

          <div className="divide-y" style={{ borderColor: colors.border }}>
            {/* Payroll Details */}
            <FormSection title="Payroll Details" icon={FileText} colors={colors}>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>
                  Payroll Name <span style={{ color: colors.error }}>*</span>
                </Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Weekly Staff Payroll"
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
              {!editingPayroll && (
                <div>
                  <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>
                    Client <span style={{ color: colors.error }}>*</span>
                  </Label>
                  <Select value={formClientId} onValueChange={setFormClientId}>
                    <SelectTrigger className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}>
                      <SelectValue placeholder="Select a client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clientOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </FormSection>

            {/* Pay Schedule */}
            <FormSection title="Pay Schedule" icon={CalendarDays} colors={colors}>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>
                  Pay Frequency <span style={{ color: colors.error }}>*</span>
                </Label>
                <Select value={formPayFrequency} onValueChange={(v) => { setFormPayFrequency(v); setFormPayDay('') }}>
                  <SelectTrigger className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}>
                    <SelectValue placeholder="Select frequency..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="two_weekly">Fortnightly</SelectItem>
                    <SelectItem value="four_weekly">4-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>
                  Pay Day <span style={{ color: colors.error }}>*</span>
                </Label>
                {formPayFrequency === 'annually' ? (
                  <Input
                    type="date"
                    value={formPayDay}
                    onChange={(e) => setFormPayDay(e.target.value)}
                    className="mt-1 text-sm"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                  />
                ) : payDayOptions.length > 0 ? (
                  <Select value={formPayDay} onValueChange={setFormPayDay}>
                    <SelectTrigger className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}>
                      <SelectValue placeholder="Select pay day..." />
                    </SelectTrigger>
                    <SelectContent>
                      {payDayOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="mt-1 text-xs" style={{ color: colors.text.muted }}>Select a frequency first</p>
                )}
              </div>
            </FormSection>

            {/* HMRC */}
            <FormSection title="HMRC" icon={Landmark} defaultOpen={false} colors={colors}>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>PAYE Reference</Label>
                <Input
                  value={formPayeReference}
                  onChange={(e) => setFormPayeReference(e.target.value)}
                  placeholder="e.g. 123/AB45678"
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Accounts Office Reference</Label>
                <Input
                  value={formAccountsOfficeRef}
                  onChange={(e) => setFormAccountsOfficeRef(e.target.value)}
                  placeholder="e.g. 123PA00012345"
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Payroll Software</Label>
                <Input
                  value={formPayrollSoftware}
                  onChange={(e) => setFormPayrollSoftware(e.target.value)}
                  placeholder="e.g. Sage, BrightPay"
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="employment-allowance"
                  checked={formEmploymentAllowance}
                  onChange={(e) => setFormEmploymentAllowance(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="employment-allowance" className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>
                  Employment Allowance
                </Label>
              </div>
            </FormSection>

            {/* Pension */}
            <FormSection title="Pension" icon={Shield} defaultOpen={false} colors={colors}>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Pension Provider</Label>
                <Select value={formPensionProvider} onValueChange={setFormPensionProvider}>
                  <SelectTrigger className="mt-1 text-sm" style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}>
                    <SelectValue placeholder="Select provider..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PENSION_PROVIDERS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Pension Staging Date</Label>
                <Input
                  type="date"
                  value={formPensionStagingDate}
                  onChange={(e) => setFormPensionStagingDate(e.target.value)}
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Re-enrolment Date</Label>
                <Input
                  type="date"
                  value={formPensionReenrolmentDate}
                  onChange={(e) => setFormPensionReenrolmentDate(e.target.value)}
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Declaration of Compliance Deadline</Label>
                <Input
                  type="date"
                  value={formDocDeadline}
                  onChange={(e) => setFormDocDeadline(e.target.value)}
                  className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
            </FormSection>

            {/* Checklist Template — only for new payrolls */}
            {!editingPayroll && (
              <FormSection title="Checklist Template" icon={ListChecks} defaultOpen={false} colors={colors}>
                <div className="space-y-2">
                  {formChecklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs w-5 text-center font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>{i + 1}</span>
                      <span className="flex-1 text-sm font-[family-name:var(--font-body)]" style={{ color: colors.text.primary }}>{item.name}</span>
                      <button
                        type="button"
                        onClick={() => removeChecklistStep(i)}
                        className="p-1 rounded hover:bg-red-50 transition-colors"
                      >
                        <X className="w-3 h-3" style={{ color: colors.error }} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    value={newStepName}
                    onChange={(e) => setNewStepName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChecklistStep() } }}
                    placeholder="Add a step..."
                    className="text-sm flex-1"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }}
                  />
                  <Button variant="outline" size="sm" onClick={addChecklistStep} disabled={!newStepName.trim()}>
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </FormSection>
            )}
          </div>

          {/* Save Button */}
          <div className="px-5 py-4" style={{ borderTop: `1px solid ${colors.border}` }}>
            <Button
              onClick={handleSave}
              disabled={saving || !formName.trim() || !formPayFrequency || !formPayDay}
              className="w-full text-white text-sm"
              style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : editingPayroll ? 'Update Payroll' : 'Add Payroll'}
            </Button>
          </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Runs Sheet ─────────────────────────────────────────────────────────── */}
      <Sheet open={runsSheetOpen} onOpenChange={(open) => { setRunsSheetOpen(open); if (!open) { setSelectedRun(null); setRunsPayroll(null) } }}>
        <SheetContent side="right" className="w-full sm:max-w-[560px] overflow-y-auto p-0" style={{ backgroundColor: colors.surface }}>
          {runsPayroll && (
            <div className="flex flex-col h-full">
              {/* Runs Sheet Header */}
              <div className="px-5 pt-5 pb-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
                <SheetHeader className="p-0">
                  <SheetTitle className="text-lg font-bold font-[family-name:var(--font-inter)] flex items-center gap-2" style={{ color: colors.text.primary }}>
                    <ClipboardCheck className="w-5 h-5" style={{ color: colors.primary }} />
                    {runsPayroll.name}
                  </SheetTitle>
                  <SheetDescription className="text-xs font-[family-name:var(--font-body)]" style={{ color: colors.text.muted }}>
                    {runsPayroll.clients?.name} · {formatFrequency(runsPayroll.pay_frequency)}
                  </SheetDescription>
                </SheetHeader>

                {/* Period Navigation */}
                <div className="flex items-center justify-center gap-1 mt-3 rounded-lg px-1 py-0.5" style={{ border: `1px solid ${colors.border}` }}>
                  <button
                    onClick={() => setCurrentPeriod(subMonths(currentPeriod, 1))}
                    className="p-1.5 rounded-md hover:opacity-70 transition-opacity"
                    style={{ color: colors.text.secondary }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[0.82rem] font-semibold px-2 min-w-[120px] text-center font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
                    {format(currentPeriod, 'MMMM yyyy')}
                  </span>
                  <button
                    onClick={() => setCurrentPeriod(addMonths(currentPeriod, 1))}
                    className="p-1.5 rounded-md hover:opacity-70 transition-opacity"
                    style={{ color: colors.text.secondary }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Runs Content */}
              <div className="flex-1 overflow-y-auto">
                {runsLoading ? (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 rounded-lg animate-pulse" style={{ backgroundColor: `${colors.border}60` }} />
                    ))}
                  </div>
                ) : selectedRun ? (
                  /* ── Checklist View for Selected Run ── */
                  <RunChecklistView
                    run={selectedRun}
                    colors={colors}
                    isDark={isDark}
                    togglingItem={togglingItem}
                    savingNotes={savingNotes}
                    addingStep={addingStep}
                    newStepName={runNewStepName}
                    onBack={() => setSelectedRun(null)}
                    onToggleItem={toggleChecklistItem}
                    onMarkAllComplete={() => markAllComplete(selectedRun)}
                    onSaveNotes={saveRunNotes}
                    onNewStepNameChange={setRunNewStepName}
                    onAddStep={() => addRunStep(selectedRun.id)}
                  />
                ) : sortedRuns.length === 0 ? (
                  /* ── Empty State ── */
                  <div className="p-12 text-center">
                    <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: `${colors.primary}12` }}>
                      <CalendarDays className="w-6 h-6" style={{ color: colors.primary }} />
                    </div>
                    <h3 className="text-sm font-semibold mb-1 font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
                      No runs for {format(currentPeriod, 'MMMM yyyy')}
                    </h3>
                    <p className="text-xs font-[family-name:var(--font-body)]" style={{ color: colors.text.muted }}>
                      Try navigating to a different month.
                    </p>
                  </div>
                ) : (
                  /* ── Run List ── */
                  <div className="p-4 space-y-2">
                    {sortedRuns.map((run) => {
                      const status = computeRunStatus(run)
                      const config = getStatusConfig(status, isDark)
                      const items = run.checklist_items ?? []
                      const completedCount = items.filter((i) => i.is_completed).length
                      const totalCount = items.length
                      const isComplete = status === 'complete'
                      const isOverdue = status === 'overdue'

                      return (
                        <button
                          key={run.id}
                          onClick={() => setSelectedRun(run)}
                          className="w-full text-left rounded-xl p-4 transition-all duration-150"
                          style={{
                            backgroundColor: colors.surface,
                            border: `1px solid ${isOverdue ? '#EF444440' : colors.border}`,
                            opacity: isComplete ? 0.7 : 1,
                            borderLeft: isOverdue ? '4px solid #EF4444' : undefined,
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[0.82rem] font-semibold font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
                              {formatDateShort(run.period_start)} – {formatDateShort(run.period_end)}
                            </span>
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.68rem] font-bold"
                              style={{ backgroundColor: config.bg, color: config.text, border: `1px solid ${config.border}` }}
                            >
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.dot }} />
                              {config.label}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <ProgressDots items={items} isDark={isDark} />
                            <span className="text-[0.72rem] font-medium ml-2" style={{ color: colors.text.muted }}>
                              {completedCount}/{totalCount} · Pay {formatDateShort(run.pay_date)}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                    <p className="text-[0.72rem] font-medium text-center pt-2" style={{ color: colors.text.muted }}>
                      {sortedRuns.length} run{sortedRuns.length !== 1 ? 's' : ''} this month
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Celebration overlay */}
      {celebration && (
        <CelebrationOverlay
          clientName={celebration}
          onDone={() => setCelebration(null)}
        />
      )}
    </div>
  )
}

// ── Run Checklist View (inside Runs Sheet) ─────────────────────────────────────

function RunChecklistView({
  run,
  colors,
  isDark,
  togglingItem,
  savingNotes,
  addingStep,
  newStepName,
  onBack,
  onToggleItem,
  onMarkAllComplete,
  onSaveNotes,
  onNewStepNameChange,
  onAddStep,
}: {
  run: PayrollRun
  colors: ReturnType<typeof getThemeColors>
  isDark: boolean
  togglingItem: string | null
  savingNotes: string | null
  addingStep: boolean
  newStepName: string
  onBack: () => void
  onToggleItem: (item: RunChecklistItem) => void
  onMarkAllComplete: () => void
  onSaveNotes: (runId: string, notes: string) => void
  onNewStepNameChange: (name: string) => void
  onAddStep: () => void
}) {
  const [localNotes, setLocalNotes] = useState(run.notes ?? '')
  const items = [...(run.checklist_items ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const completedCount = items.filter((i) => i.is_completed).length
  const totalCount = items.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const allComplete = totalCount > 0 && completedCount === totalCount
  const status = computeRunStatus(run)
  const config = getStatusConfig(status, isDark)

  useEffect(() => {
    setLocalNotes(run.notes ?? '')
  }, [run.notes])

  return (
    <div className="flex flex-col h-full">
      {/* Back + Header */}
      <div className="p-4 pb-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[0.78rem] font-medium mb-2 transition-colors"
          style={{ color: colors.primary }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to runs
        </button>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[0.85rem] font-semibold font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
              {formatDateShort(run.period_start)} – {formatDateShort(run.period_end)}
            </p>
            <p className="text-[0.72rem] font-[family-name:var(--font-body)]" style={{ color: colors.text.muted }}>
              Pay date: {formatDateFull(run.pay_date)}
            </p>
          </div>
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.72rem] font-bold"
            style={{ backgroundColor: config.bg, color: config.text, border: `1px solid ${config.border}` }}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.dot }} />
            {config.label}
          </span>
        </div>
        <div className="mt-2">
          <ProgressDots items={items} isDark={isDark} />
          <p className="text-[0.72rem] font-bold text-right mt-1" style={{ color: config.text }}>
            {progressPercent}% · {completedCount} of {totalCount}
          </p>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {items.length === 0 ? (
          <p className="text-[0.82rem] italic" style={{ color: colors.text.muted }}>No checklist items yet.</p>
        ) : (
          items.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-3 py-2.5 px-3 rounded-lg cursor-pointer transition-colors duration-100"
              style={{
                backgroundColor: item.is_completed
                  ? isDark ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.04)'
                  : 'transparent',
              }}
            >
              <div className="relative flex-shrink-0">
                <input
                  type="checkbox"
                  checked={item.is_completed}
                  onChange={() => onToggleItem(item)}
                  disabled={togglingItem === item.id}
                  className="cursor-pointer accent-emerald-600"
                  style={{ width: '18px', height: '18px' }}
                />
                {togglingItem === item.id && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: colors.primary }} />
                  </div>
                )}
              </div>
              <span
                className={`text-[0.85rem] font-medium flex-1 font-[family-name:var(--font-body)] ${item.is_completed ? 'line-through' : ''}`}
                style={{ color: item.is_completed ? '#22C55E' : colors.text.primary }}
              >
                {item.name}
              </span>
              {item.is_completed && item.completed_at && (
                <span className="text-[0.68rem] flex-shrink-0" style={{ color: colors.text.muted }}>
                  {formatDateShort(item.completed_at)}
                </span>
              )}
            </label>
          ))
        )}

        {/* Add step */}
        <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${colors.border}` }}>
          <input
            type="text"
            value={newStepName}
            onChange={(e) => onNewStepNameChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onAddStep() }}
            placeholder="Add a step..."
            className="flex-1 text-[0.82rem] font-medium px-3 py-2 rounded-lg focus:outline-none transition-all"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB',
              color: colors.text.primary,
              border: `1px solid ${colors.border}`,
            }}
          />
          <Button
            onClick={onAddStep}
            disabled={addingStep || !newStepName.trim()}
            className="text-white font-semibold text-xs rounded-md border-0 h-8 px-3"
            style={{ backgroundColor: colors.primary }}
          >
            {addingStep ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add'}
          </Button>
        </div>
      </div>

      {/* Footer: Notes + Deadlines + Actions */}
      <div className="p-4 pt-3 space-y-2" style={{ borderTop: `1px solid ${colors.border}` }}>
        {/* Notes */}
        <div>
          <p className="text-[0.72rem] font-bold uppercase tracking-wider mb-1.5 font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>
            Notes {savingNotes === run.id && <span className="font-normal normal-case">· Saving...</span>}
          </p>
          <textarea
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            onBlur={() => { if (localNotes !== (run.notes ?? '')) onSaveNotes(run.id, localNotes) }}
            placeholder="Add notes..."
            rows={2}
            className="w-full rounded-lg p-2.5 text-[0.82rem] font-medium resize-none focus:outline-none transition-all"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB',
              color: colors.text.primary,
              border: `1px solid ${colors.border}`,
            }}
          />
        </div>

        {/* HMRC Deadlines */}
        <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB', border: `1px solid ${colors.border}` }}>
          {[
            { label: 'FPS Due', value: formatDateFull(run.rti_due_date) },
            { label: 'EPS Due', value: formatDateFull(run.eps_due_date) },
            { label: 'Pay Date', value: formatDateFull(run.pay_date) },
          ].map((d) => (
            <div key={d.label} className="flex items-center justify-between">
              <span className="text-[0.75rem] font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>{d.label}</span>
              <span className="text-[0.75rem] font-bold font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>{d.value}</span>
            </div>
          ))}
        </div>

        {/* Mark All Complete */}
        {!allComplete && totalCount > 0 && (
          <Button
            onClick={onMarkAllComplete}
            className="w-full text-white font-semibold text-[0.82rem] rounded-md border-0"
            style={{ backgroundColor: colors.success }}
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Mark All Complete
          </Button>
        )}
      </div>
    </div>
  )
}

// ── View Row (for read-only sidebar) ────────────────────────────────────────

function ViewRow({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof getThemeColors> }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>{label}</span>
      <span className="text-sm font-medium font-[family-name:var(--font-body)]" style={{ color: colors.text.primary }}>{value}</span>
    </div>
  )
}
