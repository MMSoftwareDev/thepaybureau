'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
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
  Filter,
  Eye,
  EyeOff,
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

type FilterTab = 'active' | 'due_this_week' | 'overdue' | 'complete' | 'all'

// ── Status Config (Monday.com style) ────────────────────────────────────────

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
        bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
        text: isDark ? '#34D399' : '#059669',
        border: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
        dot: '#10B981',
      }
    case 'in_progress':
      return {
        label: 'In Progress',
        bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
        text: isDark ? '#60A5FA' : '#2563EB',
        border: isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE',
        dot: '#3B82F6',
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

// Status order for the cycle when clicking
const STATUS_CYCLE: PayrollStatus[] = ['not_started', 'in_progress', 'due_soon', 'complete']

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

// ── Component ──────────────────────────────────────────────────────────────────

export default function PayrollsPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('active')
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)
  const [savingNotes, setSavingNotes] = useState<string | null>(null)
  const [togglingItem, setTogglingItem] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState<string | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const searchParams = useSearchParams()
  const router = useRouter()
  const clientFilter = searchParams.get('client')

  const supabase = createClientSupabaseClient()

  // ── Data fetching ──────────────────────────────────────────────────────────

  const fetchRuns = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('payroll_runs')
        .select('*, clients(name, pay_frequency), checklist_items(*)')
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
  }, [supabase, clientFilter])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    fetchRuns()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientFilter])

  // ── Filter + search logic ─────────────────────────────────────────────────

  const filteredRuns = useMemo(() => {
    let result = runs

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (run) =>
          run.clients?.name?.toLowerCase().includes(q) ||
          formatPayFrequency(run.clients?.pay_frequency ?? null)
            .toLowerCase()
            .includes(q)
      )
    }

    // Apply filter tab
    result = result.filter((run) => {
      const status = computeStatus(run)
      switch (activeFilter) {
        case 'active':
          return status !== 'complete'
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

    return result
  }, [runs, activeFilter, searchQuery])

  // Status counts for filter badges
  const statusCounts = useMemo(() => {
    const searchFiltered = searchQuery.trim()
      ? runs.filter(
          (run) =>
            run.clients?.name
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            formatPayFrequency(run.clients?.pay_frequency ?? null)
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
        )
      : runs

    const counts = { active: 0, due_this_week: 0, overdue: 0, complete: 0, all: searchFiltered.length }
    for (const run of searchFiltered) {
      const status = computeStatus(run)
      if (status === 'complete') {
        counts.complete++
      } else {
        counts.active++
        if (status === 'overdue') counts.overdue++
        const daysUntil = differenceInDays(parseISO(run.pay_date), new Date())
        if (daysUntil >= 0 && daysUntil <= 7) counts.due_this_week++
      }
    }
    return counts
  }, [runs, searchQuery])

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

  const clientFilterName = useMemo(() => {
    if (!clientFilter || runs.length === 0) return null
    return runs[0]?.clients?.name ?? null
  }, [clientFilter, runs])

  const clearClientFilter = () => {
    router.push('/dashboard/payrolls')
  }

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'active', label: 'Active', count: statusCounts.active },
    { key: 'due_this_week', label: 'This Week', count: statusCounts.due_this_week },
    { key: 'overdue', label: 'Overdue', count: statusCounts.overdue },
    { key: 'complete', label: 'Complete', count: statusCounts.complete },
    { key: 'all', label: 'All', count: statusCounts.all },
  ]

  const cardStyle = {
    backgroundColor: colors.surface,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-14 rounded-xl" style={{ background: colors.border }} />
        <div className="h-12 rounded-xl" style={{ background: colors.border }} />
        <div className="h-96 rounded-xl" style={{ background: colors.border }} />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: colors.primary }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md border-0" style={cardStyle}>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: colors.error }} />
            <h3 className="text-lg font-bold mb-2" style={{ color: colors.text.primary }}>
              Error Loading Payrolls
            </h3>
            <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>{error}</p>
            <Button
              onClick={fetchRuns}
              className="text-white font-semibold px-5 py-2 rounded-lg border-0"
              style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (runs.length === 0) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>Payrolls</h1>
          <p className="text-[0.82rem] mt-0.5" style={{ color: colors.text.muted }}>{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        </div>
        <Card className="border-0" style={cardStyle}>
          <CardContent className="p-10 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.primary}12` }}>
              <Calendar className="w-7 h-7" style={{ color: colors.primary }} />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ color: colors.text.primary }}>No payroll runs yet</h3>
            <p className="text-sm mb-5" style={{ color: colors.text.secondary }}>Add a client to get started.</p>
            <Link href="/dashboard/clients/add">
              <Button
                className="text-white font-semibold px-5 py-2 rounded-lg border-0"
                style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add a Client
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Main content ───────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: colors.text.primary }}>Payrolls</h1>
          <p className="text-[0.82rem] mt-0.5" style={{ color: colors.text.muted }}>
            {format(new Date(), 'EEEE, d MMMM yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowSearch(!showSearch)
              if (showSearch) setSearchQuery('')
            }}
            className="h-8 w-8 p-0 rounded-lg"
            style={{ color: showSearch ? colors.primary : colors.text.muted }}
          >
            {showSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Client filter banner */}
      {clientFilterName && (
        <div
          className="flex items-center justify-between px-4 py-2.5 rounded-lg"
          style={{ backgroundColor: `${colors.primary}08`, border: `1px solid ${colors.primary}20` }}
        >
          <p className="text-[0.82rem] font-semibold" style={{ color: colors.text.primary }}>
            Showing payrolls for <span style={{ color: colors.primary }}>{clientFilterName}</span>
          </p>
          <Button variant="ghost" size="sm" onClick={clearClientFilter} className="rounded-lg text-xs font-semibold h-7 px-2" style={{ color: colors.primary }}>
            Show All
          </Button>
        </div>
      )}

      {/* Search bar */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.text.muted }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.key
          const isOverdue = tab.key === 'overdue' && tab.count > 0
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.78rem] font-semibold transition-all duration-150"
              style={{
                backgroundColor: isActive ? colors.primary : 'transparent',
                color: isActive ? '#FFFFFF' : colors.text.secondary,
                border: `1px solid ${isActive ? colors.primary : colors.border}`,
              }}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className="text-[0.65rem] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                  style={{
                    backgroundColor: isActive
                      ? 'rgba(255,255,255,0.25)'
                      : isOverdue
                        ? `${colors.error}15`
                        : `${colors.text.muted}12`,
                    color: isActive
                      ? '#FFFFFF'
                      : isOverdue
                        ? colors.error
                        : colors.text.muted,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <Card className="border-0 overflow-hidden" style={cardStyle}>
        <CardContent className="p-0">
          {filteredRuns.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: colors.text.muted }} />
              <p className="text-sm font-medium" style={{ color: colors.text.secondary }}>
                {activeFilter === 'active'
                  ? 'All payroll runs are complete!'
                  : 'No payroll runs match this filter.'}
              </p>
              {activeFilter !== 'all' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveFilter('all')}
                  className="mt-2 text-xs font-semibold"
                  style={{ color: colors.primary }}
                >
                  Show all runs
                </Button>
              )}
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div
                className="hidden lg:grid px-4 py-2.5"
                style={{
                  gridTemplateColumns: '1fr 100px 140px 120px 90px 90px',
                  gap: '12px',
                  borderBottom: `1px solid ${colors.border}`,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                }}
              >
                {['Client', 'Pay Date', 'Progress', 'Status', 'FPS', 'EPS'].map(
                  (header) => (
                    <p
                      key={header}
                      className="text-[0.68rem] font-bold uppercase tracking-[0.06em]"
                      style={{ color: colors.text.muted }}
                    >
                      {header}
                    </p>
                  )
                )}
              </div>

              {/* Rows */}
              <div>
                {filteredRuns.map((run) => {
                  const status = computeStatus(run)
                  const statusConfig = getStatusConfig(status, isDark)
                  const items = run.checklist_items ?? []
                  const completedCount = items.filter((i) => i.is_completed).length
                  const totalCount = items.length
                  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
                  const isExpanded = expandedRunId === run.id

                  return (
                    <div key={run.id}>
                      {/* Row */}
                      <div
                        className="transition-colors duration-100 cursor-pointer"
                        style={{
                          backgroundColor: isExpanded
                            ? isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
                            : 'transparent',
                          borderBottom: `1px solid ${colors.border}`,
                        }}
                        onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                        onMouseEnter={(e) => {
                          if (!isExpanded) e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)'
                        }}
                        onMouseLeave={(e) => {
                          if (!isExpanded) e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        {/* Desktop row */}
                        <div
                          className="hidden lg:grid px-4 py-3 items-center"
                          style={{
                            gridTemplateColumns: '1fr 100px 140px 120px 90px 90px',
                            gap: '12px',
                          }}
                        >
                          {/* Client name */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: colors.text.muted }} />
                            ) : (
                              <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: colors.text.muted }} />
                            )}
                            <div className="min-w-0">
                              <p className="text-[0.85rem] font-semibold truncate" style={{ color: colors.text.primary }}>
                                {run.clients?.name ?? 'Unknown Client'}
                              </p>
                              <p className="text-[0.68rem] font-medium" style={{ color: colors.text.muted }}>
                                {formatPayFrequency(run.clients?.pay_frequency ?? null)}
                              </p>
                            </div>
                          </div>

                          {/* Pay date */}
                          <p className="text-[0.82rem] font-medium" style={{ color: colors.text.primary }}>
                            {formatDateShort(run.pay_date)}
                          </p>

                          {/* Progress bar */}
                          <div className="flex items-center gap-2">
                            <div
                              className="flex-1 h-2 rounded-full overflow-hidden"
                              style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
                            >
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${progressPercent}%`,
                                  backgroundColor: statusConfig.dot,
                                }}
                              />
                            </div>
                            <span className="text-[0.68rem] font-semibold w-[32px] text-right" style={{ color: colors.text.muted }}>
                              {completedCount}/{totalCount}
                            </span>
                          </div>

                          {/* Status badge — clickable Monday.com style */}
                          <div onClick={(e) => e.stopPropagation()}>
                            <StatusBadge
                              run={run}
                              status={status}
                              statusConfig={statusConfig}
                              items={items}
                              supabase={supabase}
                              onRefresh={fetchRuns}
                            />
                          </div>

                          {/* FPS */}
                          <p className="text-[0.78rem] font-medium" style={{ color: colors.text.secondary }}>
                            {formatDateShort(run.rti_due_date)}
                          </p>

                          {/* EPS */}
                          <p className="text-[0.78rem] font-medium" style={{ color: colors.text.secondary }}>
                            {formatDateShort(run.eps_due_date)}
                          </p>
                        </div>

                        {/* Mobile row */}
                        <div className="lg:hidden p-4 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: colors.text.muted }} />
                              ) : (
                                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: colors.text.muted }} />
                              )}
                              <p className="text-[0.88rem] font-semibold truncate" style={{ color: colors.text.primary }}>
                                {run.clients?.name ?? 'Unknown Client'}
                              </p>
                            </div>
                            <div onClick={(e) => e.stopPropagation()}>
                              <StatusBadge
                                run={run}
                                status={status}
                                statusConfig={statusConfig}
                                items={items}
                                supabase={supabase}
                                onRefresh={fetchRuns}
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-3 pl-6">
                            <span className="text-[0.75rem]" style={{ color: colors.text.muted }}>
                              {formatDateShort(run.pay_date)}
                            </span>
                            <div className="flex-1 flex items-center gap-1.5">
                              <div
                                className="flex-1 h-1.5 rounded-full overflow-hidden"
                                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
                              >
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{ width: `${progressPercent}%`, backgroundColor: statusConfig.dot }}
                                />
                              </div>
                              <span className="text-[0.65rem] font-semibold" style={{ color: colors.text.muted }}>
                                {completedCount}/{totalCount}
                              </span>
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary footer */}
      <p className="text-[0.72rem] font-medium text-center" style={{ color: colors.text.muted }}>
        Showing {filteredRuns.length} of {runs.length} payroll runs
      </p>
    </div>
  )
}

// ── Status Badge (Monday.com style clickable) ──────────────────────────────

interface StatusBadgeProps {
  run: PayrollRun
  status: PayrollStatus
  statusConfig: StatusConfig
  items: ChecklistItem[]
  supabase: ReturnType<typeof createClientSupabaseClient>
  onRefresh: () => Promise<void>
}

function StatusBadge({ run, status, statusConfig, items, supabase, onRefresh }: StatusBadgeProps) {
  const [updating, setUpdating] = useState(false)

  const handleClick = async () => {
    if (updating) return

    // If clicking a "complete" badge, we can't uncomplete easily
    // If clicking "not_started", mark first item as done to trigger in_progress
    // If clicking "in_progress", mark all as done to trigger complete
    // For "overdue" / "due_soon", same as in_progress behavior
    setUpdating(true)
    try {
      if (status === 'not_started' || status === 'due_soon') {
        // Mark first incomplete item as done
        const firstIncomplete = items.find((i) => !i.is_completed)
        if (firstIncomplete) {
          await supabase
            .from('checklist_items')
            .update({ is_completed: true, completed_at: new Date().toISOString() })
            .eq('id', firstIncomplete.id)
        }
      } else if (status === 'in_progress' || status === 'overdue') {
        // Mark all incomplete items as done
        const incompleteIds = items.filter((i) => !i.is_completed).map((i) => i.id)
        if (incompleteIds.length > 0) {
          await supabase
            .from('checklist_items')
            .update({ is_completed: true, completed_at: new Date().toISOString() })
            .in('id', incompleteIds)
        }
      }
      // For 'complete' — no action needed
      await onRefresh()
    } catch (err) {
      console.error('Error updating status:', err)
    } finally {
      setUpdating(false)
    }
  }

  const isClickable = status !== 'complete'

  return (
    <button
      onClick={isClickable ? handleClick : undefined}
      disabled={updating || !isClickable}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[0.72rem] font-bold transition-all duration-150',
        isClickable && 'hover:scale-105 cursor-pointer',
        !isClickable && 'cursor-default'
      )}
      style={{
        backgroundColor: statusConfig.bg,
        color: statusConfig.text,
        border: `1px solid ${statusConfig.border}`,
      }}
      title={isClickable ? `Click to advance status` : 'Complete'}
    >
      {updating ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: statusConfig.dot }}
        />
      )}
      {statusConfig.label}
    </button>
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
  const items = [...(run.checklist_items ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const completedCount = items.filter((i) => i.is_completed).length
  const allComplete = items.length > 0 && completedCount === items.length

  return (
    <div
      className="px-4 pb-4 pt-2 space-y-4"
      style={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Checklist */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[0.82rem] font-bold flex items-center gap-2" style={{ color: colors.text.primary }}>
              <ListChecks className="w-4 h-4" style={{ color: colors.primary }} />
              Checklist
            </h4>
            {items.length > 0 && !allComplete && (
              <Button
                size="sm"
                onClick={(e) => { e.stopPropagation(); onMarkAllComplete(run) }}
                disabled={markingAll === run.id}
                className="text-white font-semibold rounded-lg text-[0.7rem] h-7 px-2.5"
                style={{ background: `linear-gradient(135deg, ${colors.success}, ${colors.success}CC)` }}
              >
                {markingAll === run.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                Complete All
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="text-[0.82rem] italic" style={{ color: colors.text.muted }}>No checklist items.</p>
          ) : (
            <div className="space-y-1">
              {items.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg cursor-pointer transition-colors duration-100"
                  style={{
                    backgroundColor: item.is_completed
                      ? isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.04)'
                      : 'transparent',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={item.is_completed}
                      onChange={() => onToggleItem(item)}
                      disabled={togglingItem === item.id}
                      className="w-4 h-4 rounded cursor-pointer accent-emerald-600"
                    />
                    {togglingItem === item.id && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: colors.primary }} />
                      </div>
                    )}
                  </div>
                  <span
                    className={cn('text-[0.82rem] font-medium', item.is_completed && 'line-through')}
                    style={{ color: item.is_completed ? colors.text.muted : colors.text.primary }}
                  >
                    {item.name}
                  </span>
                  {item.is_completed && item.completed_at && (
                    <span className="text-[0.68rem] ml-auto flex-shrink-0" style={{ color: colors.text.muted }}>
                      {formatDateShort(item.completed_at)}
                    </span>
                  )}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Right: Notes + Deadlines */}
        <div className="space-y-4">
          <div>
            <h4 className="text-[0.82rem] font-bold flex items-center gap-2 mb-2" style={{ color: colors.text.primary }}>
              <StickyNote className="w-4 h-4" style={{ color: colors.primary }} />
              Notes
              {savingNotes === run.id && (
                <span className="text-[0.68rem] font-normal ml-1" style={{ color: colors.text.muted }}>Saving...</span>
              )}
            </h4>
            <textarea
              value={localNotes}
              onChange={(e) => setLocalNotes(e.target.value)}
              onBlur={() => { if (localNotes !== (run.notes ?? '')) onSaveNotes(run.id, localNotes) }}
              onClick={(e) => e.stopPropagation()}
              placeholder="Add notes..."
              rows={3}
              className="w-full rounded-lg p-2.5 text-[0.82rem] font-medium resize-none focus:outline-none transition-all"
              style={{
                backgroundColor: colors.surface,
                color: colors.text.primary,
                border: `1px solid ${colors.border}`,
              }}
              onFocus={(e) => { e.target.style.borderColor = `${colors.primary}60` }}
              onBlurCapture={(e) => { e.target.style.borderColor = colors.border }}
            />
          </div>

          <div>
            <h4 className="text-[0.82rem] font-bold flex items-center gap-2 mb-2" style={{ color: colors.text.primary }}>
              <Clock className="w-4 h-4" style={{ color: colors.primary }} />
              Deadlines
            </h4>
            <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
              {[
                { label: 'FPS Due', value: formatDate(run.rti_due_date) },
                { label: 'EPS Due', value: formatDate(run.eps_due_date) },
                { label: 'Pay Date', value: formatDate(run.pay_date) },
              ].map((d, i) => (
                <div key={d.label}>
                  {i > 0 && <div className="h-px mb-2" style={{ backgroundColor: colors.border }} />}
                  <div className="flex items-center justify-between">
                    <span className="text-[0.78rem] font-medium" style={{ color: colors.text.secondary }}>{d.label}</span>
                    <span className="text-[0.78rem] font-bold" style={{ color: colors.text.primary }}>{d.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {status === 'complete' && (
            <Button
              onClick={(e) => { e.stopPropagation(); onGenerateNext(run) }}
              disabled={generating === run.id}
              className="w-full text-white font-semibold rounded-lg text-[0.82rem]"
              style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
            >
              {generating === run.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Generate Next Period
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
