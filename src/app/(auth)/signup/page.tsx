'use client'

import { useState, useCallback, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const GRAIN_TEXTURE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`

interface FormErrors {
  email?: string
  password?: string
  companyName?: string
  adminName?: string
  submit?: string
}

interface EmailValidation {
  isValid: boolean | null
  message: string
  suggestion: string
}

export default function SignupPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
    adminName: ''
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [emailValidation, setEmailValidation] = useState<EmailValidation>({
    isValid: null,
    message: '',
    suggestion: ''
  })

  const validateEmail = useCallback((email: string) => {
    if (!email) {
      setEmailValidation({ isValid: null, message: '', suggestion: '' })
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const personalDomains = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'aol.com']

    if (!emailRegex.test(email)) {
      setEmailValidation({ isValid: false, message: 'Please enter a valid email address', suggestion: '' })
      return
    }

    const domain = email.split('@')[1]?.toLowerCase()

    if (personalDomains.includes(domain)) {
      setEmailValidation({
        isValid: false,
        message: 'Business email required',
        suggestion: `Try using your company email instead of ${domain}`
      })
      return
    }

    const suggestedCompany = domain?.split('.')[0]
      .split(/[-_]/)
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    setEmailValidation({
      isValid: true,
      message: 'Business email verified',
      suggestion: suggestedCompany && !formData.companyName ? `Company: ${suggestedCompany}?` : ''
    })

    if (suggestedCompany && !formData.companyName) {
      setFormData(prev => ({ ...prev, companyName: suggestedCompany }))
    }
  }, [formData.companyName])

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
    if (field === 'email') validateEmail(value)
  }

  const validateForm = () => {
    const newErrors: FormErrors = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (emailValidation.isValid === false) {
      newErrors.email = emailValidation.message
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Must include uppercase, lowercase, and number'
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required'
    }

    if (!formData.adminName.trim()) {
      newErrors.adminName = 'Your name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`)
      } else {
        setErrors({ submit: data.error || 'Registration failed. Please try again.' })
      }
    } catch {
      setErrors({ submit: 'Network error. Please check your connection and try again.' })
    } finally {
      setLoading(false)
    }
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
            Built for bureau<br />
            owners who mean{' '}
            <em
              className="italic"
              style={{
                background: 'linear-gradient(135deg, var(--login-peach), var(--login-pink))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              business.
            </em>
          </h1>

          {/* Tagline */}
          <p className="mt-6 max-w-[360px] font-[family-name:var(--font-body)] text-[1.05rem] font-normal leading-[1.7] text-white/65">
            Client management, compliance tracking, and payroll
            operations — one platform, zero fuss. Free to get started.
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

        {/* Feature list */}
        <div className="relative z-10 space-y-3">
          {['Client management & HMRC compliance', 'Payroll run tracking & checklists', 'Free to start — no card required'].map((feature) => (
            <div key={feature} className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-white/60" />
              <span className="font-[family-name:var(--font-body)] text-[0.85rem] font-medium text-white/50">
                {feature}
              </span>
            </div>
          ))}
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

          {/* Form header */}
          <div className="mb-8">
            <h2 className="font-[family-name:var(--font-display)] text-[2rem] font-normal tracking-tight text-[var(--login-text)]">
              Create your account
            </h2>
            <p className="mt-2 font-[family-name:var(--font-body)] text-[0.95rem] text-[var(--login-text-3)]">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-[var(--login-purple)] transition-colors hover:text-[var(--login-pink)]"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Submit error banner */}
          {errors.submit && (
            <div
              className="mb-6 flex items-center gap-2 rounded-[10px] border border-[var(--login-error)]/10 px-4 py-3 font-[family-name:var(--font-body)] text-[0.88rem] font-medium text-[var(--login-error)]"
              style={{
                background: 'var(--login-error-bg)',
                animation: 'loginSlideDown 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
              role="alert"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zM8 11.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
              </svg>
              <span>{errors.submit}</span>
            </div>
          )}

          {/* ─── Signup Form ─── */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <Label
                htmlFor="email"
                className="mb-2 block font-[family-name:var(--font-body)] text-[0.82rem] font-semibold uppercase tracking-[0.03em] text-[var(--login-text-2)]"
              >
                Business email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="you@yourcompany.co.uk"
                autoComplete="email"
                disabled={loading}
                className={cn(
                  'h-12 rounded-xl border-2 border-transparent bg-[var(--login-cream)] px-4 font-[family-name:var(--font-body)] text-[0.95rem] font-medium text-[var(--login-text)] placeholder:font-normal placeholder:text-[var(--login-text-3)]',
                  'transition-all duration-200',
                  'hover:border-[var(--login-border)]',
                  'focus-visible:border-[var(--login-purple)] focus-visible:bg-white focus-visible:shadow-[0_0_0_4px_var(--login-focus)] dark:focus-visible:bg-[#1A1B2E]',
                  errors.email
                    ? 'border-[var(--login-error)] bg-[var(--login-error-bg)] focus-visible:shadow-[0_0_0_4px_rgba(217,48,37,0.1)]'
                    : emailValidation.isValid === true && 'border-[var(--login-success)]/30'
                )}
              />
              {emailValidation.message && !errors.email && (
                <div className={cn(
                  'mt-1.5 flex items-center gap-1.5 font-[family-name:var(--font-body)] text-[0.82rem] font-medium',
                  emailValidation.isValid ? 'text-[var(--login-success)]' : 'text-amber-600 dark:text-amber-400'
                )}>
                  {emailValidation.isValid ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
                  <span>{emailValidation.message}</span>
                </div>
              )}
              {errors.email && (
                <div className="mt-1.5 flex items-center gap-1.5 font-[family-name:var(--font-body)] text-[0.82rem] font-medium text-[var(--login-error)]">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
                    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zM8 11.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                  </svg>
                  <span>{errors.email}</span>
                </div>
              )}
            </div>

            {/* Company Name */}
            <div>
              <Label
                htmlFor="company"
                className="mb-2 block font-[family-name:var(--font-body)] text-[0.82rem] font-semibold uppercase tracking-[0.03em] text-[var(--login-text-2)]"
              >
                Company name
              </Label>
              <Input
                id="company"
                type="text"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                placeholder="Your Payroll Bureau Ltd"
                autoComplete="organization"
                disabled={loading}
                className={cn(
                  'h-12 rounded-xl border-2 border-transparent bg-[var(--login-cream)] px-4 font-[family-name:var(--font-body)] text-[0.95rem] font-medium text-[var(--login-text)] placeholder:font-normal placeholder:text-[var(--login-text-3)]',
                  'transition-all duration-200',
                  'hover:border-[var(--login-border)]',
                  'focus-visible:border-[var(--login-purple)] focus-visible:bg-white focus-visible:shadow-[0_0_0_4px_var(--login-focus)] dark:focus-visible:bg-[#1A1B2E]',
                  errors.companyName &&
                    'border-[var(--login-error)] bg-[var(--login-error-bg)] focus-visible:shadow-[0_0_0_4px_rgba(217,48,37,0.1)]'
                )}
              />
              {errors.companyName && (
                <div className="mt-1.5 flex items-center gap-1.5 font-[family-name:var(--font-body)] text-[0.82rem] font-medium text-[var(--login-error)]">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
                    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zM8 11.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                  </svg>
                  <span>{errors.companyName}</span>
                </div>
              )}
            </div>

            {/* Admin Name */}
            <div>
              <Label
                htmlFor="name"
                className="mb-2 block font-[family-name:var(--font-body)] text-[0.82rem] font-semibold uppercase tracking-[0.03em] text-[var(--login-text-2)]"
              >
                Your name
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.adminName}
                onChange={(e) => handleInputChange('adminName', e.target.value)}
                placeholder="Jane Smith"
                autoComplete="name"
                disabled={loading}
                className={cn(
                  'h-12 rounded-xl border-2 border-transparent bg-[var(--login-cream)] px-4 font-[family-name:var(--font-body)] text-[0.95rem] font-medium text-[var(--login-text)] placeholder:font-normal placeholder:text-[var(--login-text-3)]',
                  'transition-all duration-200',
                  'hover:border-[var(--login-border)]',
                  'focus-visible:border-[var(--login-purple)] focus-visible:bg-white focus-visible:shadow-[0_0_0_4px_var(--login-focus)] dark:focus-visible:bg-[#1A1B2E]',
                  errors.adminName &&
                    'border-[var(--login-error)] bg-[var(--login-error-bg)] focus-visible:shadow-[0_0_0_4px_rgba(217,48,37,0.1)]'
                )}
              />
              {errors.adminName && (
                <div className="mt-1.5 flex items-center gap-1.5 font-[family-name:var(--font-body)] text-[0.82rem] font-medium text-[var(--login-error)]">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
                    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zM8 11.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                  </svg>
                  <span>{errors.adminName}</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <Label
                htmlFor="password"
                className="mb-2 block font-[family-name:var(--font-body)] text-[0.82rem] font-semibold uppercase tracking-[0.03em] text-[var(--login-text-2)]"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Min 8 chars, upper + lower + number"
                autoComplete="new-password"
                disabled={loading}
                className={cn(
                  'h-12 rounded-xl border-2 border-transparent bg-[var(--login-cream)] px-4 font-[family-name:var(--font-body)] text-[0.95rem] font-medium text-[var(--login-text)] placeholder:font-normal placeholder:text-[var(--login-text-3)]',
                  'transition-all duration-200',
                  'hover:border-[var(--login-border)]',
                  'focus-visible:border-[var(--login-purple)] focus-visible:bg-white focus-visible:shadow-[0_0_0_4px_var(--login-focus)] dark:focus-visible:bg-[#1A1B2E]',
                  errors.password &&
                    'border-[var(--login-error)] bg-[var(--login-error-bg)] focus-visible:shadow-[0_0_0_4px_rgba(217,48,37,0.1)]'
                )}
              />
              {errors.password && (
                <div className="mt-1.5 flex items-center gap-1.5 font-[family-name:var(--font-body)] text-[0.82rem] font-medium text-[var(--login-error)]">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="shrink-0">
                    <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zM8 11.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
                  </svg>
                  <span>{errors.password}</span>
                </div>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || emailValidation.isValid === false}
              className={cn(
                'group relative h-12 w-full overflow-hidden rounded-xl font-[family-name:var(--font-body)] text-[0.95rem] font-bold tracking-[0.01em] text-white',
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
                    Creating account&hellip;
                  </>
                ) : (
                  'Create account'
                )}
              </span>
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center font-[family-name:var(--font-body)] text-[0.78rem] leading-relaxed text-[var(--login-text-3)]">
            <p>
              By creating an account you agree to our{' '}
              <Link href="/terms" className="text-[var(--login-text-2)] underline underline-offset-2 hover:text-[var(--login-purple)]">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-[var(--login-text-2)] underline underline-offset-2 hover:text-[var(--login-purple)]">
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
