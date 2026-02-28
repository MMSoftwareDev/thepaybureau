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

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by showing a neutral state initially
  if (!mounted) {
    return (
      <div className="flex h-screen overflow-hidden">
        <div className="hidden md:block w-80 h-screen bg-gray-100 animate-pulse"></div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-16 bg-white border-b animate-pulse"></div>
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex h-screen overflow-hidden transition-colors duration-300"
      style={{
        background: colors.lightBg
      }}
    >
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile by default, slides in when mobileMenuOpen */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar with hamburger on mobile */}
        <Navbar
          user={user}
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* Page Content */}
        <main
          className="flex-1 overflow-x-hidden overflow-y-auto transition-colors duration-300 relative"
          style={{
            background: isDark
              ? `linear-gradient(135deg, ${colors.lightBg} 0%, rgba(26, 27, 46, 0.8) 100%)`
              : `linear-gradient(135deg, ${colors.lightBg} 0%, #ffffff 30%, ${colors.lightBg} 100%)`,
            padding: '1.5rem'
          }}
        >
          {/* Floating background elements for depth */}
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-5 pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle, ${colors.primary} 0%, transparent 70%)`,
              transform: 'translate(30%, -30%)',
              animation: 'pulse 4s ease-in-out infinite'
            }}
          />
          <div
            className="absolute bottom-0 left-0 w-80 h-80 rounded-full opacity-3 pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle, ${colors.secondary} 0%, transparent 70%)`,
              transform: 'translate(-30%, 30%)',
              animation: 'pulse 6s ease-in-out infinite reverse'
            }}
          />

          {/* Content with proper z-index */}
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}