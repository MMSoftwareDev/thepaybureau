'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { Activity } from 'lucide-react'

type OverallStatus = 'green' | 'yellow' | 'red' | 'loading' | 'error'

interface Monitor {
  id: number
  status: number
}

const STATUS_LABELS: Record<OverallStatus, string> = {
  green: 'All Systems Operational',
  yellow: 'Some Services Degraded',
  red: 'Service Outage',
  loading: 'Checking...',
  error: 'Status Unavailable',
}

const STATUS_COLORS: Record<OverallStatus, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
  loading: '#94a3b8',
  error: '#94a3b8',
}

const STATUS_PAGE_URL = 'https://stats.uptimerobot.com/cq2aETKpXI'

export default function SidebarStatusIndicator() {
  const [status, setStatus] = useState<OverallStatus>('loading')
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status')
      if (!res.ok) throw new Error()
      const data = await res.json()
      const monitors: Monitor[] = data.monitors || []
      if (monitors.length === 0) { setStatus('green'); return }
      const hasDown = monitors.some(m => m.status === 9 || m.status === 8)
      if (hasDown) { setStatus('red'); return }
      const hasDegraded = monitors.some(m => m.status !== 2)
      if (hasDegraded) { setStatus('yellow'); return }
      setStatus('green')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 60_000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const color = STATUS_COLORS[status]
  const label = STATUS_LABELS[status]

  return (
    <a
      href={STATUS_PAGE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full flex items-center gap-2.5 px-2.5 h-8 rounded-md mb-px transition-all duration-150 no-underline"
      style={{ color: colors.text.secondary }}
      title={label}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : colors.lightBg
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
    >
      <div className="relative">
        <Activity className="w-4 h-4" style={{ color: colors.text.muted }} />
        <div
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
          style={{
            background: color,
            boxShadow: `0 0 4px ${color}60`,
            animation: status === 'red' ? 'sidebarStatusPulse 1.5s ease-in-out infinite' : 'none',
          }}
        />
      </div>
      <span className="text-[0.8rem] font-medium flex-1">Status</span>
      <span className="text-[0.68rem] font-medium" style={{ color }}>
        {status === 'green' ? 'OK' : status === 'red' ? 'Down' : status === 'yellow' ? 'Issue' : '...'}
      </span>

      <style>{`
        @keyframes sidebarStatusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </a>
  )
}
