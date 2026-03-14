import Link from 'next/link'
import Image from 'next/image'
import { APP_DOMAIN } from '@/lib/domains'

interface NavbarProps {
  showNav?: boolean
}

export function Navbar({ showNav = true }: NavbarProps) {
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

        {/* Nav links + CTAs */}
        <div className="flex items-center gap-1">
          {showNav && (
            <div className="hidden md:flex items-center gap-1 mr-4">
              {[
                { label: 'Features', href: '#features' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'FAQ', href: '#faq' },
                { label: 'Roadmap', href: '/roadmap' },
              ].map((link) => {
                const isExternal = link.href.startsWith('/roadmap')
                const Tag = isExternal ? Link : 'a'
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
            Get Started Free
          </a>
        </div>
      </div>
    </nav>
  )
}
