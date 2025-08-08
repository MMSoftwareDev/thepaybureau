// src/components/layout/DashboardWrapper.tsx
'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'

interface DashboardWrapperProps {
  children: React.ReactNode
  user: any
}

// Clean color palette matching the dashboard
const colors = {
  background: '#FAFBFC',
  surface: '#FFFFFF',
  border: '#E5E7EB'
}

export default function DashboardWrapper({ children, user }: DashboardWrapperProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load sidebar preference from localStorage
    const savedCollapsed = localStorage.getItem('sidebarCollapsed')
    if (savedCollapsed) {
      setSidebarCollapsed(savedCollapsed === 'true')
    }
  }, [])

  const handleSidebarToggle = () => {
    const newCollapsed = !sidebarCollapsed
    setSidebarCollapsed(newCollapsed)
    localStorage.setItem('sidebarCollapsed', String(newCollapsed))
  }

  // Prevent hydration mismatch by showing a loading state initially
  if (!mounted) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: colors.background }}>
        <div className="w-64 h-screen bg-white border-r animate-pulse" style={{ borderColor: colors.border }}></div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-16 bg-white border-b animate-pulse" style={{ borderColor: colors.border }}></div>
          <main className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: colors.background }}>
            <div className="space-y-6">
              <div className="h-10 bg-gray-200 rounded-lg animate-pulse max-w-md"></div>
              <div className="grid grid-cols-3 gap-6">
                <div className="h-32 bg-white rounded-xl animate-pulse" style={{ border: `1px solid ${colors.border}` }}></div>
                <div className="h-32 bg-white rounded-xl animate-pulse" style={{ border: `1px solid ${colors.border}` }}></div>
                <div className="h-32 bg-white rounded-xl animate-pulse" style={{ border: `1px solid ${colors.border}` }}></div>
              </div>
              <div className="h-64 bg-white rounded-xl animate-pulse" style={{ border: `1px solid ${colors.border}` }}></div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="flex h-screen overflow-hidden"
      style={{
        backgroundColor: colors.background
      }}
    >
      {/* Sidebar */}
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={handleSidebarToggle} 
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <Navbar user={user} />
        
        {/* Page Content */}
        <main 
          className="flex-1 overflow-x-hidden overflow-y-auto"
          style={{
            backgroundColor: colors.background
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
