// src/app/(dashboard)/dashboard/audit-log/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
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
  X,
  Download,
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

const ACTION_CONFIG = {
  CREATE: { label: 'Created', icon: Plus, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  UPDATE: { label: 'Updated', icon: Pencil, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  DELETE: { label: 'Deleted', icon: Trash2, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
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

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [resourceFilter, setResourceFilter] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [exporting, setExporting] = useState(false)

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

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' })
      if (search) params.set('search', search)
      if (actionFilter) params.set('action', actionFilter)
      if (resourceFilter) params.set('resource_type', resourceFilter)

      const res = await fetch(`/api/audit-logs?${params}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data: AuditResponse = await res.json()
      setLogs(data.logs)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, actionFilter, resourceFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
            Audit Log
          </h1>
          <p className="mt-1 text-sm" style={{ color: colors.text.secondary }}>
            Track every change made across your account
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: colors.text.muted }}>
            {total.toLocaleString()} total entries
          </span>
          <button
            onClick={handleExport}
            disabled={exporting || total === 0}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border disabled:opacity-40"
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
      </div>

      {/* Search & Filters */}
      <div
        className="rounded-xl border p-4"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 flex gap-2">
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
                className="pl-9"
                style={{
                  background: isDark ? '#0f172a' : '#f8fafc',
                  borderColor: colors.border,
                  color: colors.text.primary,
                }}
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white"
              style={{ background: colors.primary }}
            >
              Search
            </button>
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border"
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
        </div>

        {/* Filter dropdowns */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 mt-3 pt-3" style={{ borderTop: `1px solid ${colors.border}` }}>
            <select
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
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm"
                style={{ color: colors.text.muted }}
              >
                <X size={14} />
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Log entries */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        {loading ? (
          <div className="py-16 text-center">
            <div
              className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto mb-3"
              style={{ borderColor: colors.primary }}
            />
            <p className="text-sm" style={{ color: colors.text.muted }}>
              Loading audit logs...
            </p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <ScrollText
              size={40}
              className="mx-auto mb-3"
              style={{ color: colors.text.muted, opacity: 0.4 }}
            />
            <p className="text-sm font-medium" style={{ color: colors.text.secondary }}>
              No audit logs found
            </p>
            <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Changes will appear here as you use the platform'}
            </p>
          </div>
        ) : (
          <div>
            {logs.map((log, idx) => {
              const config = ACTION_CONFIG[log.action]
              const ActionIcon = config.icon
              const isExpanded = expandedId === log.id
              const hasChanges = log.changes && Object.keys(log.changes).length > 0

              return (
                <div
                  key={log.id}
                  style={{
                    borderBottom: idx < logs.length - 1
                      ? `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}`
                      : 'none',
                  }}
                >
                  {/* Main row */}
                  <button
                    onClick={() => hasChanges ? setExpandedId(isExpanded ? null : log.id) : null}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors"
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
                          className="text-sm font-medium"
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
                        <span className="text-sm" style={{ color: colors.text.secondary }}>
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
                      <div
                        className="rounded-lg border overflow-hidden text-sm"
                        style={{ borderColor: colors.border }}
                      >
                        <table className="w-full">
                          <thead>
                            <tr style={{ background: isDark ? '#1e293b' : '#f1f5f9' }}>
                              <th
                                className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wider"
                                style={{ color: colors.text.muted }}
                              >
                                Field
                              </th>
                              <th
                                className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wider"
                                style={{ color: colors.text.muted }}
                              >
                                Before
                              </th>
                              <th
                                className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wider"
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
                                  borderTop: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}`,
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
                                  style={{ color: '#ef4444' }}
                                >
                                  {formatValue(change.from)}
                                </td>
                                <td
                                  className="px-3 py-2 text-xs"
                                  style={{ color: '#22c55e' }}
                                >
                                  {formatValue(change.to)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: `1px solid ${colors.border}` }}
          >
            <p className="text-xs" style={{ color: colors.text.muted }}>
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border disabled:opacity-40"
                style={{
                  borderColor: colors.border,
                  color: colors.text.secondary,
                  background: 'transparent',
                }}
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border disabled:opacity-40"
                style={{
                  borderColor: colors.border,
                  color: colors.text.secondary,
                  background: 'transparent',
                }}
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
