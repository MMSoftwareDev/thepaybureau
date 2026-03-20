'use client'

import { useEffect, useState, useCallback, createContext, useContext } from 'react'
import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const TOAST_STYLES: Record<ToastType, { bg: string; bgDark: string; border: string; borderDark: string; text: string; textDark: string; icon: string; iconDark: string }> = {
  success: {
    bg: 'var(--brand-success-bg)',
    bgDark: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(24, 128, 56, 0.2)',
    borderDark: 'rgba(16, 185, 129, 0.25)',
    text: 'var(--brand-success)',
    textDark: '#10B981',
    icon: 'var(--brand-success)',
    iconDark: '#34d399',
  },
  error: {
    bg: 'var(--brand-error-bg)',
    bgDark: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(217, 48, 37, 0.2)',
    borderDark: 'rgba(239, 68, 68, 0.25)',
    text: 'var(--brand-error)',
    textDark: '#EF4444',
    icon: 'var(--brand-error)',
    iconDark: '#f87171',
  },
  info: {
    bg: 'rgba(64, 29, 108, 0.06)',
    bgDark: 'rgba(124, 92, 191, 0.12)',
    border: 'rgba(64, 29, 108, 0.15)',
    borderDark: 'rgba(124, 92, 191, 0.25)',
    text: 'var(--brand-purple)',
    textDark: '#7C5CBF',
    icon: 'var(--brand-purple)',
    iconDark: '#a78bfa',
  },
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(toast.id), 200)
    }, 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const Icon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertTriangle : Info
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  const styles = TOAST_STYLES[toast.type]

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-200',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
      style={{
        background: isDark ? styles.bgDark : styles.bg,
        borderColor: isDark ? styles.borderDark : styles.border,
        color: isDark ? styles.textDark : styles.text,
      }}
    >
      <Icon className="w-5 h-5 flex-shrink-0" style={{ color: isDark ? styles.iconDark : styles.icon }} />
      <p className="text-sm font-medium flex-1 font-[family-name:var(--font-inter)]">{toast.message}</p>
      <button
        onClick={() => {
          setVisible(false)
          setTimeout(() => onDismiss(toast.id), 200)
        }}
        className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
