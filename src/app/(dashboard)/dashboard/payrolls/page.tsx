'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { format, parseISO, isToday, isBefore, startOfDay, addDays, startOfMonth, endOfMonth } from 'date-fns'
import { getPayrollStatus, type PayrollStatus } from '@/lib/hmrc-deadlines'
import { emitBadgeEarned } from '@/components/gamification/BadgeToast'
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
  ListChecks,
  X,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Download,
  Settings2,
  Filter,
  AlertTriangle,
  Clock,
  Check,
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { mutate } from 'swr'

// ── Types ──────────────────────────────────────────────────────────────────────

interface PayrollClient {
  name: string
}

interface ChecklistItem {
  id: string
  payroll_run_id: string
  name: string
  is_completed: boolean
  completed_at: string | null
  completed_by: string | null
  sort_order: number
}

interface LatestRun {
  id: string
  payroll_id: string
  pay_date: string
  period_start: string
  period_end: string
  status: string
  rti_due_date: string | null
  eps_due_date: string | null
  checklist_items: ChecklistItem[]
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

function getStatusConfig(status: PayrollStatus, isDark: boolean) {
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

function computeRunStatus(run: LatestRun): PayrollStatus {
  const items = run.checklist_items ?? []
  const completedCount = items.filter((i) => i.is_completed).length
  return getPayrollStatus(parseISO(run.pay_date), items.length, completedCount)
}

function formatDateFull(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try { return format(parseISO(dateStr), 'd MMM yyyy') } catch { return '-' }
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

// ── Column definitions ───────────────────────────────────────────────────────

type SortField = 'name' | 'client' | 'frequency' | 'pay_day' | 'paye_ref' | 'pay_date' | 'status' | 'pension_provider' | 'payroll_software'
type SortDirection = 'asc' | 'desc'

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
  { id: 'pay_date', label: 'Pay Date', sortField: 'pay_date', defaultVisible: true, getValue: (p) => p.latestRun ? formatDateFull(p.latestRun.pay_date) : '-' },
  { id: 'pay_day', label: 'Pay Day', sortField: 'pay_day', defaultVisible: false, getValue: (p) => formatPayDay(p.pay_day) },
  { id: 'paye_ref', label: 'PAYE Ref', sortField: 'paye_ref', defaultVisible: false, getValue: (p) => p.paye_reference || '-' },
  { id: 'status', label: 'Status', sortField: 'status', defaultVisible: false, getValue: (p) => p.status },
  { id: 'pension_provider', label: 'Pension', sortField: 'pension_provider', defaultVisible: false, getValue: (p) => p.pension_provider || '-' },
  { id: 'payroll_software', label: 'Software', sortField: 'payroll_software', defaultVisible: false, getValue: (p) => p.payroll_software || '-' },
]

const DEFAULT_VISIBLE = ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.id)
const DEFAULT_ORDER = ALL_COLUMNS.map(c => c.id)
const LOCALSTORAGE_KEY = 'tpb_payroll_columns'
const PAGE_SIZE = 25

// ── SortableHeader ───────────────────────────────────────────────────────────

function SortableHeader({
  label, field, currentField, currentDirection, onSort, colors, className = '',
}: {
  label: string; field: SortField; currentField: SortField; currentDirection: SortDirection
  onSort: (field: SortField) => void; colors: ReturnType<typeof getThemeColors>; className?: string
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

// ── Celebration Overlay ──────────────────────────────────────────────────────

function CelebrationOverlay({ clientName, onDone }: { clientName: string; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 4000)
    return () => clearTimeout(timer)
  }, [onDone])

  const particles = useMemo(() => {
    const pColors = ['#22C55E', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6', '#EF4444', '#14B8A6', '#F97316']
    return Array.from({ length: 60 }, (_, i) => ({
      id: i, color: pColors[i % pColors.length], left: Math.random() * 100,
      delay: Math.random() * 0.8, duration: 1.5 + Math.random() * 2, size: 6 + Math.random() * 8,
      rotation: Math.random() * 360, shape: i % 3,
    }))
  }, [])

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center" onClick={onDone} style={{ pointerEvents: 'auto' }}>
      <div className="absolute inset-0 bg-black/20 animate-fadeIn" />
      {particles.map((p) => (
        <div key={p.id} className="absolute top-0" style={{
          left: `${p.left}%`, width: p.shape === 2 ? p.size * 1.5 : p.size, height: p.size,
          backgroundColor: p.color, borderRadius: p.shape === 0 ? '50%' : '2px',
          transform: `rotate(${p.rotation}deg)`, animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
        }} />
      ))}
      <div className="relative z-10 bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl text-center animate-fadeIn">
        <div className="text-4xl mb-3">🎉</div>
        <h3 className="text-lg font-bold mb-1">Payroll Complete!</h3>
        <p className="text-sm text-gray-500">{clientName} — all steps done</p>
      </div>
      <style>{`@keyframes confetti-fall { 0% { transform: translateY(-20px) rotate(0deg); opacity: 1; } 100% { transform: translateY(100vh) rotate(720deg); opacity: 0; } }`}</style>
    </div>
  )
}

// ── Collapsible Section ────────────────────────────────────────────────────────

function FormSection({
  title, icon: Icon, defaultOpen = true, colors, children,
}: {
  title: string; icon: React.ComponentType<{ className?: string }>; defaultOpen?: boolean
  colors: ReturnType<typeof getThemeColors>; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderBottom: `1px solid ${colors.border}` }}>
      <button type="button" className="flex w-full items-center gap-2 px-5 py-3 text-left text-sm font-semibold font-[family-name:var(--font-inter)] transition-colors" style={{ color: colors.text.primary }} onClick={() => setOpen(!open)}>
        <Icon className="w-4 h-4" />
        {title}
        <span className="ml-auto">{open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</span>
      </button>
      {open && <div className="px-5 pb-4 space-y-3">{children}</div>}
    </div>
  )
}

