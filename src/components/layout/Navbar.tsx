// src/components/layout/Navbar.tsx
'use client'

import { useState, useEffect } from 'react'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { Menu, ChevronRight } from 'lucide-react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

interface NavbarProps {
  onMenuToggle?: () => void
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/clients': 'Clients',
  '/dashboard/clients/add': 'Add Client',
  '/dashboard/payrolls': 'Payroll Runs',
  '/dashboard/pensions': 'Pension Declarations',
  '/dashboard/settings': 'Settings',
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

  return [{ label: title }]
}

export default function Navbar({ onMenuToggle }: NavbarProps) {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return (
      <nav
        className="h-[52px] border-b"
        style={{ background: colors.surface, borderColor: colors.border }}
      />
    )
  }

  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <nav
      className="h-[52px] flex items-center px-4 md:px-5 gap-3 transition-colors duration-200"
      style={{
        background: colors.surface,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      {/* Hamburger - mobile only */}
      {onMenuToggle && (
        <button
          onClick={onMenuToggle}
          className="md:hidden flex items-center justify-center h-8 w-8 rounded-md transition-colors duration-150"
          style={{ color: colors.text.secondary }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <Menu className="w-[18px] h-[18px]" />
        </button>
      )}

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 min-w-0">
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
    </nav>
  )
}
