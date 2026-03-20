'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import { useTheme, getThemeColors } from '@/contexts/ThemeContext'
import { MessageSquarePlus, Bug, Sparkles, HelpCircle, X, Loader2, Send, CheckCircle } from 'lucide-react'

const CATEGORIES = [
  { value: 'bug' as const, label: 'Bug', icon: Bug, color: '#ef4444' },
  { value: 'improvement' as const, label: 'Improvement', icon: Sparkles, color: '#8b5cf6' },
  { value: 'other' as const, label: 'Other', icon: HelpCircle, color: '#6b7280' },
]

function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [category, setCategory] = useState<'bug' | 'improvement' | 'other'>('bug')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const pathname = usePathname()

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('Please enter your feedback')
      return
    }
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          message: message.trim(),
          page_url: pathname,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send feedback')
      }
      setSent(true)
      setTimeout(onClose, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send feedback')
    } finally {
      setSending(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: 16,
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          animation: 'feedbackFadeIn 0.2s ease-out',
        }}
      >
        {sent ? (
          <div className="p-10 text-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: `${colors.success}15` }}
            >
              <CheckCircle className="w-7 h-7" style={{ color: colors.success }} />
            </div>
            <p className="text-[1rem] font-bold mb-1" style={{ color: colors.text.primary }}>
              Thanks for your feedback!
            </p>
            <p className="text-[0.85rem]" style={{ color: colors.text.muted }}>
              We&apos;ll review it and get back to you if needed.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: `1px solid ${colors.border}` }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${colors.primary}12` }}
                >
                  <MessageSquarePlus className="w-[16px] h-[16px]" style={{ color: colors.primary }} />
                </div>
                <span className="text-[0.95rem] font-bold" style={{ color: colors.text.primary }}>
                  Send Feedback
                </span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: colors.text.muted }}
                onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : colors.lightBg }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Category selector */}
              <div>
                <label className="text-[0.75rem] font-semibold uppercase tracking-[0.06em] mb-2.5 block" style={{ color: colors.text.muted }}>
                  What kind of feedback?
                </label>
                <div className="flex gap-2.5">
                  {CATEGORIES.map((cat) => {
                    const isActive = category === cat.value
                    const Icon = cat.icon
                    return (
                      <button
                        key={cat.value}
                        onClick={() => setCategory(cat.value)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[0.82rem] font-semibold transition-all"
                        style={{
                          background: isActive ? `${cat.color}12` : isDark ? 'rgba(255,255,255,0.04)' : colors.lightBg,
                          border: `1.5px solid ${isActive ? cat.color : colors.border}`,
                          color: isActive ? cat.color : colors.text.secondary,
                        }}
                      >
                        <Icon className="w-4 h-4" />
                        {cat.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-[0.75rem] font-semibold uppercase tracking-[0.06em] mb-2.5 block" style={{ color: colors.text.muted }}>
                  Your feedback
                </label>
                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value)
                    if (error) setError('')
                  }}
                  placeholder={
                    category === 'bug'
                      ? "What's not working? Include steps to reproduce if possible..."
                      : category === 'improvement'
                        ? "What could be better? How would it help your workflow?"
                        : "Tell us what's on your mind..."
                  }
                  rows={5}
                  maxLength={2000}
                  disabled={sending}
                  className="w-full rounded-lg px-4 py-3 text-[0.88rem] font-medium resize-none outline-none transition-all"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.05)' : colors.lightBg,
                    color: colors.text.primary,
                    border: `1px solid ${error ? colors.error : colors.border}`,
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = colors.primary; e.currentTarget.style.boxShadow = `0 0 0 3px ${colors.primary}12` }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = error ? colors.error : colors.border; e.currentTarget.style.boxShadow = 'none' }}
                  autoFocus
                />
                <div className="flex items-center justify-between mt-2">
                  {error ? (
                    <span className="text-[0.78rem] font-medium" style={{ color: colors.error }}>{error}</span>
                  ) : (
                    <span className="text-[0.72rem]" style={{ color: colors.text.muted }}>
                      Page: {pathname}
                    </span>
                  )}
                  <span className="text-[0.72rem]" style={{ color: message.length > 1900 ? colors.error : colors.text.muted }}>
                    {message.length}/2000
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-end gap-3 px-6 py-4"
              style={{ borderTop: `1px solid ${colors.border}` }}
            >
              <button
                onClick={onClose}
                disabled={sending}
                className="px-5 py-2.5 rounded-lg text-[0.85rem] font-semibold transition-colors"
                style={{ color: colors.text.secondary }}
                onMouseEnter={(e) => { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : colors.lightBg }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={sending || !message.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-[0.85rem] font-semibold text-white transition-all"
                style={{
                  background: !message.trim()
                    ? colors.border
                    : 'linear-gradient(135deg, var(--brand-purple), var(--brand-pink))',
                  opacity: sending ? 0.7 : 1,
                }}
              >
                {sending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Sending...</>
                ) : (
                  <><Send className="w-3.5 h-3.5" />Send Feedback</>
                )}
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes feedbackFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  )
}

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2.5 px-2.5 h-8 rounded-md mb-px transition-all duration-150"
        style={{ color: colors.text.secondary }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : colors.lightBg
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
        }}
      >
        <MessageSquarePlus className="w-4 h-4" style={{ color: colors.text.muted }} />
        <span className="text-[0.8rem] font-medium">Send Feedback</span>
      </button>

      {open && <FeedbackModal onClose={() => setOpen(false)} />}
    </>
  )
}
