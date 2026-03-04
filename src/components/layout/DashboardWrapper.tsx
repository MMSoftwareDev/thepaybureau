// src/components/layout/DashboardWrapper.tsx
'use client'

import { useState, useEffect } from 'react'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'

interface DashboardWrapperProps {
  children: React.ReactNode
  user: any
}

export default function DashboardWrapper({ children, user }: DashboardWrapperProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) {
    return (
      <div className="flex h-screen overflow-hidden">
        <div className="hidden md:block w-[260px] h-screen" style={{ background: '#2A1145' }} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-[60px] bg-white border-b animate-pulse" />
          <main className="flex-1 overflow-y-auto p-6" style={{ background: '#FAF7FF' }}>
            <div className="space-y-4 max-w-5xl mx-auto">
              <div className="h-8 bg-gray-100 rounded-xl animate-pulse" />
              <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden transition-colors duration-300" style={{ background: colors.lightBg }}>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar
          user={user}
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        <main
          className="flex-1 overflow-x-hidden overflow-y-auto transition-colors duration-300"
          style={{
            background: isDark ? colors.lightBg : colors.lightBg,
            padding: '2rem 2rem',
          }}
        >
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
