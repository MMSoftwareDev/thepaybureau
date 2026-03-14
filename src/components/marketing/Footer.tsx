import Link from 'next/link'
import Image from 'next/image'
import { APP_DOMAIN } from '@/lib/domains'

export function Footer() {
  return (
    <footer className="border-t" style={{ background: 'var(--mkt-text)', borderColor: 'transparent' }}>
      <div className="max-w-[1200px] mx-auto px-5 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <Image src="/logo.png" alt="ThePayBureau" width={28} height={28} className="h-7 w-7 rounded-md" />
              <span className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-body)' }}>
                ThePayBureau
              </span>
            </div>
            <p className="text-xs text-white/40 leading-relaxed max-w-[220px]" style={{ fontFamily: 'var(--font-inter)' }}>
              The professional payroll CRM for UK bureau owners and specialists.
            </p>
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
                { label: 'Log in', href: `${APP_DOMAIN}/login`, external: true },
                { label: 'Sign up', href: `${APP_DOMAIN}/signup`, external: true },
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
