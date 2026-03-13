// src/app/(dashboard)/layout.tsx
'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import DashboardWrapper from '@/components/layout/DashboardWrapper'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <DashboardWrapper>
        {children}
      </DashboardWrapper>
    </AuthProvider>
  )
}
