// src/app/(dashboard)/layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import DashboardWrapper from '@/components/layout/DashboardWrapper'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [plan, setPlan] = useState<string>('free')
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    // Auth is already enforced by middleware — this just fetches user info for display
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user)
        // Fetch avatar in parallel, non-blocking
        supabase
          .from('users')
          .select('avatar_url')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data?.avatar_url) setAvatarUrl(data.avatar_url)
          })
        // Check admin status server-side
        fetch('/api/admin/check')
          .then(res => res.json())
          .then(data => setIsAdmin(data.isAdmin === true))
          .catch(() => {})
        // Fetch subscription plan
        fetch('/api/stripe/subscription')
          .then(res => res.json())
          .then(data => { if (data.plan) setPlan(data.plan) })
          .catch(() => {})
      }
    })

    const handleAvatarUpdate = (e: CustomEvent<string | null>) => {
      setAvatarUrl(e.detail)
    }
    window.addEventListener('avatar-updated', handleAvatarUpdate as EventListener)
    return () => window.removeEventListener('avatar-updated', handleAvatarUpdate as EventListener)
  }, [])

  // Render immediately — middleware already ensures auth.
  // User info populates asynchronously for sidebar/navbar display.
  return (
    <DashboardWrapper user={user} avatarUrl={avatarUrl} isAdmin={isAdmin} plan={plan}>
      {children}
    </DashboardWrapper>
  )
}
