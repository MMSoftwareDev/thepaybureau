'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { getPayrollStatus, type PayrollStatus } from '@/lib/hmrc-deadlines'
import { format, differenceInDays, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  Plus,
  AlertTriangle,
  ListChecks,
  StickyNote,
} from 'lucide-react'
import Link from 'next/link'

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

type FilterTab = 'all' | 'due_this_week' | 'overdue' | 'complete'

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatPayFrequency(freq: string | null): string {
  if (!freq) return 'N/A'
  const map: Record<string, string> = {
    weekly: 'Weekly',
    fortnightly: 'Fortnightly',
    four_weekly: 'Four-Weekly',
    monthly: 'Monthly',
  }
  return map[freq] ?? freq
}

function getStatusBadgeClasses(status: PayrollStatus): string {
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

function getStatusLabel(status: PayrollStatus): string {
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
    default:
      return 'Not Started'
  }
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

// ── Component ──────────────────────────────────────────────────────────────────

export default function PayrollsPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)
  const [savingNotes, setSavingNotes] = useState<string | null>(null)
  const [togglingItem, setTogglingItem] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState<string | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const supabase = createClientSupabaseClient()

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchRuns = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('payroll_runs')
        .select('*, clients(name, pay_frequency), checklist_items(*)')
        .order('pay_date', { ascending: true })

      if (fetchError) throw fetchError

      setRuns((data as unknown as PayrollRun[]) ?? [])
    } catch (err) {
      console.error('Error fetching payroll runs:', err)
      setError(err instanceof Error ? err.message : 'Failed to load payroll runs')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    setMounted(true)
    fetchRuns()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Filter logic ───────────────────────────────────────────────────────────

  const filteredRuns = runs.filter((run) => {
    const status = computeStatus(run)

    switch (activeFilter) {
      case 'due_this_week': {
        if (status === 'complete') return false
        const daysUntil = differenceInDays(parseISO(run.pay_date), new Date())
        return daysUntil >= 0 && daysUntil <= 7
      }
      case 'overdue':
        return status === 'overdue'
      case 'complete':
        return status === 'complete'
      case 'all':
      default:
        return true
    }
  })

  // ── Actions ────────────────────────────────────────────────────────────────

  const toggleChecklistItem = async (item: ChecklistItem) => {
    setTogglingItem(item.id)
    try {
      const { error: updateError } = await supabase
        .from('checklist_items')
        .update({
          is_completed: !item.is_completed,
          completed_at: !item.is_completed ? new Date().toISOString() : null,
        })
        .eq('id', item.id)

      if (updateError) throw updateError
      await fetchRuns()
    } catch (err) {
      console.error('Error toggling checklist item:', err)
    } finally {
      setTogglingItem(null)
    }
  }

  const markAllComplete = async (run: PayrollRun) => {
    setMarkingAll(run.id)
    try {
      const incompleteItems = run.checklist_items.filter((i) => !i.is_completed)
      const ids = incompleteItems.map((i) => i.id)
      if (ids.length === 0) return

      const { error: updateError } = await supabase
        .from('checklist_items')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .in('id', ids)

      if (updateError) throw updateError
      await fetchRuns()
    } catch (err) {
      console.error('Error marking all complete:', err)
    } finally {
      setMarkingAll(null)
    }
  }

  const saveNotes = async (runId: string, newNotes: string) => {
    setSavingNotes(runId)
    try {
      const { error: updateError } = await supabase
        .from('payroll_runs')
        .update({ notes: newNotes })
        .eq('id', runId)

      if (updateError) throw updateError
      await fetchRuns()
    } catch (err) {
      console.error('Error saving notes:', err)
    } finally {
      setSavingNotes(null)
    }
  }

  const generateNextPeriod = async (run: PayrollRun) => {
    setGenerating(run.id)
    try {
      const res = await fetch('/api/payroll-runs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: run.client_id }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to generate next period')
      }
      await fetchRuns()
    } catch (err) {
      console.error('Error generating next period:', err)
    } finally {
      setGenerating(null)
    }
  }

  // ── Render helpers ─────────────────────────────────────────────────────────

  const filterTabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'due_this_week', label: 'Due This Week' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'complete', label: 'Complete' },
  ]

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 rounded-xl" style={{ backgroundColor: colors.glass.surface }} />
        <div className="h-12 rounded-xl" style={{ backgroundColor: colors.glass.surface }} />
        <div className="h-96 rounded-xl" style={{ backgroundColor: colors.glass.surface }} />
      </div>
    )
  }

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div
        className="min-h-[60vh] flex items-center justify-center transition-colors duration-300"
      >
        <div className="text-center">
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-2xl shadow-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              boxShadow: isDark
                ? `0 25px 50px ${colors.shadow.heavy}`
                : `0 20px 40px ${colors.primary}30`,
            }}
          >
            <ListChecks className="w-10 h-10 text-white animate-pulse" />
          </div>
          <p
            className="text-xl font-semibold transition-colors duration-300"
            style={{ color: colors.text.primary }}
          >
            Loading payrolls...
          </p>
        </div>
      </div>
    )
  }

  // ── Error state ────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center transition-colors duration-300">
        <Card
          className="max-w-md border-0 shadow-2xl"
          style={{
            backgroundColor: colors.glass.card,
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: `1px solid ${colors.borderElevated}`,
            boxShadow: isDark
              ? `0 25px 50px ${colors.shadow.heavy}`
              : `0 20px 40px ${colors.primary}20`,
          }}
        >
          <CardContent className="p-8 text-center">
            <AlertTriangle
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: colors.error }}
            />
            <h3
              className="text-xl font-bold mb-3 transition-colors duration-300"
              style={{ color: colors.text.primary }}
            >
              Error Loading Payrolls
            </h3>
            <p
              className="text-base mb-6 transition-colors duration-300"
              style={{ color: colors.text.secondary }}
            >
              {error}
            </p>
            <Button
              onClick={fetchRuns}
              className="text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                boxShadow: `0 10px 25px ${colors.primary}30`,
              }}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Empty state ────────────────────────────────────────────────────────────

  if (runs.length === 0) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1
            className="text-4xl font-bold mb-2 transition-colors duration-300"
            style={{ color: colors.text.primary }}
          >
            Payrolls
          </h1>
          <p
            className="text-lg transition-colors duration-300"
            style={{ color: colors.text.secondary }}
          >
            {format(new Date(), 'MMMM yyyy')}
          </p>
        </div>

        <Card
          className="border-0 shadow-xl"
          style={{
            backgroundColor: colors.glass.card,
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: `1px solid ${colors.borderElevated}`,
            boxShadow: isDark
              ? `0 15px 35px ${colors.shadow.medium}`
              : `0 10px 25px ${colors.shadow.light}`,
          }}
        >
          <CardContent className="p-12">
            <div className="text-center">
              <div
                className="w-20 h-20 mx-auto mb-6 rounded-2xl shadow-xl flex items-center justify-center"
                style={{
                  backgroundColor: `${colors.primary}15`,
                  border: `2px dashed ${colors.primary}30`,
                }}
              >
                <Calendar className="w-10 h-10" style={{ color: colors.primary }} />
              </div>
              <h3
                className="text-xl font-bold mb-3 transition-colors duration-300"
                style={{ color: colors.text.primary }}
              >
                No payroll runs yet
              </h3>
              <p
                className="text-base mb-6 transition-colors duration-300"
                style={{ color: colors.text.secondary }}
              >
                Add a client to get started.
              </p>
              <Link href="/dashboard/clients/add">
                <Button
                  className="text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                    boxShadow: `0 10px 25px ${colors.primary}30`,
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add a Client
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Main content ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1
          className="text-4xl font-bold mb-2 transition-colors duration-300"
          style={{ color: colors.text.primary }}
        >
          Payrolls
        </h1>
        <p
          className="text-lg transition-colors duration-300"
          style={{ color: colors.text.secondary }}
        >
          {format(new Date(), 'MMMM yyyy')}
        </p>
      </div>

      {/* Filter tabs */}
      <Card
        className="border-0 shadow-xl transition-all duration-300"
        style={{
          backgroundColor: colors.glass.card,
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: `1px solid ${colors.borderElevated}`,
          boxShadow: isDark
            ? `0 10px 30px ${colors.shadow.medium}`
            : `0 10px 25px ${colors.shadow.light}`,
        }}
      >
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => {
              const isActive = activeFilter === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300',
                    isActive ? 'shadow-lg' : 'hover:shadow-md'
                  )}
                  style={{
                    backgroundColor: isActive
                      ? colors.primary
                      : colors.glass.surface,
                    color: isActive ? '#FFFFFF' : colors.text.secondary,
                    border: `1px solid ${isActive ? colors.primary : colors.borderElevated}`,
                    boxShadow: isActive
                      ? `0 4px 15px ${colors.primary}40`
                      : 'none',
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
          <div
            className="mt-3 text-sm font-medium"
            style={{ color: colors.text.muted }}
          >
            Showing {filteredRuns.length} of {runs.length} payroll runs
          </div>
        </CardContent>
      </Card>

      {/* Payroll runs list */}
      <Card
        className="border-0 shadow-xl transition-all duration-300"
        style={{
          backgroundColor: colors.glass.card,
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          border: `1px solid ${colors.borderElevated}`,
          boxShadow: isDark
            ? `0 15px 35px ${colors.shadow.medium}`
            : `0 10px 25px ${colors.shadow.light}`,
        }}
      >
        <CardHeader>
          <CardTitle
            className="flex items-center justify-between text-xl font-bold transition-colors duration-300"
            style={{ color: colors.text.primary }}
          >
            <span>Payroll Runs</span>
            <Badge
              className="text-xs font-bold px-3 py-1 shadow-lg"
              style={{
                backgroundColor: `${colors.secondary}20`,
                color: colors.secondary,
                border: `1px solid ${colors.secondary}30`,
              }}
            >
              {filteredRuns.length} runs
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRuns.length === 0 ? (
            <div className="text-center py-12">
              <FileText
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: colors.text.muted }}
              />
              <p
                className="text-base font-medium"
                style={{ color: colors.text.secondary }}
              >
                No payroll runs match the current filter.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRuns.map((run) => {
                const status = computeStatus(run)
                const items = run.checklist_items ?? []
                const completedCount = items.filter((i) => i.is_completed).length
                const totalCount = items.length
                const progressPercent =
                  totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
                const isExpanded = expandedRunId === run.id

                return (
                  <div key={run.id}>
                    {/* Row */}
                    <div
                      className="rounded-xl transition-all duration-300 cursor-pointer"
                      style={{
                        backgroundColor: isExpanded
                          ? colors.glass.surfaceHover
                          : colors.glass.surface,
                        border: `1px solid ${isExpanded ? colors.borderElevated : colors.border}`,
                        boxShadow: isExpanded
                          ? `0 4px 15px ${colors.shadow.light}`
                          : 'none',
                      }}
                      onClick={() =>
                        setExpandedRunId(isExpanded ? null : run.id)
                      }
                      onMouseEnter={(e) => {
                        if (!isExpanded) {
                          e.currentTarget.style.backgroundColor =
                            colors.glass.surfaceHover
                          e.currentTarget.style.boxShadow = `0 4px 15px ${colors.shadow.light}`
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) {
                          e.currentTarget.style.backgroundColor =
                            colors.glass.surface
                          e.currentTarget.style.boxShadow = 'none'
                        }
                      }}
                    >
                      <div className="p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                          {/* Expand icon + Client name */}
                          <div className="flex items-center gap-3 lg:w-[220px] lg:min-w-[220px]">
                            {isExpanded ? (
                              <ChevronDown
                                className="w-5 h-5 flex-shrink-0"
                                style={{ color: colors.text.muted }}
                              />
                            ) : (
                              <ChevronRight
                                className="w-5 h-5 flex-shrink-0"
                                style={{ color: colors.text.muted }}
                              />
                            )}
                            <div className="min-w-0">
                              <p
                                className="font-bold truncate"
                                style={{ color: colors.text.primary }}
                              >
                                {run.clients?.name ?? 'Unknown Client'}
                              </p>
                              <p
                                className="text-xs font-medium"
                                style={{ color: colors.text.muted }}
                              >
                                {formatPayFrequency(
                                  run.clients?.pay_frequency ?? null
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Pay date */}
                          <div className="flex items-center gap-2 lg:w-[120px] lg:min-w-[120px]">
                            <Calendar
                              className="w-4 h-4 flex-shrink-0"
                              style={{ color: colors.text.muted }}
                            />
                            <span
                              className="text-sm font-medium"
                              style={{ color: colors.text.primary }}
                            >
                              {formatDate(run.pay_date)}
                            </span>
                          </div>

                          {/* Progress */}
                          <div className="flex items-center gap-3 lg:w-[160px] lg:min-w-[160px]">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className="text-xs font-semibold"
                                  style={{ color: colors.text.secondary }}
                                >
                                  {completedCount}/{totalCount}
                                </span>
                                <span
                                  className="text-xs font-medium"
                                  style={{ color: colors.text.muted }}
                                >
                                  {progressPercent}%
                                </span>
                              </div>
                              <div
                                className="h-2 rounded-full overflow-hidden"
                                style={{
                                  backgroundColor: isDark
                                    ? 'rgba(255,255,255,0.1)'
                                    : 'rgba(0,0,0,0.08)',
                                }}
                              >
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${progressPercent}%`,
                                    backgroundColor:
                                      status === 'complete'
                                        ? colors.success
                                        : status === 'overdue'
                                        ? colors.error
                                        : colors.primary,
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Status badge */}
                          <div className="lg:w-[110px] lg:min-w-[110px]">
                            <Badge
                              className={cn(
                                'text-xs font-bold px-3 py-1 border-0',
                                getStatusBadgeClasses(status)
                              )}
                            >
                              {getStatusLabel(status)}
                            </Badge>
                          </div>

                          {/* FPS due */}
                          <div className="lg:w-[110px] lg:min-w-[110px]">
                            <p
                              className="text-xs font-medium"
                              style={{ color: colors.text.muted }}
                            >
                              FPS Due
                            </p>
                            <p
                              className="text-sm font-semibold"
                              style={{ color: colors.text.primary }}
                            >
                              {formatDate(run.rti_due_date)}
                            </p>
                          </div>

                          {/* EPS due */}
                          <div className="lg:w-[110px] lg:min-w-[110px]">
                            <p
                              className="text-xs font-medium"
                              style={{ color: colors.text.muted }}
                            >
                              EPS Due
                            </p>
                            <p
                              className="text-sm font-semibold"
                              style={{ color: colors.text.primary }}
                            >
                              {formatDate(run.eps_due_date)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded panel */}
                    {isExpanded && (
                      <ExpandedPanel
                        run={run}
                        status={status}
                        colors={colors}
                        isDark={isDark}
                        togglingItem={togglingItem}
                        savingNotes={savingNotes}
                        markingAll={markingAll}
                        generating={generating}
                        onToggleItem={toggleChecklistItem}
                        onMarkAllComplete={markAllComplete}
                        onSaveNotes={saveNotes}
                        onGenerateNext={generateNextPeriod}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Expanded Panel Sub-component ─────────────────────────────────────────────

interface ExpandedPanelProps {
  run: PayrollRun
  status: PayrollStatus
  colors: ReturnType<typeof getThemeColors>
  isDark: boolean
  togglingItem: string | null
  savingNotes: string | null
  markingAll: string | null
  generating: string | null
  onToggleItem: (item: ChecklistItem) => void
  onMarkAllComplete: (run: PayrollRun) => void
  onSaveNotes: (runId: string, notes: string) => void
  onGenerateNext: (run: PayrollRun) => void
}

function ExpandedPanel({
  run,
  status,
  colors,
  isDark,
  togglingItem,
  savingNotes,
  markingAll,
  generating,
  onToggleItem,
  onMarkAllComplete,
  onSaveNotes,
  onGenerateNext,
}: ExpandedPanelProps) {
  const [localNotes, setLocalNotes] = useState(run.notes ?? '')
  const items = [...(run.checklist_items ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  )
  const completedCount = items.filter((i) => i.is_completed).length
  const allComplete = items.length > 0 && completedCount === items.length

  return (
    <div
      className="mt-1 rounded-xl p-6 space-y-6"
      style={{
        backgroundColor: colors.glass.surfaceHover,
        border: `1px solid ${colors.borderElevated}`,
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Checklist */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4
              className="text-sm font-bold flex items-center gap-2"
              style={{ color: colors.text.primary }}
            >
              <ListChecks className="w-4 h-4" style={{ color: colors.primary }} />
              Checklist
            </h4>
            {items.length > 0 && !allComplete && (
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkAllComplete(run)
                }}
                disabled={markingAll === run.id}
                className="text-white font-semibold rounded-lg text-xs transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, ${colors.success}, ${colors.success}CC)`,
                  boxShadow: `0 4px 12px ${colors.success}30`,
                }}
              >
                {markingAll === run.id ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                )}
                Mark All Complete
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <p
              className="text-sm italic"
              style={{ color: colors.text.muted }}
            >
              No checklist items for this run.
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200"
                  style={{
                    backgroundColor: item.is_completed
                      ? isDark
                        ? 'rgba(16, 185, 129, 0.1)'
                        : 'rgba(16, 185, 129, 0.05)'
                      : 'transparent',
                    border: `1px solid ${item.is_completed ? `${colors.success}30` : colors.border}`,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={item.is_completed}
                      onChange={() => onToggleItem(item)}
                      disabled={togglingItem === item.id}
                      className="w-5 h-5 rounded cursor-pointer accent-emerald-600"
                    />
                    {togglingItem === item.id && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: colors.primary }} />
                      </div>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium transition-all duration-200',
                      item.is_completed && 'line-through'
                    )}
                    style={{
                      color: item.is_completed
                        ? colors.text.muted
                        : colors.text.primary,
                    }}
                  >
                    {item.name}
                  </span>
                  {item.is_completed && item.completed_at && (
                    <span
                      className="text-xs ml-auto flex-shrink-0"
                      style={{ color: colors.text.muted }}
                    >
                      {formatDate(item.completed_at)}
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Notes + deadlines */}
        <div className="space-y-6">
          {/* Notes */}
          <div>
            <h4
              className="text-sm font-bold flex items-center gap-2 mb-3"
              style={{ color: colors.text.primary }}
            >
              <StickyNote className="w-4 h-4" style={{ color: colors.primary }} />
              Notes
              {savingNotes === run.id && (
                <span
                  className="text-xs font-normal ml-2"
                  style={{ color: colors.text.muted }}
                >
                  Saving...
                </span>
              )}
            </h4>
            <textarea
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={() => {
                if (localNotes !== (run.notes ?? '')) {
                  onSaveNotes(run.id, localNotes)
                }
              }}
              onClick={(e) => e.stopPropagation()}
              placeholder="Add notes for this payroll period..."
              rows={4}
              className="w-full rounded-lg p-3 text-sm font-medium resize-none focus:outline-none transition-all duration-300"
              style={{
                backgroundColor: colors.glass.surface,
                color: colors.text.primary,
                border: `1px solid ${colors.borderElevated}`,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = `${colors.primary}60`
                e.target.style.boxShadow = `0 0 0 2px ${colors.primary}20`
              }}
              onBlurCapture={(e) => {
                e.target.style.borderColor = colors.borderElevated
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Deadline summary */}
          <div>
            <h4
              className="text-sm font-bold flex items-center gap-2 mb-3"
              style={{ color: colors.text.primary }}
            >
              <Clock className="w-4 h-4" style={{ color: colors.primary }} />
              Deadlines
            </h4>
            <div
              className="rounded-lg p-4 space-y-3"
              style={{
                backgroundColor: colors.glass.surface,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-sm font-medium"
                  style={{ color: colors.text.secondary }}
                >
                  FPS Due
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: colors.text.primary }}
                >
                  {formatDate(run.rti_due_date)}
                </span>
              </div>
              <div
                className="h-px"
                style={{ backgroundColor: colors.border }}
              />
              <div className="flex items-center justify-between">
                <span
                  className="text-sm font-medium"
                  style={{ color: colors.text.secondary }}
                >
                  EPS Due
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: colors.text.primary }}
                >
                  {formatDate(run.eps_due_date)}
                </span>
              </div>
              <div
                className="h-px"
                style={{ backgroundColor: colors.border }}
              />
              <div className="flex items-center justify-between">
                <span
                  className="text-sm font-medium"
                  style={{ color: colors.text.secondary }}
                >
                  Pay Date
                </span>
                <span
                  className="text-sm font-bold"
                  style={{ color: colors.text.primary }}
                >
                  {formatDate(run.pay_date)}
                </span>
              </div>
            </div>
          </div>

          {/* Generate Next Period button */}
          {status === 'complete' && (
            <Button
              onClick={(e) => {
                e.stopPropagation()
                onGenerateNext(run)
              }}
              disabled={generating === run.id}
              className="w-full text-white font-semibold rounded-xl shadow-lg transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                boxShadow: `0 10px 25px ${colors.primary}30`,
              }}
            >
              {generating === run.id ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Generate Next Period
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
