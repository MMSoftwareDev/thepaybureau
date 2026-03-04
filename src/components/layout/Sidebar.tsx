// src/components/layout/Sidebar.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import {
  Users,
  ClipboardCheck,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  Home,
  Plus
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  description: string
}

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const navigationItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, description: 'Overview & deadlines' },
  { name: 'Clients', href: '/dashboard/clients', icon: Users, description: 'Manage your clients' },
  { name: 'Payrolls', href: '/dashboard/payrolls', icon: ClipboardCheck, description: 'Track payroll runs' },
  { name: 'Settings', href: '/dashboard/settings', icon: SettingsIcon, description: 'Preferences' },
]

// Same grain texture as the login brand panel
const GRAIN_TEXTURE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`

export default function Sidebar({ collapsed = false, onToggle, mobileOpen = false, onMobileClose }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  useEffect(() => { setMounted(true) }, [])

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  if (!mounted) {
    return (
      <div className={`hidden md:block ${collapsed ? 'w-[72px]' : 'w-[260px]'} h-screen`}
        style={{ background: 'var(--login-purple-d)' }}
      />
    )
  }

  return (
    <div
      className={`
        h-screen flex flex-col relative overflow-hidden
        fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out
        md:relative md:z-auto md:translate-x-0 md:transition-all md:duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        ${collapsed ? 'md:w-[72px] w-[260px]' : 'md:w-[260px] w-[260px]'}
      `}
      style={{ background: 'var(--login-purple-d)' }}
    >
      {/* Animated mesh gradient background — same as login brand panel */}
      <div
        className="login-mesh-bg pointer-events-none absolute opacity-40"
        style={{
          inset: '-50%',
          width: '200%',
          height: '200%',
          background: `
            radial-gradient(ellipse at 20% 50%, var(--login-purple-l) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, var(--login-pink) 0%, transparent 40%),
            radial-gradient(ellipse at 60% 80%, var(--login-peach) 0%, transparent 45%),
            radial-gradient(ellipse at 40% 30%, var(--login-purple) 0%, transparent 50%)
          `,
          animation: 'meshShift 20s ease-in-out infinite alternate',
        }}
      />

      {/* Grain texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{ backgroundImage: GRAIN_TEXTURE, backgroundSize: '128px 128px' }}
      />

      {/* ─── Header ─── */}
      <div className="relative z-10 px-5 pt-6 pb-2">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-3">
            {/* Logo — matches login page */}
            <div className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-white/10 bg-white/15 backdrop-blur-sm flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="h-[20px] w-[20px]">
                <path d="M4 4h6v6H4V4z" fill="rgba(255,255,255,0.9)" />
                <path d="M14 4h6v6h-6V4z" fill="rgba(255,255,255,0.5)" />
                <path d="M4 14h6v6H4v-6z" fill="rgba(255,255,255,0.5)" />
                <path d="M14 14h6v6h-6v-6z" fill="rgba(255,255,255,0.3)" />
              </svg>
            </div>
            {!collapsed && (
              <span className="font-[family-name:var(--font-body)] text-[1.05rem] font-extrabold tracking-tight text-white">
                ThePayBureau
              </span>
            )}
          </div>

          {!collapsed && onToggle && (
            <button
              onClick={onToggle}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-all duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Add Client CTA */}
        {!collapsed && (
          <button
            onClick={() => { router.push('/dashboard/clients/add'); onMobileClose?.() }}
            className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-[0.85rem] font-bold text-white transition-all duration-300 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, var(--login-pink), var(--login-peach))',
              boxShadow: '0 8px 24px rgba(236, 56, 93, 0.3)',
            }}
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        )}

        {/* Collapsed expand button */}
        {collapsed && onToggle && (
          <button
            onClick={onToggle}
            className="absolute -right-3 top-7 h-6 w-6 flex items-center justify-center rounded-full bg-white/15 border border-white/10 backdrop-blur-sm text-white/60 hover:text-white hover:bg-white/25 transition-all duration-200 z-20"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* ─── Navigation ─── */}
      <nav className="relative z-10 flex-1 py-4 px-3 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = isActiveRoute(item.href)
          const Icon = item.icon

          return (
            <button
              key={item.name}
              onClick={() => { router.push(item.href); onMobileClose?.() }}
              className={`
                w-full flex items-center rounded-xl mb-1 transition-all duration-200 group relative
                ${collapsed ? 'justify-center px-3 py-3' : 'px-3.5 py-2.5 gap-3'}
                ${isActive
                  ? 'bg-white/15 text-white shadow-lg'
                  : 'text-white/55 hover:text-white hover:bg-white/8'
                }
              `}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                  style={{ background: 'linear-gradient(180deg, var(--login-pink), var(--login-peach))' }}
                />
              )}

              <Icon className={`w-[18px] h-[18px] flex-shrink-0 transition-colors duration-200 ${
                isActive ? 'text-white' : 'text-white/50 group-hover:text-white/90'
              }`} />

              {!collapsed && (
                <div className="flex-1 text-left min-w-0">
                  <span className={`text-[0.82rem] font-semibold block truncate ${
                    isActive ? 'text-white' : ''
                  }`}>
                    {item.name}
                  </span>
                  <span className={`text-[0.7rem] block truncate mt-0.5 ${
                    isActive ? 'text-white/60' : 'text-white/30 group-hover:text-white/40'
                  }`}>
                    {item.description}
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </nav>

      {/* ─── Footer ─── */}
      <div className="relative z-10 px-4 pb-5">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-3 border-t border-white/8">
            <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: 'var(--login-peach)' }} />
            <span className="text-[0.75rem] font-medium text-white/35">
              All systems operational
            </span>
            <span className="ml-auto text-[0.7rem] font-medium text-white/20 px-1.5 py-0.5 rounded border border-white/8">
              v2.1
            </span>
          </div>
        )}
      </div>

      {/* Decorative watermark — same as login */}
      <svg
        className="pointer-events-none absolute z-[1] opacity-[0.03]"
        style={{ bottom: '-8%', right: '-20%', width: '280px', height: '280px' }}
        viewBox="0 0 200 200"
        fill="none"
      >
        <path d="M20 20h70v70H20V20z" fill="white" />
        <path d="M110 20h70v70h-70V20z" fill="white" />
        <path d="M20 110h70v70H20v-70z" fill="white" />
        <path d="M110 110h70v70h-70v-70z" fill="white" />
      </svg>
    </div>
  )
}
