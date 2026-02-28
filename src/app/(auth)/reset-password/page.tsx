'use client'

import { useState, useEffect } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2, CheckCircle2, Lock } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const GRAIN_TEXTURE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState(false)
  const supabase = createClientSupabaseClient()
  const router = useRouter()

  useEffect(() => {
    // Supabase automatically handles the auth callback when the page loads
    // with the token in the URL hash. We listen for the PASSWORD_RECOVERY event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })

    // Also check if there's already a session (user may have already been verified)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
    })

    // If no session after 5 seconds, show error
    const timeout = setTimeout(() => {
      setSessionReady((ready) => {
        if (!ready) setSessionError(true)
        return ready
      })
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [supabase.auth])

  const handleReset = async () => {
    setPasswordError('')
    setConfirmError('')

    let hasErrors = false

    if (!password) {
      setPasswordError('Password is required')
      hasErrors = true
    } else if (password.length < 8) {
      setPasswordError('Must be at least 8 characters')
      hasErrors = true
    }

    if (!confirmPassword) {
      setConfirmError('Please confirm your password')
      hasErrors = true
    } else if (password !== confirmPassword) {
      setConfirmError('Passwords do not match')
      hasErrors = true
    }

    if (hasErrors) return

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setPasswordError(error.message)
      } else {
        setSuccess(true)
        setTimeout(() => router.push('/login'), 3000)
      }
    } catch {
      setPasswordError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleReset()
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
            Choose a new<br />
            password
          </h1>

          <p className="mt-6 max-w-[360px] font-[family-name:var(--font-body)] text-[1.05rem] font-normal leading-[1.7] text-white/65">
            Make it strong — at least 8 characters with a mix of letters and numbers.
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
          {success ? (
            /* ── Success state ── */
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="font-[family-name:var(--font-display)] text-[1.75rem] leading-tight text-[var(--login-fg)]">
                Password updated
              </h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--login-muted)]">
                Your password has been reset successfully. Redirecting you to sign in...
              </p>
            </div>
          ) : sessionError ? (
            /* ── Session error state ── */
            <div className="text-center">
              <h2 className="font-[family-name:var(--font-display)] text-[1.75rem] leading-tight text-[var(--login-fg)]">
                Invalid or expired link
              </h2>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--login-muted)]">
                This password reset link has expired or is invalid. Please request a new one.
              </p>
              <Link
                href="/forgot-password"
                className="mt-6 inline-block font-semibold text-[var(--login-purple)] hover:underline"
              >
                Request new reset link
              </Link>
            </div>
          ) : !sessionReady ? (
            /* ── Loading state ── */
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--login-purple)]" />
              <p className="text-[var(--login-muted)]">Verifying your reset link...</p>
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
                Set new password
              </h2>
              <p className="mt-2 text-[0.95rem] text-[var(--login-muted)]">
                Enter your new password below.
              </p>

              <div className="mt-8 space-y-5">
                {/* New password */}
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-[0.82rem] font-semibold uppercase tracking-wider text-[var(--login-label)]"
                  >
                    New password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (passwordError) setPasswordError('')
                      }}
                      onKeyDown={handleKeyDown}
                      placeholder="At least 8 characters"
                      className={cn(
                        'h-12 rounded-xl border bg-[var(--login-input-bg)] px-4 pr-12 text-[0.95rem] text-[var(--login-fg)] placeholder:text-[var(--login-muted)]/50',
                        'transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--login-purple)]/40 focus-visible:ring-offset-0',
                        passwordError
                          ? 'border-red-400 dark:border-red-500'
                          : 'border-[var(--login-border)] hover:border-[var(--login-border-hover)]'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--login-muted)] transition-colors hover:text-[var(--login-fg)]"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                    </button>
                  </div>
                  {passwordError && (
                    <p className="flex items-center gap-1.5 text-[0.8rem] font-medium text-red-500 dark:text-red-400">
                      <Lock className="h-3.5 w-3.5" />
                      {passwordError}
                    </p>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-2">
                  <Label
                    htmlFor="confirm-password"
                    className="text-[0.82rem] font-semibold uppercase tracking-wider text-[var(--login-label)]"
                  >
                    Confirm password
                  </Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (confirmError) setConfirmError('')
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Re-enter your password"
                    className={cn(
                      'h-12 rounded-xl border bg-[var(--login-input-bg)] px-4 text-[0.95rem] text-[var(--login-fg)] placeholder:text-[var(--login-muted)]/50',
                      'transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--login-purple)]/40 focus-visible:ring-offset-0',
                      confirmError
                        ? 'border-red-400 dark:border-red-500'
                        : 'border-[var(--login-border)] hover:border-[var(--login-border-hover)]'
                    )}
                  />
                  {confirmError && (
                    <p className="flex items-center gap-1.5 text-[0.8rem] font-medium text-red-500 dark:text-red-400">
                      <Lock className="h-3.5 w-3.5" />
                      {confirmError}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit button */}
              <Button
                onClick={handleReset}
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
                    Updating password...
                  </>
                ) : (
                  'Update password'
                )}
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
