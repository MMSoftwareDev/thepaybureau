// src/app/(dashboard)/dashboard/audit-log/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { useAuditLogs } from '@/lib/swr'
import {
  ScrollText,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  Filter,
  Download,
  Activity,
  Clock,
} from 'lucide-react'
import { Input } from '@/components/ui/input'

// ─── Types ───────────────────────────────────────────────────────────

interface AuditLog {
  id: string
  tenant_id: string
  user_id: string
  user_email: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  resource_type: string
  resource_id: string | null
  resource_name: string | null
  changes: Record<string, { from: unknown; to: unknown }> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

interface AuditResponse {
  logs: AuditLog[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ─── Helpers ─────────────────────────────────────────────────────────

function getActionConfig(isDark: boolean) {
  return {
    CREATE: { label: 'Created', icon: Plus, color: isDark ? '#34d399' : '#059669', bg: isDark ? 'rgba(52,211,153,0.12)' : 'rgba(5,150,105,0.1)' },
    UPDATE: { label: 'Updated', icon: Pencil, color: isDark ? '#60a5fa' : '#2563eb', bg: isDark ? 'rgba(96,165,250,0.12)' : 'rgba(37,99,235,0.1)' },
    DELETE: { label: 'Deleted', icon: Trash2, color: isDark ? '#f87171' : '#dc2626', bg: isDark ? 'rgba(248,113,113,0.12)' : 'rgba(220,38,38,0.1)' },
  }
}

const RESOURCE_LABELS: Record<string, string> = {
  client: 'Client',
  payroll_run: 'Payroll Run',
  checklist_item: 'Checklist Item',
  checklist_template: 'Checklist Template',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(dateStr)
}

// ─── Component ───────────────────────────────────────────────────────

export default function AuditLogPage() {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const actionConfig = getActionConfig(isDark)

  const [mounted, setMounted] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [resourceFilter, setResourceFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => setMounted(true), [])

  const { data, isLoading } = useAuditLogs({
    page,
    search,
    action: actionFilter,
    resource_type: resourceFilter,
  })

  const auditData = data as AuditResponse | undefined
  const logs = auditData?.logs || []
  const totalPages = auditData?.totalPages || 1
  const total = auditData?.total || 0

  // Compute KPI stats from current page data
  const todayCount = logs.filter(l => {
    const d = new Date(l.created_at)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  }).length

  const createCount = logs.filter(l => l.action === 'CREATE').length
  const updateCount = logs.filter(l => l.action === 'UPDATE').length
  const deleteCount = logs.filter(l => l.action === 'DELETE').length

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (actionFilter) params.set('action', actionFilter)
      if (resourceFilter) params.set('resource_type', resourceFilter)

      const res = await fetch(`/api/audit-logs/export?${params}`)
      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    setSearch(searchInput)
  }

  const clearFilters = () => {
    setSearch('')
    setSearchInput('')
    setActionFilter('')
    setResourceFilter('')
    setPage(1)
  }

  const hasActiveFilters = search || actionFilter || resourceFilter

  // ─── Skeleton ─────────────────────────────────────────────────────

  if (!mounted || (isLoading && logs.length === 0)) {
    return (
      <div className="space-y-5 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-32 rounded-lg" style={{ background: colors.border }} />
            <div className="h-4 w-56 rounded-lg mt-2" style={{ background: colors.border }} />
          </div>
          <div className="h-9 w-28 rounded-lg" style={{ background: colors.border }} />
        </div>

        {/* KPI skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              <div className="h-3 w-16 rounded mb-2" style={{ background: colors.border }} />
              <div className="h-7 w-10 rounded" style={{ background: colors.border }} />
            </div>
          ))}
        </div>

        {/* Search skeleton */}
        <div className="h-12 rounded-xl" style={{ background: colors.surface, border: `1px solid ${colors.border}` }} />

        {/* Table skeleton */}
        <div className="rounded-xl" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
              <div className="w-8 h-8 rounded-lg" style={{ background: colors.border }} />
              <div className="flex-1">
                <div className="h-4 w-48 rounded mb-1" style={{ background: colors.border }} />
                <div className="h-3 w-24 rounded" style={{ background: colors.border }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─── KPI Cards ────────────────────────────────────────────────────

  const kpiCards = [
    { label: 'Total Entries', value: total.toLocaleString(), icon: ScrollText, color: colors.primary },
    { label: 'Today', value: todayCount, icon: Clock, color: actionConfig.UPDATE.color },
    { label: 'Created', value: createCount, icon: Plus, color: actionConfig.CREATE.color },
    { label: 'Changes', value: updateCount + deleteCount, icon: Activity, color: actionConfig.DELETE.color },
  ]

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
            Audit Log
          </h1>
          <p className="mt-1 text-sm font-[family-name:var(--font-body)]" style={{ color: colors.text.secondary }}>
            Track every change made across your account
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || total === 0}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border disabled:opacity-40 transition-colors duration-150"
          style={{
            borderColor: colors.border,
            color: colors.text.secondary,
            background: 'transparent',
          }}
        >
          <Download size={14} />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.label}
              className="rounded-xl p-4 transition-colors duration-150"
              style={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} style={{ color: kpi.color }} />
                <span className="text-xs font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>
                  {kpi.label}
                </span>
              </div>
              <p className="text-2xl font-bold font-[family-name:var(--font-inter)]" style={{ color: colors.text.primary }}>
                {kpi.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* Search & Filters Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="flex-1 min-w-[200px] flex gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: colors.text.muted }}
            />
            <Input
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9 h-9 text-sm"
              style={{
                background: isDark ? '#0f172a' : '#f8fafc',
                borderColor: colors.border,
                color: colors.text.primary,
              }}
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 h-9 rounded-lg text-xs font-medium text-white transition-colors duration-150"
            style={{ background: colors.primary }}
          >
            Search
          </button>
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-medium border transition-colors duration-150"
          style={{
            borderColor: hasActiveFilters ? colors.primary : colors.border,
            color: hasActiveFilters ? colors.primary : colors.text.secondary,
            background: 'transparent',
          }}
        >
          <Filter size={14} />
          Filters
          {hasActiveFilters && (
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: colors.primary }}
            />
          )}
        </button>

        {/* Export (toolbar position) */}
        <button
          onClick={handleExport}
          disabled={exporting || total === 0}
          className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-medium border disabled:opacity-40 transition-colors duration-150 sm:hidden"
          style={{
            borderColor: colors.border,
            color: colors.text.secondary,
            background: 'transparent',
          }}
        >
          <Download size={14} />
          Export
        </button>
      </div>

      {/* Filter dropdowns */}
      {showFilters && (
        <div
          className="flex flex-wrap gap-3 rounded-lg p-3"
          style={{ background: isDark ? 'rgba(255,255,255,0.03)' : colors.lightBg }}
        >
          <select
            aria-label="Filter by action"
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1) }}
            className="rounded-lg px-3 py-2 text-sm border"
            style={{
              background: isDark ? '#0f172a' : '#f8fafc',
              borderColor: colors.border,
              color: colors.text.primary,
            }}
          >
            <option value="">All Actions</option>
            <option value="CREATE">Created</option>
            <option value="UPDATE">Updated</option>
            <option value="DELETE">Deleted</option>
          </select>

