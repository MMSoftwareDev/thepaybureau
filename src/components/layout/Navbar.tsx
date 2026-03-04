// src/components/layout/Navbar.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import {
  Search,
  Bell,
  LogOut,
  Settings,
  Sun,
  Moon,
  Menu,
  ChevronDown,
  User,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface NavbarProps {
  user?: any
  onMenuToggle?: () => void
}

export default function Navbar({ user, onMenuToggle }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [mounted, setMounted] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClientSupabaseClient()
  const { isDark, toggleTheme } = useTheme()
  const colors = getThemeColors(isDark)

  useEffect(() => { setMounted(true) }, [])

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    if (showUserMenu) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showUserMenu])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/dashboard/clients?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getUserInitial = () => {
    if (!mounted) return 'U'
    return user?.user_metadata?.name?.[0] || user?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'
  }

  const getUserName = () => {
    if (!mounted) return 'User'
    return user?.user_metadata?.name || user?.name || user?.email?.split('@')[0] || 'User'
  }

  if (!mounted) {
    return (
      <nav className="h-[60px] border-b animate-pulse" style={{ background: colors.surface, borderColor: colors.border }} />
    )
  }

  return (
    <nav
      className="h-[60px] flex items-center px-5 gap-4 relative z-50 transition-colors duration-300"
      style={{
        background: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      {/* Hamburger — mobile only */}
      {onMenuToggle && (
        <button
          onClick={onMenuToggle}
          className="md:hidden flex items-center justify-center h-9 w-9 rounded-lg transition-colors"
          style={{ color: colors.text.secondary }}
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200"
          style={{ color: searchFocused ? colors.primary : colors.text.muted }}
        />
        <Input
          type="text"
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          className="pl-10 h-9 text-[0.82rem] font-medium border-0 rounded-lg transition-all duration-200"
          style={{
            background: isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg,
            color: colors.text.primary,
            border: searchFocused
              ? `1.5px solid ${colors.primary}60`
              : `1px solid ${colors.border}`,
            boxShadow: searchFocused
              ? `0 0 0 3px ${colors.primary}12`
              : 'none',
          }}
        />
      </form>

      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="h-9 w-9 flex items-center justify-center rounded-lg transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/8"
          style={{ color: colors.text.muted }}
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          {isDark ? <Sun className="w-[18px] h-[18px] text-amber-400" /> : <Moon className="w-[18px] h-[18px]" />}
        </button>

        {/* Notifications */}
        <button
          className="h-9 w-9 flex items-center justify-center rounded-lg transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/8 relative"
          style={{ color: colors.text.muted }}
        >
          <Bell className="w-[18px] h-[18px]" />
        </button>

        {/* Divider */}
        <div className="h-6 w-px mx-1.5" style={{ background: colors.border }} />

        {/* User */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/8"
          >
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-[0.75rem] font-bold flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, var(--login-purple), var(--login-pink))`,
              }}
            >
              {getUserInitial()}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-[0.8rem] font-semibold leading-tight" style={{ color: colors.text.primary }}>
                {getUserName()}
              </div>
              <div className="text-[0.68rem] font-medium leading-tight mt-0.5" style={{ color: colors.text.muted }}>
                Administrator
              </div>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 hidden md:block transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
              style={{ color: colors.text.muted }}
            />
          </button>

          {/* Dropdown */}
          {showUserMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden shadow-xl animate-fadeIn"
              style={{
                background: colors.surface,
                border: `1px solid ${colors.borderElevated}`,
                boxShadow: isDark
                  ? `0 16px 40px rgba(0,0,0,0.5)`
                  : `0 16px 40px rgba(0,0,0,0.12)`,
              }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: colors.border }}>
                <div className="text-[0.82rem] font-bold" style={{ color: colors.text.primary }}>
                  {getUserName()}
                </div>
                <div className="text-[0.72rem] font-medium mt-0.5" style={{ color: colors.text.muted }}>
                  {user?.email}
                </div>
              </div>

              <div className="py-1.5">
                <button
                  onClick={() => { router.push('/dashboard/settings'); setShowUserMenu(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-[0.8rem] font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: colors.text.secondary }}
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <button
                  onClick={() => { router.push('/dashboard/settings'); setShowUserMenu(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-[0.8rem] font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: colors.text.secondary }}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
              </div>

              <div className="border-t py-1.5" style={{ borderColor: colors.border }}>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-[0.8rem] font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                  style={{ color: colors.error }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
