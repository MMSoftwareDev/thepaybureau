// src/components/layout/Sidebar.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard,
  Users,
  UsersRound,
  ClipboardCheck,
  Shield,
  Search,
  Sun,
  Moon,
  Command,
  BarChart3,
  ChevronDown,
  ScrollText,
  GraduationCap,
  Lightbulb,
  Bot,
  BookOpen,
} from 'lucide-react'
import FeedbackWidget from '@/components/ui/FeedbackWidget'
import SidebarStatusIndicator from '@/components/ui/SidebarStatusIndicator'
import { APP_VERSION, CURRENT_STAGE, CURRENT_STAGE_COLOR } from '@/config/version'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  pro?: boolean
}

interface NavSection {
  label: string
  items: NavItem[]
}

interface SidebarProps {
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
    ],
  },
  {
    label: 'PAYROLL',
    items: [
      { name: 'Payrolls', href: '/dashboard/payrolls', icon: ClipboardCheck },
      { name: 'Pension Declarations', href: '/dashboard/pensions', icon: Shield },
    ],
  },
  {
    label: 'TRAINING',
    items: [
      { name: 'Training & CPD', href: '/dashboard/training', icon: GraduationCap, pro: true },
    ],
  },
  {
    label: 'AI',
    items: [
      { name: 'AI Assistant', href: '/dashboard/ai-assistant', icon: Bot, pro: true },
      { name: 'Knowledge Base', href: '/dashboard/ai-assistant/documents', icon: BookOpen, pro: true },
    ],
  },
  {
    label: 'ADMIN',
    items: [
      { name: 'Audit Log', href: '/dashboard/audit-log', icon: ScrollText },
      // User Management added dynamically for platform admins (see navSections below)
    ],
  },
  {
    label: 'COMMUNITY',
    items: [
      { name: 'Feature Requests', href: '/dashboard/feature-requests', icon: Lightbulb },
    ],
  },
]

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const { isAdmin, plan } = useAuth()
  const isFreePlan = plan === 'free' || plan === 'trial'

  // Dynamically add admin-only nav items
  const navSections: NavSection[] = NAV_SECTIONS.map(section => {
    if (section.label === 'ADMIN' && isAdmin) {
      return {
        ...section,
        items: [
          ...section.items,
          { name: 'User Management', href: '/dashboard/admin/users', icon: UsersRound },
        ],
      }
    }
    return section
  })

  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const { isDark, toggleTheme } = useTheme()
  const colors = getThemeColors(isDark)
  useEffect(() => { setMounted(true) }, [])

  // Auto-expand section containing the active route
  useEffect(() => {
    const activeSection = NAV_SECTIONS.find(section =>
      section.items.some(item => {
        if (item.href === '/dashboard') return pathname === '/dashboard'
        if (item.href === '/dashboard/clients') return pathname === '/dashboard/clients' || (pathname.startsWith('/dashboard/clients/') && !pathname.includes('/add'))
        return pathname.startsWith(item.href)
      })
    )
    if (activeSection) {
      setExpandedSections(prev => {
        if (prev.has(activeSection.label)) return prev
        const next = new Set(prev)
        next.add(activeSection.label)
        return next
      })
    }
  }, [pathname])

  const toggleSection = (label: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      return next
    })
  }

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
      <div className="h-[60px] flex items-center px-4 border-b" style={{ borderColor: colors.border }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-3 group"
        >
          <Image src="/logo.png" alt="ThePayBureau" width={36} height={36} className="rounded-lg flex-shrink-0" priority />
          <span
            className="text-[0.95rem] font-bold tracking-tight"
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
        {navSections.map((section) => {
          const isExpanded = expandedSections.has(section.label)
          return (
          <div key={section.label} className="mb-3">
            <button
              onClick={() => toggleSection(section.label)}
              className="w-full flex items-center justify-between px-2.5 pb-1 pt-0.5 rounded-md transition-colors duration-150"
              style={{ color: colors.text.muted }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <span className="text-[0.65rem] font-semibold tracking-[0.08em] uppercase">
                {section.label}
              </span>
              <ChevronDown
                className="w-3 h-3 transition-transform duration-200"
                style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
              />
            </button>
            <div
              className="overflow-hidden transition-all duration-200"
              style={{
                display: 'grid',
                gridTemplateRows: isExpanded ? '1fr' : '0fr',
              }}
            >
              <div className="min-h-0 pt-1 pl-2">
            {section.items.map((item) => {
              const isActive = isActiveRoute(item.href)
              const Icon = item.icon
              const isGated = item.pro && isFreePlan
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className="w-full flex items-center gap-2.5 px-2.5 h-9 rounded-lg mb-0.5 transition-all duration-150 relative"
                  style={{
                    background: isActive && !isGated
                      ? isDark ? 'rgba(255,255,255,0.08)' : `${colors.primary}10`
                      : 'transparent',
                    color: isGated ? colors.text.muted : isActive ? colors.text.primary : colors.text.secondary,
                    opacity: isGated ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive || isGated) {
                      e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : colors.lightBg
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive || isGated) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  {/* Active indicator bar */}
                  {isActive && !isGated && (
                    <div
                      className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full"
                      style={{ background: `linear-gradient(180deg, ${colors.primary}, ${colors.secondary})` }}
                    />
                  )}
                  <Icon
                    className="w-[18px] h-[18px] flex-shrink-0"
                    style={{ color: isGated ? colors.text.muted : isActive ? colors.primary : colors.text.muted }}
                  />
                  <span className={`text-[0.8rem] ${isActive && !isGated ? 'font-semibold' : 'font-medium'} flex-1 text-left`}>
                    {item.name}
                  </span>
                  {isGated && (
                    <span
                      className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wide"
                      style={{
                        background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                        color: '#fff',
                      }}
                    >
                      Pro
                    </span>
                  )}
                </button>
              )
            })}
              </div>
            </div>
          </div>
          )
        })}

        {/* Send Feedback — opens modal */}
        <div className="px-2.5 mb-3">
          <FeedbackWidget />
        </div>
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

        {/* Status indicator */}
        <SidebarStatusIndicator />

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

        {/* Version badge */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
          <span
            className="text-[0.65rem] font-medium"
            style={{ color: colors.text.muted }}
          >
            {APP_VERSION.label}
          </span>
          <span
            className="px-1.5 py-0.5 rounded text-[0.6rem] font-semibold uppercase tracking-wide"
            style={{
              background: CURRENT_STAGE_COLOR.bg,
              color: CURRENT_STAGE_COLOR.text,
            }}
          >
            {CURRENT_STAGE}
          </span>
        </div>

      </div>
    </nav>
  )
}
