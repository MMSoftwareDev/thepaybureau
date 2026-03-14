// src/contexts/AuthContext.tsx
'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase'
import { clearSWRCache, revalidateAllSWR } from '@/lib/swr'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  avatarUrl: string | null
  isAdmin: boolean
  plan: string
  loading: boolean
  updateAvatar: (url: string | null) => void
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [plan, setPlan] = useState<string>('free')
  const [loading, setLoading] = useState(true)
  const supabaseRef = useRef(createClientSupabaseClient())
  const currentUserIdRef = useRef<string | null>(null)

  const fetchUserData = useCallback(async (authUser: User) => {
    const supabase = supabaseRef.current

    // Fetch avatar, admin status, and plan in parallel
    const [avatarResult] = await Promise.all([
      supabase
        .from('users')
        .select('avatar_url')
        .eq('id', authUser.id)
        .single(),
      fetch('/api/admin/check')
        .then(res => res.json())
        .then(data => setIsAdmin(data.isAdmin === true))
        .catch(() => {}),
      fetch('/api/stripe/subscription')
        .then(res => res.json())
        .then(data => { if (data.plan) setPlan(data.plan) })
        .catch(() => {}),
    ])

    if (avatarResult.data?.avatar_url) {
      setAvatarUrl(avatarResult.data.avatar_url)
    }
  }, [])

  useEffect(() => {
    const supabase = supabaseRef.current

    // Initial user fetch
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser) {
        currentUserIdRef.current = authUser.id
        setUser(authUser)
        fetchUserData(authUser).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        currentUserIdRef.current = null
        clearSWRCache()
        setUser(null)
        setAvatarUrl(null)
        setIsAdmin(false)
        setPlan('free')
      } else if (event === 'SIGNED_IN' && session?.user) {
        const isNewUser = currentUserIdRef.current !== session.user.id
        currentUserIdRef.current = session.user.id
        if (isNewUser) {
          // Only clear cache + refetch when switching accounts, not on session restore
          clearSWRCache()
          revalidateAllSWR()
          fetchUserData(session.user)
        }
        setUser(session.user)
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchUserData])

  const updateAvatar = useCallback((url: string | null) => {
    setAvatarUrl(url)
  }, [])

  const handleSignOut = useCallback(async () => {
    try {
      clearSWRCache()
      await supabaseRef.current.auth.signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      avatarUrl,
      isAdmin,
      plan,
      loading,
      updateAvatar,
      signOut: handleSignOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
