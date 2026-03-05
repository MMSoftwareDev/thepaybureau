// src/app/(dashboard)/dashboard/clients/onboarding/page.tsx
'use client'

import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { UserCheck, Hammer } from 'lucide-react'

export default function ClientOnboardingPage() {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: colors.text.primary }}
        >
          Client Onboarding
        </h1>
        <p style={{ color: colors.text.secondary }} className="mt-1 text-sm">
          Streamlined onboarding workflows for new clients
        </p>
      </div>

      {/* Coming soon card */}
      <div
        className="rounded-xl border"
        style={{
          background: colors.surface,
          borderColor: colors.border,
        }}
      >
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <div
            className="rounded-full p-4 mb-6"
            style={{
              background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
            }}
          >
            <UserCheck
              size={40}
              style={{ color: colors.primary }}
            />
          </div>

          <div className="flex items-center gap-2 mb-3">
            <Hammer size={16} style={{ color: colors.text.muted }} />
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: colors.text.muted }}
            >
              Coming Soon
            </span>
          </div>

          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: colors.text.primary }}
          >
            Client Onboarding is under construction
          </h2>

          <p
            className="max-w-md text-sm leading-relaxed"
            style={{ color: colors.text.secondary }}
          >
            We&apos;re building a guided onboarding experience to help you set up new clients
            with all the right details — payroll schedules, pension providers, HMRC
            credentials, and more — all in one streamlined flow.
          </p>
        </div>
      </div>
    </div>
  )
}
