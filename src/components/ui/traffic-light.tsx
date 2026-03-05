// src/components/ui/traffic-light.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { Activity, ChevronDown, ChevronUp, ExternalLink, RefreshCw } from 'lucide-react'

interface Monitor {
  id: number
  name: string
  status: number // 0=paused, 1=not checked, 2=up, 8=seems down, 9=down
  url: string
}

type OverallStatus = 'green' | 'yellow' | 'red' | 'loading' | 'error'

function getMonitorStatus(status: number): 'green' | 'yellow' | 'red' {
  if (status === 2) return 'green'
  if (status === 9 || status === 8) return 'red'
  return 'yellow' // paused, not checked, etc.
}

function getOverallStatus(monitors: Monitor[]): OverallStatus {
  if (monitors.length === 0) return 'green'
  const hasDown = monitors.some(m => m.status === 9 || m.status === 8)
  if (hasDown) return 'red'
  const hasDegraded = monitors.some(m => m.status !== 2)
  if (hasDegraded) return 'yellow'
  return 'green'
}

const STATUS_CONFIG = {
  green: {
    color: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.4)',
    label: 'All Systems Operational',
  },
  yellow: {
    color: '#eab308',
    glow: 'rgba(234, 179, 8, 0.4)',
    label: 'Some Services Degraded',
  },
  red: {
    color: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.4)',
    label: 'Service Outage Detected',
  },
  loading: {
    color: '#94a3b8',
    glow: 'rgba(148, 163, 184, 0.2)',
    label: 'Checking Status...',
  },
  error: {
    color: '#94a3b8',
    glow: 'rgba(148, 163, 184, 0.2)',
    label: 'Status Unavailable',
  },
}

const STATUS_PAGE_URL = 'https://stats.uptimerobot.com/cq2aETKpXI'
const POLL_INTERVAL = 60_000 // 60 seconds