// ── Task Popover (inline checklist dropdown) ─────────────────────────────────

function TaskPopover({
  payroll, colors, isDark, onComplete,
}: {
  payroll: Payroll; colors: ReturnType<typeof getThemeColors>; isDark: boolean
  onComplete: (clientName: string) => void
}) {
  const run = payroll.latestRun
  const items = run ? [...run.checklist_items].sort((a, b) => a.sort_order - b.sort_order) : []
  const completedCount = items.filter((i) => i.is_completed).length
  const totalCount = items.length
  const status = run ? computeRunStatus(run) : 'not_started' as PayrollStatus
  const config = getStatusConfig(status, isDark)
  const [togglingItem, setTogglingItem] = useState<string | null>(null)
  const [localItems, setLocalItems] = useState(items)
  const [open, setOpen] = useState(false)

  // Sync local items with prop changes
  useEffect(() => {
    setLocalItems(run ? [...run.checklist_items].sort((a, b) => a.sort_order - b.sort_order) : [])
  }, [run])

  const localCompletedCount = localItems.filter(i => i.is_completed).length
  const localStatus = run ? getPayrollStatus(parseISO(run.pay_date), localItems.length, localCompletedCount) : 'not_started' as PayrollStatus
  const localConfig = getStatusConfig(localStatus, isDark)

  if (!run) {
    return (
      <span className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>
        No run
      </span>
    )
  }

  const toggleItem = async (item: ChecklistItem) => {
    setTogglingItem(item.id)
    // Optimistic update
    const newItems = localItems.map(ci => ci.id === item.id ? { ...ci, is_completed: !item.is_completed, completed_at: !item.is_completed ? new Date().toISOString() : null } : ci)
    setLocalItems(newItems)

    try {
      const res = await fetch('/api/payroll-runs/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_item', item_id: item.id, is_completed: !item.is_completed }),
      })
      if (!res.ok) throw new Error('Failed to toggle item')

      const resData = await res.json().catch(() => ({}))
      if (resData.newBadges?.length > 0) emitBadgeEarned(resData.newBadges)

      // Check if this completed all items
      if (!item.is_completed) {
        const otherIncomplete = localItems.filter(ci => ci.id !== item.id && !ci.is_completed)
        if (otherIncomplete.length === 0) {
          setOpen(false)
          onComplete(payroll.clients?.name ?? 'Payroll')
          // Auto-generate next run
          try {
            await fetch('/api/payroll-runs/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ payroll_id: payroll.id }),
            })
          } catch (err) { console.error('Auto-generate error:', err) }
          mutate('/api/payrolls')
          return
        }
      }

      mutate('/api/payrolls')
    } catch (err) {
      console.error('Error toggling item:', err)
      // Revert optimistic update
      setLocalItems(items)
      mutate('/api/payrolls')
    } finally {
      setTogglingItem(null)
    }
  }

  const markAllComplete = async () => {
    const incompleteIds = localItems.filter(i => !i.is_completed).map(i => i.id)
    if (incompleteIds.length === 0) return

    // Optimistic update
    setLocalItems(localItems.map(ci => ({ ...ci, is_completed: true, completed_at: new Date().toISOString() })))

    try {
      const res = await fetch('/api/payroll-runs/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_complete', payroll_run_id: run.id }),
      })
      if (!res.ok) throw new Error('Failed to mark all complete')

      const resData = await res.json().catch(() => ({}))
      if (resData.newBadges?.length > 0) emitBadgeEarned(resData.newBadges)

      setOpen(false)
      onComplete(payroll.clients?.name ?? 'Payroll')

      // Auto-generate next run
      try {
        await fetch('/api/payroll-runs/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payroll_id: payroll.id }),
        })
      } catch (err) { console.error('Auto-generate error:', err) }

      mutate('/api/payrolls')
    } catch (err) {
      console.error('Error marking all complete:', err)
      setLocalItems(items)
      mutate('/api/payrolls')
    }
  }

  const allComplete = localItems.length > 0 && localCompletedCount === localItems.length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer"
          style={{ backgroundColor: localConfig.bg, color: localConfig.text, border: `1px solid ${localConfig.border}` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: localConfig.dot }} />
          {localConfig.label} {totalCount > 0 && `${localCompletedCount}/${totalCount}`}
          <ChevronDown className="w-3 h-3 ml-0.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="p-0 w-[280px]"
        style={{ backgroundColor: colors.surface, border: `1px solid ${localConfig.border}`, borderTop: `3px solid ${localConfig.dot}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <span className="text-xs font-bold font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
            Tasks
          </span>
          <span className="text-xs font-bold font-[family-name:var(--font-inter)]" style={{ color: localConfig.text }}>
            {localCompletedCount}/{totalCount}
          </span>
        </div>

        {/* Checklist Items */}
        <div className="max-h-[280px] overflow-y-auto">
          {localItems.map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors duration-100"
              style={{
                backgroundColor: item.is_completed
                  ? isDark ? 'rgba(34, 197, 94, 0.06)' : 'rgba(34, 197, 94, 0.04)'
                  : 'transparent',
                borderBottom: `1px solid ${colors.border}40`,
              }}
            >
              <div className="relative flex-shrink-0">
                {togglingItem === item.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: colors.primary }} />
                ) : item.is_completed ? (
                  <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#22C55E' }}>
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full border-2" style={{ borderColor: colors.text.muted }} />
                )}
                <input
                  type="checkbox"
                  checked={item.is_completed}
                  onChange={() => toggleItem(item)}
                  disabled={togglingItem === item.id}
                  className="sr-only"
                />
              </div>
              <span
                className={`text-xs font-medium flex-1 font-[family-name:var(--font-body)] ${item.is_completed ? 'line-through' : ''}`}
                style={{ color: item.is_completed ? '#22C55E' : colors.text.primary }}
              >
                {item.name}
              </span>
            </label>
          ))}
        </div>

        {/* Mark All Complete */}
        {!allComplete && totalCount > 0 && (
          <div className="p-2" style={{ borderTop: `1px solid ${colors.border}` }}>
            <Button
              onClick={markAllComplete}
              size="sm"
              className="w-full text-white font-semibold text-xs rounded-md border-0"
              style={{ backgroundColor: '#22C55E' }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Mark All Complete
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
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
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [clientFilter, setClientFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [kpiFilter, setKpiFilter] = useState<string>('all')

  // Sort — default to pay_date ascending (soonest first)
  const [sortField, setSortField] = useState<SortField>('pay_date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

  // Column prefs
  const [columnPrefs, setColumnPrefs] = useState<{ visible: string[]; order: string[] }>({ visible: DEFAULT_VISIBLE, order: DEFAULT_ORDER })
  const [columnsDialogOpen, setColumnsDialogOpen] = useState(false)

  // Config Sheet state (edit only)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Delete dialog
  const [payrollToDelete, setPayrollToDelete] = useState<Payroll | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Celebration
  const [celebration, setCelebration] = useState<string | null>(null)

  // Form fields
  const [formName, setFormName] = useState('')
  const [formClientId, setFormClientId] = useState('')
  const [formPayFrequency, setFormPayFrequency] = useState('')
  const [formPayDay, setFormPayDay] = useState('')
  const [formPayeReference, setFormPayeReference] = useState('')
  const [formAccountsOfficeRef, setFormAccountsOfficeRef] = useState('')
  const [formPayrollSoftware, setFormPayrollSoftware] = useState('')
  const [formEmploymentAllowance, setFormEmploymentAllowance] = useState(false)
  const [formChecklist, setFormChecklist] = useState(DEFAULT_CHECKLIST)
  const [newStepName, setNewStepName] = useState('')

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

  // ── Config Sheet handlers ───────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setFormName(''); setFormClientId(''); setFormPayFrequency(''); setFormPayDay('')
    setFormPayeReference(''); setFormAccountsOfficeRef(''); setFormPayrollSoftware('')
    setFormEmploymentAllowance(false); setFormChecklist(DEFAULT_CHECKLIST); setNewStepName('')
    setEditingPayroll(null)
  }, [])

  const openAdd = useCallback(() => {
    resetForm()
    setSheetOpen(true)
  }, [resetForm])

  const openEdit = useCallback((payroll: Payroll) => {
    setEditingPayroll(payroll)
    setFormName(payroll.name || '')
    setFormClientId(payroll.client_id || '')
    setFormPayFrequency(payroll.pay_frequency || '')
    setFormPayDay(payroll.pay_day || '')
    setFormPayeReference(payroll.paye_reference || '')
    setFormAccountsOfficeRef(payroll.accounts_office_ref || '')
    setFormPayrollSoftware(payroll.payroll_software || '')
    setFormEmploymentAllowance(payroll.employment_allowance || false)
    setSheetOpen(true)
  }, [])

  const payDayOptions = useMemo(() => {
    if (formPayFrequency === 'monthly') {
      const days = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))
      return [...days, { value: 'last_day_of_month', label: 'Last day of month' }, { value: 'last_working_day', label: 'Last working day' }]
    }
    if (formPayFrequency === 'annually') return []
    return WEEKDAYS.map((d) => ({ value: d, label: d.charAt(0).toUpperCase() + d.slice(1) }))
  }, [formPayFrequency])

  const handleSave = async () => {
    if (!formName.trim()) { toast('Payroll name is required', 'error'); return }
    if (!editingPayroll && !formClientId) { toast('Please select a client', 'error'); return }
    if (!formPayFrequency) { toast('Pay frequency is required', 'error'); return }
    if (!formPayDay) { toast('Pay day is required', 'error'); return }

    setSaving(true)
    try {
      if (editingPayroll) {
        const payload = {
          name: formName.trim(), pay_frequency: formPayFrequency, pay_day: formPayDay,
          paye_reference: formPayeReference.trim() || undefined, accounts_office_ref: formAccountsOfficeRef.trim() || undefined,
          payroll_software: formPayrollSoftware.trim() || undefined, employment_allowance: formEmploymentAllowance,
        }
        const res = await fetch(`/api/payrolls/${editingPayroll.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to update payroll') }
      } else {
        const payload = {
          name: formName.trim(), client_id: formClientId, pay_frequency: formPayFrequency, pay_day: formPayDay,
          paye_reference: formPayeReference.trim() || undefined, accounts_office_ref: formAccountsOfficeRef.trim() || undefined,
          payroll_software: formPayrollSoftware.trim() || undefined, employment_allowance: formEmploymentAllowance,
          checklist_items: formChecklist,
        }
        const res = await fetch('/api/payrolls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to create payroll') }
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
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/payrolls/export?${params}`)
      if (!res.ok) throw new Error('Failed to export')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `payrolls-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
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

  // ── KPI Counts ────────────────────────────────────────────────────────────

  const kpiCounts = useMemo(() => {
    const all = (payrolls || []) as Payroll[]
    const today = startOfDay(new Date())
    const weekEnd = addDays(today, 7)
    const monthStart = startOfMonth(today)
    const monthEnd = endOfMonth(today)

    let dueToday = 0
    let overdue = 0
    let thisWeek = 0
    let completedThisMonth = 0

    for (const p of all) {
      if (!p.latestRun) continue
      const run = p.latestRun
      const items = run.checklist_items ?? []
      const completedCount = items.filter(i => i.is_completed).length
      const totalCount = items.length
      const payDate = parseISO(run.pay_date)
      const payDateNorm = startOfDay(payDate)
      const allDone = totalCount > 0 && completedCount === totalCount

      if (allDone) {
        // Check if completed this month (use the last completed_at timestamp)
        const lastCompleted = items.reduce((max, item) => {
          if (item.completed_at) {
            const d = parseISO(item.completed_at)
            return d > max ? d : max
          }
          return max
        }, new Date(0))
        if (lastCompleted >= monthStart && lastCompleted <= monthEnd) {
          completedThisMonth++
        }
        continue
      }

      if (isToday(payDateNorm)) dueToday++
      if (isBefore(payDateNorm, today)) overdue++
      if (payDateNorm >= today && payDateNorm <= weekEnd) thisWeek++
    }

    return { dueToday, overdue, thisWeek, completedThisMonth, total: all.length }
  }, [payrolls])

  // ── Filtered + sorted data ──────────────────────────────────────────────────

  const filteredSorted: Payroll[] = useMemo(() => {
    if (!payrolls) return []
    let filtered = payrolls as Payroll[]

    if (statusFilter !== 'all') filtered = filtered.filter((p) => p.status === statusFilter)
    if (clientFilter !== 'all') filtered = filtered.filter((p) => p.client_id === clientFilter)

    // KPI filter
    if (kpiFilter !== 'all') {
      const today = startOfDay(new Date())
      const weekEnd = addDays(today, 7)
      filtered = filtered.filter((p) => {
        if (!p.latestRun) return false
        const run = p.latestRun
        const items = run.checklist_items ?? []
        const completedCount = items.filter(i => i.is_completed).length
        const totalCount = items.length
        const payDate = startOfDay(parseISO(run.pay_date))
        const allDone = totalCount > 0 && completedCount === totalCount

        switch (kpiFilter) {
          case 'due_today': return !allDone && isToday(payDate)
          case 'overdue': return !allDone && isBefore(payDate, today)
          case 'this_week': return !allDone && payDate >= today && payDate <= weekEnd
          case 'completed': {
            if (!allDone) return false
            const monthStart = startOfMonth(today)
            const monthEnd = endOfMonth(today)
            const lastCompleted = items.reduce((max, item) => {
              if (item.completed_at) { const d = parseISO(item.completed_at); return d > max ? d : max }
              return max
            }, new Date(0))
            return lastCompleted >= monthStart && lastCompleted <= monthEnd
          }
          default: return true
        }
      })
    }

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
        case 'pay_date': {
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
  }, [payrolls, statusFilter, clientFilter, kpiFilter, debouncedSearch, sortField, sortDirection])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, clientFilter, kpiFilter, debouncedSearch, sortField, sortDirection])

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PAGE_SIZE))
  const paginatedPayrolls = filteredSorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const showingFrom = filteredSorted.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(currentPage * PAGE_SIZE, filteredSorted.length)

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (clientFilter !== 'all' ? 1 : 0)

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
        <h1 className="text-xl md:text-2xl font-bold tracking-tight font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
          Payrolls
        </h1>
        <Button onClick={openAdd} className="text-white text-sm" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add Payroll
        </Button>
      </div>

      {/* KPI Cards — action-oriented */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: 'Due Today', count: kpiCounts.dueToday, key: 'due_today', color: colors.primary, icon: Clock },
          { label: 'Overdue', count: kpiCounts.overdue, key: 'overdue', color: '#EF4444', icon: AlertTriangle },
          { label: 'This Week', count: kpiCounts.thisWeek, key: 'this_week', color: '#F59E0B', icon: CalendarDays },
          { label: 'Completed', count: kpiCounts.completedThisMonth, key: 'completed', color: '#22C55E', icon: CheckCircle2 },
        ].map((kpi) => {
          const isActive = kpiFilter === kpi.key
          const KpiIcon = kpi.icon
          return (
            <button
              key={kpi.key}
              onClick={() => setKpiFilter(kpiFilter === kpi.key ? 'all' : kpi.key)}
              className="rounded-xl p-3 text-left transition-all duration-150"
              style={{
                backgroundColor: colors.surface,
                border: `1px solid ${isActive ? kpi.color : colors.border}`,
                boxShadow: isActive ? `0 0 0 1px ${kpi.color}` : undefined,
                borderLeft: kpi.key === 'overdue' && kpi.count > 0 ? `4px solid ${kpi.color}` : undefined,
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <KpiIcon className="w-3.5 h-3.5" style={{ color: isActive ? kpi.color : colors.text.muted }} />
                <p className="text-[0.7rem] font-medium font-[family-name:var(--font-inter)] truncate" style={{ color: isActive ? kpi.color : colors.text.muted }}>
                  {kpi.label}
                </p>
              </div>
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
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="text-xs gap-1.5"
            style={{ borderColor: colors.border, color: activeFilterCount > 0 ? colors.primary : colors.text.secondary }}>
            <Filter className="w-3.5 h-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[0.6rem] font-bold text-white" style={{ backgroundColor: colors.primary }}>
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setColumnsDialogOpen(true)} className="text-xs gap-1.5"
            style={{ borderColor: colors.border, color: colors.text.secondary }}>
            <Settings2 className="w-3.5 h-3.5" />
            Columns
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting} className="text-xs gap-1.5"
            style={{ borderColor: colors.border, color: colors.text.secondary }}>
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
            {(activeFilterCount > 0 || kpiFilter !== 'all') && (
              <button
                onClick={() => { setStatusFilter('all'); setClientFilter('all'); setKpiFilter('all') }}
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
              {debouncedSearch || activeFilterCount > 0 || kpiFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Add a payroll to start managing pay runs.'}
            </p>
            {!debouncedSearch && activeFilterCount === 0 && kpiFilter === 'all' && (
              <Button onClick={openAdd} size="sm" className="text-white text-xs"
                style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
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
                <SortableHeader label="Payroll" field="name" currentField={sortField} currentDirection={sortDirection} onSort={handleSort} colors={colors} />
                {activeColumns.map((col) => (
                  col.sortField ? (
                    <SortableHeader key={col.id} label={col.label} field={col.sortField} currentField={sortField} currentDirection={sortDirection} onSort={handleSort} colors={colors} />
                  ) : (
                    <TableHead key={col.id} className="px-4 py-3 text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>
                      {col.label}
                    </TableHead>
                  )
                ))}
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>Tasks</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium uppercase tracking-wider font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPayrolls.map((payroll) => (
                <TableRow key={payroll.id} className="transition-colors group" style={{ borderColor: colors.border }}>
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
                          backgroundColor: payroll.status === 'active' ? isDark ? 'rgba(34, 197, 94, 0.15)' : '#F0FDF4' : isDark ? 'rgba(156, 163, 175, 0.15)' : '#F9FAFB',
                          color: payroll.status === 'active' ? isDark ? '#4ADE80' : '#16A34A' : isDark ? '#9CA3AF' : '#6B7280',
                          border: `1px solid ${payroll.status === 'active' ? isDark ? 'rgba(34, 197, 94, 0.3)' : '#BBF7D0' : isDark ? 'rgba(156, 163, 175, 0.3)' : '#E5E7EB'}`,
                        }}>
                          {payroll.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      ) : (
                        <span className="truncate block max-w-[150px]">{col.getValue(payroll)}</span>
                      )}
                    </TableCell>
                  ))}
                  {/* Tasks column — inline checklist popover */}
                  <TableCell className="px-4 py-2.5">
                    <TaskPopover payroll={payroll} colors={colors} isDark={isDark} onComplete={setCelebration} />
                  </TableCell>
                  {/* Actions — Edit + Delete only */}
                  <TableCell className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit" onClick={() => openEdit(payroll)}>
                        <Edit className="w-3.5 h-3.5" style={{ color: colors.text.muted }} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" title="Delete" onClick={() => setPayrollToDelete(payroll)}>
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
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="h-7 text-xs" style={{ borderColor: colors.border }}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <span className="text-xs font-medium px-2 font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>
                  {currentPage} / {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="h-7 text-xs" style={{ borderColor: colors.border }}>
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
            <Button variant="outline" onClick={() => setPayrollToDelete(null)} style={{ borderColor: colors.border }}>Cancel</Button>
            <Button className="text-white" style={{ backgroundColor: colors.error }} onClick={() => payrollToDelete && handleDelete(payrollToDelete)} disabled={deletingId === payrollToDelete?.id}>
              {deletingId === payrollToDelete?.id ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1.5" />}
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
                  <input type="checkbox" checked={isVisible} onChange={() => toggleColumn(id)} className="rounded" />
                  <span className="text-sm font-medium flex-1 font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>{col.label}</span>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => moveColumn(id, 'up')} disabled={idx === 0} className="p-1 rounded transition-colors disabled:opacity-30" style={{ color: colors.text.muted }}>
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => moveColumn(id, 'down')} disabled={idx === columnPrefs.order.length - 1} className="p-1 rounded transition-colors disabled:opacity-30" style={{ color: colors.text.muted }}>
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetColumns} size="sm" style={{ borderColor: colors.border }}>Reset to Default</Button>
            <Button onClick={() => setColumnsDialogOpen(false)} size="sm" className="text-white" style={{ backgroundColor: colors.primary }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Config Sidebar (edit only — no view mode) */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { setSheetOpen(open); if (!open) resetForm() }}>
        <SheetContent side="right" className="w-full sm:max-w-[480px] overflow-y-auto p-0" style={{ backgroundColor: colors.surface }}>
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
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Weekly Staff Payroll" className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
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
                  <Input type="date" value={formPayDay} onChange={(e) => setFormPayDay(e.target.value)} className="mt-1 text-sm"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
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
                <Input value={formPayeReference} onChange={(e) => setFormPayeReference(e.target.value)} placeholder="e.g. 123/AB45678" className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Accounts Office Reference</Label>
                <Input value={formAccountsOfficeRef} onChange={(e) => setFormAccountsOfficeRef(e.target.value)} placeholder="e.g. 123PA00012345" className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div>
                <Label className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>Payroll Software</Label>
                <Input value={formPayrollSoftware} onChange={(e) => setFormPayrollSoftware(e.target.value)} placeholder="e.g. Sage, BrightPay" className="mt-1 text-sm"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="employment-allowance" checked={formEmploymentAllowance} onChange={(e) => setFormEmploymentAllowance(e.target.checked)} className="rounded" />
                <Label htmlFor="employment-allowance" className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>
                  Employment Allowance
                </Label>
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
                      <button type="button" onClick={() => removeChecklistStep(i)} className="p-1 rounded hover:bg-red-50 transition-colors">
                        <X className="w-3 h-3" style={{ color: colors.error }} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Input value={newStepName} onChange={(e) => setNewStepName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChecklistStep() } }}
                    placeholder="Add a step..." className="text-sm flex-1"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }} />
                  <Button variant="outline" size="sm" onClick={addChecklistStep} disabled={!newStepName.trim()}>
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </FormSection>
            )}
          </div>

          {/* Save Button */}
          <div className="px-5 py-4" style={{ borderTop: `1px solid ${colors.border}` }}>
            <Button onClick={handleSave} disabled={saving || !formName.trim() || !formPayFrequency || !formPayDay}
              className="w-full text-white text-sm" style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}>
              {saving ? (<><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Saving...</>) : editingPayroll ? 'Update Payroll' : 'Add Payroll'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Celebration overlay */}
      {celebration && (
        <CelebrationOverlay clientName={celebration} onDone={() => setCelebration(null)} />
      )}
    </div>
  )
}
