// src/app/(dashboard)/dashboard/admin/users/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { useToast } from '@/components/ui/toast'
import {
  Users,
  ArrowLeft,
  Pencil,
  Check,
  X,
  Search,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface AdminUser {
  id: string
  email: string
  name: string
  title: string | null
  avatar_url: string | null
  is_active: boolean | null
  created_at: string | null
  tenant_id: string | null
  tenant_name: string | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)

  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin/users')
        if (res.status === 403) {
          router.push('/dashboard')
          return
        }
        if (!res.ok) throw new Error('Failed to fetch users')
        const data = await res.json()
        setUsers(data.users)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load users')
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [router])

  const startEdit = (user: AdminUser) => {
    setEditingUserId(user.id)
    setEditTitle(user.title || '')
  }

  const cancelEdit = () => {
    setEditingUserId(null)
    setEditTitle('')
  }

  const saveTitle = async (userId: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim() || null }),
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, title: data.user.title } : u))
        setEditingUserId(null)
        setEditTitle('')
        toast('Title updated')
      } else {
        const err = await res.json()
        toast(err.error || 'Failed to update', 'error')
      }
    } catch {
      toast('Failed to update title', 'error')
    } finally {
      setSaving(false)
    }
  }

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.title?.toLowerCase().includes(q) ||
      u.tenant_name?.toLowerCase().includes(q)
    )
  })

  const cardStyle = {
    background: colors.surface,
    borderColor: colors.border,
  }

  // ─── Skeleton ──────────────────────────────────────────────────────

  if (!mounted || loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg animate-pulse" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />
          <div className="space-y-1.5">
            <div className="h-5 w-40 rounded animate-pulse" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />
            <div className="h-3 w-56 rounded animate-pulse" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }} />
          </div>
        </div>
        <div className="h-64 rounded-xl animate-pulse" style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }} />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border" style={cardStyle}>
        <CardContent className="p-8 text-center">
          <p className="text-sm" style={{ color: colors.error }}>{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" style={{ color: colors.text.muted }} />
          </button>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: `${colors.primary}15` }}
          >
            <Users className="w-5 h-5" style={{ color: colors.primary }} />
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
              User Management
            </h1>
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              Manage user titles and view platform users
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: colors.text.muted }} />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          style={{ background: isDark ? 'rgba(255,255,255,0.05)' : '#fff', borderColor: colors.border, color: colors.text.primary }}
        />
      </div>

      {/* Users table */}
      <Card className="border overflow-hidden" style={cardStyle}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow style={{ borderColor: colors.border }}>
                <TableHead className="text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.muted }}>User</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.muted }}>Email</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.muted }}>Title</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.muted }}>Tenant</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.muted }}>Status</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider" style={{ color: colors.text.muted }}>Joined</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider w-[80px]" style={{ color: colors.text.muted }}>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => {
                const initial = (user.name?.[0] || user.email?.[0] || 'U').toUpperCase()
                const isEditing = editingUserId === user.id

                return (
                  <TableRow key={user.id} style={{ borderColor: colors.border }}>
                    {/* User */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {user.avatar_url ? (
                          <Image
                            src={user.avatar_url}
                            alt={user.name}
                            width={28}
                            height={28}
                            className="rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[0.6rem] font-bold flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
                          >
                            {initial}
                          </div>
                        )}
                        <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
                          {user.name}
                        </span>
                      </div>
                    </TableCell>

                    {/* Email */}
                    <TableCell>
                      <span className="text-xs" style={{ color: colors.text.secondary }}>{user.email}</span>
                    </TableCell>

                    {/* Title */}
                    <TableCell>
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <Input
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            placeholder="e.g. Founding Member"
                            maxLength={100}
                            className="h-7 text-xs w-40"
                            style={{ borderColor: colors.border, color: colors.text.primary }}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveTitle(user.id)
                              if (e.key === 'Escape') cancelEdit()
                            }}
                          />
                          <button
                            onClick={() => saveTitle(user.id)}
                            disabled={saving}
                            className="p-1 rounded transition-colors"
                            style={{ color: colors.success }}
                            aria-label="Save title"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 rounded transition-colors"
                            style={{ color: colors.text.muted }}
                            aria-label="Cancel editing"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: user.title ? colors.primary : colors.text.muted }}>
                          {user.title || '—'}
                        </span>
                      )}
                    </TableCell>

                    {/* Tenant */}
                    <TableCell>
                      <span className="text-xs" style={{ color: colors.text.secondary }}>
                        {user.tenant_name || '—'}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <span
                        className="px-2 py-0.5 rounded-full text-[0.65rem] font-medium"
                        style={{
                          background: user.is_active !== false ? 'rgba(5,150,105,0.1)' : 'rgba(220,38,38,0.1)',
                          color: user.is_active !== false ? '#059669' : '#dc2626',
                        }}
                      >
                        {user.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>

                    {/* Joined */}
                    <TableCell>
                      <span className="text-xs" style={{ color: colors.text.muted }}>
                        {user.created_at ? format(parseISO(user.created_at), 'dd MMM yyyy') : '—'}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      {!isEditing && (
                        <button
                          onClick={() => startEdit(user)}
                          className="p-1.5 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                          title="Edit title"
                          aria-label="Edit user title"
                        >
                          <Pencil className="w-3.5 h-3.5" style={{ color: colors.text.muted }} />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-sm" style={{ color: colors.text.muted }}>
                      {searchQuery ? 'No users match your search' : 'No users found'}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
