'use client'

import { useEffect, useState, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClientSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { getPayrollStatus, type PayrollStatus } from '@/lib/hmrc-deadlines'
import { format, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  AlertTriangle,
  ListChecks,
  StickyNote,
} from 'lucide-react'

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

export default function PayrollRunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [run, setRun] = useState<PayrollRun | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingNotes, setSavingNotes] = useState(false)
  const [togglingItem, setTogglingItem] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [localNotes, setLocalNotes] = useState('')
  const [mounted, setMounted] = useState(false)

  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const router = useRouter()
  const supabase = createClientSupabaseClient()

  const fetchRun = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('payroll_runs')
        .select('*, clients(name, pay_frequency), checklist_items(*)')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      const runData = data as unknown as PayrollRun
      setRun(runData)
      setLocalNotes(runData.notes ?? '')
    } catch (err) {
      console.error('Error fetching payroll run:', err)
      setError(err instanceof Error ? err.message : 'Failed to load payroll run')
    } finally {
      setLoading(false)
    }
  }, [supabase, id])

  useEffect(() => {
    setMounted(true)
    fetchRun()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      await fetchRun()
    } catch (err) {
      console.error('Error toggling checklist item:', err)
    } finally {
      setTogglingItem(null)
    }
  }

  const markAllComplete = async () => {
    if (!run) return
    setMarkingAll(true)
    try {
      const res = await fetch('/api/payroll-runs/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_complete', payroll_run_id: run.id }),
      })
      if (!res.ok) throw new Error('Failed to mark all complete')
      await fetchRun()
    } catch (err) {
      console.error('Error marking all complete:', err)
    } finally {
      setMarkingAll(false)
    }
  }

  const saveNotes = async () => {
    if (!run || localNotes === (run.notes ?? '')) return
    setSavingNotes(true)
    try {
      const res = await fetch('/api/payroll-runs/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_notes', payroll_run_id: run.id, notes: localNotes }),
      })
      if (!res.ok) throw new Error('Failed to save notes')
      await fetchRun()
    } catch (err) {
      console.error('Error saving notes:', err)
    } finally {
      setSavingNotes(false)
    }
  }

  const generateNextPeriod = async () => {
    if (!run) return
    setGenerating(true)
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
      await fetchRun()
    } catch (err) {
      console.error('Error generating next period:', err)
    } finally {
      setGenerating(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const cardStyle = {
    backgroundColor: colors.surface,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
  }

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 w-64 rounded-xl" style={{ background: colors.border }} />
        <div className="h-32 rounded-lg" style={{ background: colors.border }} />
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

  if (error || !run) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md border-0" style={cardStyle}>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" style={{ color: colors.error }} />
            <h3 className="text-xl font-bold mb-3" style={{ color: colors.text.primary }}>
              {error || 'Payroll run not found'}
            </h3>
            <Button
              onClick={() => router.push('/dashboard/payrolls')}
              className="text-white font-semibold px-6 py-3 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
              }}
            >
              Back to Payrolls
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const status = computeStatus(run)
  const items = [...(run.checklist_items ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const completedCount = items.filter((i) => i.is_completed).length
  const totalCount = items.length
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const allComplete = totalCount > 0 && completedCount === totalCount

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push(`/dashboard/clients/${run.client_id}`)}
          className="self-start rounded-lg px-3"
          style={{ color: colors.text.secondary }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Client
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl md:text-2xl font-bold truncate" style={{ color: colors.text.primary }}>
              {run.clients?.name ?? 'Unknown Client'}
            </h1>
            {run.clients?.pay_frequency && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-[0.68rem] font-bold uppercase tracking-wide"
                style={{
                  backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
                  color: isDark ? '#A78BFA' : '#7C3AED',
                }}
              >
                {formatPayFrequency(run.clients.pay_frequency)}
              </span>
            )}
            <Badge
              className={cn('font-bold text-[0.72rem] border-0 px-3 py-1', getStatusBadgeClasses(status))}
            >
              {getStatusLabel(status)}
            </Badge>
          </div>
          <p className="text-[0.82rem] mt-1" style={{ color: colors.text.muted }}>
            {formatPayFrequency(run.clients?.pay_frequency ?? null)} &middot;{' '}
            {formatDate(run.period_start)} – {formatDate(run.period_end)}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <Card className="border-0" style={cardStyle}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold" style={{ color: colors.text.primary }}>
              Progress
            </span>
            <span className="text-sm font-bold" style={{ color: colors.text.primary }}>
              {completedCount}/{totalCount} ({progressPercent}%)
            </span>
          </div>
          <div
            className="h-3 rounded-full overflow-hidden"
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
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
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        {/* Checklist — spans 2 columns */}
        <Card className="border-0 lg:col-span-2" style={cardStyle}>
          <CardHeader className="pb-2 px-5 md:px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2.5 text-base font-bold" style={{ color: colors.text.primary }}>
                <ListChecks className="w-[18px] h-[18px]" style={{ color: colors.primary }} />
                Checklist
              </CardTitle>
              {totalCount > 0 && !allComplete && (
                <Button
                  size="sm"
                  onClick={markAllComplete}
                  disabled={markingAll}
                  className="text-white font-semibold rounded-lg text-xs"
                  style={{
                    background: `linear-gradient(135deg, ${colors.success}, ${colors.success}CC)`,
                    boxShadow: `0 4px 12px ${colors.success}30`,
                  }}
                >
                  {markingAll ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                  )}
                  Mark All Complete
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-5 md:px-6 pt-2">
            {items.length === 0 ? (
              <p className="text-sm italic py-4" style={{ color: colors.text.muted }}>
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
                  >
                    <div className="relative flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={item.is_completed}
                        onChange={() => toggleChecklistItem(item)}
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
                        'text-sm font-medium transition-all duration-200 flex-1',
                        item.is_completed && 'line-through'
                      )}
                      style={{
                        color: item.is_completed ? colors.text.muted : colors.text.primary,
                      }}
                    >
                      {item.name}
                    </span>
                    {item.is_completed && item.completed_at && (
                      <span className="text-xs flex-shrink-0" style={{ color: colors.text.muted }}>
                        {formatDate(item.completed_at)}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column: Deadlines + Notes */}
        <div className="space-y-4 md:space-y-5">
          {/* Deadlines */}
          <Card className="border-0" style={cardStyle}>
            <CardHeader className="pb-2 px-5 md:px-6">
              <CardTitle className="flex items-center gap-2.5 text-base font-bold" style={{ color: colors.text.primary }}>
                <Clock className="w-[18px] h-[18px]" style={{ color: colors.primary }} />
                Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 md:px-6 pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <span className="text-[0.82rem] font-medium" style={{ color: colors.text.secondary }}>Pay Date</span>
                  <span className="text-[0.82rem] font-bold" style={{ color: colors.text.primary }}>{formatDate(run.pay_date)}</span>
                </div>
                <div className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <span className="text-[0.82rem] font-medium" style={{ color: colors.text.secondary }}>FPS Due</span>
                  <span className="text-[0.82rem] font-bold" style={{ color: colors.text.primary }}>{formatDate(run.rti_due_date)}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[0.82rem] font-medium" style={{ color: colors.text.secondary }}>EPS Due</span>
                  <span className="text-[0.82rem] font-bold" style={{ color: colors.text.primary }}>{formatDate(run.eps_due_date)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="border-0" style={cardStyle}>
            <CardHeader className="pb-2 px-5 md:px-6">
              <CardTitle className="flex items-center gap-2.5 text-base font-bold" style={{ color: colors.text.primary }}>
                <StickyNote className="w-[18px] h-[18px]" style={{ color: colors.primary }} />
                Notes
                {savingNotes && (
                  <span className="text-xs font-normal ml-2" style={{ color: colors.text.muted }}>
                    Saving...
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 md:px-6 pt-0">
              <textarea
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
                onBlur={saveNotes}
                placeholder="Add notes for this payroll period..."
                rows={5}
                className="w-full rounded-lg p-3 text-sm font-medium resize-none focus:outline-none transition-all duration-300"
                style={{
                  backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg,
                  color: colors.text.primary,
                  border: `1px solid ${colors.border}`,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = `${colors.primary}60`
                  e.target.style.boxShadow = `0 0 0 2px ${colors.primary}20`
                }}
                onBlurCapture={(e) => {
                  e.target.style.borderColor = colors.border
                  e.target.style.boxShadow = 'none'
                }}
              />
            </CardContent>
          </Card>

          {/* Generate Next Period */}
          {status === 'complete' && (
            <Button
              onClick={generateNextPeriod}
              disabled={generating}
              className="w-full text-white font-semibold rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
              }}
            >
              {generating ? (
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
