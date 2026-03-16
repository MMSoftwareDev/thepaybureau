// src/app/(dashboard)/dashboard/feature-requests/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Lightbulb,
  Plus,
  ChevronUp,
  Pencil,
  Trash2,
  X,
  MessageSquare,
  ArrowUpDown,
  Reply,
  Send,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// ─── Types ───────────────────────────────────────────────────────────

type FeatureStatus = 'submitted' | 'planned' | 'considering' | 'working_on' | 'shipped' | 'will_not_implement' | 'future'

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
  comment_count: number
  created_by_title: string | null
  created_by_avatar_url: string | null
}

interface Comment {
  id: string
  feature_request_id: string
  parent_comment_id: string | null
  user_id: string
  user_email: string
  user_name: string | null
  content: string
  created_at: string
  updated_at: string
}

interface CommentUserInfo {
  title: string | null
  avatar_url: string | null
}

type SortOption = 'newest' | 'oldest' | 'most_votes'

// ─── Constants ───────────────────────────────────────────────────────

const STATUS_CONFIG: Record<FeatureStatus, { label: string; color: string; bg: string }> = {
  submitted: { label: 'Submitted', color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
  planned: { label: 'Planned', color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
  considering: { label: 'Considering', color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  working_on: { label: 'Working On', color: '#059669', bg: 'rgba(5,150,105,0.1)' },
  shipped: { label: 'Shipped', color: '#0891b2', bg: 'rgba(8,145,178,0.1)' },
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
  { value: 'working_on', label: 'Working On' },
  { value: 'shipped', label: 'Shipped' },
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

// ─── Shared UI helpers ───────────────────────────────────────────────

function UserAvatar({ name, avatarUrl, size = 20, colors }: {
  name: string
  avatarUrl: string | null
  size?: number
  colors: ReturnType<typeof getThemeColors>
}) {
  const initial = (name?.[0] || 'U').toUpperCase()
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
      }}
    >
      {initial}
    </div>
  )
}

function TitleBadge({ title, colors }: { title: string | null; colors: ReturnType<typeof getThemeColors> }) {
  if (!title) return null
  const isFounder = title.toLowerCase() === 'founder'
  return (
    <span
      className="px-1.5 py-0.5 rounded-full text-[0.6rem] font-semibold whitespace-nowrap"
      style={{
        background: isFounder
          ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
          : `${colors.primary}15`,
        color: isFounder ? '#fff' : colors.primary,
      }}
    >
      {title}
    </span>
  )
}

// ─── Comment Thread ──────────────────────────────────────────────────

function CommentThread({ featureRequestId, colors, isDark, isAdmin, currentUserId }: {
  featureRequestId: string
  colors: ReturnType<typeof getThemeColors>
  isDark: boolean
  isAdmin: boolean
  currentUserId: string
}) {
  const { toast } = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [usersMap, setUsersMap] = useState<Record<string, CommentUserInfo>>({})
  const [loading, setLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch(`/api/feature-requests/${featureRequestId}/comments`)
        if (res.ok) {
          const data = await res.json()
          setComments(data.comments)
          setUsersMap(data.users)
        }
      } catch {
        // Silently fail — comments aren't critical
      } finally {
        setLoading(false)
      }
    }
    fetchComments()
  }, [featureRequestId])

  const handleSubmitComment = async (content: string, parentId?: string) => {
    if (!content.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/feature-requests/${featureRequestId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          parent_comment_id: parentId,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setComments(prev => [...prev, data.comment])
        setUsersMap(prev => ({ ...prev, [data.comment.user_id]: data.user }))
        setNewComment('')
        setReplyContent('')
        setReplyingTo(null)
      } else {
        const err = await res.json()
        toast(err.error || 'Failed to post comment', 'error')
      }
    } catch {
      toast('Failed to post comment', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/feature-requests/${featureRequestId}/comments/${commentId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        // Remove the comment and its replies
        setComments(prev => prev.filter(c => c.id !== commentId && c.parent_comment_id !== commentId))
        setDeleteTarget(null)
      }
    } catch {
      toast('Failed to delete comment', 'error')
    }
  }

  // Organize into threads
  const topLevel = comments.filter(c => !c.parent_comment_id)
  const repliesMap: Record<string, Comment[]> = {}
  for (const c of comments) {
    if (c.parent_comment_id) {
      if (!repliesMap[c.parent_comment_id]) repliesMap[c.parent_comment_id] = []
      repliesMap[c.parent_comment_id].push(c)
    }
  }

  const renderComment = (comment: Comment, isReply = false) => {
    const userInfo = usersMap[comment.user_id]
    const canDelete = comment.user_id === currentUserId || isAdmin

    return (
      <div
        key={comment.id}
        className={`flex gap-2.5 ${isReply ? 'pl-10 border-l-2' : ''}`}
        style={isReply ? { borderColor: `${colors.primary}20` } : undefined}
      >
        <UserAvatar
          name={comment.user_name || 'Anonymous'}
          avatarUrl={userInfo?.avatar_url || null}
          size={isReply ? 22 : 26}
          colors={colors}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold" style={{ color: colors.text.primary }}>
              {comment.user_name || 'Anonymous'}
            </span>
            <TitleBadge title={userInfo?.title || null} colors={colors} />
            <span className="text-[0.6rem]" style={{ color: colors.text.muted }}>
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>
          <p className="text-xs mt-0.5 whitespace-pre-wrap" style={{ color: colors.text.secondary }}>
            {comment.content}
          </p>
          <div className="flex items-center gap-3 mt-1">
            {!isReply && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="flex items-center gap-1 text-[0.65rem] font-medium transition-colors"
                style={{ color: colors.text.muted }}
              >
                <Reply className="w-3 h-3" />
                Reply
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => setDeleteTarget(comment.id)}
                className="flex items-center gap-1 text-[0.65rem] font-medium transition-colors hover:text-red-500"
                style={{ color: colors.text.muted }}
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            )}
          </div>

          {/* Reply form */}
          {replyingTo === comment.id && (
            <div className="flex gap-2 mt-2">
              <textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                maxLength={2000}
                rows={2}
                className="flex-1 rounded-md border px-2.5 py-1.5 text-xs resize-none focus:outline-none focus:ring-2"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                  borderColor: colors.border,
                  color: colors.text.primary,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ['--tw-ring-color' as any]: colors.primary,
                }}
              />
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleSubmitComment(replyContent, comment.id)}
                  disabled={!replyContent.trim() || submitting}
                  className="p-1.5 rounded-md transition-colors disabled:opacity-40"
                  style={{ background: colors.primary, color: '#fff' }}
                >
                  <Send className="w-3 h-3" />
                </button>
                <button
                  onClick={() => { setReplyingTo(null); setReplyContent('') }}
                  className="p-1.5 rounded-md transition-colors"
                  style={{ color: colors.text.muted }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-3 py-3">
        {[1, 2].map(i => (
          <div key={i} className="flex gap-2.5">
            <div className="w-6 h-6 rounded-full animate-pulse" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-24 rounded animate-pulse" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />
              <div className="h-3 w-48 rounded animate-pulse" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-3">
      {topLevel.map(comment => (
        <div key={comment.id} className="space-y-3">
          {renderComment(comment)}
          {(repliesMap[comment.id] || []).map(reply => renderComment(reply, true))}
        </div>
      ))}

      {/* New comment form */}
      <div className="flex gap-2 pt-2" style={{ borderTop: `1px solid ${colors.border}` }}>
        <textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          maxLength={2000}
          rows={2}
          className="flex-1 rounded-md border px-2.5 py-1.5 text-xs resize-none focus:outline-none focus:ring-2"
          style={{
            background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
            borderColor: colors.border,
            color: colors.text.primary,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ['--tw-ring-color' as any]: colors.primary,
          }}
        />
        <button
          onClick={() => handleSubmitComment(newComment)}
          disabled={!newComment.trim() || submitting}
          className="self-end p-2 rounded-md transition-colors disabled:opacity-40"
          style={{ background: colors.primary, color: '#fff' }}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this comment{repliesMap[deleteTarget || '']?.length ? ' and all its replies' : ''}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDeleteComment(deleteTarget)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ─── Main Page Component ─────────────────────────────────────────────

export default function FeatureRequestsPage() {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { toast } = useToast()
  const { user } = useAuth()

  const [requests, setRequests] = useState<FeatureRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [sort, setSort] = useState<SortOption>('most_votes')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showSubmit, setShowSubmit] = useState(false)
  const [editingRequest, setEditingRequest] = useState<FeatureRequest | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

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
      const data = await res.json()
      if (res.ok) {
        setRequests(prev => prev.map(r => r.id === editingRequest.id ? { ...r, ...data.request, vote_count: r.vote_count, user_has_voted: r.user_has_voted, comment_count: r.comment_count } : r))
        closeForm()
        toast('Updated')
      } else {
        toast(data.error || 'Failed to update', 'error')
      }
    } catch {
      toast('Failed to update', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/feature-requests/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setRequests(prev => prev.filter(r => r.id !== id))
        setDeleteTarget(null)
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

  const toggleComments = (id: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
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

  const currentUserId = user?.id || ''

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
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
                    <option key={value} value={value} style={{ background: colors.surface, color: colors.text.primary }}>{label}</option>
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
              <option key={value} value={value} style={{ background: colors.surface, color: colors.text.primary }}>{label}</option>
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
              className="rounded-xl border overflow-hidden transition-all hover:shadow-sm"
              style={{ background: colors.surface, borderColor: colors.border }}
            >
              <div className="flex">
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
                      {/* Author line with avatar + title */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <UserAvatar
                          name={req.created_by_name || 'Anonymous'}
                          avatarUrl={req.created_by_avatar_url || null}
                          size={18}
                          colors={colors}
                        />
                        <span className="text-[0.65rem]" style={{ color: colors.text.muted }}>
                          {req.created_by_name || 'Anonymous'}
                        </span>
                        <TitleBadge title={req.created_by_title} colors={colors} />
                        <span className="text-[0.65rem]" style={{ color: colors.text.muted }}>
                          &middot; {formatDate(req.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Admin actions + comment toggle */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => toggleComments(req.id)}
                        className="flex items-center gap-1 p-1.5 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                        title="Comments"
                      >
                        <MessageSquare className="w-3.5 h-3.5" style={{ color: expandedComments.has(req.id) ? colors.primary : colors.text.muted }} />
                        {req.comment_count > 0 && (
                          <span className="text-[0.65rem] font-medium" style={{ color: expandedComments.has(req.id) ? colors.primary : colors.text.muted }}>
                            {req.comment_count}
                          </span>
                        )}
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => openEdit(req)}
                            className="p-1.5 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" style={{ color: colors.text.muted }} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(req.id)}
                            className="p-1.5 rounded-md transition-colors hover:bg-red-500/10"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" style={{ color: colors.text.muted }} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded comments section */}
              {expandedComments.has(req.id) && (
                <div
                  className="px-4 pb-4"
                  style={{ borderTop: `1px solid ${colors.border}` }}
                >
                  <CommentThread
                    featureRequestId={req.id}
                    colors={colors}
                    isDark={isDark}
                    isAdmin={isAdmin}
                    currentUserId={currentUserId}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete request confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete feature request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this feature request and all its votes and comments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
