'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { Suspense } from 'react'

const GRAIN_TEXTURE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || 'your email'

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
            You&apos;re{' '}
            <em
              className="italic"
              style={{
                background: 'linear-gradient(135deg, var(--login-peach), var(--login-pink))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              almost
            </em>
            <br />
            there.
          </h1>

          {/* Tagline */}
          <p className="mt-6 max-w-[360px] font-[family-name:var(--font-body)] text-[1.05rem] font-normal leading-[1.7] text-white/65">
            Just one more step and your payroll bureau will be
            set up and ready to go.
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
            Secure email verification
          </span>
        </div>
      </aside>

      {/* ═══ CONTENT PANEL (right) ═══ */}
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

        <div className="relative z-10 w-full max-w-[420px] text-center">
          <div
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: 'var(--login-success-bg)' }}
          >
            <Mail className="h-8 w-8" style={{ color: 'var(--login-success)' }} />
          </div>

          <h2 className="font-[family-name:var(--font-display)] text-[2rem] font-normal tracking-tight text-[var(--login-text)]">
            Check your inbox
          </h2>

          <p className="mt-3 font-[family-name:var(--font-body)] text-[0.95rem] leading-relaxed text-[var(--login-text-3)]">
            We&apos;ve sent a confirmation link to{' '}
            <strong className="text-[var(--login-text)]">{email}</strong>.
            Click the link in the email to verify your account and get started.
          </p>

          <div className="mt-8 rounded-[10px] border border-[var(--login-border)] bg-[var(--login-cream)] p-4 text-left">
            <p className="font-[family-name:var(--font-body)] text-[0.82rem] font-medium text-[var(--login-text-2)]">
              Didn&apos;t receive the email?
            </p>
            <ul className="mt-2 space-y-1 font-[family-name:var(--font-body)] text-[0.8rem] text-[var(--login-text-3)]">
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email</li>
              <li>The email may take a minute to arrive</li>
            </ul>
          </div>

          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 font-[family-name:var(--font-body)] text-[0.88rem] font-medium text-[var(--login-text-3)] transition-colors hover:text-[var(--login-text)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </main>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  )
}
