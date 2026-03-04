'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import {
  Shield,
  Search,
  AlertTriangle,
  Clock,
  Save,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import { parseISO, isBefore, addDays, startOfDay } from 'date-fns'
import Link from 'next/link'

// ─── Types ───────────────────────────────────────────────────────────

interface PensionClient {
  id: string
  name: string
  status: string | null
  pension_provider: string | null
  pension_staging_date: string | null
  pension_reenrolment_date: string | null
  declaration_of_compliance_deadline: string | null
}

type DateField = 'pension_staging_date' | 'pension_reenrolment_date' | 'declaration_of_compliance_deadline'

interface PendingEdit {
  clientId: string
  field: DateField | 'pension_provider'
  value: string
}

// ─── Helpers ─────────────────────────────────────────────────────────

function getDateStatus(dateStr: string | null): 'overdue' | 'due_soon' | 'ok' | 'none' {
  if (!dateStr) return 'none'
  const date = parseISO(dateStr)
  const today = startOfDay(new Date())
  if (isBefore(date, today)) return 'overdue'
  if (isBefore(date, addDays(today, 30))) return 'due_soon'
  return 'ok'
}

// ─── Component ───────────────────────────────────────────────────────

export default function PensionDeclarationsPage() {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const [clients, setClients] = useState<PensionClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingEdits, setPendingEdits] = useState<PendingEdit[]>([])
  const [saving, setSaving] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'overdue' | 'due_soon' | 'missing'>('all')

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch('/api/pensions')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to fetch pension data')
      }
      const data = await res.json()
      setClients(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pension data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  // ─── Edit tracking ─────────────────────────────────────────────────

  const getEditValue = (clientId: string, field: DateField | 'pension_provider'): string | undefined => {
    return pendingEdits.find((e) => e.clientId === clientId && e.field === field)?.value
  }

  const setEditValue = (clientId: string, field: DateField | 'pension_provider', value: string) => {
    setPendingEdits((prev) => {
      const filtered = prev.filter((e) => !(e.clientId === clientId && e.field === field))
      const client = clients.find((c) => c.id === clientId)
      const originalValue = client ? (client[field] || '') : ''
      if (value === originalValue) return filtered
      return [...filtered, { clientId, field, value }]
    })
  }

  const hasEditsForClient = (clientId: string): boolean => {
    return pendingEdits.some((e) => e.clientId === clientId)
  }

  const saveClient = async (clientId: string) => {
    const edits = pendingEdits.filter((e) => e.clientId === clientId)
    if (edits.length === 0) return

    setSaving(clientId)
    try {
      const updates: Record<string, string | null> = {}
      for (const edit of edits) {
        updates[edit.field] = edit.value || null
      }

      const res = await fetch('/api/pensions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, ...updates }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      const updated = await res.json()
      setClients((prev) => prev.map((c) => (c.id === clientId ? updated : c)))
      setPendingEdits((prev) => prev.filter((e) => e.clientId !== clientId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(null)
    }
  }

  // ─── Filtering ─────────────────────────────────────────────────────

  const filteredClients = clients.filter((client) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!client.name.toLowerCase().includes(q) && !(client.pension_provider || '').toLowerCase().includes(q)) {
        return false
      }
    }

    if (filter === 'overdue') {
      return (
        getDateStatus(client.pension_staging_date) === 'overdue' ||
        getDateStatus(client.pension_reenrolment_date) === 'overdue' ||
        getDateStatus(client.declaration_of_compliance_deadline) === 'overdue'
      )
    }
    if (filter === 'due_soon') {
      return (
        getDateStatus(client.pension_staging_date) === 'due_soon' ||
        getDateStatus(client.pension_reenrolment_date) === 'due_soon' ||
        getDateStatus(client.declaration_of_compliance_deadline) === 'due_soon'
      )
    }
    if (filter === 'missing') {
      return !client.pension_provider || !client.pension_staging_date || !client.pension_reenrolment_date || !client.declaration_of_compliance_deadline
    }

    return true
  })

  // ─── Summary stats ─────────────────────────────────────────────────

  const stats = {
    total: clients.length,
    overdue: clients.filter(
      (c) =>
        getDateStatus(c.pension_staging_date) === 'overdue' ||
        getDateStatus(c.pension_reenrolment_date) === 'overdue' ||
        getDateStatus(c.declaration_of_compliance_deadline) === 'overdue'
    ).length,
    dueSoon: clients.filter(
      (c) =>
        getDateStatus(c.pension_staging_date) === 'due_soon' ||
        getDateStatus(c.pension_reenrolment_date) === 'due_soon' ||
        getDateStatus(c.declaration_of_compliance_deadline) === 'due_soon'
    ).length,
    missing: clients.filter(
      (c) => !c.pension_provider || !c.pension_staging_date || !c.pension_reenrolment_date || !c.declaration_of_compliance_deadline
    ).length,
  }

  // ─── Styles ────────────────────────────────────────────────────────

  const inputStyle = {
    background: colors.glass.surface,
    color: colors.text.primary,
    border: `1px solid ${colors.borderElevated}`,
  }

  const getStatusDot = (status: 'overdue' | 'due_soon' | 'ok' | 'none') => {
    if (status === 'overdue') return colors.error
    if (status === 'due_soon') return colors.warning
    if (status === 'ok') return colors.success
    return colors.text.muted
  }

  // ─── Loading state ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 rounded-xl bg-gray-200 animate-pulse" style={{ background: colors.glass.surface }} />
        <div className="h-16 rounded-2xl bg-gray-200 animate-pulse" style={{ background: colors.glass.surface }} />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-gray-200 animate-pulse" style={{ background: colors.glass.surface }} />
        ))}
      </div>
    )
  }

  // ─── Error state ───────────────────────────────────────────────────

  if (error && clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="w-12 h-12" style={{ color: colors.error }} />
        <p className="text-lg font-semibold" style={{ color: colors.text.primary }}>
          Failed to load pension data
        </p>
        <p className="text-sm" style={{ color: colors.text.secondary }}>
          {error}
        </p>
        <Button
          onClick={fetchClients}
          className="rounded-xl font-semibold text-white"
          style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-3xl md:text-4xl font-bold transition-colors duration-300"
          style={{ color: colors.text.primary }}
        >
          Pension Declarations
        </h1>
        <p
          className="text-base md:text-lg transition-colors duration-300 mt-1"
          style={{ color: colors.text.secondary }}
        >
          Manage pension dates across all clients
        </p>
      </div>

      {/* Inline error banner */}
      {error && clients.length > 0 && (
        <div
          className="p-3 rounded-xl text-sm font-medium"
          style={{
            background: `${colors.error}15`,
            color: colors.error,
            border: `1px solid ${colors.error}30`,
          }}
        >
          {error}
        </div>
      )}

      {/* Summary bar */}
      <div
        className="flex flex-wrap gap-3 p-4 rounded-2xl"
        style={{
          backgroundColor: colors.glass.card,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${colors.borderElevated}`,
          boxShadow: isDark ? `0 4px 15px ${colors.shadow.medium}` : `0 4px 15px ${colors.shadow.light}`,
        }}
      >
        {[
          { label: 'Total Clients', value: stats.total, filterKey: 'all' as const, color: colors.primary, icon: Shield },
          { label: 'Overdue', value: stats.overdue, filterKey: 'overdue' as const, color: colors.error, icon: AlertTriangle },
          { label: 'Due Within 30 Days', value: stats.dueSoon, filterKey: 'due_soon' as const, color: colors.warning, icon: Clock },
          { label: 'Missing Info', value: stats.missing, filterKey: 'missing' as const, color: colors.text.muted, icon: Search },
        ].map((stat) => {
          const Icon = stat.icon
          const isActive = filter === stat.filterKey
          return (
            <button
              key={stat.filterKey}
              onClick={() => setFilter(isActive ? 'all' : stat.filterKey)}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-200 min-w-[140px]"
              style={{
                background: isActive ? `${stat.color}15` : 'transparent',
                border: `1px solid ${isActive ? `${stat.color}40` : 'transparent'}`,
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: stat.color }} />
              <div className="text-left">
                <div className="text-lg font-bold leading-tight" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className="text-[0.7rem] font-medium" style={{ color: colors.text.muted }}>
                  {stat.label}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: colors.text.muted }}
        />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by client name or provider..."
          className="pl-10 rounded-xl border-0 shadow-lg"
          style={inputStyle}
        />
      </div>

      {/* Table */}
      {filteredClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Shield className="w-10 h-10" style={{ color: colors.text.muted }} />
          <p className="text-sm font-medium" style={{ color: colors.text.muted }}>
            {searchQuery || filter !== 'all' ? 'No clients match your filters' : 'No clients found'}
          </p>
        </div>
      ) : (
        <Card
          className="border-0 shadow-xl overflow-hidden"
          style={{
            backgroundColor: colors.glass.card,
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: `1px solid ${colors.borderElevated}`,
            boxShadow: isDark ? `0 8px 25px ${colors.shadow.medium}` : `0 6px 20px ${colors.shadow.light}`,
          }}
        >
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    style={{
                      borderBottom: `1px solid ${colors.borderElevated}`,
                      background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                    }}
                  >
                    <th className="text-left px-5 py-3 text-[0.7rem] font-semibold uppercase tracking-wider" style={{ color: colors.text.muted }}>
                      Client
                    </th>
                    <th className="text-left px-5 py-3 text-[0.7rem] font-semibold uppercase tracking-wider" style={{ color: colors.text.muted }}>
                      Provider
                    </th>
                    <th className="text-left px-5 py-3 text-[0.7rem] font-semibold uppercase tracking-wider" style={{ color: colors.text.muted }}>
                      Staging Date
                    </th>
                    <th className="text-left px-5 py-3 text-[0.7rem] font-semibold uppercase tracking-wider" style={{ color: colors.text.muted }}>
                      Re-Enrolment Date
                    </th>
                    <th className="text-left px-5 py-3 text-[0.7rem] font-semibold uppercase tracking-wider" style={{ color: colors.text.muted }}>
                      Declaration of Compliance
                    </th>
                    <th className="text-right px-5 py-3 text-[0.7rem] font-semibold uppercase tracking-wider" style={{ color: colors.text.muted }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => {
                    const stagingStatus = getDateStatus(client.pension_staging_date)
                    const reenrolmentStatus = getDateStatus(client.pension_reenrolment_date)
                    const complianceStatus = getDateStatus(client.declaration_of_compliance_deadline)
                    const hasEdits = hasEditsForClient(client.id)
                    const isSaving = saving === client.id

                    return (
                      <tr
                        key={client.id}
                        className="transition-colors duration-150"
                        style={{
                          borderBottom: `1px solid ${colors.border}`,
                        }}
                      >
                        {/* Client name */}
                        <td className="px-5 py-3">
                          <Link
                            href={`/dashboard/clients/${client.id}`}
                            className="text-sm font-semibold hover:underline underline-offset-2 flex items-center gap-1.5"
                            style={{ color: colors.text.primary }}
                          >
                            {client.name}
                            <ExternalLink className="w-3 h-3 opacity-40" />
                          </Link>
                          {client.status && (
                            <span
                              className="text-[0.65rem] font-medium capitalize"
                              style={{ color: colors.text.muted }}
                            >
                              {client.status}
                            </span>
                          )}
                        </td>

                        {/* Provider */}
                        <td className="px-5 py-3">
                          <Input
                            value={getEditValue(client.id, 'pension_provider') ?? client.pension_provider ?? ''}
                            onChange={(e) => setEditValue(client.id, 'pension_provider', e.target.value)}
                            placeholder="No provider"
                            className="h-8 text-sm rounded-lg border-0 w-36"
                            style={inputStyle}
                          />
                        </td>

                        {/* Staging Date */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: getStatusDot(stagingStatus) }}
                              title={stagingStatus === 'overdue' ? 'Overdue' : stagingStatus === 'due_soon' ? 'Due within 30 days' : stagingStatus === 'ok' ? 'OK' : 'Not set'}
                            />
                            <Input
                              type="date"
                              value={getEditValue(client.id, 'pension_staging_date') ?? client.pension_staging_date ?? ''}
                              onChange={(e) => setEditValue(client.id, 'pension_staging_date', e.target.value)}
                              className="h-8 text-sm rounded-lg border-0 w-40"
                              style={inputStyle}
                            />
                          </div>
                        </td>

                        {/* Re-Enrolment Date */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: getStatusDot(reenrolmentStatus) }}
                              title={reenrolmentStatus === 'overdue' ? 'Overdue' : reenrolmentStatus === 'due_soon' ? 'Due within 30 days' : reenrolmentStatus === 'ok' ? 'OK' : 'Not set'}
                            />
                            <Input
                              type="date"
                              value={getEditValue(client.id, 'pension_reenrolment_date') ?? client.pension_reenrolment_date ?? ''}
                              onChange={(e) => setEditValue(client.id, 'pension_reenrolment_date', e.target.value)}
                              className="h-8 text-sm rounded-lg border-0 w-40"
                              style={inputStyle}
                            />
                          </div>
                        </td>

                        {/* Declaration of Compliance */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ background: getStatusDot(complianceStatus) }}
                              title={complianceStatus === 'overdue' ? 'Overdue' : complianceStatus === 'due_soon' ? 'Due within 30 days' : complianceStatus === 'ok' ? 'OK' : 'Not set'}
                            />
                            <Input
                              type="date"
                              value={getEditValue(client.id, 'declaration_of_compliance_deadline') ?? client.declaration_of_compliance_deadline ?? ''}
                              onChange={(e) => setEditValue(client.id, 'declaration_of_compliance_deadline', e.target.value)}
                              className="h-8 text-sm rounded-lg border-0 w-40"
                              style={inputStyle}
                            />
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3 text-right">
                          {hasEdits && (
                            <Button
                              size="sm"
                              onClick={() => saveClient(client.id)}
                              disabled={isSaving}
                              className="rounded-lg text-white text-xs font-semibold h-8 px-3"
                              style={{
                                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                                boxShadow: `0 4px 12px ${colors.primary}30`,
                              }}
                            >
                              {isSaving ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                              ) : (
                                <>
                                  <Save className="w-3 h-3 mr-1" />
                                  Save
                                </>
                              )}
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div
        className="flex items-center gap-6 px-4 py-3 rounded-xl text-[0.75rem]"
        style={{
          background: colors.glass.surface,
          border: `1px solid ${colors.border}`,
          color: colors.text.muted,
        }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: colors.error }} />
          Overdue
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: colors.warning }} />
          Due within 30 days
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: colors.success }} />
          OK
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: colors.text.muted }} />
          Not set
        </div>
      </div>
    </div>
  )
}
