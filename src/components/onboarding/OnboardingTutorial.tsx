'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { useClients, usePayrolls } from '@/lib/swr'
import { Button } from '@/components/ui/button'
import { X, Check, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  ONBOARDING_STEPS,
  STORAGE_KEY_STEP,
  STORAGE_KEY_DISMISSED,
} from './onboarding-steps'

export default function OnboardingTutorial() {
  const router = useRouter()
  const pathname = usePathname()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const { data: clients } = useClients()
  const { data: payrolls } = usePayrolls()

  const [currentStep, setCurrentStep] = useState(0)
  const [dismissed, setDismissed] = useState(true) // default hidden until we check
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null)

  const prevClientCount = useRef(0)
  const prevPayrollCount = useRef(0)

  // Load persisted state
  useEffect(() => {
    setMounted(true)
    try {
      const d = localStorage.getItem(STORAGE_KEY_DISMISSED)
      if (d === 'true') {
        setDismissed(true)
        return
      }
      const s = localStorage.getItem(STORAGE_KEY_STEP)
      if (s !== null) {
        setCurrentStep(parseInt(s, 10))
      }
      setDismissed(false)
    } catch {
      setDismissed(false)
    }
  }, [])

  // Determine if tutorial should show
  const clientCount = Array.isArray(clients) ? clients.length : 0
  const payrollCount = Array.isArray(payrolls) ? payrolls.length : 0

  // Track previous counts for auto-advance detection
  useEffect(() => {
    prevClientCount.current = clientCount
  }, [clientCount])

  useEffect(() => {
    prevPayrollCount.current = payrollCount
  }, [payrollCount])

  // Show tutorial for new users who haven't dismissed it
  // - New users (0 clients): show from step 0
  // - Mid-tutorial users (already started, step > 0): continue regardless of data
  const shouldShow =
    mounted &&
    !dismissed &&
    (clientCount === 0 || currentStep > 0)

  // Animate in
  useEffect(() => {
    if (shouldShow) {
      const t = setTimeout(() => setVisible(true), 300)
      return () => clearTimeout(t)
    } else {
      setVisible(false)
    }
  }, [shouldShow])

  // Auto-advance: client created
  useEffect(() => {
    if (currentStep === 1 && clientCount > 0 && prevClientCount.current === 0) {
      advanceTo(2)
    }
  }, [clientCount, currentStep])

  // Auto-advance: payroll created
  useEffect(() => {
    if (currentStep === 2 && payrollCount > 0 && prevPayrollCount.current === 0) {
      advanceTo(3)
    }
  }, [payrollCount, currentStep])

  // Spotlight: find the target element and track its position
  useEffect(() => {
    const step = ONBOARDING_STEPS[currentStep]
    if (!step?.highlightSelector) {
      setHighlightRect(null)
      return
    }

    const updateRect = () => {
      const el = document.querySelector(step.highlightSelector!)
      if (el) {
        setHighlightRect(el.getBoundingClientRect())
      } else {
        setHighlightRect(null)
      }
    }

    // Wait a tick for page to render after navigation
    const t = setTimeout(updateRect, 400)
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, true)

    return () => {
      clearTimeout(t)
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
      dismiss()
      router.push('/dashboard')
    }
    // create-client and create-payroll auto-advance via SWR watchers
  }, [currentStep, advanceTo, router])

  const dismiss = useCallback(() => {
    setDismissed(true)
    setVisible(false)
    try {
      localStorage.setItem(STORAGE_KEY_DISMISSED, 'true')
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
      {/* Spotlight overlay — desktop only, only for steps with highlight targets */}
      {highlightRect && (
        <div
          className="fixed inset-0 z-[85] pointer-events-none hidden md:block transition-opacity duration-300"
          style={{
            opacity: visible ? 1 : 0,
            background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.25)',
            maskImage: `radial-gradient(ellipse ${highlightRect.width + 40}px ${highlightRect.height + 30}px at ${highlightRect.left + highlightRect.width / 2}px ${highlightRect.top + highlightRect.height / 2}px, transparent 60%, black 100%)`,
            WebkitMaskImage: `radial-gradient(ellipse ${highlightRect.width + 40}px ${highlightRect.height + 30}px at ${highlightRect.left + highlightRect.width / 2}px ${highlightRect.top + highlightRect.height / 2}px, transparent 60%, black 100%)`,
          }}
        />
      )}

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
              boxShadow: `0 0 0 4px ${colors.primary}20`,
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
                    i < currentStep && 'scale-100',
                    i === currentStep && 'scale-110'
                  )}
                  style={{
                    backgroundColor:
                      i < currentStep
                        ? colors.success
                        : i === currentStep
                          ? colors.primary
                          : `${colors.text.muted}30`,
                  }}
                >
                  {i < currentStep && (
                    <Check
                      className="w-2 h-2"
                      style={{ color: colors.surface }}
                    />
                  )}
                </div>
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
                onClick={dismiss}
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
                  backgroundColor: `${colors.primary}12`,
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
                backgroundColor: `${colors.primary}08`,
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
              onClick={dismiss}
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
