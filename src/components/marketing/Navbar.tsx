'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import { APP_DOMAIN } from '@/lib/domains'

interface NavbarProps {
  showNav?: boolean
}

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Roadmap', href: '/roadmap' },
]

export function Navbar({ showNav = true }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-xl border-b"
      style={{
        background: 'color-mix(in srgb, var(--mkt-bg) 90%, transparent)',
        borderColor: 'var(--mkt-border)',
      }}
    >
      <div className="max-w-[1200px] mx-auto px-5 h-[64px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="ThePayBureau" width={32} height={32} className="h-8 w-8" />
          <span
            className="text-[15px] font-bold tracking-tight hidden sm:inline"
            style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-body)' }}
          >
            ThePayBureau
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="flex items-center gap-1">
          {showNav && (
            <div className="hidden md:flex items-center gap-1 mr-4">
              {NAV_LINKS.map((link) => {
                const isPage = link.href.startsWith('/')
                const Tag = isPage ? Link : 'a'
                return (
                  <Tag
                    key={link.label}
                    href={link.href}
                    className="px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 hover:bg-[var(--mkt-bg-alt)]"
                    style={{ color: 'var(--mkt-text-2)', fontFamily: 'var(--font-inter)' }}
                  >
                    {link.label}
                  </Tag>
                )
              })}
            </div>
          )}

          <a
            href={`${APP_DOMAIN}/login`}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-150 hover:bg-[var(--mkt-bg-alt)]"
            style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-inter)' }}
          >
            Log in
          </a>
          <a
            href={`${APP_DOMAIN}/signup`}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white rounded-lg transition-opacity duration-150 hover:opacity-90"
            style={{ background: 'var(--mkt-purple)', fontFamily: 'var(--font-inter)' }}
          >
            Start Free
          </a>

          {/* Mobile hamburger */}
          {showNav && (
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden ml-2 p-2 rounded-lg transition-colors duration-150 hover:bg-[var(--mkt-bg-alt)]"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" style={{ color: 'var(--mkt-text)' }} />
              ) : (
                <Menu className="w-5 h-5" style={{ color: 'var(--mkt-text)' }} />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile dropdown */}
      {showNav && mobileOpen && (
        <div
          className="md:hidden border-t px-5 py-4 space-y-1"
          style={{ borderColor: 'var(--mkt-border)', background: 'var(--mkt-bg)' }}
        >
          {NAV_LINKS.map((link) => {
            const isPage = link.href.startsWith('/')
            const Tag = isPage ? Link : 'a'
            return (
              <Tag
                key={link.label}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 hover:bg-[var(--mkt-bg-alt)]"
                style={{ color: 'var(--mkt-text-2)', fontFamily: 'var(--font-inter)' }}
              >
                {link.label}
              </Tag>
            )
          })}
          <a
            href={`${APP_DOMAIN}/login`}
            className="block px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 hover:bg-[var(--mkt-bg-alt)]"
            style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-inter)' }}
          >
            Log in
          </a>
        </div>
      )}
    </nav>
  )
}
