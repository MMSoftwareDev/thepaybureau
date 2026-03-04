// src/components/layout/DashboardWrapper.tsx
'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'

interface DashboardWrapperProps {
  children: React.ReactNode
  user: { email?: string; user_metadata?: { name?: string } }
}

export default function DashboardWrapper({ children, user }: DashboardWrapperProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const pathname = usePathname()

  useEffect(() => { setMounted(true) }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  if (!mounted) {
    return (
      <div className="flex h-screen overflow-hidden">
        <div className="hidden md:block w-[252px] h-screen border-r" style={{ background: colors.surface, borderColor: colors.border }} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-[52px] border-b" style={{ background: colors.surface, borderColor: colors.border }} />
          <main className="flex-1 overflow-y-auto p-6" style={{ background: colors.lightBg }}>
            <div className="space-y-4 max-w-5xl mx-auto">
              <div className="h-8 rounded-lg animate-pulse" style={{ background: colors.border }} />
              <div className="h-32 rounded-lg animate-pulse" style={{ background: colors.border }} />
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden transition-colors duration-200" style={{ background: colors.lightBg }}>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        user={user}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        <main
          className="flex-1 overflow-x-hidden overflow-y-auto transition-colors duration-200"
          style={{ background: colors.lightBg }}
        >
          <div className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
