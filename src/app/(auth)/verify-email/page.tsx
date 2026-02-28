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
            Almost<br />
            there
          </h1>

          <p className="mt-6 max-w-[360px] font-[family-name:var(--font-body)] text-[1.05rem] font-normal leading-[1.7] text-white/65">
            Just one more step to get your payroll bureau set up and running.
          </p>
        </div>

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
      <main className="relative flex items-center justify-center px-6 py-12 sm:px-12 bg-[var(--login-surface)]">
        <div className="w-full max-w-[420px] text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--login-purple)]/10">
            <Mail className="h-8 w-8 text-[var(--login-purple)]" />
          </div>

          <h2 className="font-[family-name:var(--font-display)] text-[1.75rem] leading-tight text-[var(--login-fg)]">
            Check your email
          </h2>

          <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--login-muted)]">
            We&apos;ve sent a confirmation link to{' '}
            <strong className="text-[var(--login-fg)]">{email}</strong>.
            Click the link in the email to verify your account and get started.
          </p>

          <div className="mt-8 rounded-xl border border-[var(--login-border)] bg-[var(--login-input-bg)] p-4 text-left">
            <p className="text-[0.85rem] font-medium text-[var(--login-fg)]">
              Didn&apos;t receive the email?
            </p>
            <ul className="mt-2 space-y-1 text-[0.82rem] text-[var(--login-muted)]">
              <li>Check your spam or junk folder</li>
              <li>Make sure you entered the correct email</li>
              <li>The email may take a minute to arrive</li>
            </ul>
          </div>

          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[var(--login-muted)] transition-colors hover:text-[var(--login-fg)]"
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
