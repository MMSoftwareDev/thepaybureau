'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { useClients, usePayrolls } from '@/lib/swr'
import { Button } from '@/components/ui/button'
import { X, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ONBOARDING_STEPS,
  STORAGE_KEY_STEP,
  STORAGE_KEY_COMPLETED,
} from './onboarding-steps'

// Helper: convert hex (#RRGGBB) to rgba with opacity
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function OnboardingTutorial() {
  const router = useRouter()
  const pathname = usePathname()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const { data: clients } = useClients()
  const { data: payrolls } = usePayrolls()

  const [currentStep, setCurrentStep] = useState(0)
  const [completed, setCompleted] = useState(false) // permanently completed
  const [skipped, setSkipped] = useState(false) // session-only skip
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null)

  const prevClientCount = useRef(0)
  const prevPayrollCount = useRef(0)

  // Load persisted state
  useEffect(() => {
    setMounted(true)
    try {
      const d = localStorage.getItem(STORAGE_KEY_COMPLETED)
      if (d === 'true') {
        setCompleted(true)
        return
      }
      const s = localStorage.getItem(STORAGE_KEY_STEP)
      if (s !== null) {
        setCurrentStep(parseInt(s, 10))
      }
    } catch { /* ignore */ }
  }, [])

  // Determine if tutorial should show
  // clients === undefined means SWR still loading — treat as "no clients yet"
  const clientsLoaded = clients !== undefined
  const clientCount = Array.isArray(clients) ? clients.length : 0
  const payrollCount = Array.isArray(payrolls) ? payrolls.length : 0

  // Show when: not completed AND not skipped this session
  // AND either: SWR still loading, has 0 clients, or tutorial already in progress
  const shouldShow = mounted && !completed && !skipped &&
    (!clientsLoaded || clientCount === 0 || currentStep > 0)

  // Animate in immediately (no delay — previous 300ms setTimeout was getting cancelled by re-renders)
  useEffect(() => {
    if (shouldShow) {
      const raf = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(raf)
    } else {
      setVisible(false)
    }
  }, [shouldShow])

  // FIX: Auto-advance client created — ref update AFTER check in same effect
  useEffect(() => {
    if (currentStep === 1 && clientCount > 0 && prevClientCount.current === 0) {
      advanceTo(2)
    }
    prevClientCount.current = clientCount
  }, [clientCount, currentStep])

  // FIX: Auto-advance payroll created — ref update AFTER check in same effect
  useEffect(() => {
    if (currentStep === 2 && payrollCount > 0 && prevPayrollCount.current === 0) {
      advanceTo(3)
    }
    prevPayrollCount.current = payrollCount
  }, [payrollCount, currentStep])

  // FIX: Spotlight — polling interval + ResizeObserver for accurate positioning
  useEffect(() => {
    const step = ONBOARDING_STEPS[currentStep]
    if (!step?.highlightSelector) {
      setHighlightRect(null)
      return
    }

    let observer: ResizeObserver | null = null
    let pollTimer: ReturnType<typeof setInterval> | null = null
    let foundEl: Element | null = null

    const updateRect = () => {
      const el = foundEl || document.querySelector(step.highlightSelector!)
      if (el) {
        foundEl = el
        setHighlightRect(el.getBoundingClientRect())
      } else {
        setHighlightRect(null)
      }
    }

    // Poll every 200ms until element is found, then stop polling
    pollTimer = setInterval(() => {
      const el = document.querySelector(step.highlightSelector!)
      if (el) {
        foundEl = el
        updateRect()
        if (pollTimer) clearInterval(pollTimer)
        pollTimer = null

        // Watch for layout changes
        observer = new ResizeObserver(updateRect)
        observer.observe(el)
      }
    }, 200)

    // Also recalc on scroll/resize
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, true)

    return () => {
      if (pollTimer) clearInterval(pollTimer)
      if (observer) observer.disconnect()
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect, true)
    }
  }, [currentStep, pathname])

  const persistStep = useCallback((step: number) => {
    try {
      localStorage.setItem(STORAGE_KEY_STEP, step.toString())
    } catch { /* ignore */ }
  }, [])

  const advanceTo = useCallback(
    (step: number) => {
      setCurrentStep(step)
      persistStep(step)
      const nextRoute = ONBOARDING_STEPS[step]?.route
      if (nextRoute && pathname !== nextRoute) {
        router.push(nextRoute)
      }
    },
    [persistStep, pathname, router]
  )

  const handleAction = useCallback(() => {
    const step = ONBOARDING_STEPS[currentStep]
    if (step.id === 'welcome') {
      advanceTo(1)
    } else if (step.id === 'pensions-overview') {
      advanceTo(4)
    } else if (step.id === 'complete') {
      complete()
      router.push('/dashboard')
    }
    // create-client and create-payroll auto-advance via SWR watchers
  }, [currentStep, advanceTo, router])

  // Permanently mark tutorial as completed — never shows again
  const complete = useCallback(() => {
    setCompleted(true)
    setVisible(false)
    try {
      localStorage.setItem(STORAGE_KEY_COMPLETED, 'true')
      localStorage.removeItem(STORAGE_KEY_STEP)
    } catch { /* ignore */ }
  }, [])

  // Session-only skip — comes back next page load if still 0 clients
  const skip = useCallback(() => {
    setSkipped(true)
    setVisible(false)
    try {
      localStorage.removeItem(STORAGE_KEY_STEP)
    } catch { /* ignore */ }
  }, [])

  // Navigate to step route if not already there
  useEffect(() => {
    const step = ONBOARDING_STEPS[currentStep]
    if (shouldShow && step && step.route !== pathname && currentStep > 0) {
      router.push(step.route)
    }
  }, [currentStep, shouldShow]) // intentionally exclude pathname/router to avoid loops

  if (!shouldShow) return null

  const step = ONBOARDING_STEPS[currentStep]
  const StepIcon = step.icon
  const isWaitingStep = step.id === 'create-client' || step.id === 'create-payroll'

  return (
    <>
      {/* Pulse ring around highlighted element */}
      {highlightRect && (
        <div
          className="fixed z-[86] pointer-events-none hidden md:block"
          style={{
            left: highlightRect.left - 6,
            top: highlightRect.top - 6,
            width: highlightRect.width + 12,
            height: highlightRect.height + 12,
            borderRadius: 12,
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
        >
          <div
            className="absolute inset-0 rounded-xl animate-onboarding-pulse"
            style={{
              border: `2px solid ${colors.primary}`,
              boxShadow: `0 0 0 4px ${hexToRgba(colors.primary, 0.25)}`,
            }}
          />
        </div>
      )}

      {/* Floating tutorial card */}
      <div
        className={cn(
          'fixed z-[90] transition-all duration-500 ease-out',
          'bottom-6 left-6 w-[360px]',
          'max-md:bottom-4 max-md:left-4 max-md:right-4 max-md:w-auto',
          visible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        <div
          className="rounded-xl shadow-lg border overflow-hidden"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          {/* Progress dots + step label */}
          <div
            className="flex items-center justify-between px-4 pt-4 pb-2"
          >
            <div className="flex items-center gap-1.5">
              {ONBOARDING_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all duration-300',
                    i === currentStep && 'scale-110'
                  )}
                  style={{
                    backgroundColor:
                      i < currentStep
                        ? colors.success
                        : i === currentStep
                          ? colors.primary
                          : hexToRgba(colors.text.muted, 0.2),
                  }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[0.7rem] font-medium font-[family-name:var(--font-inter)]"
                style={{ color: colors.text.muted }}
              >
                {currentStep + 1} of {ONBOARDING_STEPS.length}
              </span>
              <button
                onClick={skip}
                className="p-1 rounded-md transition-colors duration-150 hover:opacity-80"
                style={{ color: colors.text.muted }}
                aria-label="Dismiss tutorial"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Step content */}
          <div className="px-4 pb-2">
            <div className="flex items-start gap-3">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center mt-0.5"
                style={{
                  backgroundColor: hexToRgba(colors.primary, 0.1),
                }}
              >
                <StepIcon
                  className="w-5 h-5"
                  style={{ color: colors.primary }}
                />
              </div>
              <div className="min-w-0">
                <h3
                  className="text-sm font-semibold font-[family-name:var(--font-inter)] leading-tight"
                  style={{ color: colors.text.primary }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-[0.8rem] mt-1 leading-relaxed font-[family-name:var(--font-body)]"
                  style={{ color: colors.text.secondary }}
                >
                  {step.description}
                </p>
              </div>
            </div>
          </div>

          {/* Action hint for waiting steps */}
          {step.actionHint && (
            <div
              className="mx-4 mb-2 px-3 py-2 rounded-lg text-[0.75rem] font-medium font-[family-name:var(--font-inter)]"
              style={{
                backgroundColor: hexToRgba(colors.primary, 0.06),
                color: colors.primary,
              }}
            >
              {step.actionHint}
            </div>
          )}

          {/* Footer */}
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: colors.border }}
          >
            <button
              onClick={skip}
              className="text-[0.75rem] font-medium font-[family-name:var(--font-inter)] transition-colors duration-150 hover:opacity-80"
              style={{ color: colors.text.muted }}
            >
              Skip tutorial
            </button>

            {!isWaitingStep && (
              <Button
                onClick={handleAction}
                size="sm"
                className="text-white text-xs h-8 px-4"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                }}
              >
                {step.action}
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}

            {isWaitingStep && (
              <div
                className="flex items-center gap-2 text-[0.75rem] font-medium font-[family-name:var(--font-inter)]"
                style={{ color: colors.text.muted }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: colors.primary }}
                />
                {step.action}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
