'use client'

import { useEffect, useState, useCallback, useMemo, Suspense } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { getPayrollStatus, type PayrollStatus } from '@/lib/hmrc-deadlines'
import { format, differenceInDays, parseISO, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  Plus,
  AlertTriangle,
  Search,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

// ── Types ──────────────────────────────────────────────────────────────────────

interface ChecklistItem {
  id: string
  payroll_run_id: string
  template_id: string | null
  name: string
  is_completed: boolean
  completed_at: string | null
  completed_by: string | null
  sort_order: number
}

interface PayrollRunClient {
  name: string
  pay_frequency: string | null
}

interface PayrollRun {
  id: string
  client_id: string
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
  clients: PayrollRunClient
  checklist_items: ChecklistItem[]
}

type ViewMode = 'board' | 'list'
type StatusFilter = 'all' | 'complete' | 'in_progress' | 'overdue'

// ── Status Helpers ─────────────────────────────────────────────────────────────

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

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatPayFrequency(freq: string | null): string {
  if (!freq) return 'N/A'
  const map: Record<string, string> = {
    weekly: 'Weekly',
    fortnightly: 'Fortnightly',
    four_weekly: 'Four-Weekly',
    monthly: 'Monthly',
    annually: 'Annually',
  }
  return map[freq] ?? freq
}

function computeStatus(run: PayrollRun): PayrollStatus {
  const items = run.checklist_items ?? []
  const completedCount = items.filter((i) => i.is_completed).length
  return getPayrollStatus(parseISO(run.pay_date), items.length, completedCount)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  try {
    return format(parseISO(dateStr), 'd MMM yyyy')
  } catch {
    return '-'
  }
}

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return '-'
  try {
    return format(parseISO(dateStr), 'd MMM')
  } catch {
    return '-'
  }
}

/** Sort priority: overdue first, then due soonest, then by status weight */
function sortByUrgency(a: PayrollRun, b: PayrollRun): number {
  const statusWeight: Record<PayrollStatus, number> = {
    overdue: 0,
    due_soon: 1,
    in_progress: 2,
    not_started: 3,
    complete: 4,
  }
  const sa = computeStatus(a)
  const sb = computeStatus(b)
  if (statusWeight[sa] !== statusWeight[sb]) return statusWeight[sa] - statusWeight[sb]
  return new Date(a.pay_date).getTime() - new Date(b.pay_date).getTime()
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function PayrollsPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin" /></div>}>
      <PayrollsPage />
    </Suspense>
  )
}

function PayrollsPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // View & filters
  const [viewMode, setViewMode] = useState<ViewMode>('board')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [currentPeriod, setCurrentPeriod] = useState(startOfMonth(new Date()))
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  // Checklist panel
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  // Action states
  const [togglingItem, setTogglingItem] = useState<string | null>(null)
  const [savingNotes, setSavingNotes] = useState<string | null>(null)
  const [addingStep, setAddingStep] = useState(false)
  const [newStepName, setNewStepName] = useState('')

  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const searchParams = useSearchParams()
  const router = useRouter()
  const clientFilter = searchParams.get('client')
  const supabase = createClientSupabaseClient()

  // Persist view mode
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('payroll-runs-view')
    if (saved === 'board' || saved === 'list') setViewMode(saved)
  }, [])

  useEffect(() => {
    if (mounted) localStorage.setItem('payroll-runs-view', viewMode)
  }, [viewMode, mounted])

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchRuns = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const periodStart = format(currentPeriod, 'yyyy-MM-dd')
      const periodEnd = format(endOfMonth(currentPeriod), 'yyyy-MM-dd')

      let query = supabase
        .from('payroll_runs')
        .select('*, clients(name, pay_frequency), checklist_items(*)')
        .gte('pay_date', periodStart)
        .lte('pay_date', periodEnd)
        .order('pay_date', { ascending: true })

      if (clientFilter) {
        query = query.eq('client_id', clientFilter)
      }

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError
      setRuns((data as unknown as PayrollRun[]) ?? [])
    } catch (err) {
      console.error('Error fetching payroll runs:', err)
      setError(err instanceof Error ? err.message : 'Failed to load payroll runs')
    } finally {
      setLoading(false)
    }
  }, [supabase, clientFilter, currentPeriod])

  useEffect(() => {
    if (mounted) fetchRuns()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientFilter, currentPeriod, mounted])

  // ── Filtering & sorting ─────────────────────────────────────────────────────

  const filteredRuns = useMemo(() => {
    let result = runs

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((run) => run.clients?.name?.toLowerCase().includes(q))
    }

    // Filter by status — default ('all') hides completed runs
    result = result.filter((run) => {
      const s = computeStatus(run)
      if (statusFilter === 'all') return s !== 'complete'
      if (statusFilter === 'in_progress') return s === 'in_progress' || s === 'due_soon' || s === 'not_started'
      if (statusFilter === 'overdue') return s === 'overdue'
      if (statusFilter === 'complete') return s === 'complete'
      return true
    })

    return [...result].sort(sortByUrgency)
  }, [runs, statusFilter, searchQuery])

  // Status counts
  const counts = useMemo(() => {
    const c = { total: runs.length, complete: 0, in_progress: 0, overdue: 0 }
    for (const run of runs) {
      const s = computeStatus(run)
      if (s === 'complete') c.complete++
      else if (s === 'overdue') c.overdue++
      else c.in_progress++
    }
    return c
  }, [runs])

  // ── Actions ────────────────────────────────────────────────────────────────

  const toggleChecklistItem = async (item: ChecklistItem) => {
    setTogglingItem(item.id)
    try {
      const res = await fetch('/api/payroll-runs/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_item', item_id: item.id, is_completed: !item.is_completed }),
      })
      if (!res.ok) throw new Error('Failed to toggle item')

      // Optimistic update
      const updatedChecklist = (runItems: ChecklistItem[]) =>
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
            // All items now complete — close panel and auto-generate
            setPanelOpen(false)
            setSelectedRun(null)
            try {
              const res = await fetch('/api/payroll-runs/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ client_id: parentRun.client_id }),
              })
              if (res.ok) {
                const newRun = await res.json()
                if (newRun.pay_date) {
                  const newPayDate = parseISO(newRun.pay_date)
                  const newMonth = startOfMonth(newPayDate)
                  if (newMonth.getTime() !== currentPeriod.getTime()) {
                    setCurrentPeriod(newMonth)
                  }
                }
              } else {
                const body = await res.json().catch(() => ({}))
                console.error('Auto-generate next period failed:', body.error || res.status)
              }
            } catch (err) {
              console.error('Auto-generate network error:', err)
            }
          }
        }
      }
    } catch (err) {
      console.error('Error toggling checklist item:', err)
      await fetchRuns()
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

      // Close side panel if open for this run
      if (selectedRun?.id === run.id) {
        setPanelOpen(false)
        setSelectedRun(null)
      }

      // Auto-generate next period
      try {
        const res = await fetch('/api/payroll-runs/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: run.client_id }),
        })
        if (res.ok) {
          const newRun = await res.json()
          // If the new run falls in a different month, navigate to it
          if (newRun.pay_date) {
            const newPayDate = parseISO(newRun.pay_date)
            const newMonth = startOfMonth(newPayDate)
            if (newMonth.getTime() !== currentPeriod.getTime()) {
              setCurrentPeriod(newMonth)
              return // fetchRuns will be triggered by currentPeriod change
            }
          }
        } else {
          const body = await res.json().catch(() => ({}))
          console.error('Auto-generate next period failed:', body.error || res.status)
        }
      } catch (err) {
        console.error('Auto-generate network error:', err)
      }

      await fetchRuns()
    } catch (err) {
      console.error('Error marking all complete:', err)
    }
  }

  const saveNotes = async (runId: string, newNotes: string) => {
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

  const addStep = async (runId: string) => {
    if (!newStepName.trim()) return
    setAddingStep(true)
    try {
      const run = runs.find((r) => r.id === runId)
      const maxOrder = run ? Math.max(0, ...run.checklist_items.map((i) => i.sort_order)) : 0
      const res = await fetch('/api/payroll-runs/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_step', payroll_run_id: runId, name: newStepName.trim(), sort_order: maxOrder + 1 }),
      })
      if (!res.ok) throw new Error('Failed to add step')
      setNewStepName('')
      await fetchRuns()
      // Refresh selectedRun
      const updated = runs.find((r) => r.id === runId)
      if (updated) setSelectedRun(updated)
    } catch (err) {
      console.error('Error adding step:', err)
    } finally {
      setAddingStep(false)
    }
  }

  const openChecklist = (run: PayrollRun) => {
    setSelectedRun(run)
    setPanelOpen(true)
  }

  // Keep selectedRun in sync with runs data
  useEffect(() => {
    if (selectedRun) {
      const updated = runs.find((r) => r.id === selectedRun.id)
      if (updated) setSelectedRun(updated)
    }
  }, [runs, selectedRun])

  // ── Period navigation ────────────────────────────────────────────────────────

  const periodLabel = format(currentPeriod, 'MMMM yyyy')
  const goToPrevPeriod = () => setCurrentPeriod(subMonths(currentPeriod, 1))
  const goToNextPeriod = () => setCurrentPeriod(addMonths(currentPeriod, 1))

  // ── Prevent hydration mismatch ──────────────────────────────────────────────

  if (!mounted) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-14 rounded-xl" style={{ background: colors.border }} />
        <div className="h-12 rounded-xl" style={{ background: colors.border }} />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-lg" style={{ background: colors.border }} />
          ))}
        </div>
      </div>
    )
  }

  // ── Loading: Skeleton cards ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Skeleton header */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 rounded-lg animate-pulse" style={{ background: colors.border }} />
          <div className="h-9 w-44 rounded-lg animate-pulse" style={{ background: colors.border }} />
        </div>
        {/* Skeleton summary bar */}
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex-1 h-16 rounded-lg animate-pulse" style={{ background: colors.border }} />
          ))}
        </div>
        {/* Skeleton cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-lg animate-pulse" style={{ background: colors.border }} />
          ))}
        </div>
      </div>
    )
  }

  // ── Error State ─────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center p-8 rounded-xl" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: '#F59E0B' }} />
          <h3 className="text-base font-semibold mb-2" style={{ color: colors.text.primary }}>
            Could not load payroll runs
          </h3>
          <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>Try refreshing.</p>
          <Button
            onClick={fetchRuns}
            className="text-white font-semibold px-5 py-2 rounded-md border-0"
            style={{ backgroundColor: '#F59E0B' }}
          >
            Refresh
          </Button>
        </div>
      </div>
    )
  }

  // ── Empty State ─────────────────────────────────────────────────────────────

  if (runs.length === 0 && !loading) {
    return (
      <div className="space-y-4">
        {/* Header still shows */}
        <PageHeader
          periodLabel={periodLabel}
          viewMode={viewMode}
          onViewChange={setViewMode}
          onPrevPeriod={goToPrevPeriod}
          onNextPeriod={goToNextPeriod}
          colors={colors}
        />
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="text-center p-10">
            <div
              className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: `${colors.primary}12` }}
            >
              <CalendarPlus className="w-8 h-8" style={{ color: colors.primary }} />
            </div>
            <h3 className="text-base font-semibold mb-2" style={{ color: colors.text.primary }}>
              No payroll runs for {periodLabel}
            </h3>
            <p className="text-sm mb-5" style={{ color: colors.text.muted }}>
              Add your first run to start tracking this period.
            </p>
            <Link href="/dashboard/clients/add">
              <Button
                className="text-white font-semibold px-5 py-2.5 rounded-md border-0"
                style={{ backgroundColor: colors.primary }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Payroll Run
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Main content ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Zone A — Header */}
      <PageHeader
        periodLabel={periodLabel}
        viewMode={viewMode}
        onViewChange={setViewMode}
        onPrevPeriod={goToPrevPeriod}
        onNextPeriod={goToNextPeriod}
        colors={colors}
        showSearch={showSearch}
        searchQuery={searchQuery}
        onToggleSearch={() => { setShowSearch(!showSearch); if (showSearch) setSearchQuery('') }}
        onSearchChange={setSearchQuery}
      />

      {/* Client filter banner */}
      {clientFilter && runs.length > 0 && (
        <div
          className="flex items-center justify-between px-4 py-2.5 rounded-lg"
          style={{ backgroundColor: `${colors.primary}08`, border: `1px solid ${colors.primary}20` }}
        >
          <p className="text-[0.82rem] font-semibold" style={{ color: colors.text.primary }}>
            Showing payrolls for <span style={{ color: colors.primary }}>{runs[0]?.clients?.name}</span>
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/payrolls')}
            className="rounded-lg text-xs font-semibold h-7 px-2"
            style={{ color: colors.primary }}
          >
            Show All
          </Button>
        </div>
      )}

      {/* Zone B — Summary Bar */}
      <SummaryBar
        counts={counts}
        statusFilter={statusFilter}
        onFilterChange={(f) => setStatusFilter(statusFilter === f ? 'all' : f)}
        colors={colors}
        isDark={isDark}
      />

      {/* Zone C — Board or List */}
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRuns.map((run) => (
            <RunCard
              key={run.id}
              run={run}
              colors={colors}
              isDark={isDark}
              onOpenChecklist={() => openChecklist(run)}
              onMarkComplete={() => markAllComplete(run)}
            />
          ))}
        </div>
      ) : (
        <RunListView
          runs={filteredRuns}
          colors={colors}
          isDark={isDark}
          onOpenChecklist={openChecklist}
          onMarkComplete={markAllComplete}
        />
      )}

      {filteredRuns.length === 0 && runs.length > 0 && (
        <div className="text-center py-16">
          <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: colors.text.muted }} />
          <p className="text-sm font-medium" style={{ color: colors.text.secondary }}>
            No payroll runs match this filter.
          </p>
          <button
            onClick={() => setStatusFilter('all')}
            className="mt-2 text-xs font-semibold"
            style={{ color: colors.primary }}
          >
            Show all runs
          </button>
        </div>
      )}

      {/* Summary footer */}
      <p className="text-[0.72rem] font-medium text-center" style={{ color: colors.text.muted }}>
        Showing {filteredRuns.length} of {runs.length} payroll runs
      </p>

      {/* Checklist Side Panel */}
      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent side="right" className="w-full sm:max-w-[420px] overflow-y-auto p-0" style={{ backgroundColor: colors.surface }}>
          {selectedRun && (
            <ChecklistPanel
              run={selectedRun}
              colors={colors}
              isDark={isDark}
              togglingItem={togglingItem}
              savingNotes={savingNotes}
              addingStep={addingStep}
              newStepName={newStepName}
              onToggleItem={toggleChecklistItem}
              onMarkAllComplete={() => markAllComplete(selectedRun)}
              onSaveNotes={saveNotes}
              onNewStepNameChange={setNewStepName}
              onAddStep={() => addStep(selectedRun.id)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════════════

// ── Page Header ────────────────────────────────────────────────────────────────

interface PageHeaderProps {
  periodLabel: string
  viewMode: ViewMode
  onViewChange: (v: ViewMode) => void
  onPrevPeriod: () => void
  onNextPeriod: () => void
  colors: ReturnType<typeof getThemeColors>
  showSearch?: boolean
  searchQuery?: string
  onToggleSearch?: () => void
  onSearchChange?: (q: string) => void
}

function PageHeader({
  periodLabel,
  viewMode,
  onViewChange,
  onPrevPeriod,
  onNextPeriod,
  colors,
  showSearch,
  searchQuery,
  onToggleSearch,
  onSearchChange,
}: PageHeaderProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>
          Payroll Runs
        </h1>
        <div className="flex items-center gap-2">
          {/* Period navigation */}
          <div className="flex items-center gap-1 rounded-lg px-1 py-0.5" style={{ border: `1px solid ${colors.border}` }}>
            <button onClick={onPrevPeriod} className="p-1.5 rounded-md hover:opacity-70 transition-opacity" style={{ color: colors.text.secondary }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[0.82rem] font-semibold px-2 min-w-[120px] text-center" style={{ color: colors.text.primary }}>
              {periodLabel}
            </span>
            <button onClick={onNextPeriod} className="p-1.5 rounded-md hover:opacity-70 transition-opacity" style={{ color: colors.text.secondary }}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${colors.border}` }}>
            <button
              onClick={() => onViewChange('board')}
              className="p-1.5 transition-all"
              style={{
                backgroundColor: viewMode === 'board' ? colors.primary : 'transparent',
                color: viewMode === 'board' ? '#FFFFFF' : colors.text.muted,
              }}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewChange('list')}
              className="p-1.5 transition-all"
              style={{
                backgroundColor: viewMode === 'list' ? colors.primary : 'transparent',
                color: viewMode === 'list' ? '#FFFFFF' : colors.text.muted,
              }}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Search toggle */}
          {onToggleSearch && (
            <button
              onClick={onToggleSearch}
              className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
              style={{ color: showSearch ? colors.primary : colors.text.muted }}
            >
              {showSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>
          )}

          {/* Add button */}
          <Link href="/dashboard/clients/add">
            <Button
              className="text-white font-semibold text-xs rounded-md border-0 h-8 px-3"
              style={{ backgroundColor: colors.primary }}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Payroll Run
            </Button>
          </Link>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && onSearchChange && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.text.muted }} />
          <input
            type="text"
            value={searchQuery ?? ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by client name..."
            autoFocus
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm font-medium focus:outline-none transition-all"
            style={{
              backgroundColor: colors.surface,
              color: colors.text.primary,
              border: `1px solid ${colors.border}`,
            }}
            onFocus={(e) => { e.target.style.borderColor = `${colors.primary}60` }}
            onBlur={(e) => { e.target.style.borderColor = colors.border }}
          />
        </div>
      )}
    </div>
  )
}

// ── Summary Bar ────────────────────────────────────────────────────────────────

interface SummaryBarProps {
  counts: { total: number; complete: number; in_progress: number; overdue: number }
  statusFilter: StatusFilter
  onFilterChange: (f: StatusFilter) => void
  colors: ReturnType<typeof getThemeColors>
  isDark: boolean
}

function SummaryBar({ counts, statusFilter, onFilterChange, colors, isDark }: SummaryBarProps) {
  const pills: { key: StatusFilter; label: string; count: number; color: string }[] = [
    { key: 'all', label: 'Active', count: counts.total - counts.complete, color: colors.primary },
    { key: 'in_progress', label: 'In Progress', count: counts.in_progress, color: '#F59E0B' },
    { key: 'overdue', label: 'Overdue', count: counts.overdue, color: '#EF4444' },
    { key: 'complete', label: 'Complete', count: counts.complete, color: colors.success },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {pills.map((pill) => {
        const isActive = statusFilter === pill.key
        return (
          <button
            key={pill.key}
            onClick={() => onFilterChange(pill.key)}
            className="flex flex-col items-center py-3 px-5 rounded-lg transition-all duration-150"
            style={{
              backgroundColor: colors.surface,
              border: `2px solid ${isActive ? pill.color : colors.border}`,
              ...(isActive ? { backgroundColor: isDark ? `${pill.color}10` : `${pill.color}08` } : {}),
            }}
          >
            <span className="text-2xl font-bold" style={{ color: pill.color }}>
              {pill.count}
            </span>
            <span className="text-[0.78rem] font-medium mt-0.5" style={{ color: colors.text.muted }}>
              {pill.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── Run Card (Board View) ──────────────────────────────────────────────────────

interface RunCardProps {
  run: PayrollRun
  colors: ReturnType<typeof getThemeColors>
  isDark: boolean
  onOpenChecklist: () => void
  onMarkComplete: () => void
}

function RunCard({ run, colors, isDark, onOpenChecklist, onMarkComplete }: RunCardProps) {
  const status = computeStatus(run)
  const config = getStatusConfig(status, isDark)
  const items = run.checklist_items ?? []
  const completedCount = items.filter((i) => i.is_completed).length
  const totalCount = items.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const isOverdue = status === 'overdue'
  const isComplete = status === 'complete'

  const daysUntil = differenceInDays(parseISO(run.pay_date), new Date())
  const isDueToday = daysUntil === 0

  // Pay period display
  const payPeriod = `${formatDateShort(run.period_start)} – ${formatDateShort(run.period_end)}`

  // Pay date display
  let payDateLabel = `Pay Date: ${formatDateShort(run.pay_date)}`
  let payDateColor = colors.text.muted
  if (isOverdue) {
    payDateLabel = `OVERDUE · ${formatDateShort(run.pay_date)}`
    payDateColor = '#EF4444'
  } else if (isDueToday && !isComplete) {
    payDateLabel = `Pay Date: Today`
    payDateColor = '#F59E0B'
  }

  return (
    <div
      className="relative group"
      style={{
        backgroundColor: colors.surface,
        borderRadius: '8px',
        border: `1px solid ${isOverdue ? '#EF444440' : colors.border}`,
        borderLeft: isOverdue ? '4px solid #EF4444' : `1px solid ${isOverdue ? '#EF444440' : colors.border}`,
        opacity: isComplete ? 0.75 : 1,
        boxShadow: isOverdue
          ? `0 4px 12px rgba(239, 68, 68, 0.15)`
          : `0 1px 3px ${colors.shadow.light}`,
        transition: 'transform 150ms ease-in-out, box-shadow 150ms ease-in-out',
        ...(isOverdue ? { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.05)' : '#FFF5F5' } : {}),
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = isOverdue
          ? '0 8px 20px rgba(239, 68, 68, 0.2)'
          : `0 4px 12px ${colors.shadow.medium}`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = isOverdue
          ? '0 4px 12px rgba(239, 68, 68, 0.15)'
          : `0 1px 3px ${colors.shadow.light}`
      }}
    >
      {/* Status bar at top */}
      <div
        className="rounded-t-lg"
        style={{ height: '4px', backgroundColor: config.dot }}
      />

      <div className="p-4 space-y-3">
        {/* Client name + Status badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <Link
                href={`/dashboard/clients/${run.client_id}`}
                className="text-[0.95rem] font-semibold truncate hover:underline"
                style={{ color: colors.text.primary }}
                onClick={(e) => e.stopPropagation()}
              >
                {run.clients?.name ?? 'Unknown Client'}
              </Link>
              {run.clients?.pay_frequency && (
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wide flex-shrink-0"
                  style={{
                    backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
                    color: isDark ? '#A78BFA' : '#7C3AED',
                  }}
                >
                  {formatPayFrequency(run.clients.pay_frequency)}
                </span>
              )}
            </div>
            <p className="text-[0.78rem] mt-0.5" style={{ color: colors.text.muted }}>
              {payPeriod} · {formatPayFrequency(run.clients?.pay_frequency ?? null)}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {isOverdue && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
            )}
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[0.72rem] font-bold"
              style={{
                backgroundColor: config.bg,
                color: config.text,
                border: `1px solid ${config.border}`,
              }}
            >
              {config.label}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%`, backgroundColor: config.dot }}
            />
          </div>
          <p className="text-[0.72rem] font-medium mt-1" style={{ color: colors.text.muted }}>
            {completedCount} of {totalCount} steps
          </p>
        </div>

        {/* Pay date */}
        <p
          className="text-[0.78rem]"
          style={{ color: payDateColor, fontWeight: isOverdue || isDueToday ? 700 : 400 }}
        >
          {payDateLabel}
        </p>

        {/* Card footer */}
        <div className="flex items-center justify-between pt-1" style={{ borderTop: `1px solid ${colors.border}` }}>
          <button
            onClick={onOpenChecklist}
            className="text-[0.78rem] font-semibold px-3 py-1.5 rounded-md transition-opacity hover:opacity-80"
            style={{ color: colors.primary }}
          >
            {isComplete ? 'View Details' : 'Open Checklist'}
          </button>
          {!isComplete && (
            <button
              onClick={onMarkComplete}
              className="text-[0.78rem] font-semibold px-3 py-1.5 rounded-md text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: colors.success }}
            >
              Mark Complete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── List View ──────────────────────────────────────────────────────────────────

interface RunListViewProps {
  runs: PayrollRun[]
  colors: ReturnType<typeof getThemeColors>
  isDark: boolean
  onOpenChecklist: (run: PayrollRun) => void
  onMarkComplete: (run: PayrollRun) => void
}

function RunListView({ runs, colors, isDark, onOpenChecklist }: RunListViewProps) {
  const [sortField, setSortField] = useState<'client' | 'status' | 'progress' | 'pay_date'>('pay_date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sorted = useMemo(() => {
    return [...runs].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      switch (sortField) {
        case 'client':
          return dir * (a.clients?.name ?? '').localeCompare(b.clients?.name ?? '')
        case 'status': {
          const w: Record<PayrollStatus, number> = { overdue: 0, due_soon: 1, in_progress: 2, not_started: 3, complete: 4 }
          return dir * (w[computeStatus(a)] - w[computeStatus(b)])
        }
        case 'progress': {
          const pa = a.checklist_items?.length ? a.checklist_items.filter((i) => i.is_completed).length / a.checklist_items.length : 0
          const pb = b.checklist_items?.length ? b.checklist_items.filter((i) => i.is_completed).length / b.checklist_items.length : 0
          return dir * (pa - pb)
        }
        case 'pay_date':
        default:
          return dir * (new Date(a.pay_date).getTime() - new Date(b.pay_date).getTime())
      }
    })
  }, [runs, sortField, sortDir])

  const handleSort = (field: typeof sortField) => {
    if (field === sortField) setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const thStyle: React.CSSProperties = {
    color: colors.text.muted,
    fontSize: '0.68rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    cursor: 'pointer',
    userSelect: 'none',
    padding: '10px 12px',
  }

  const SortArrow = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return null
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="overflow-x-auto rounded-lg" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)' }}>
            <th style={thStyle} className="text-left" onClick={() => handleSort('client')}>
              Client<SortArrow field="client" />
            </th>
            <th style={thStyle} className="text-left hidden md:table-cell">Pay Period</th>
            <th style={thStyle} className="text-left" onClick={() => handleSort('status')}>
              Status<SortArrow field="status" />
            </th>
            <th style={thStyle} className="text-left hidden sm:table-cell" onClick={() => handleSort('progress')}>
              Progress<SortArrow field="progress" />
            </th>
            <th style={thStyle} className="text-left" onClick={() => handleSort('pay_date')}>
              Pay Date<SortArrow field="pay_date" />
            </th>
            <th style={{ ...thStyle, width: '48px' }} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((run) => {
            const status = computeStatus(run)
            const config = getStatusConfig(status, isDark)
            const items = run.checklist_items ?? []
            const completedCount = items.filter((i) => i.is_completed).length
            const totalCount = items.length
            const isOverdue = status === 'overdue'
            const daysUntil = differenceInDays(parseISO(run.pay_date), new Date())

            return (
              <tr
                key={run.id}
                className="group transition-colors cursor-pointer"
                style={{ borderBottom: `1px solid ${colors.border}` }}
                onClick={() => onOpenChecklist(run)}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.02)' : '#F9FAFB' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <td className="px-3 py-3">
                  <Link
                    href={`/dashboard/clients/${run.client_id}`}
                    className="text-[0.85rem] font-semibold hover:underline"
                    style={{ color: colors.primary }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {run.clients?.name ?? 'Unknown'} ↗
                  </Link>
                </td>
                <td className="px-3 py-3 hidden md:table-cell">
                  <span className="text-[0.82rem]" style={{ color: colors.text.secondary }}>
                    {formatDateShort(run.period_start)} – {formatDateShort(run.period_end)}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.72rem] font-bold"
                    style={{ backgroundColor: config.bg, color: config.text, border: `1px solid ${config.border}` }}
                  >
                    {isOverdue && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                      </span>
                    )}
                    {config.label}
                  </span>
                </td>
                <td className="px-3 py-3 hidden sm:table-cell">
                  <span className="text-[0.82rem] font-medium" style={{ color: colors.text.secondary }}>
                    {completedCount} / {totalCount}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span
                    className="text-[0.82rem]"
                    style={{
                      color: isOverdue ? '#EF4444' : daysUntil === 0 ? '#F59E0B' : colors.text.secondary,
                      fontWeight: isOverdue || daysUntil === 0 ? 700 : 400,
                    }}
                  >
                    {isOverdue && '⚠ '}{formatDateShort(run.pay_date)}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenChecklist(run) }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                    style={{ color: colors.text.muted }}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Checklist Side Panel ───────────────────────────────────────────────────────

interface ChecklistPanelProps {
  run: PayrollRun
  colors: ReturnType<typeof getThemeColors>
  isDark: boolean
  togglingItem: string | null
  savingNotes: string | null
  addingStep: boolean
  newStepName: string
  onToggleItem: (item: ChecklistItem) => void
  onMarkAllComplete: () => void
  onSaveNotes: (runId: string, notes: string) => void
  onNewStepNameChange: (name: string) => void
  onAddStep: () => void
}

function ChecklistPanel({
  run,
  colors,
  isDark,
  togglingItem,
  savingNotes,
  addingStep,
  newStepName,
  onToggleItem,
  onMarkAllComplete,
  onSaveNotes,
  onNewStepNameChange,
  onAddStep,
}: ChecklistPanelProps) {
  const [localNotes, setLocalNotes] = useState(run.notes ?? '')
  const items = [...(run.checklist_items ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const completedCount = items.filter((i) => i.is_completed).length
  const totalCount = items.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const allComplete = totalCount > 0 && completedCount === totalCount
  const status = computeStatus(run)
  const config = getStatusConfig(status, isDark)

  // Sync localNotes when run changes
  useEffect(() => {
    setLocalNotes(run.notes ?? '')
  }, [run.notes])

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="p-6 pb-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
        <SheetHeader className="p-0">
          <SheetTitle className="text-lg font-bold flex items-center gap-2" style={{ color: colors.text.primary }}>
            {run.clients?.name ?? 'Unknown Client'}
            {run.clients?.pay_frequency && (
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wide"
                style={{
                  backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
                  color: isDark ? '#A78BFA' : '#7C3AED',
                }}
              >
                {formatPayFrequency(run.clients.pay_frequency)}
              </span>
            )}
          </SheetTitle>
          <SheetDescription className="text-[0.82rem] font-medium" style={{ color: colors.text.muted }}>
            {formatDateShort(run.period_start)} – {formatDateShort(run.period_end)} · {formatPayFrequency(run.clients?.pay_frequency ?? null)}
          </SheetDescription>
        </SheetHeader>

        {/* Status + Progress */}
        <div className="mt-4 flex items-center gap-3">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.72rem] font-bold"
            style={{ backgroundColor: config.bg, color: config.text, border: `1px solid ${config.border}` }}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.dot }} />
            {config.label}
          </span>
          <span className="text-[0.82rem] font-medium" style={{ color: colors.text.muted }}>
            {completedCount} of {totalCount} steps complete
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%`, backgroundColor: config.dot }}
            />
          </div>
          <p className="text-[0.72rem] font-bold text-right mt-1" style={{ color: config.text }}>
            {progressPercent}%
          </p>
        </div>
      </div>

      {/* Checklist items */}
      <div className="flex-1 overflow-y-auto p-6 space-y-1">
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
              onMouseEnter={(e) => {
                if (!item.is_completed) e.currentTarget.style.backgroundColor = isDark ? 'rgba(124, 92, 191, 0.08)' : '#F5F3FF'
              }}
              onMouseLeave={(e) => {
                if (!item.is_completed) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <div className="relative flex-shrink-0">
                <input
                  type="checkbox"
                  checked={item.is_completed}
                  onChange={() => onToggleItem(item)}
                  disabled={togglingItem === item.id}
                  className="w-4.5 h-4.5 rounded cursor-pointer accent-emerald-600"
                  style={{ width: '18px', height: '18px' }}
                />
                {togglingItem === item.id && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: colors.primary }} />
                  </div>
                )}
              </div>
              <span
                className={`text-[0.85rem] font-medium flex-1 ${item.is_completed ? 'line-through' : ''}`}
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

        {/* Add step input */}
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
            onFocus={(e) => { e.target.style.borderColor = `${colors.primary}60` }}
            onBlur={(e) => { e.target.style.borderColor = colors.border }}
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

      {/* Panel footer */}
      <div className="p-6 pt-4 space-y-2" style={{ borderTop: `1px solid ${colors.border}` }}>
        {/* Notes */}
        <div>
          <p className="text-[0.72rem] font-bold uppercase tracking-wider mb-1.5" style={{ color: colors.text.muted }}>
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
            onFocus={(e) => { e.target.style.borderColor = `${colors.primary}60` }}
            onBlurCapture={(e) => { e.target.style.borderColor = colors.border }}
          />
        </div>

        {/* Deadlines */}
        <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB', border: `1px solid ${colors.border}` }}>
          {[
            { label: 'FPS Due', value: formatDate(run.rti_due_date) },
            { label: 'EPS Due', value: formatDate(run.eps_due_date) },
            { label: 'Pay Date', value: formatDate(run.pay_date) },
          ].map((d) => (
            <div key={d.label} className="flex items-center justify-between">
              <span className="text-[0.75rem] font-medium" style={{ color: colors.text.muted }}>{d.label}</span>
              <span className="text-[0.75rem] font-bold" style={{ color: colors.text.primary }}>{d.value}</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
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
