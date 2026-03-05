// src/app/(dashboard)/dashboard/feature-requests/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Lightbulb,
  Plus,
  ChevronUp,
  Pencil,
  Trash2,
  X,
  MessageSquare,
  ArrowUpDown,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────

type FeatureStatus = 'submitted' | 'planned' | 'considering' | 'will_not_implement' | 'future'

interface FeatureRequest {
  id: string
  title: string
  description: string | null
  status: FeatureStatus
  created_by_user_id: string | null
  created_by_email: string | null
  created_by_name: string | null
  created_at: string
  updated_at: string
  vote_count: number
  user_has_voted: boolean
}

type SortOption = 'newest' | 'oldest' | 'most_votes'

// ─── Constants ───────────────────────────────────────────────────────

const STATUS_CONFIG: Record<FeatureStatus, { label: string; color: string; bg: string }> = {
  submitted: { label: 'Submitted', color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
  planned: { label: 'Planned', color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
  considering: { label: 'Considering', color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  future: { label: 'Future', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  will_not_implement: { label: 'Won\'t Do', color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'most_votes', label: 'Most Votes' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
]

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'planned', label: 'Planned' },
  { value: 'considering', label: 'Considering' },
  { value: 'future', label: 'Future' },
  { value: 'will_not_implement', label: 'Won\'t Do' },
]

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Component ───────────────────────────────────────────────────────

export default function FeatureRequestsPage() {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { toast } = useToast()

  const [requests, setRequests] = useState<FeatureRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [sort, setSort] = useState<SortOption>('most_votes')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showSubmit, setShowSubmit] = useState(false)
  const [editingRequest, setEditingRequest] = useState<FeatureRequest | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formStatus, setFormStatus] = useState<FeatureStatus>('submitted')

  const fetchRequests = useCallback(async () => {
    try {
      const params = new URLSearchParams({ sort, status: statusFilter })
      const res = await fetch(`/api/feature-requests?${params}`)
      const data = await res.json()
      if (res.ok) {
        setRequests(data.requests)
      }
    } catch {
      toast('Failed to load feature requests', 'error')
    } finally {
      setLoading(false)
    }
  }, [sort, statusFilter, toast])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  useEffect(() => {
    fetch('/api/admin/check')
      .then(r => r.json())
      .then(d => setIsAdmin(d.isAdmin))
      .catch(() => {})
  }, [])

  const handleSubmit = async () => {
    if (!formTitle.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/feature-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: formTitle.trim(), description: formDescription.trim() || undefined }),
      })
      if (res.ok) {
        const data = await res.json()
        setRequests(prev => [data.request, ...prev])
        setFormTitle('')
        setFormDescription('')
        setShowSubmit(false)
        toast('Feature request submitted!')
      }
    } catch {
      toast('Failed to submit', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editingRequest) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/feature-requests/${editingRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
          status: formStatus,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setRequests(prev => prev.map(r => r.id === editingRequest.id ? { ...r, ...data.request } : r))
        closeForm()
        toast('Updated')
      }
    } catch {
      toast('Failed to update', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this feature request?')) return
    try {
      const res = await fetch(`/api/feature-requests/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setRequests(prev => prev.filter(r => r.id !== id))
        toast('Deleted')
      }
    } catch {
      toast('Failed to delete', 'error')
    }
  }

  const handleVote = async (id: string) => {
    try {
      const res = await fetch(`/api/feature-requests/${id}/vote`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setRequests(prev => prev.map(r =>
          r.id === id ? { ...r, vote_count: data.vote_count, user_has_voted: data.user_has_voted } : r
        ))
      }
    } catch {
      toast('Failed to vote', 'error')
    }
  }

  const openEdit = (req: FeatureRequest) => {
    setEditingRequest(req)
    setFormTitle(req.title)
    setFormDescription(req.description || '')
    setFormStatus(req.status)
    setShowSubmit(false)
  }

  const closeForm = () => {
    setShowSubmit(false)
    setEditingRequest(null)
    setFormTitle('')
    setFormDescription('')
    setFormStatus('submitted')
  }

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: `${colors.primary}15` }}
          >
            <Lightbulb className="w-5 h-5" style={{ color: colors.primary }} />
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
              Feature Requests
            </h1>
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              Suggest and vote on ideas to improve the platform
            </p>
          </div>
        </div>
        <Button
          onClick={() => { closeForm(); setShowSubmit(true) }}
          style={{ background: colors.primary, color: '#fff' }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Submit Request
        </Button>
      </div>

      {/* Submit / Edit form */}
      {(showSubmit || editingRequest) && (
        <div
          className="rounded-xl border p-5"
          style={{ background: colors.surface, borderColor: colors.border }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold" style={{ color: colors.text.primary }}>
              {editingRequest ? 'Edit Request' : 'Submit a Feature Request'}
            </h2>
            <button onClick={closeForm}>
              <X className="w-4 h-4" style={{ color: colors.text.muted }} />
            </button>
          </div>
          <div className="space-y-3">
            <Input
              placeholder="Feature title..."
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              maxLength={200}
              style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', borderColor: colors.border, color: colors.text.primary }}
            />
            <textarea
              placeholder="Describe your idea (optional)..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              maxLength={2000}
              rows={3}
              className="w-full rounded-md border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2"
              style={{
                background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                borderColor: colors.border,
                color: colors.text.primary,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ['--tw-ring-color' as any]: colors.primary,
              }}
            />
            {editingRequest && isAdmin && (
              <div className="flex items-center gap-2">
                <span className="text-sm" style={{ color: colors.text.secondary }}>Status:</span>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as FeatureStatus)}
                  className="rounded-md border px-2 py-1 text-sm"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                    borderColor: colors.border,
                    color: colors.text.primary,
                  }}
                >
                  {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeForm} style={{ borderColor: colors.border, color: colors.text.secondary }}>
                Cancel
              </Button>
              <Button
                onClick={editingRequest ? handleUpdate : handleSubmit}
                disabled={!formTitle.trim() || submitting}
                style={{ background: colors.primary, color: '#fff', opacity: !formTitle.trim() || submitting ? 0.5 : 1 }}
              >
                {submitting ? 'Saving...' : editingRequest ? 'Update' : 'Submit'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map(({ value, label }) => {
            const active = statusFilter === value
            return (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  background: active ? `${colors.primary}15` : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  color: active ? colors.primary : colors.text.secondary,
                  border: `1px solid ${active ? `${colors.primary}30` : 'transparent'}`,
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5" style={{ color: colors.text.muted }} />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="text-sm rounded-md border px-2 py-1"
            style={{
              background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
              borderColor: colors.border,
              color: colors.text.primary,
            }}
          >
            {SORT_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Request list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-24 rounded-xl animate-pulse"
              style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}
            />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div
          className="rounded-xl border p-12 text-center"
          style={{ background: colors.surface, borderColor: colors.border }}
        >
          <MessageSquare className="w-10 h-10 mx-auto mb-3" style={{ color: colors.text.muted }} />
          <p className="text-sm font-medium" style={{ color: colors.text.secondary }}>
            No feature requests yet
          </p>
          <p className="text-xs mt-1" style={{ color: colors.text.muted }}>
            Be the first to suggest an improvement!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div
              key={req.id}
              className="rounded-xl border flex overflow-hidden transition-all hover:shadow-sm"
              style={{ background: colors.surface, borderColor: colors.border }}
            >
              {/* Vote column */}
              <button
                onClick={() => handleVote(req.id)}
                className="flex flex-col items-center justify-center px-4 py-3 min-w-[64px] transition-all"
                style={{
                  background: req.user_has_voted
                    ? `${colors.primary}12`
                    : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                  borderRight: `1px solid ${colors.border}`,
                }}
              >
                <ChevronUp
                  className="w-5 h-5 mb-0.5"
                  style={{
                    color: req.user_has_voted ? colors.primary : colors.text.muted,
                    strokeWidth: req.user_has_voted ? 2.5 : 1.5,
                  }}
                />
                <span
                  className="text-sm font-semibold"
                  style={{ color: req.user_has_voted ? colors.primary : colors.text.primary }}
                >
                  {req.vote_count}
                </span>
              </button>

              {/* Content */}
              <div className="flex-1 p-4 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        className="text-sm font-semibold truncate"
                        style={{ color: colors.text.primary }}
                      >
                        {req.title}
                      </h3>
                      <span
                        className="px-2 py-0.5 rounded-full text-[0.65rem] font-medium whitespace-nowrap"
                        style={{
                          background: STATUS_CONFIG[req.status].bg,
                          color: STATUS_CONFIG[req.status].color,
                        }}
                      >
                        {STATUS_CONFIG[req.status].label}
                      </span>
                    </div>
                    {req.description && (
                      <p
                        className="text-xs mt-1 line-clamp-2"
                        style={{ color: colors.text.secondary }}
                      >
                        {req.description}
                      </p>
                    )}
                    <p className="text-[0.65rem] mt-2" style={{ color: colors.text.muted }}>
                      {req.created_by_name || 'Anonymous'} &middot; {formatDate(req.created_at)}
                    </p>
                  </div>

                  {/* Admin actions */}
                  {isAdmin && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEdit(req)}
                        className="p-1.5 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" style={{ color: colors.text.muted }} />
                      </button>
                      <button
                        onClick={() => handleDelete(req.id)}
                        className="p-1.5 rounded-md transition-colors hover:bg-red-500/10"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" style={{ color: colors.text.muted }} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
