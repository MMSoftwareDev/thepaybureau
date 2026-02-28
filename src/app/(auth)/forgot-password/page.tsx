'use client'

import { useState } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
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
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
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
        {/* Animated mesh gradient */}
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

        {/* Grain texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay"
          style={{ backgroundImage: GRAIN_TEXTURE, backgroundSize: '128px 128px' }}
        />

        {/* Brand content */}
        <div className="relative z-10">
          {/* Logo */}
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

          {/* Headline */}
          <h1 className="mt-[5vh] max-w-[420px] font-[family-name:var(--font-display)] text-[clamp(2.4rem,3.5vw,3.4rem)] leading-[1.15] text-white">
            Happens to the<br />
            best of{' '}
            <em
              className="italic"
              style={{
                background: 'linear-gradient(135deg, var(--login-peach), var(--login-pink))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              us.
            </em>
          </h1>

          {/* Tagline */}
          <p className="mt-6 max-w-[360px] font-[family-name:var(--font-body)] text-[1.05rem] font-normal leading-[1.7] text-white/65">
            No worries — we&apos;ll send a secure link to your email so you
            can get back to running your bureau in no time.
          </p>
        </div>

        {/* Decorative watermark */}
        <svg
          className="pointer-events-none absolute z-[1] opacity-[0.04]"
          style={{ bottom: '-8%', right: '-12%', width: '420px', height: '420px' }}
          viewBox="0 0 200 200"
          fill="none"
        >
          <path d="M20 20h70v70H20V20z" fill="white" />
          <path d="M110 20h70v70h-70V20z" fill="white" />
          <path d="M20 110h70v70H20v-70z" fill="white" />
          <path d="M110 110h70v70h-70v-70z" fill="white" />
        </svg>

        {/* Footer */}
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
      <main className="relative flex items-center justify-center bg-[var(--login-surface)] p-6 md:p-12">
        {/* Faint blush gradient */}
        <div
          className="pointer-events-none absolute opacity-100"
          style={{
            top: '-20%',
            right: '-10%',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(255, 128, 115, 0.06) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 w-full max-w-[420px]">
          {/* Back to login */}
          <Link
            href="/login"
            className="mb-8 inline-flex items-center gap-2 font-[family-name:var(--font-body)] text-[0.88rem] font-medium text-[var(--login-text-3)] transition-colors hover:text-[var(--login-text)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>

          {sent ? (
            /* ── Success state ── */
            <div className="text-center">
              <div
                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: 'var(--login-success-bg)' }}
              >
                <CheckCircle2 className="h-8 w-8" style={{ color: 'var(--login-success)' }} />
              </div>
              <h2 className="font-[family-name:var(--font-display)] text-[2rem] font-normal tracking-tight text-[var(--login-text)]">
                Check your inbox
              </h2>
              <p className="mt-3 font-[family-name:var(--font-body)] text-[0.95rem] leading-relaxed text-[var(--login-text-3)]">
                We&apos;ve sent a password reset link to{' '}
                <strong className="text-[var(--login-text)]">{email}</strong>.
                Click the link in the email to choose a new password.
              </p>
              <div className="mt-6 rounded-[10px] border border-[var(--login-border)] bg-[var(--login-cream)] p-4 text-left">
                <p className="font-[family-name:var(--font-body)] text-[0.82rem] font-medium text-[var(--login-text-2)]">
                  Didn&apos;t receive it?
                </p>
                <ul className="mt-2 space-y-1 font-[family-name:var(--font-body)] text-[0.8rem] text-[var(--login-text-3)]">
                  <li>Check your spam or junk folder</li>
                  <li>Make sure you entered the correct email</li>
                  <li>The link expires in one hour</li>
                </ul>
              </div>
              <button
                onClick={() => setSent(false)}
                className="mt-6 font-[family-name:var(--font-body)] text-[0.88rem] font-semibold text-[var(--login-purple)] transition-colors hover:text-[var(--login-pink)]"
              >
                Try a different email
              </button>
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
                <span className="font-[family-name:var(--font-body)] text-lg font-extrabold tracking-tight text-[var(--login-text)]">
                  ThePayBureau
                </span>
              </div>

              {/* Form header */}
              <div className="mb-8">
                <h2 className="font-[family-name:var(--font-display)] text-[2rem] font-normal tracking-tight text-[var(--login-text)]">
                  Forgot password?
                </h2>
                <p className="mt-2 font-[family-name:var(--font-body)] text-[0.95rem] text-[var(--login-text-3)]">
                  Enter the email you signed up with and we&apos;ll send you a reset link.
                </p>
              </div>

              {/* Email field */}
              <div>
                <Label
                  htmlFor="email"
                  className="mb-2 block font-[family-name:var(--font-body)] text-[0.82rem] font-semibold uppercase tracking-[0.03em] text-[var(--login-text-2)]"
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
                  placeholder="you@yourcompany.co.uk"
                  autoComplete="email"
                  disabled={loading}
                  className={cn(
                    'h-12 rounded-xl border-2 border-transparent bg-[var(--login-cream)] px-4 font-[family-name:var(--font-body)] text-[0.95rem] font-medium text-[var(--login-text)] placeholder:font-normal placeholder:text-[var(--login-text-3)]',
                    'transition-all duration-200',
                    'hover:border-[var(--login-border)]',
                    'focus-visible:border-[var(--login-purple)] focus-visible:bg-white focus-visible:shadow-[0_0_0_4px_var(--login-focus)] dark:focus-visible:bg-[#1A1B2E]',
                    emailError &&
                      'border-[var(--login-error)] bg-[var(--login-error-bg)] focus-visible:shadow-[0_0_0_4px_rgba(217,48,37,0.1)]'
                  )}
                />
                {emailError && (
                  <div className="mt-1.5 flex items-center gap-1.5 font-[family-name:var(--font-body)] text-[0.82rem] font-medium text-[var(--login-error)]">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
                      <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zM8 11.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                    </svg>
                    <span>{emailError}</span>
                  </div>
                )}
              </div>

              {/* Submit button */}
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className={cn(
                  'group relative mt-6 h-12 w-full overflow-hidden rounded-xl font-[family-name:var(--font-body)] text-[0.95rem] font-bold tracking-[0.01em] text-white',
                  'transition-all duration-300',
                  'hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(64,29,108,0.3)]',
                  'active:translate-y-0',
                  'focus-visible:outline-2 focus-visible:outline-[var(--login-purple)] focus-visible:outline-offset-[3px]',
                  'disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none'
                )}
                style={{ background: 'var(--login-purple)' }}
              >
                {/* Gradient hover overlay */}
                <span
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-400 group-hover:opacity-100 group-disabled:opacity-0"
                  style={{
                    background: 'linear-gradient(135deg, var(--login-pink), var(--login-peach))',
                  }}
                />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-[18px] w-[18px] animate-spin" />
                      Sending link&hellip;
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </span>
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
