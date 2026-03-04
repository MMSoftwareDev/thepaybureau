// src/components/layout/Sidebar.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClientSupabaseClient } from '@/lib/supabase'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ClipboardCheck,
  Settings as SettingsIcon,
  Search,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react'

interface NavSection {
  label: string
  items: {
    name: string
    href: string
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  }[]
}

interface SidebarProps {
  user?: { email?: string; user_metadata?: { name?: string } }
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'OVERVIEW',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'CLIENTS',
    items: [
      { name: 'All Clients', href: '/dashboard/clients', icon: Users },
      { name: 'Add Client', href: '/dashboard/clients/add', icon: UserPlus },
    ],
  },
  {
    label: 'PAYROLL',
    items: [
      { name: 'Payroll Runs', href: '/dashboard/payrolls', icon: ClipboardCheck },
    ],
  },
]

export default function Sidebar({ user, mobileOpen = false, onMobileClose }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { isDark, toggleTheme } = useTheme()
  const colors = getThemeColors(isDark)
  const supabase = createClientSupabaseClient()

  useEffect(() => { setMounted(true) }, [])

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/dashboard/clients') return pathname === '/dashboard/clients' || (pathname.startsWith('/dashboard/clients/') && !pathname.includes('/add'))
    return pathname.startsWith(href)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/dashboard/clients?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      onMobileClose?.()
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

  const navigate = (href: string) => {
    router.push(href)
    onMobileClose?.()
  }

  const getUserName = () => {
    if (!mounted) return 'User'
    return user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  }

  const getUserEmail = () => {
    return user?.email || ''
  }

  const getUserInitial = () => {
    if (!mounted) return 'U'
    return user?.user_metadata?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'
  }

  if (!mounted) {
    return <div className="hidden md:block w-[260px] h-screen" style={{ background: colors.surface }} />
  }

  return (
    <div
      className={`
        h-screen w-[260px] flex flex-col
        fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out
        md:relative md:z-auto md:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      style={{
        background: colors.surface,
        borderRight: `1px solid ${colors.border}`,
      }}
    >
      {/* Logo */}
      <div className="px-5 pt-5 pb-2">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2.5 group"
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-[16px] w-[16px]">
              <path d="M4 4h6v6H4V4z" fill="rgba(255,255,255,0.95)" />
              <path d="M14 4h6v6h-6V4z" fill="rgba(255,255,255,0.6)" />
              <path d="M4 14h6v6H4v-6z" fill="rgba(255,255,255,0.6)" />
              <path d="M14 14h6v6h-6v-6z" fill="rgba(255,255,255,0.35)" />
            </svg>
          </div>
          <span
            className="text-[0.95rem] font-bold tracking-tight"
            style={{ color: colors.text.primary }}
          >
            ThePayBureau
          </span>
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2 pt-1">
        <form onSubmit={handleSearch} className="relative">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={{ color: colors.text.muted }}
          />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-[0.8rem] rounded-lg outline-none transition-all duration-200"
            style={{
              background: isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg,
              color: colors.text.primary,
              border: `1px solid ${colors.border}`,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = `${colors.primary}60`
              e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primary}10`
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = colors.border
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
        </form>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pt-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-4">
            <div
              className="px-2.5 pb-1.5 text-[0.68rem] font-bold tracking-[0.08em]"
              style={{ color: colors.text.muted }}
            >
              {section.label}
            </div>
            {section.items.map((item) => {
              const isActive = isActiveRoute(item.href)
              const Icon = item.icon
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg mb-0.5 transition-all duration-150"
                  style={{
                    background: isActive
                      ? isDark ? 'rgba(255,255,255,0.08)' : `${colors.primary}08`
                      : 'transparent',
                    color: isActive ? colors.text.primary : colors.text.secondary,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  <Icon
                    className="w-[16px] h-[16px] flex-shrink-0"
                    style={{ color: isActive ? colors.primary : colors.text.muted }}
                  />
                  <span className={`text-[0.82rem] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {item.name}
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4">
        {/* Settings */}
        <button
          onClick={() => navigate('/dashboard/settings')}
          className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg mb-1 transition-all duration-150"
          style={{
            background: pathname.startsWith('/dashboard/settings')
              ? isDark ? 'rgba(255,255,255,0.08)' : `${colors.primary}08`
              : 'transparent',
            color: pathname.startsWith('/dashboard/settings') ? colors.text.primary : colors.text.secondary,
          }}
          onMouseEnter={(e) => {
            if (!pathname.startsWith('/dashboard/settings')) {
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg
            }
          }}
          onMouseLeave={(e) => {
            if (!pathname.startsWith('/dashboard/settings')) {
              e.currentTarget.style.background = 'transparent'
            }
          }}
        >
          <SettingsIcon className="w-[16px] h-[16px]" style={{ color: colors.text.muted }} />
          <span className="text-[0.82rem] font-medium">Settings</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg mb-3 transition-all duration-150"
          style={{ color: colors.text.secondary }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          {isDark
            ? <Sun className="w-[16px] h-[16px] text-amber-400" />
            : <Moon className="w-[16px] h-[16px]" style={{ color: colors.text.muted }} />
          }
          <span className="text-[0.82rem] font-medium">
            {isDark ? 'Light mode' : 'Dark mode'}
          </span>
        </button>

        {/* Divider */}
        <div className="h-px mb-3" style={{ background: colors.border }} />

        {/* User */}
        <div className="flex items-center gap-2.5 px-1">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-[0.72rem] font-bold flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
          >
            {getUserInitial()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[0.8rem] font-semibold truncate" style={{ color: colors.text.primary }}>
              {getUserName()}
            </div>
            <div className="text-[0.68rem] truncate" style={{ color: colors.text.muted }}>
              {getUserEmail()}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="h-7 w-7 flex items-center justify-center rounded-md transition-colors duration-150"
            style={{ color: colors.text.muted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = colors.error
              e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.1)' : 'rgba(217,48,37,0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = colors.text.muted
              e.currentTarget.style.background = 'transparent'
            }}
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
