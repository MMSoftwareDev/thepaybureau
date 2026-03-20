'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClientSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// SVG noise texture data URI for the brand panel grain overlay
const GRAIN_TEXTURE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginSuccess, setLoginSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    if (emailError && validateEmail(value)) setEmailError('')
    if (loginError) setLoginError('')
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    if (passwordError && value.length >= 8) setPasswordError('')
    if (loginError) setLoginError('')
  }

  const handleLogin = async () => {
    setEmailError('')
    setPasswordError('')
    setLoginError('')

    let hasErrors = false

    if (!email) {
      setEmailError('Email is required')
      hasErrors = true
    } else if (!validateEmail(email)) {
      setEmailError('Enter a valid email address')
      hasErrors = true
    }

    if (!password) {
      setPasswordError('Password is required')
      hasErrors = true
    } else if (password.length < 8) {
      setPasswordError('Must be at least 8 characters')
      hasErrors = true
    }

    if (hasErrors) return

    setLoading(true)

    try {
      const result = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (result.error) {
        setLoginError(result.error.message)
      } else {
        setLoginSuccess(true)
        setTimeout(() => {
          router.push('/dashboard')
        }, 500)
      }
    } catch {
      setLoginError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  if (!mounted) return null

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[44%_1fr]">
      {/* ═══ BRAND PANEL (left) ═══ */}
      <aside
        className="relative hidden flex-col justify-between overflow-hidden p-10 lg:p-12 md:flex"
        style={{ background: 'var(--brand-purple-d)' }}
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
              radial-gradient(ellipse at 20% 50%, var(--brand-purple-l) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, var(--brand-pink) 0%, transparent 40%),
              radial-gradient(ellipse at 60% 80%, var(--brand-peach) 0%, transparent 45%),
              radial-gradient(ellipse at 40% 30%, var(--brand-purple) 0%, transparent 50%)
            `,
            animation: 'meshShift 20s ease-in-out infinite alternate',
          }}
        />

        {/* Grain texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay"
          style={{
            backgroundImage: GRAIN_TEXTURE,
            backgroundSize: '128px 128px',
          }}
        />

        {/* Brand content */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="ThePayBureau" width={42} height={42} className="rounded-xl" />
            <span className="font-[family-name:var(--font-body)] text-[1.25rem] font-extrabold tracking-tight text-white">
              ThePayBureau
            </span>
          </div>

          {/* Headline */}
          <h1 className="mt-[5vh] max-w-[420px] font-[family-name:var(--font-display)] text-[clamp(2.4rem,3.5vw,3.4rem)] leading-[1.15] text-white">
            The future of<br />
            payroll bureaus<br />
            starts{' '}
            <em
              className="italic"
              style={{
                background: 'linear-gradient(135deg, var(--brand-peach), var(--brand-pink))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              here.
            </em>
          </h1>

          {/* Tagline */}
          <p className="mt-6 max-w-[360px] font-[family-name:var(--font-body)] text-[1.05rem] font-normal leading-[1.7] text-white/65">
            One platform. Built by bureau owners, for bureau owners. Streamline
            operations, connect with peers, and grow.
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
            style={{
              background: 'var(--brand-peach)',
              animation: 'loginPulse 3s ease-in-out infinite',
            }}
          />
          <span className="font-[family-name:var(--font-body)] text-[0.82rem] font-medium text-white/45">
            Trusted by 100+ UK bureau owners
          </span>
        </div>
      </aside>

      {/* ═══ FORM PANEL (right) ═══ */}
      <main className="relative flex items-center justify-center bg-white p-6 dark:bg-[#1A1B2E] md:p-12">
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
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 md:hidden">
            <Image src="/logo.png" alt="ThePayBureau" width={36} height={36} className="rounded-lg" />
            <span className="font-[family-name:var(--font-body)] text-lg font-extrabold tracking-tight text-[var(--brand-fg)]">
              ThePayBureau
            </span>
          </div>

          {/* Form header */}
          <div className="mb-10">
            <h2 className="font-[family-name:var(--font-display)] text-[2rem] font-normal tracking-tight text-[var(--brand-text)]">
              Welcome back
            </h2>
            <p className="mt-2 font-[family-name:var(--font-body)] text-[0.95rem] text-[var(--brand-text-3)]">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-semibold text-[var(--brand-purple)] transition-colors hover:text-[var(--brand-pink)]"
              >
                Create one
              </Link>
            </p>
          </div>

          {/* Error alert banner */}
          {loginError && (
            <div
              className="mb-6 flex items-center gap-2 rounded-[10px] border border-[var(--brand-error)]/10 px-4 py-3 font-[family-name:var(--font-body)] text-[0.88rem] font-medium text-[var(--brand-error)]"
              style={{
                background: 'var(--brand-error-bg)',
                animation: 'loginSlideDown 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              role="alert"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zM8 11.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
              </svg>
              <span>{loginError}</span>
            </div>
          )}

          {/* Success alert banner */}
          {loginSuccess && (
            <div
              className="mb-6 flex items-center gap-2 rounded-[10px] border border-[var(--brand-success)]/10 px-4 py-3 font-[family-name:var(--font-body)] text-[0.88rem] font-medium text-[var(--brand-success)]"
              style={{
                background: 'var(--brand-success-bg)',
                animation: 'loginSlideDown 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              role="status"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm3.22 5.28a.75.75 0 00-1.06-1.06L7 8.38 5.84 7.22a.75.75 0 00-1.06 1.06l1.75 1.75a.75.75 0 001.06 0l3.63-3.75z" />
              </svg>
              <span>Signed in! Redirecting&hellip;</span>
            </div>
          )}

          {/* ─── Login Form ─── */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleLogin()
            }}
            noValidate
            className="space-y-6"
          >
            {/* Email */}
            <div>
              <Label
                htmlFor="email"
                className="mb-2 block font-[family-name:var(--font-body)] text-[0.82rem] font-semibold uppercase tracking-[0.03em] text-[var(--brand-text-2)]"
              >
                Email
              </Label>
              <Input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                onKeyDown={handleKeyDown}
                placeholder="you@yourbureauname.co.uk"
                autoComplete="email"
                disabled={loading}
                className={cn(
                  'h-12 rounded-xl border-2 border-transparent bg-[var(--brand-cream)] px-4 font-[family-name:var(--font-body)] text-[0.95rem] font-medium text-[var(--brand-text)] placeholder:font-normal placeholder:text-[var(--brand-text-3)]',
                  'transition-all duration-200',
                  'hover:border-[var(--brand-border)]',
                  'focus-visible:border-[var(--brand-purple)] focus-visible:bg-white focus-visible:shadow-[0_0_0_4px_var(--brand-focus)] dark:focus-visible:bg-[#1A1B2E]',
                  emailError &&
                    'border-[var(--brand-error)] bg-[var(--brand-error-bg)] focus-visible:shadow-[0_0_0_4px_rgba(217,48,37,0.1)]'
                )}
              />
              {emailError && (
                <div className="mt-1.5 flex items-center gap-1.5 font-[family-name:var(--font-body)] text-[0.82rem] font-medium text-[var(--brand-error)]">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
                    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zM8 11.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                  </svg>
                  <span>{emailError}</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <Label
                htmlFor="password"
                className="mb-2 block font-[family-name:var(--font-body)] text-[0.82rem] font-semibold uppercase tracking-[0.03em] text-[var(--brand-text-2)]"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={handlePasswordChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  className={cn(
                    'h-12 rounded-xl border-2 border-transparent bg-[var(--brand-cream)] px-4 pr-12 font-[family-name:var(--font-body)] text-[0.95rem] font-medium text-[var(--brand-text)] placeholder:font-normal placeholder:text-[var(--brand-text-3)]',
                    'transition-all duration-200',
                    'hover:border-[var(--brand-border)]',
                    'focus-visible:border-[var(--brand-purple)] focus-visible:bg-white focus-visible:shadow-[0_0_0_4px_var(--brand-focus)] dark:focus-visible:bg-[#1A1B2E]',
                    passwordError &&
                      'border-[var(--brand-error)] bg-[var(--brand-error-bg)] focus-visible:shadow-[0_0_0_4px_rgba(217,48,37,0.1)]'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-md p-1 text-[var(--brand-text-3)] transition-colors hover:text-[var(--brand-purple)] focus-visible:outline-2 focus-visible:outline-[var(--brand-purple)] focus-visible:outline-offset-2"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {passwordError && (
                <div className="mt-1.5 flex items-center gap-1.5 font-[family-name:var(--font-body)] text-[0.82rem] font-medium text-[var(--brand-error)]">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
                    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zM8 11.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                  </svg>
                  <span>{passwordError}</span>
                </div>
              )}
            </div>

            {/* Options row */}
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="h-[18px] w-[18px] shrink-0 cursor-pointer appearance-none rounded-[5px] border-2 border-[var(--brand-border)] bg-[var(--brand-cream)] transition-all checked:border-[var(--brand-purple)] checked:bg-[var(--brand-purple)] focus-visible:outline-2 focus-visible:outline-[var(--brand-purple)] focus-visible:outline-offset-2"
                  style={{
                    backgroundImage: rememberMe
                      ? `url("data:image/svg+xml,%3Csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2.5-2.5a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3E%3C/svg%3E")`
                      : 'none',
                    backgroundSize: '12px 12px',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
                <span className="select-none font-[family-name:var(--font-body)] text-[0.88rem] font-medium text-[var(--brand-text-2)]">
                  Remember me
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="font-[family-name:var(--font-body)] text-[0.88rem] font-semibold text-[var(--brand-purple)] transition-colors hover:text-[var(--brand-pink)] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-[var(--brand-purple)] focus-visible:outline-offset-2"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || loginSuccess}
              className={cn(
                'group relative h-12 w-full overflow-hidden rounded-xl font-[family-name:var(--font-body)] text-[0.95rem] font-bold tracking-[0.01em] text-white',
                'transition-all duration-300',
                'hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(64,29,108,0.3)]',
                'active:translate-y-0',
                'focus-visible:outline-2 focus-visible:outline-[var(--brand-purple)] focus-visible:outline-offset-[3px]',
                'disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none'
              )}
              style={{ background: 'var(--brand-purple)' }}
            >
              {/* Gradient hover overlay */}
              <span
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-400 group-hover:opacity-100 group-disabled:opacity-0"
                style={{
                  background: 'linear-gradient(135deg, var(--brand-pink), var(--brand-peach))',
                }}
              />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-[18px] w-[18px] animate-spin" />
                    Signing in&hellip;
                  </>
                ) : loginSuccess ? (
                  'Redirecting\u2026'
                ) : (
                  'Sign in'
                )}
              </span>
            </Button>
          </form>

          {/* Support contact */}
          <p className="mt-6 text-center font-[family-name:var(--font-body)] text-[0.82rem] text-[var(--brand-text-3)]">
            Can&apos;t remember your email?{' '}
            <a
              href="mailto:support@thepaybureau.com"
              className="font-medium text-[var(--brand-purple)] transition-colors hover:text-[var(--brand-pink)]"
            >
              Contact support
            </a>
          </p>

          {/* Footer */}
          <div className="mt-6 text-center font-[family-name:var(--font-body)] text-[0.78rem] leading-relaxed text-[var(--brand-text-3)]">
            <p>
              By signing in you agree to our{' '}
              <Link href="/terms" className="text-[var(--brand-text-2)] underline underline-offset-2 hover:text-[var(--brand-purple)]">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-[var(--brand-text-2)] underline underline-offset-2 hover:text-[var(--brand-purple)]">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
