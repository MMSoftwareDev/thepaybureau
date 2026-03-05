// src/app/(dashboard)/dashboard/training/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { useToast } from '@/components/ui/toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  GraduationCap,
  Plus,
  Check,
  ExternalLink,
  Trash2,
  Pencil,
  X,
  Search,
  Filter,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────

interface TrainingRecord {
  id: string
  title: string
  provider: string | null
  category: string | null
  url: string | null
  notes: string | null
  completed: boolean
  completed_date: string | null
  created_at: string
}

type Category = 'hmrc_webinar' | 'cipp_webinar' | 'online_course' | 'conference' | 'workshop' | 'self_study' | 'other'

// ─── Helpers ─────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  hmrc_webinar: 'HMRC Webinar',
  cipp_webinar: 'CIPP Webinar',
  online_course: 'Online Course',
  conference: 'Conference',
  workshop: 'Workshop',
  self_study: 'Self Study',
  other: 'Other',
}

const CATEGORY_COLORS: Record<string, { text: string; bg: string }> = {
  hmrc_webinar: { text: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  cipp_webinar: { text: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
  online_course: { text: '#059669', bg: 'rgba(5,150,105,0.1)' },
  conference: { text: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  workshop: { text: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
  self_study: { text: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
  other: { text: '#64748b', bg: 'rgba(100,116,139,0.1)' },
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Component ───────────────────────────────────────────────────────

export default function TrainingPage() {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { toast } = useToast()

  const [records, setRecords] = useState<TrainingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formProvider, setFormProvider] = useState('')
  const [formCategory, setFormCategory] = useState<Category | ''>('')
  const [formUrl, setFormUrl] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formCompleted, setFormCompleted] = useState(false)
  const [formCompletedDate, setFormCompletedDate] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch('/api/training')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setRecords(data)
    } catch (err) {
      console.error('Failed to fetch training records:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const resetForm = () => {
    setFormTitle('')
    setFormProvider('')
    setFormCategory('')
    setFormUrl('')
    setFormNotes('')
    setFormCompleted(false)
    setFormCompletedDate('')
    setEditingId(null)
    setShowForm(false)
  }

  const startEdit = (record: TrainingRecord) => {
    setFormTitle(record.title)
    setFormProvider(record.provider || '')
    setFormCategory((record.category as Category) || '')
    setFormUrl(record.url || '')
    setFormNotes(record.notes || '')
    setFormCompleted(record.completed)
    setFormCompletedDate(record.completed_date || '')
    setEditingId(record.id)
    setShowForm(true)
  }

  const handleSubmit = async () => {
    if (!formTitle.trim()) return
    setSaving(true)

    try {
      const body: Record<string, unknown> = {
        title: formTitle.trim(),
        provider: formProvider.trim() || null,
        category: formCategory || null,
        url: formUrl.trim() || null,
        notes: formNotes.trim() || null,
        completed: formCompleted,
        completed_date: formCompleted && formCompletedDate ? formCompletedDate : null,
      }

      if (editingId) {
        body.id = editingId
      }

      const res = await fetch('/api/training', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('Failed to save')

      toast(editingId ? 'Training record updated' : 'Training record added', 'success')
      resetForm()
      fetchRecords()
    } catch {
      toast('Failed to save training record', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleCompleted = async (record: TrainingRecord) => {
    const nowCompleted = !record.completed
    try {
      const res = await fetch('/api/training', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: record.id,
          completed: nowCompleted,
          completed_date: nowCompleted ? new Date().toISOString().split('T')[0] : null,
        }),
      })
      if (!res.ok) throw new Error('Failed to update')
      fetchRecords()
    } catch {
      toast('Failed to update', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/training?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast('Training record deleted', 'success')
      fetchRecords()
    } catch {
      toast('Failed to delete', 'error')
    }
  }

  // Filter records
  const filtered = records.filter(r => {
    if (statusFilter === 'completed' && !r.completed) return false
    if (statusFilter === 'pending' && r.completed) return false
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) &&
        !(r.provider || '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const completedCount = records.filter(r => r.completed).length
  const pendingCount = records.length - completedCount

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: colors.text.primary }}>
            Training &amp; CPD
          </h1>
          <p className="mt-1 text-sm" style={{ color: colors.text.secondary }}>
            Track your continuing professional development
          </p>
        </div>
        <Button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2"
          style={{ background: colors.primary }}
        >
          <Plus size={16} />
          Add Training
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: records.length },
          { label: 'Completed', value: completedCount },
          { label: 'Pending', value: pendingCount },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-xl border p-4 text-center"
            style={{ background: colors.surface, borderColor: colors.border }}
          >
            <div className="text-2xl font-bold" style={{ color: colors.text.primary }}>
              {stat.value}
            </div>
            <div className="text-xs mt-1" style={{ color: colors.text.muted }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div
          className="rounded-xl border p-5 space-y-4"
          style={{ background: colors.surface, borderColor: colors.border }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: colors.text.primary }}>
              {editingId ? 'Edit Training Record' : 'Add Training Record'}
            </h2>
            <button onClick={resetForm} style={{ color: colors.text.muted }}>
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium block mb-1" style={{ color: colors.text.secondary }}>
                Title *
              </label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. HMRC Employment Income Manual Webinar"
                style={{ background: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border, color: colors.text.primary }}
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: colors.text.secondary }}>
                Provider
              </label>
              <Input
                value={formProvider}
                onChange={(e) => setFormProvider(e.target.value)}
                placeholder="e.g. HMRC, CIPP, Brightpay"
                style={{ background: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border, color: colors.text.primary }}
              />
            </div>

            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: colors.text.secondary }}>
                Category
              </label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as Category)}
                className="w-full rounded-lg px-3 py-2 text-sm border"
                style={{ background: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border, color: colors.text.primary }}
              >
                <option value="">Select category...</option>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-medium block mb-1" style={{ color: colors.text.secondary }}>
                Link (URL)
              </label>
              <Input
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                placeholder="https://..."
                style={{ background: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border, color: colors.text.primary }}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-medium block mb-1" style={{ color: colors.text.secondary }}>
                Notes
              </label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Key takeaways, topics covered..."
                rows={2}
                className="w-full rounded-lg px-3 py-2 text-sm border resize-none"
                style={{ background: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border, color: colors.text.primary }}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formCompleted}
                  onChange={(e) => {
                    setFormCompleted(e.target.checked)
                    if (e.target.checked && !formCompletedDate) {
                      setFormCompletedDate(new Date().toISOString().split('T')[0])
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm" style={{ color: colors.text.primary }}>Completed</span>
              </label>
            </div>

            {formCompleted && (
              <div>
                <label className="text-xs font-medium block mb-1" style={{ color: colors.text.secondary }}>
                  Date Completed
                </label>
                <Input
                  type="date"
                  value={formCompletedDate}
                  onChange={(e) => setFormCompletedDate(e.target.value)}
                  style={{ background: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border, color: colors.text.primary }}
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={!formTitle.trim() || saving}
              style={{ background: colors.primary }}
            >
              {saving ? 'Saving...' : editingId ? 'Update' : 'Add'}
            </Button>
            <Button
              onClick={resetForm}
              variant="outline"
              style={{ borderColor: colors.border, color: colors.text.secondary }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: colors.text.muted }}
          />
          <Input
            placeholder="Search training records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            style={{ background: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border, color: colors.text.primary }}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border"
          style={{
            borderColor: statusFilter !== 'all' ? colors.primary : colors.border,
            color: statusFilter !== 'all' ? colors.primary : colors.text.secondary,
            background: 'transparent',
          }}
        >
          <Filter size={14} />
          {statusFilter === 'all' ? 'Filter' : statusFilter === 'completed' ? 'Completed' : 'Pending'}
        </button>
      </div>

      {showFilters && (
        <div className="flex gap-2">
          {(['all', 'completed', 'pending'] as const).map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setShowFilters(false) }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border"
              style={{
                borderColor: statusFilter === s ? colors.primary : colors.border,
                color: statusFilter === s ? colors.primary : colors.text.secondary,
                background: statusFilter === s ? (isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.05)') : 'transparent',
              }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Records list */}
      <div
        className="rounded-xl border overflow-hidden"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        {loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 mx-auto mb-3" style={{ borderColor: colors.primary }} />
            <p className="text-sm" style={{ color: colors.text.muted }}>Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <GraduationCap size={40} className="mx-auto mb-3" style={{ color: colors.text.muted, opacity: 0.4 }} />
            <p className="text-sm font-medium" style={{ color: colors.text.secondary }}>
              {records.length === 0 ? 'No training records yet' : 'No matching records'}
            </p>
            <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
              {records.length === 0 ? 'Click "Add Training" to log your first CPD entry' : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          filtered.map((record, idx) => {
            const catConfig = record.category ? CATEGORY_COLORS[record.category] : null

            return (
              <div
                key={record.id}
                className="flex items-start gap-3 px-4 py-3"
                style={{
                  borderBottom: idx < filtered.length - 1 ? `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}` : 'none',
                }}
              >
                {/* Completed checkbox */}
                <button
                  onClick={() => toggleCompleted(record)}
                  className="flex-shrink-0 mt-0.5 w-5 h-5 rounded border flex items-center justify-center"
                  style={{
                    borderColor: record.completed ? '#22c55e' : colors.border,
                    background: record.completed ? '#22c55e' : 'transparent',
                  }}
                >
                  {record.completed && <Check size={12} style={{ color: '#fff' }} />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: colors.text.primary,
                        textDecoration: record.completed ? 'line-through' : 'none',
                        opacity: record.completed ? 0.7 : 1,
                      }}
                    >
                      {record.title}
                    </span>
                    {record.url && (
                      <a
                        href={record.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                        style={{ color: colors.primary }}
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {record.provider && (
                      <span className="text-xs" style={{ color: colors.text.muted }}>
                        {record.provider}
                      </span>
                    )}
                    {record.category && catConfig && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ color: catConfig.text, background: catConfig.bg }}
                      >
                        {CATEGORY_LABELS[record.category]}
                      </span>
                    )}
                    {record.completed_date && (
                      <span className="text-xs" style={{ color: colors.text.muted }}>
                        Completed {formatDate(record.completed_date)}
                      </span>
                    )}
                  </div>

                  {record.notes && (
                    <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
                      {record.notes}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex gap-1">
                  <button
                    onClick={() => startEdit(record)}
                    className="p-1.5 rounded-lg"
                    style={{ color: colors.text.muted }}
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="p-1.5 rounded-lg"
                    style={{ color: colors.text.muted }}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
