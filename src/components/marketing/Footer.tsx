'use client'

import Link from 'next/link'
import Image from 'next/image'
import { APP_DOMAIN } from '@/lib/domains'

export function Footer() {
  return (
    <footer className="border-t" style={{ background: '#1A1225', borderColor: 'transparent' }}>
      <div className="max-w-[1200px] mx-auto px-5 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
          {/* Brand — spans 2 cols on desktop */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <Image src="/logo.png" alt="ThePayBureau" width={28} height={28} className="h-7 w-7 rounded-md" />
              <span className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-body)' }}>
                ThePayBureau
              </span>
            </div>
            <p className="text-xs text-white/40 leading-relaxed max-w-[280px] mb-6" style={{ fontFamily: 'var(--font-inter)' }}>
              Built by payroll professionals, for payroll professionals.
            </p>

            {/* Newsletter signup */}
            <div>
              <p className="text-xs font-semibold text-white/60 mb-2" style={{ fontFamily: 'var(--font-inter)' }}>
                Get payroll tips &amp; product updates
              </p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="you@bureau.co.uk"
                  className="flex-1 h-8 px-3 rounded-md text-xs border bg-white/5 text-white/80 placeholder:text-white/30 outline-none focus:border-white/30 transition-colors duration-150"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', fontFamily: 'var(--font-inter)' }}
                />
                <button
                  type="submit"
                  className="h-8 px-3 rounded-md text-xs font-semibold text-white/80 border border-white/20 hover:bg-white/10 transition-colors duration-150"
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  Subscribe
                </button>
              </form>
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
            &copy; {new Date().getFullYear()} ThePayBureau Ltd. Registered in England and Wales.
          </p>
        </div>
      </div>
    </footer>
  )
}
