'use client'

import { useEffect, useState } from 'react'
import BadgeIcon from './BadgeIcon'
import { TIER_COLORS } from '@/lib/badges'
import type { NewBadge } from '@/lib/badges'

// Global event system for badge notifications
type BadgeListener = (badges: NewBadge[]) => void
const listeners: Set<BadgeListener> = new Set()

export function emitBadgeEarned(badges: NewBadge[]) {
  if (badges.length === 0) return
  listeners.forEach((fn) => fn(badges))
}

export default function BadgeToast() {
  const [queue, setQueue] = useState<NewBadge[]>([])
  const [current, setCurrent] = useState<NewBadge | null>(null)
  const [visible, setVisible] = useState(false)

  // Subscribe to badge events
  useEffect(() => {
    const handler: BadgeListener = (badges) => {
      setQueue((prev) => [...prev, ...badges])
    }
    listeners.add(handler)
    return () => { listeners.delete(handler) }
  }, [])

  // Process queue
  useEffect(() => {
    if (current || queue.length === 0) return
    const [next, ...rest] = queue
    setCurrent(next)
    setQueue(rest)
    // Delay show for animation
    requestAnimationFrame(() => setVisible(true))
  }, [queue, current])

  // Auto-dismiss
  useEffect(() => {
    if (!current) return
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => setCurrent(null), 400)
    }, 4000)
    return () => clearTimeout(timer)
  }, [current])

  if (!current) return null

  const tierColor = TIER_COLORS[current.badge_tier as keyof typeof TIER_COLORS] ?? '#CD7F32'
  const tierLabel = current.badge_tier.charAt(0).toUpperCase() + current.badge_tier.slice(1)

  return (
    <div
      className="fixed top-4 right-4 z-[200] pointer-events-auto"
      style={{
        transform: visible ? 'translateX(0)' : 'translateX(120%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
      }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg"
        style={{
          background: 'white',
          border: `2px solid ${tierColor}`,
          boxShadow: `0 8px 30px rgba(0, 0, 0, 0.12), 0 0 0 1px ${tierColor}20`,
          minWidth: 280,
        }}
      >
        <BadgeIcon
          icon={current.badge_icon}
          tier={current.badge_tier as 'bronze' | 'silver' | 'gold'}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: tierColor }}>
            {tierLabel} Badge Earned!
          </p>
          <p className="text-sm font-semibold text-gray-900 truncate">
            {current.badge_name}
          </p>
        </div>
      </div>
    </div>
  )
}
