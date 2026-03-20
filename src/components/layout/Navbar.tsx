// src/components/layout/Navbar.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { Menu, ChevronRight, LogOut, ChevronDown, Trophy, Settings as SettingsIcon, CreditCard } from 'lucide-react'
import BadgeDropdown from '@/components/gamification/BadgeDropdown'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

interface NavbarProps {
  onMenuToggle?: () => void
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/clients': 'Clients',

  '/dashboard/payrolls': 'Payroll Runs',
  '/dashboard/pensions': 'Pension Declarations',
  '/dashboard/settings': 'Settings',
  '/dashboard/feature-requests': 'Feature Requests',
  '/dashboard/ai-assistant': 'AI Assistant',
  '/dashboard/ai-assistant/documents': 'Knowledge Base',
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.match(/^\/dashboard\/clients\/[^/]+\/edit$/)) return 'Edit Client'
  if (pathname.match(/^\/dashboard\/clients\/[^/]+$/)) return 'Client Details'
  if (pathname.match(/^\/dashboard\/payrolls\/[^/]+$/)) return 'Payroll Details'
  return 'Dashboard'
}

function getBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const title = getPageTitle(pathname)

  if (pathname === '/dashboard') return [{ label: 'Dashboard' }]

  if (pathname.startsWith('/dashboard/clients')) {
    const crumbs: { label: string; href?: string }[] = [
      { label: 'Clients', href: '/dashboard/clients' },
    ]
    if (pathname !== '/dashboard/clients') {
      crumbs.push({ label: title })
    }
    return crumbs
  }

  if (pathname.startsWith('/dashboard/payrolls')) {
    const crumbs: { label: string; href?: string }[] = [
      { label: 'Payroll Runs', href: '/dashboard/payrolls' },
    ]
    if (pathname !== '/dashboard/payrolls') {
      crumbs.push({ label: title })
    }
    return crumbs
  }

  if (pathname.startsWith('/dashboard/pensions')) {
    return [{ label: 'Pension Declarations' }]
  }

  if (pathname.startsWith('/dashboard/ai-assistant')) {
    const crumbs: { label: string; href?: string }[] = [
      { label: 'AI Assistant', href: '/dashboard/ai-assistant' },
    ]
    if (pathname !== '/dashboard/ai-assistant') {
      crumbs.push({ label: title })
    }
    return crumbs
  }

  return [{ label: title }]
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const [mounted, setMounted] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [badgeSheetOpen, setBadgeSheetOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const { user, avatarUrl, signOut } = useAuth()

  useEffect(() => { setMounted(true) }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close dropdown on route change
  useEffect(() => { setDropdownOpen(false) }, [pathname])

  const getUserName = () => {
    if (!mounted) return 'User'
    return user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  }

  const getUserInitial = () => {
    if (!mounted) return 'U'
    return user?.user_metadata?.name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'
  }

  if (!mounted) {
    return (
      <nav
        className="h-[60px] border-b"
        style={{ background: colors.surface, borderColor: colors.border }}
      />
    )
  }

  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <nav
      className="h-[60px] flex items-center px-4 md:px-5 gap-3 transition-colors duration-200"
      style={{
        background: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      {/* Hamburger - mobile only */}
      {onMenuToggle && (
        <button
          aria-label="Toggle navigation menu"
          onClick={onMenuToggle}
          className="md:hidden flex items-center justify-center h-8 w-8 rounded-md transition-colors duration-150 hover:bg-[var(--nav-hover)]"
          style={{ color: colors.text.secondary, '--nav-hover': isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg } as React.CSSProperties}
        >
          <Menu className="w-[18px] h-[18px]" />
        </button>
      )}

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 min-w-0 flex-1">
        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center gap-1 min-w-0">
            {index > 0 && (
              <ChevronRight
                className="w-3.5 h-3.5 flex-shrink-0"
                style={{ color: colors.text.muted }}
              />
            )}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="text-[0.8rem] font-medium transition-colors duration-150 hover:underline underline-offset-2"
                style={{ color: colors.text.muted }}
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className="text-[0.8rem] font-semibold truncate"
                style={{ color: colors.text.primary }}
              >
                {crumb.label}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* User profile dropdown */}
      <div className="relative flex-shrink-0" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors duration-150 hover:bg-[var(--nav-hover)]"
          style={{ color: colors.text.secondary, '--nav-hover': isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg } as React.CSSProperties}
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={getUserName()}
              width={26}
              height={26}
              className="rounded-md object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="h-[26px] w-[26px] rounded-md flex items-center justify-center text-white text-[0.65rem] font-bold flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` }}
            >
              {getUserInitial()}
            </div>
          )}
          <span className="hidden sm:inline text-[0.78rem] font-medium max-w-[120px] truncate">
            {getUserName()}
          </span>
          <ChevronDown
            className="w-3 h-3 transition-transform"
            style={{
              color: colors.text.muted,
              transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>

        {/* Dropdown */}
        {dropdownOpen && (
          <div
            className="absolute right-0 top-full mt-1 w-56 rounded-lg border shadow-lg py-1 z-50"
            style={{
              background: colors.surface,
              borderColor: colors.border,
              boxShadow: isDark
                ? '0 8px 24px rgba(0,0,0,0.4)'
                : '0 8px 24px rgba(0,0,0,0.08)',
            }}
          >
            {/* User info */}
            <div className="px-3 py-2.5 border-b" style={{ borderColor: colors.border }}>
              <div className="text-[0.78rem] font-semibold truncate" style={{ color: colors.text.primary }}>
                {getUserName()}
              </div>
              <div className="text-[0.65rem] truncate" style={{ color: colors.text.muted }}>
                {user?.email || ''}
              </div>
            </div>

            {/* View Badges */}
            <button
              onClick={() => { setDropdownOpen(false); setBadgeSheetOpen(true) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors duration-150 hover:bg-[var(--nav-hover)]"
              style={{ color: colors.text.secondary, '--nav-hover': isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg } as React.CSSProperties}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span className="text-[0.78rem] font-medium">View Badges</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => { setDropdownOpen(false); router.push('/dashboard/settings') }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors duration-150 hover:bg-[var(--nav-hover)]"
              style={{ color: colors.text.secondary, '--nav-hover': isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg } as React.CSSProperties}
            >
              <SettingsIcon className="w-3.5 h-3.5" />
              <span className="text-[0.78rem] font-medium">Settings</span>
            </button>

            {/* Subscription */}
            <button
              onClick={() => { setDropdownOpen(false); router.push('/dashboard/subscription') }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors duration-150 hover:bg-[var(--nav-hover)]"
              style={{ color: colors.text.secondary, '--nav-hover': isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg } as React.CSSProperties}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span className="text-[0.78rem] font-medium">Subscription</span>
            </button>

            {/* Divider before sign out */}
            <div className="border-t my-1" style={{ borderColor: colors.border }} />

            {/* Logout */}
            <button
              onClick={signOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors duration-150 hover:bg-[var(--nav-hover)] hover:text-[var(--nav-hover-color)]"
              style={{ color: colors.text.secondary, '--nav-hover': isDark ? 'rgba(239,68,68,0.08)' : 'rgba(217,48,37,0.05)', '--nav-hover-color': colors.error } as React.CSSProperties}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="text-[0.78rem] font-medium">Sign out</span>
            </button>
          </div>
        )}
      </div>

      {/* Badge Sheet (rendered outside dropdown) */}
      <BadgeDropdown colors={colors} isDark={isDark} open={badgeSheetOpen} onOpenChange={setBadgeSheetOpen} />
    </nav>
  )
}
