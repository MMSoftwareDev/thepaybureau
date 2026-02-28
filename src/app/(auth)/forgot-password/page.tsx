'use client'

import { useState } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const GRAIN_TEXTURE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [sent, setSent] = useState(false)
  const supabase = createClientSupabaseClient()

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const handleSubmit = async () => {
    setEmailError('')

    if (!email) {
      setEmailError('Email is required')
      return
    }
    if (!validateEmail(email)) {
      setEmailError('Enter a valid email address')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setEmailError(error.message)
      } else {
        setSent(true)
      }
    } catch {
      setEmailError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[44%_1fr]">
      {/* ═══ BRAND PANEL (left) ═══ */}
      <aside
        className="relative hidden flex-col justify-between overflow-hidden p-10 lg:p-12 md:flex"
        style={{ background: 'var(--login-purple-d)' }}
        aria-hidden="true"
      >
        <div
          className="login-mesh-bg pointer-events-none absolute opacity-60"
          style={{
            inset: '-50%',
            width: '200%',
            height: '200%',
            background: `
              radial-gradient(ellipse at 20% 50%, var(--login-purple-l) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, var(--login-pink) 0%, transparent 40%),
              radial-gradient(ellipse at 60% 80%, var(--login-peach) 0%, transparent 45%),
              radial-gradient(ellipse at 40% 30%, var(--login-purple) 0%, transparent 50%)
            `,
            animation: 'meshShift 20s ease-in-out infinite alternate',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay"
          style={{ backgroundImage: GRAIN_TEXTURE, backgroundSize: '128px 128px' }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-white/10 bg-white/15 backdrop-blur-sm">
              <svg viewBox="0 0 24 24" fill="none" className="h-[22px] w-[22px]">
                <path d="M4 4h6v6H4V4z" fill="rgba(255,255,255,0.9)" />
                <path d="M14 4h6v6h-6V4z" fill="rgba(255,255,255,0.5)" />
                <path d="M4 14h6v6H4v-6z" fill="rgba(255,255,255,0.5)" />
                <path d="M14 14h6v6h-6v-6z" fill="rgba(255,255,255,0.3)" />
              </svg>
            </div>
            <span className="font-[family-name:var(--font-body)] text-[1.25rem] font-extrabold tracking-tight text-white">
              ThePayBureau
            </span>
          </div>

          <h1 className="mt-[5vh] max-w-[420px] font-[family-name:var(--font-display)] text-[clamp(2.4rem,3.5vw,3.4rem)] leading-[1.15] text-white">
            Reset your<br />
            password
          </h1>

          <p className="mt-6 max-w-[360px] font-[family-name:var(--font-body)] text-[1.05rem] font-normal leading-[1.7] text-white/65">
            No worries — it happens to the best of us. We&apos;ll send you a link to reset your password.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div
            className="login-pulse-dot h-2 w-2 rounded-full"
            style={{ background: 'var(--login-peach)', animation: 'loginPulse 3s ease-in-out infinite' }}
          />
          <span className="font-[family-name:var(--font-body)] text-[0.82rem] font-medium text-white/45">
            Secure password recovery
          </span>
        </div>
      </aside>

      {/* ═══ FORM PANEL (right) ═══ */}
      <main className="relative flex items-center justify-center px-6 py-12 sm:px-12 bg-[var(--login-surface)]">
        <div className="w-full max-w-[420px]">
          {/* Back to login */}
          <Link
            href="/login"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[var(--login-muted)] transition-colors hover:text-[var(--login-fg)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>

          {sent ? (
            /* ── Success state ── */
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="font-[family-name:var(--font-display)] text-[1.75rem] leading-tight text-[var(--login-fg)]">
                Check your email
              </h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--login-muted)]">
                We&apos;ve sent a password reset link to{' '}
                <strong className="text-[var(--login-fg)]">{email}</strong>.
                Click the link in the email to reset your password.
              </p>
              <p className="mt-6 text-sm text-[var(--login-muted)]">
                Didn&apos;t receive it?{' '}
                <button
                  onClick={() => setSent(false)}
                  className="font-semibold text-[var(--login-purple)] hover:underline"
                >
                  Try again
                </button>
              </p>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              {/* Mobile logo */}
              <div className="mb-8 flex items-center gap-2 md:hidden">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: 'var(--login-purple)' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                    <path d="M4 4h6v6H4V4z" fill="rgba(255,255,255,0.9)" />
                    <path d="M14 4h6v6h-6V4z" fill="rgba(255,255,255,0.5)" />
                    <path d="M4 14h6v6H4v-6z" fill="rgba(255,255,255,0.5)" />
                    <path d="M14 14h6v6h-6v-6z" fill="rgba(255,255,255,0.3)" />
                  </svg>
                </div>
                <span className="font-[family-name:var(--font-body)] text-lg font-extrabold tracking-tight text-[var(--login-fg)]">
                  ThePayBureau
                </span>
              </div>

              <h2 className="font-[family-name:var(--font-display)] text-[1.75rem] leading-tight text-[var(--login-fg)]">
                Forgot password?
              </h2>
              <p className="mt-2 text-[0.95rem] text-[var(--login-muted)]">
                Enter your email and we&apos;ll send you a reset link.
              </p>

              {/* Email field */}
              <div className="mt-8 space-y-2">
                <Label
                  htmlFor="email"
                  className="text-[0.82rem] font-semibold uppercase tracking-wider text-[var(--login-label)]"
                >
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) setEmailError('')
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="you@company.com"
                  className={cn(
                    'h-12 rounded-xl border bg-[var(--login-input-bg)] px-4 text-[0.95rem] text-[var(--login-fg)] placeholder:text-[var(--login-muted)]/50',
                    'transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--login-purple)]/40 focus-visible:ring-offset-0',
                    emailError
                      ? 'border-red-400 dark:border-red-500'
                      : 'border-[var(--login-border)] hover:border-[var(--login-border-hover)]'
                  )}
                />
                {emailError && (
                  <p className="flex items-center gap-1.5 text-[0.8rem] font-medium text-red-500 dark:text-red-400">
                    <Mail className="h-3.5 w-3.5" />
                    {emailError}
                  </p>
                )}
              </div>

              {/* Submit button */}
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className={cn(
                  'mt-6 h-12 w-full rounded-xl text-[0.95rem] font-semibold text-white shadow-lg transition-all',
                  'hover:brightness-110 active:scale-[0.98]',
                  loading && 'pointer-events-none opacity-60'
                )}
                style={{
                  background: 'linear-gradient(135deg, var(--login-purple) 0%, var(--login-purple-d) 100%)',
                  boxShadow: '0 4px 20px var(--login-purple) / 0.25',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  'Send reset link'
                )}
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