          <select
            aria-label="Filter by resource type"
            value={resourceFilter}
            onChange={(e) => { setResourceFilter(e.target.value); setPage(1) }}
            className="rounded-lg px-3 py-2 text-sm border"
            style={{
              background: isDark ? '#0f172a' : '#f8fafc',
              borderColor: colors.border,
              color: colors.text.primary,
            }}
          >
            <option value="">All Resources</option>
            <option value="client">Client</option>
            <option value="payroll_run">Payroll Run</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs font-medium transition-colors duration-150"
              style={{ color: colors.primary }}
            >
              Clear All
            </button>
          )}
        </div>
      )}

      {/* Log entries */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        {logs.length === 0 && !isLoading ? (
          <div className="py-16 text-center">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
              style={{ background: `${colors.primary}12` }}
            >
              <ScrollText size={24} style={{ color: colors.primary }} />
            </div>
            <p className="text-sm font-medium font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>
              No audit logs found
            </p>
            <p className="text-xs mt-1 font-[family-name:var(--font-body)]" style={{ color: colors.text.muted }}>
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Changes will appear here as you use the platform'}
            </p>
          </div>
        ) : (
          <div>
            {logs.map((log, idx) => {
              const config = actionConfig[log.action]
              const ActionIcon = config.icon
              const isExpanded = expandedId === log.id
              const hasChanges = log.changes && Object.keys(log.changes).length > 0

              return (
                <div
                  key={log.id}
                  style={{
                    borderBottom: idx < logs.length - 1
                      ? `1px solid ${colors.border}`
                      : 'none',
                  }}
                >
                  {/* Main row */}
                  <button
                    onClick={() => hasChanges ? setExpandedId(isExpanded ? null : log.id) : null}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors duration-150"
                    style={{
                      cursor: hasChanges ? 'pointer' : 'default',
                      background: isExpanded ? (isDark ? '#0f172a' : '#f8fafc') : 'transparent',
                    }}
                  >
                    {/* Action icon */}
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: config.bg }}
                    >
                      <ActionIcon size={14} style={{ color: config.color }} />
                    </div>

                    {/* Description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-sm font-medium font-[family-name:var(--font-inter)]"
                          style={{ color: colors.text.primary }}
                        >
                          {log.user_email}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            color: config.color,
                            background: config.bg,
                          }}
                        >
                          {config.label}
                        </span>
                        <span className="text-sm font-[family-name:var(--font-body)]" style={{ color: colors.text.secondary }}>
                          {RESOURCE_LABELS[log.resource_type] || log.resource_type}
                        </span>
                        {log.resource_name && (
                          <span
                            className="text-sm font-medium truncate max-w-[200px]"
                            style={{ color: colors.text.primary }}
                          >
                            &ldquo;{log.resource_name}&rdquo;
                          </span>
                        )}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: colors.text.muted }}>
                        {timeAgo(log.created_at)}
                        {log.ip_address && ` \u00b7 ${log.ip_address}`}
                      </div>
                    </div>

                    {/* Expand arrow */}
                    {hasChanges && (
                      <div className="flex-shrink-0" style={{ color: colors.text.muted }}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    )}
                  </button>

                  {/* Expanded changes */}
                  {isExpanded && log.changes && (
                    <div
                      className="px-4 pb-4 pt-1 ml-11"
                      style={{ background: isDark ? '#0f172a' : '#f8fafc' }}
                    >
                      <div className="overflow-x-auto">
                        <div
                          className="rounded-lg border overflow-hidden text-sm"
                          style={{ borderColor: colors.border }}
                        >
                          <table className="w-full min-w-[400px]">
                            <thead>
                              <tr style={{ background: isDark ? 'rgba(255,255,255,0.04)' : colors.lightBg }}>
                                <th
                                  className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wider font-[family-name:var(--font-inter)]"
                                  style={{ color: colors.text.muted }}
                                >
                                  Field
                                </th>
                                <th
                                  className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wider font-[family-name:var(--font-inter)]"
                                  style={{ color: colors.text.muted }}
                                >
                                  Before
                                </th>
                                <th
                                  className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wider font-[family-name:var(--font-inter)]"
                                  style={{ color: colors.text.muted }}
                                >
                                  After
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(log.changes).map(([field, change]) => (
                                <tr
                                  key={field}
                                  style={{
                                    borderTop: `1px solid ${colors.border}`,
                                  }}
                                >
                                  <td
                                    className="px-3 py-2 font-mono text-xs"
                                    style={{ color: colors.text.secondary }}
                                  >
                                    {field.replace(/_/g, ' ')}
                                  </td>
                                  <td
                                    className="px-3 py-2 text-xs"
                                    style={{ color: actionConfig.DELETE.color }}
                                  >
                                    {formatValue(change.from)}
                                  </td>
                                  <td
                                    className="px-3 py-2 text-xs"
                                    style={{ color: actionConfig.CREATE.color }}
                                  >
                                    {formatValue(change.to)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{ borderTop: `1px solid ${colors.border}` }}
          >
            <p className="text-xs font-[family-name:var(--font-inter)]" style={{ color: colors.text.muted }}>
              Showing {((page - 1) * 30) + 1}–{Math.min(page * 30, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center justify-center w-7 h-7 rounded-lg border disabled:opacity-40 transition-colors duration-150"
                style={{
                  borderColor: colors.border,
                  color: colors.text.secondary,
                  background: 'transparent',
                }}
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-medium px-2 font-[family-name:var(--font-inter)]" style={{ color: colors.text.secondary }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center justify-center w-7 h-7 rounded-lg border disabled:opacity-40 transition-colors duration-150"
                style={{
                  borderColor: colors.border,
                  color: colors.text.secondary,
                  background: 'transparent',
                }}
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
