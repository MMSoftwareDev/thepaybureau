'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import {
  Shield,
  Search,
  AlertTriangle,
  Clock,
  ExternalLink,
  RefreshCw,
  Check,
  Loader2,
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

type EditableField = 'pension_provider' | 'pension_staging_date' | 'pension_reenrolment_date' | 'declaration_of_compliance_deadline'

// ─── Helpers ─────────────────────────────────────────────────────────

function getDateStatus(dateStr: string | null): 'overdue' | 'due_soon' | 'ok' | 'none' {
  if (!dateStr) return 'none'
  const date = parseISO(dateStr)
  const today = startOfDay(new Date())
  if (isBefore(date, today)) return 'overdue'
  if (isBefore(date, addDays(today, 30))) return 'due_soon'
  return 'ok'
}

function isExempt(provider: string | null): boolean {
  return provider?.toLowerCase() === 'exempt'
}

// ─── Component ───────────────────────────────────────────────────────

export default function PensionDeclarationsPage() {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const [clients, setClients] = useState<PensionClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'overdue' | 'due_soon' | 'missing'>('all')
  const [savingFields, setSavingFields] = useState<Set<string>>(new Set())
  const [savedFields, setSavedFields] = useState<Set<string>>(new Set())
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map())

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

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      debounceTimers.current.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  // ─── Auto-save logic ──────────────────────────────────────────────

  const saveField = useCallback(async (clientId: string, field: EditableField, value: string) => {
    const key = `${clientId}:${field}`
    setSavingFields((prev) => new Set(prev).add(key))
    setSavedFields((prev) => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })

    try {
      const res = await fetch('/api/pensions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, [field]: value || null }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save')
      }

      const updated = await res.json()
      setClients((prev) => prev.map((c) => (c.id === clientId ? updated : c)))

      setSavedFields((prev) => new Set(prev).add(key))
      setTimeout(() => {
        setSavedFields((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSavingFields((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }, [])

  const handleFieldChange = useCallback((clientId: string, field: EditableField, value: string) => {
    // Optimistically update local state
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, [field]: value || null } : c))
    )

    const timerKey = `${clientId}:${field}`
    const existing = debounceTimers.current.get(timerKey)
    if (existing) clearTimeout(existing)

    // For date fields, save immediately. For text (provider), debounce.
    const delay = field === 'pension_provider' ? 800 : 0

    if (delay === 0) {
      saveField(clientId, field, value)
    } else {
      const timer = setTimeout(() => {
        saveField(clientId, field, value)
        debounceTimers.current.delete(timerKey)
      }, delay)
      debounceTimers.current.set(timerKey, timer)
    }
  }, [saveField])

  const getFieldStatus = (clientId: string, field: EditableField): 'saving' | 'saved' | null => {
    const key = `${clientId}:${field}`
    if (savingFields.has(key)) return 'saving'
    if (savedFields.has(key)) return 'saved'
    return null
  }

  // ─── Filtering (exclude exempt clients) ────────────────────────────

  const nonExemptClients = clients.filter((c) => !isExempt(c.pension_provider))

  const filteredClients = nonExemptClients.filter((client) => {
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

  // ─── Summary stats (non-exempt only) ──────────────────────────────

  const stats = {
    total: nonExemptClients.length,
    overdue: nonExemptClients.filter(
      (c) =>
        getDateStatus(c.pension_staging_date) === 'overdue' ||
        getDateStatus(c.pension_reenrolment_date) === 'overdue' ||
        getDateStatus(c.declaration_of_compliance_deadline) === 'overdue'
    ).length,
    dueSoon: nonExemptClients.filter(
      (c) =>
        getDateStatus(c.pension_staging_date) === 'due_soon' ||
        getDateStatus(c.pension_reenrolment_date) === 'due_soon' ||
        getDateStatus(c.declaration_of_compliance_deadline) === 'due_soon'
    ).length,
    missing: nonExemptClients.filter(
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

  const renderFieldIndicator = (clientId: string, field: EditableField) => {
    const status = getFieldStatus(clientId, field)
    if (status === 'saving') {
      return <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" style={{ color: colors.text.muted }} />
    }
    if (status === 'saved') {
      return <Check className="w-3 h-3 flex-shrink-0" style={{ color: colors.success }} />
    }
    return null
  }

  // ─── Loading state ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 rounded-xl animate-pulse" style={{ background: colors.glass.surface }} />
        <div className="h-16 rounded-2xl animate-pulse" style={{ background: colors.glass.surface }} />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: colors.glass.surface }} />
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
          {clients.length !== nonExemptClients.length && (
            <span style={{ color: colors.text.muted }}>
              {' '}({clients.length - nonExemptClients.length} exempt)
            </span>
          )}
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
                      Pension Provider
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
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => {
                    const stagingStatus = getDateStatus(client.pension_staging_date)
                    const reenrolmentStatus = getDateStatus(client.pension_reenrolment_date)
                    const complianceStatus = getDateStatus(client.declaration_of_compliance_deadline)

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

                        {/* Pension Provider */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            <Input
                              value={client.pension_provider ?? ''}
                              onChange={(e) => handleFieldChange(client.id, 'pension_provider', e.target.value)}
                              placeholder="No provider"
                              list="pension-providers-list"
                              className="h-8 text-sm rounded-lg border-0 w-36"
                              style={inputStyle}
                            />
                            {renderFieldIndicator(client.id, 'pension_provider')}
                          </div>
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
                              value={client.pension_staging_date ?? ''}
                              onChange={(e) => handleFieldChange(client.id, 'pension_staging_date', e.target.value)}
                              className="h-8 text-sm rounded-lg border-0 w-40"
                              style={inputStyle}
                            />
                            {renderFieldIndicator(client.id, 'pension_staging_date')}
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
                              value={client.pension_reenrolment_date ?? ''}
                              onChange={(e) => handleFieldChange(client.id, 'pension_reenrolment_date', e.target.value)}
                              className="h-8 text-sm rounded-lg border-0 w-40"
                              style={inputStyle}
                            />
                            {renderFieldIndicator(client.id, 'pension_reenrolment_date')}
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
                              value={client.declaration_of_compliance_deadline ?? ''}
                              onChange={(e) => handleFieldChange(client.id, 'declaration_of_compliance_deadline', e.target.value)}
                              className="h-8 text-sm rounded-lg border-0 w-40"
                              style={inputStyle}
                            />
                            {renderFieldIndicator(client.id, 'declaration_of_compliance_deadline')}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Datalist for pension providers (shared across all rows) */}
            <datalist id="pension-providers-list">
              {['NEST', 'NOW Pensions', 'Smart Pension', "People's Pension", 'Aviva', 'Scottish Widows', 'Royal London', 'Penfold', 'Legal & General', 'Standard Life', 'LGPS', 'Cushon', 'Creative', 'True Potential', 'Exempt'].map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
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
        <div className="ml-auto flex items-center gap-1.5">
          <Loader2 className="w-3 h-3" style={{ color: colors.text.muted }} />
          Saving
        </div>
        <div className="flex items-center gap-1.5">
          <Check className="w-3 h-3" style={{ color: colors.success }} />
          Saved
        </div>
      </div>
    </div>
  )
}