export default function TrafficLight() {
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [overallStatus, setOverallStatus] = useState<OverallStatus>('loading')
  const [expanded, setExpanded] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const previousStatusRef = useRef<OverallStatus>('loading')
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { isDark } = useTheme()

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      const newMonitors: Monitor[] = data.monitors || []
      setMonitors(newMonitors)
      const newStatus = getOverallStatus(newMonitors)

      // Show banner pop-up if status changed to non-green
      if (
        previousStatusRef.current !== 'loading' &&
        previousStatusRef.current !== newStatus &&
        newStatus !== 'green'
      ) {
        setShowBanner(true)
        if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current)
        bannerTimerRef.current = setTimeout(() => setShowBanner(false), 15_000)
      }

      // Auto-dismiss banner when status returns to green
      if (newStatus === 'green' && showBanner) {
        setShowBanner(false)
      }

      previousStatusRef.current = newStatus
      setOverallStatus(newStatus)
    } catch {
      setOverallStatus('error')
    }
  }, [showBanner])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, POLL_INTERVAL)
    return () => {
      clearInterval(interval)
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current)
    }
  }, [fetchStatus])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchStatus()
    setRefreshing(false)
  }

  const config = STATUS_CONFIG[overallStatus]

  return (
    <>
      {/* Banner notification — pops up when status changes to non-green */}
      {showBanner && overallStatus !== 'green' && overallStatus !== 'loading' && (
        <div
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 9999,
            maxWidth: 420,
            animation: 'trafficLightSlideIn 0.3s ease-out',
          }}
        >
          <div
            style={{
              background: isDark ? '#1e293b' : '#ffffff',
              border: `2px solid ${config.color}`,
              borderRadius: 12,
              padding: '14px 18px',
              boxShadow: `0 8px 32px rgba(0,0,0,0.15), 0 0 12px ${config.glow}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: config.color,
                boxShadow: `0 0 8px ${config.glow}`,
                flexShrink: 0,
                marginTop: 3,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontWeight: 600,
                fontSize: 14,
                color: isDark ? '#f1f5f9' : '#1e293b',
                marginBottom: 4,
              }}>
                {config.label}
              </div>
              <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <div style={{
                  fontSize: 13,
                  color: isDark ? '#94a3b8' : '#64748b',
                  animation: monitors.filter(m => getMonitorStatus(m.status) !== 'green').length > 1
                    ? 'trafficLightScroll 10s linear infinite'
                    : 'none',
                  display: 'inline-block',
                }}>
                  {monitors
                    .filter(m => getMonitorStatus(m.status) !== 'green')
                    .map(m => m.name)
                    .join('  \u2022  ')}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isDark ? '#64748b' : '#94a3b8',
                fontSize: 18,
                lineHeight: 1,
                padding: 0,
                flexShrink: 0,
              }}
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Traffic Light widget — fixed bottom-right */}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 9998,
          fontFamily: 'var(--font-inter), system-ui, sans-serif',
        }}
      >
        {/* Expanded panel */}
        {expanded && (
          <div
            style={{
              background: isDark ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              borderRadius: 12,
              padding: 0,
              marginBottom: 8,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              width: 300,
              maxHeight: 360,
              overflow: 'hidden',
              animation: 'trafficLightFadeUp 0.2s ease-out',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <Activity size={16} style={{ color: config.color }} />
                <span style={{
                  fontWeight: 600,
                  fontSize: 14,
                  color: isDark ? '#f1f5f9' : '#1e293b',
                }}>
                  System Status
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  onClick={handleRefresh}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    borderRadius: 6,
                    display: 'flex',
                    color: isDark ? '#94a3b8' : '#64748b',
                  }}
                  title="Refresh"
                  aria-label="Refresh status"
                >
                  <RefreshCw size={14} style={{
                    animation: refreshing ? 'spin 1s linear infinite' : 'none',
                  }} />
                </button>
                <a
                  href={STATUS_PAGE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    borderRadius: 6,
                    display: 'flex',
                    color: isDark ? '#94a3b8' : '#64748b',
                    textDecoration: 'none',
                  }}
                  title="Open status page"
                  aria-label="Open status page"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* Overall status bar */}
            <div style={{
              padding: '10px 16px',
              background: isDark ? '#0f172a' : '#f8fafc',
              borderBottom: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: config.color,
                boxShadow: `0 0 6px ${config.glow}`,
              }} />
              <span style={{
                fontSize: 13,
                fontWeight: 500,
                color: config.color,
              }}>
                {config.label}
              </span>
            </div>

            {/* Monitor list */}
            <div style={{
              maxHeight: 240,
              overflowY: 'auto',
            }}>
              {overallStatus === 'loading' ? (
                <div style={{
                  padding: 24,
                  textAlign: 'center',
                  color: isDark ? '#64748b' : '#94a3b8',
                  fontSize: 13,
                }}>
                  Loading monitors...
                </div>
              ) : overallStatus === 'error' ? (
                <div style={{
                  padding: 24,
                  textAlign: 'center',
                  color: isDark ? '#64748b' : '#94a3b8',
                  fontSize: 13,
                }}>
                  Could not load status data
                </div>
              ) : monitors.length === 0 ? (
                <div style={{
                  padding: 24,
                  textAlign: 'center',
                  color: isDark ? '#64748b' : '#94a3b8',
                  fontSize: 13,
                }}>
                  No monitors configured
                </div>
              ) : (
                monitors.map((monitor) => {
                  const status = getMonitorStatus(monitor.status)
                  const statusConf = STATUS_CONFIG[status]
                  return (
                    <div
                      key={monitor.id}
                      style={{
                        padding: '10px 16px',
                        borderBottom: `1px solid ${isDark ? '#1e293b' : '#f1f5f9'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{
                        fontSize: 13,
                        color: isDark ? '#cbd5e1' : '#475569',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 200,
                      }}>
                        {monitor.name}
                      </span>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: statusConf.color,
                          textTransform: 'uppercase',
                        }}>
                          {status === 'green' ? 'Up' : status === 'red' ? 'Down' : 'Issue'}
                        </span>
                        <div style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: statusConf.color,
                          boxShadow: `0 0 4px ${statusConf.glow}`,
                        }} />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Floating button */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            borderRadius: 24,
            border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            background: isDark ? '#1e293b' : '#ffffff',
            cursor: 'pointer',
            boxShadow: `0 4px 16px rgba(0,0,0,0.1), 0 0 8px ${config.glow}`,
            transition: 'all 0.2s ease',
            marginLeft: 'auto',
          }}
          title="System Status"
          aria-label="Toggle system status panel"
        >
          <div style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: config.color,
            boxShadow: `0 0 6px ${config.glow}`,
            animation: overallStatus === 'red' ? 'trafficLightPulse 1.5s ease-in-out infinite' : 'none',
          }} />
          <span style={{
            fontSize: 12,
            fontWeight: 500,
            color: isDark ? '#cbd5e1' : '#475569',
          }}>
            Status
          </span>
          {expanded ? (
            <ChevronDown size={12} style={{ color: isDark ? '#94a3b8' : '#64748b' }} />
          ) : (
            <ChevronUp size={12} style={{ color: isDark ? '#94a3b8' : '#64748b' }} />
          )}
        </button>
      </div>

      {/* Keyframe animations */}
      <style>{`
        @keyframes trafficLightPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes trafficLightSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes trafficLightFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes trafficLightScroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </>
  )
}
