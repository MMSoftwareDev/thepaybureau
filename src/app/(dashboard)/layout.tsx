// src/app/(dashboard)/layout.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import DashboardWrapper from '@/components/layout/DashboardWrapper'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      // Use getUser() instead of getSession() to ensure token refresh
      // getSession() reads stale cookies and can miss refreshed tokens,
      // causing a redirect loop: /dashboard/clients → /login → /dashboard
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        router.push('/login')
        return
      }

      setUser(user)
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show login redirect message
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Show dashboard if user is authenticated
  return (
    <DashboardWrapper user={user}>
      {children}
    </DashboardWrapper>
  )
}