'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { APP_DOMAIN } from '@/lib/domains'

export function Footer() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setMessage('You\'re subscribed! Look out for our Friday updates.')
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <footer className="border-t" style={{ background: '#1A1225', borderColor: 'transparent' }}>
      <div className="max-w-[1200px] mx-auto px-5 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
          {/* Brand + Newsletter — spans 2 cols on desktop */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <Image src="/logo.png" alt="ThePayBureau" width={28} height={28} className="h-7 w-7 rounded-md" />
              <span className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-body)' }}>
                ThePayBureau
              </span>
            </div>
            <p className="text-xs text-white/40 leading-relaxed max-w-[280px] mb-5" style={{ fontFamily: 'var(--font-inter)' }}>
              Built by payroll professionals, for payroll professionals.
            </p>

            {/* Newsletter signup */}
            <div className="max-w-[320px]">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2.5" style={{ fontFamily: 'var(--font-inter)' }}>
                Weekly payroll insights
              </p>
              {status === 'success' ? (
                <p className="text-xs text-emerald-400" style={{ fontFamily: 'var(--font-inter)' }}>
                  {message}
                </p>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setStatus('idle') }}
                    required
                    className="flex-1 min-w-0 px-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors duration-150"
                    style={{ fontFamily: 'var(--font-inter)' }}
                    disabled={status === 'loading'}
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="px-4 py-2 text-xs font-medium text-white rounded-lg transition-opacity duration-150 hover:opacity-90 disabled:opacity-50 shrink-0"
                    style={{ background: '#EC385D', fontFamily: 'var(--font-inter)' }}
                  >
                    {status === 'loading' ? '...' : 'Subscribe'}
                  </button>
                </form>
              )}
              {status === 'error' && (
                <p className="text-xs text-red-400 mt-1.5" style={{ fontFamily: 'var(--font-inter)' }}>
                  {message}
                </p>
              )}
              <p className="text-[10px] text-white/25 mt-2 leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>
                Friday payroll tips &amp; product updates. Unsubscribe anytime.
              </p>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4" style={{ fontFamily: 'var(--font-inter)' }}>
              Product
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Features', href: '/#features' },
                { label: 'Pricing', href: '/#pricing' },
                { label: 'Roadmap', href: '/roadmap' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/50 hover:text-white/90 transition-colors duration-150"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4" style={{ fontFamily: 'var(--font-inter)' }}>
              Legal
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Terms of Service', href: '/terms' },
                { label: 'Privacy Policy', href: '/privacy' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/50 hover:text-white/90 transition-colors duration-150"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-4" style={{ fontFamily: 'var(--font-inter)' }}>
              Company
            </h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Support', href: 'mailto:support@thepaybureau.com' },
                { label: 'Log in', href: `${APP_DOMAIN}/login` },
                { label: 'Sign up', href: `${APP_DOMAIN}/signup` },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-white/50 hover:text-white/90 transition-colors duration-150"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-6 border-t border-white/10">
          <p className="text-xs text-white/30" style={{ fontFamily: 'var(--font-inter)' }}>
            &copy; {new Date().getFullYear()} Intelligent Payroll Limited T/A The Pay Bureau. Registered in England and Wales.
          </p>
        </div>
      </div>
    </footer>
  )
}
