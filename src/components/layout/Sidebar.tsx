// src/components/layout/Sidebar.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ClipboardCheck,
  Shield,
  CreditCard,
  Settings as SettingsIcon,
  Search,
  Sun,
  Moon,
  Command,
  BarChart3,
  ScrollText,
  GraduationCap,
  Lightbulb,
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
  user?: { email?: string; user_metadata?: { name?: string } } | null
  avatarUrl?: string | null
  isAdmin?: boolean
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
      { name: 'Pension Declarations', href: '/dashboard/pensions', icon: Shield },
    ],
  },
  {
    label: 'DEVELOPMENT',
    items: [
      { name: 'Training & CPD', href: '/dashboard/training', icon: GraduationCap },
    ],
  },
  {
    label: 'ADMIN',
    items: [
      { name: 'Audit Log', href: '/dashboard/audit-log', icon: ScrollText },
    ],
  },
  {
    label: 'COMMUNITY',
    items: [
      { name: 'Feature Requests', href: '/dashboard/feature-requests', icon: Lightbulb },
    ],
  },
]

export default function Sidebar({ isAdmin = false, mobileOpen = false, onMobileClose }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const { isDark, toggleTheme } = useTheme()
  const colors = getThemeColors(isDark)
  useEffect(() => { setMounted(true) }, [])

  // Keyboard shortcut: Cmd/Ctrl + K to toggle search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(prev => !prev)
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setSearchQuery('')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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
      setSearchOpen(false)
      onMobileClose?.()
    }
  }

  const navigate = (href: string) => {
    router.push(href)
    onMobileClose?.()
  }

  if (!mounted) {
    return <div className="hidden md:block w-[252px] h-screen" style={{ background: colors.surface }} />
  }

  return (
    <nav
      aria-label="Main navigation"
      className={`
        h-screen w-[252px] flex flex-col
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
      <div className="h-[52px] flex items-center px-4 border-b" style={{ borderColor: colors.border }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2.5 group"
        >
          <Image src="/logo.png" alt="ThePayBureau" width={28} height={28} className="rounded-md flex-shrink-0" priority />
          <span
            className="text-[0.875rem] font-semibold tracking-tight"
            style={{ color: colors.text.primary }}
          >
            ThePayBureau
          </span>
        </button>
      </div>

      {/* Search trigger */}
      <div className="px-3 pt-3 pb-1">
        {!searchOpen ? (
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center gap-2.5 px-2.5 h-8 rounded-md text-[0.8rem] transition-colors duration-150"
            style={{
              background: isDark ? 'rgba(255,255,255,0.04)' : colors.lightBg,
              color: colors.text.muted,
              border: `1px solid ${colors.border}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = colors.borderElevated
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : '#F3EEFF'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = colors.border
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : colors.lightBg
            }}
          >
            <Search className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="flex-1 text-left">Search...</span>
            <kbd
              className="hidden sm:inline-flex items-center gap-0.5 px-1.5 h-5 rounded text-[0.65rem] font-medium"
              style={{
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                color: colors.text.muted,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
              }}
            >
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </button>
        ) : (
          <form onSubmit={handleSearch} className="relative">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
              style={{ color: colors.primary }}
            />
            <input
              autoFocus
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => {
                if (!searchQuery) setSearchOpen(false)
              }}
              className="w-full h-8 pl-8 pr-3 text-[0.8rem] rounded-md outline-none transition-all duration-150"
              style={{
                background: isDark ? 'rgba(255,255,255,0.06)' : '#F3EEFF',
                color: colors.text.primary,
                border: `1px solid ${colors.primary}50`,
                boxShadow: `0 0 0 3px ${colors.primary}12`,
              }}
            />
          </form>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pt-3 scrollbar-thin">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-3">
            <div
              className="px-2.5 pb-1 text-[0.65rem] font-semibold tracking-[0.08em] uppercase"
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
                  className="w-full flex items-center gap-2.5 px-2.5 h-8 rounded-md mb-px transition-all duration-150 relative"
                  style={{
                    background: isActive
                      ? isDark ? 'rgba(255,255,255,0.08)' : `${colors.primary}08`
                      : 'transparent',
                    color: isActive ? colors.text.primary : colors.text.secondary,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : colors.lightBg
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <div
                      className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full"
                      style={{ background: `linear-gradient(180deg, ${colors.primary}, ${colors.secondary})` }}
                    />
                  )}
                  <Icon
                    className="w-4 h-4 flex-shrink-0"
                    style={{ color: isActive ? colors.primary : colors.text.muted }}
                  />
                  <span className={`text-[0.8rem] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                    {item.name}
                  </span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-3 mt-auto">
        {/* Admin Analytics — only visible to platform admin */}
        {isAdmin && (
          <button
            onClick={() => navigate('/dashboard/admin/analytics')}
            className="w-full flex items-center gap-2.5 px-2.5 h-8 rounded-md mb-px transition-all duration-150 relative"
            style={{
              background: pathname.startsWith('/dashboard/admin')
                ? isDark ? 'rgba(255,255,255,0.08)' : `${colors.primary}08`
                : 'transparent',
              color: pathname.startsWith('/dashboard/admin') ? colors.text.primary : colors.text.secondary,
            }}
            onMouseEnter={(e) => {
              if (!pathname.startsWith('/dashboard/admin')) {
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : colors.lightBg
              }
            }}
            onMouseLeave={(e) => {
              if (!pathname.startsWith('/dashboard/admin')) {
                e.currentTarget.style.background = 'transparent'
              }
            }}
          >
            {pathname.startsWith('/dashboard/admin') && (
              <div
                className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full"
                style={{ background: `linear-gradient(180deg, ${colors.primary}, ${colors.secondary})` }}
              />
            )}
            <BarChart3 className="w-4 h-4" style={{ color: colors.text.muted }} />
            <span className="text-[0.8rem] font-medium">Analytics</span>
          </button>
        )}

        {/* Settings */}
        <button
          onClick={() => navigate('/dashboard/settings')}
          className="w-full flex items-center gap-2.5 px-2.5 h-8 rounded-md mb-px transition-all duration-150 relative"
          style={{
            background: pathname.startsWith('/dashboard/settings')
              ? isDark ? 'rgba(255,255,255,0.08)' : `${colors.primary}08`
              : 'transparent',
            color: pathname.startsWith('/dashboard/settings') ? colors.text.primary : colors.text.secondary,
          }}
          onMouseEnter={(e) => {
            if (!pathname.startsWith('/dashboard/settings')) {
              e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : colors.lightBg
            }
          }}
          onMouseLeave={(e) => {
            if (!pathname.startsWith('/dashboard/settings')) {
              e.currentTarget.style.background = 'transparent'
            }
          }}
        >
          {pathname.startsWith('/dashboard/settings') && (
            <div
              className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full"
              style={{ background: `linear-gradient(180deg, ${colors.primary}, ${colors.secondary})` }}
            />
          )}
          <SettingsIcon className="w-4 h-4" style={{ color: colors.text.muted }} />
          <span className="text-[0.8rem] font-medium">Settings</span>
        </button>

        {/* Subscription (greyed out — V2) */}
        <div
          className="w-full flex items-center gap-2.5 px-2.5 h-8 rounded-md mb-px"
          style={{
            color: colors.text.muted,
            opacity: 0.45,
            cursor: 'not-allowed',
          }}
        >
          <CreditCard className="w-4 h-4" style={{ color: colors.text.muted }} />
          <span className="text-[0.8rem] font-medium">Subscription</span>
          <span className="text-[0.6rem] ml-auto" style={{ color: colors.text.muted }}>Coming Soon</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2.5 px-2.5 h-8 rounded-md mb-2 transition-all duration-150"
          style={{ color: colors.text.secondary }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : colors.lightBg
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          {isDark
            ? <Sun className="w-4 h-4 text-amber-400" />
            : <Moon className="w-4 h-4" style={{ color: colors.text.muted }} />
          }
          <span className="text-[0.8rem] font-medium">
            {isDark ? 'Light mode' : 'Dark mode'}
          </span>
        </button>

      </div>
    </nav>
  )
}
