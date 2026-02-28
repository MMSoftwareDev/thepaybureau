'use client'

import { useState, useCallback, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, Building2, Mail, Lock, User, Loader2, Sparkles } from 'lucide-react'
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
            Start your<br />
            payroll bureau{' '}
            <em
              className="italic"
              style={{
                background: 'linear-gradient(135deg, var(--login-peach), var(--login-pink))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              journey.
            </em>
          </h1>

          <p className="mt-6 max-w-[360px] font-[family-name:var(--font-body)] text-[1.05rem] font-normal leading-[1.7] text-white/65">
            Join a growing community of bureau owners. Client management,
            compliance tracking, and payroll operations — all in one place.
          </p>
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-3">
          {['Client Management', 'HMRC Compliance', 'Free to Start'].map((feature) => (
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
      <main className="relative flex items-center justify-center px-6 py-12 sm:px-12 bg-[var(--login-surface)]">
        <div className="w-full max-w-[420px]">
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
            Create your account
          </h2>
          <p className="mt-2 text-[0.95rem] text-[var(--login-muted)]">
            Get started with your free playground account.
          </p>

          {/* Submit error banner */}
          {errors.submit && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 dark:border-red-800 dark:bg-red-950/30">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-[0.85rem] font-medium text-red-600 dark:text-red-400">{errors.submit}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[0.82rem] font-semibold uppercase tracking-wider text-[var(--login-label)]">
                Business email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--login-muted)]/50" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="admin@yourcompany.com"
                  className={cn(
                    'h-12 rounded-xl border bg-[var(--login-input-bg)] pl-11 pr-4 text-[0.95rem] text-[var(--login-fg)] placeholder:text-[var(--login-muted)]/50',
                    'transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--login-purple)]/40 focus-visible:ring-offset-0',
                    errors.email ? 'border-red-400' : emailValidation.isValid === true ? 'border-green-400' : 'border-[var(--login-border)]'
                  )}
                />
              </div>
              {emailValidation.message && (
                <p className={cn(
                  'flex items-center gap-1.5 text-[0.8rem] font-medium',
                  emailValidation.isValid ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                )}>
                  {emailValidation.isValid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  {emailValidation.message}
                </p>
              )}
              {errors.email && (
                <p className="flex items-center gap-1.5 text-[0.8rem] font-medium text-red-500">
                  <AlertCircle className="h-3.5 w-3.5" />{errors.email}
                </p>
              )}
            </div>

            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="company" className="text-[0.82rem] font-semibold uppercase tracking-wider text-[var(--login-label)]">
                Company name
              </Label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--login-muted)]/50" />
                <Input
                  id="company"
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="Your Company Ltd"
                  className={cn(
                    'h-12 rounded-xl border bg-[var(--login-input-bg)] pl-11 pr-4 text-[0.95rem] text-[var(--login-fg)] placeholder:text-[var(--login-muted)]/50',
                    'transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--login-purple)]/40 focus-visible:ring-offset-0',
                    errors.companyName ? 'border-red-400' : 'border-[var(--login-border)]'
                  )}
                />
              </div>
              {errors.companyName && (
                <p className="flex items-center gap-1.5 text-[0.8rem] font-medium text-red-500">
                  <AlertCircle className="h-3.5 w-3.5" />{errors.companyName}
                </p>
              )}
            </div>

            {/* Admin Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[0.82rem] font-semibold uppercase tracking-wider text-[var(--login-label)]">
                Your name
              </Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--login-muted)]/50" />
                <Input
                  id="name"
                  type="text"
                  value={formData.adminName}
                  onChange={(e) => handleInputChange('adminName', e.target.value)}
                  placeholder="John Smith"
                  className={cn(
                    'h-12 rounded-xl border bg-[var(--login-input-bg)] pl-11 pr-4 text-[0.95rem] text-[var(--login-fg)] placeholder:text-[var(--login-muted)]/50',
                    'transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--login-purple)]/40 focus-visible:ring-offset-0',
                    errors.adminName ? 'border-red-400' : 'border-[var(--login-border)]'
                  )}
                />
              </div>
              {errors.adminName && (
                <p className="flex items-center gap-1.5 text-[0.8rem] font-medium text-red-500">
                  <AlertCircle className="h-3.5 w-3.5" />{errors.adminName}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[0.82rem] font-semibold uppercase tracking-wider text-[var(--login-label)]">
                Password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--login-muted)]/50" />
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="8+ characters, upper, lower, number"
                  className={cn(
                    'h-12 rounded-xl border bg-[var(--login-input-bg)] pl-11 pr-4 text-[0.95rem] text-[var(--login-fg)] placeholder:text-[var(--login-muted)]/50',
                    'transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--login-purple)]/40 focus-visible:ring-offset-0',
                    errors.password ? 'border-red-400' : 'border-[var(--login-border)]'
                  )}
                />
              </div>
              {errors.password && (
                <p className="flex items-center gap-1.5 text-[0.8rem] font-medium text-red-500">
                  <AlertCircle className="h-3.5 w-3.5" />{errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || emailValidation.isValid === false}
              className={cn(
                'h-12 w-full rounded-xl text-[0.95rem] font-semibold text-white shadow-lg transition-all',
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
                  Creating account...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create account
                </>
              )}
            </Button>
          </form>

          {/* Login link */}
          <p className="mt-8 text-center text-[0.85rem] text-[var(--login-muted)]">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-[var(--login-purple)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
