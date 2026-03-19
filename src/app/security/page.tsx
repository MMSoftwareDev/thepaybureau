import type { Metadata } from 'next'
import { MARKETING_DOMAIN } from '@/lib/domains'
import { Navbar } from '@/components/marketing/Navbar'
import { Footer } from '@/components/marketing/Footer'
import { FadeInOnScroll } from '@/components/marketing/FadeInOnScroll'
import { SectionHeader } from '@/components/marketing/SectionHeader'
import { SecurityPageClient } from './SecurityPageClient'
import {
  Lock,
  Building2,
  KeyRound,
  FileSearch,
  Activity,
  ShieldCheck,
  Flag,
  Server,
  Scale,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Security — The Pay Bureau',
  description:
    'Learn how The Pay Bureau protects your payroll data with encryption, tenant isolation, audit trails, and UK GDPR compliance.',
  alternates: {
    canonical: `${MARKETING_DOMAIN}/security`,
  },
}

export default function SecurityPage() {
  return (
    <div
      className="overflow-x-clip w-full scroll-smooth"
      style={{
        background: 'var(--mkt-bg)',
        fontFamily: 'var(--font-body), Plus Jakarta Sans, system-ui, sans-serif',
      }}
    >
      <Navbar showNav />

      {/* Hero */}
      <FadeInOnScroll>
        <section
          className="pt-32 pb-20 max-[880px]:pt-24 max-[880px]:pb-12"
          style={{ background: 'var(--mkt-bg)' }}
        >
          <div className="max-w-[1160px] mx-auto px-10 max-[880px]:px-5 text-center">
            <div
              className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.1em] uppercase mb-4"
              style={{ color: 'var(--mkt-pink)', fontFamily: 'var(--font-inter)' }}
            >
              <span className="w-5 h-0.5 rounded-sm" style={{ background: 'var(--mkt-pink)' }} />
              Security
              <span className="w-5 h-0.5 rounded-sm" style={{ background: 'var(--mkt-pink)' }} />
            </div>
            <h1
              className="text-[clamp(2rem,4.5vw,3.4rem)] font-bold tracking-[-0.025em] leading-[1.1] mb-5"
              style={{
                color: 'var(--mkt-text)',
                fontFamily: 'var(--font-display), DM Serif Display, serif',
              }}
            >
              Your clients&apos; data,<br className="hidden sm:block" /> protected at every layer
            </h1>
            <p
              className="text-lg max-w-[560px] mx-auto leading-relaxed"
              style={{ color: 'var(--mkt-text-2)', fontFamily: 'var(--font-body)' }}
            >
              Payroll data is sensitive. We treat it that way — with encryption, strict access
              controls, and data isolation built into every part of the platform.
            </p>
          </div>
        </section>
      </FadeInOnScroll>

      {/* Trust Badges */}
      <FadeInOnScroll delay={100}>
        <section style={{ background: 'var(--mkt-bg)' }}>
          <div className="max-w-[1160px] mx-auto px-10 max-[880px]:px-5 pb-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {TRUST_BADGES.map((badge) => (
                <div
                  key={badge.label}
                  className="rounded-xl p-5 border text-center"
                  style={{
                    background: 'var(--mkt-surface)',
                    borderColor: 'var(--mkt-border)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'color-mix(in srgb, var(--mkt-purple) 8%, transparent)' }}
                  >
                    <badge.icon className="w-5 h-5" style={{ color: 'var(--mkt-purple)' }} />
                  </div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-inter)' }}
                  >
                    {badge.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeInOnScroll>

      {/* Feature Cards */}
      <FadeInOnScroll delay={150}>
        <section
          className="py-20 max-[880px]:py-12"
          style={{ background: 'var(--mkt-bg-alt)' }}
        >
          <div className="max-w-[1160px] mx-auto px-10 max-[880px]:px-5">
            <SectionHeader
              eyebrow="How We Protect You"
              title="Security built in, not bolted on"
              description="Every feature is designed with data protection at its core — from the database layer up to the user interface."
              className="text-center mx-auto"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SECURITY_FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl p-6 border transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: 'var(--mkt-surface)',
                    borderColor: 'var(--mkt-border)',
                    boxShadow: 'var(--mkt-card-shadow)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                    style={{ background: 'color-mix(in srgb, var(--mkt-purple) 8%, transparent)' }}
                  >
                    <feature.icon className="w-5 h-5" style={{ color: 'var(--mkt-purple)' }} />
                  </div>
                  <h3
                    className="text-[15px] font-semibold mb-2"
                    style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-inter)' }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--mkt-text-2)', fontFamily: 'var(--font-body)' }}
                  >
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeInOnScroll>

      {/* Data Handling */}
      <FadeInOnScroll>
        <section className="py-20 max-[880px]:py-12" style={{ background: 'var(--mkt-bg)' }}>
          <div className="max-w-[1160px] mx-auto px-10 max-[880px]:px-5">
            <SectionHeader
              eyebrow="Data Handling"
              title="Your data, your rules"
              description="We believe you should always be in control of your information."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DATA_PRINCIPLES.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl p-6 border"
                  style={{
                    background: 'var(--mkt-surface)',
                    borderColor: 'var(--mkt-border)',
                  }}
                >
                  <h3
                    className="text-[15px] font-semibold mb-2"
                    style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-inter)' }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--mkt-text-2)', fontFamily: 'var(--font-body)' }}
                  >
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeInOnScroll>

      {/* Security Practices */}
      <FadeInOnScroll>
        <section
          className="py-20 max-[880px]:py-12"
          style={{ background: 'var(--mkt-bg-alt)' }}
        >
          <div className="max-w-[1160px] mx-auto px-10 max-[880px]:px-5">
            <SectionHeader
              eyebrow="Our Practices"
              title="How we stay ahead of threats"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {PRACTICES.map((practice) => (
                <div key={practice} className="flex items-start gap-3">
                  <span
                    className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: 'var(--mkt-purple)' }}
                  />
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--mkt-text-2)', fontFamily: 'var(--font-body)' }}
                  >
                    {practice}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </FadeInOnScroll>

      {/* FAQ */}
      <FadeInOnScroll>
        <section className="py-20 max-[880px]:py-12" style={{ background: 'var(--mkt-bg)' }}>
          <div className="max-w-[720px] mx-auto px-10 max-[880px]:px-5">
            <SectionHeader
              eyebrow="FAQ"
              title="Common security questions"
              className="text-center mx-auto"
            />
            <SecurityPageClient />
          </div>
        </section>
      </FadeInOnScroll>

      {/* Contact CTA */}
      <FadeInOnScroll>
        <section className="pb-20 max-[880px]:pb-12" style={{ background: 'var(--mkt-bg)' }}>
          <div className="max-w-[1160px] mx-auto px-10 max-[880px]:px-5">
            <div
              className="rounded-2xl p-10 max-[880px]:p-6 text-center"
              style={{
                background: 'linear-gradient(135deg, var(--mkt-purple), var(--mkt-purple-l))',
              }}
            >
              <h2
                className="text-2xl md:text-3xl font-bold mb-3 text-white"
                style={{ fontFamily: 'var(--font-display), DM Serif Display, serif' }}
              >
                Have a security question?
              </h2>
              <p
                className="text-base mb-6 max-w-[420px] mx-auto"
                style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-body)' }}
              >
                We take every enquiry seriously. Reach out and we&apos;ll respond within 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="mailto:security@thepaybureau.com"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-150 hover:opacity-90"
                  style={{
                    background: 'white',
                    color: 'var(--mkt-purple)',
                    fontFamily: 'var(--font-inter)',
                  }}
                >
                  security@thepaybureau.com
                </a>
                <a
                  href="/privacy"
                  className="text-sm font-medium underline underline-offset-4"
                  style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-inter)' }}
                >
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>
        </section>
      </FadeInOnScroll>

      <Footer />
    </div>
  )
}

/* ─── Data ────────────────────────────────────────────────────────── */

const TRUST_BADGES: { icon: LucideIcon; label: string }[] = [
  { icon: Flag, label: 'UK GDPR Compliant' },
  { icon: Lock, label: 'Encrypted at Rest & In Transit' },
  { icon: Scale, label: 'SOC 2 Aligned' },
  { icon: Server, label: '99.9% Uptime' },
]

const SECURITY_FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Lock,
    title: 'Data Encryption',
    description:
      'All data is encrypted in transit using TLS 1.2+ and at rest using AES-256 encryption. Every connection to the platform is served over HTTPS — no exceptions.',
  },
  {
    icon: Building2,
    title: 'Tenant Isolation',
    description:
      'Every bureau\'s data is completely separated at the database level. Row-level security policies ensure no cross-tenant access — even in the event of a software bug.',
  },
  {
    icon: KeyRound,
    title: 'Access Control & Authentication',
    description:
      'Strong password requirements, email verification, and company email enforcement. Session tokens refresh automatically and expire after inactivity. Admin roles control visibility.',
  },
  {
    icon: FileSearch,
    title: 'Audit Trail',
    description:
      'Every change to client records, payroll configurations, and settings is logged with who made the change, what changed, and when. Export audit reports for compliance reviews.',
  },
  {
    icon: Activity,
    title: 'Infrastructure & Monitoring',
    description:
      'Hosted on enterprise-grade cloud infrastructure with automatic failover. Real-time error monitoring, uptime tracking, and performance analytics keep us ahead of issues.',
  },
  {
    icon: ShieldCheck,
    title: 'API & Request Protection',
    description:
      'Every API request is authenticated and rate-limited. Cross-site request forgery protection on every form. Webhook signatures verified cryptographically. Disposable emails blocked.',
  },
]

const DATA_PRINCIPLES = [
  {
    title: 'Your data, your control',
    description:
      'Export all your data anytime in JSON or CSV format. Delete your account and all associated data permanently from Settings — no questions asked.',
  },
  {
    title: 'We never sell your data',
    description:
      'Your information is used solely to provide the service. We do not share data with third parties for marketing, analytics, or any other purpose.',
  },
  {
    title: 'UK data residency',
    description:
      'Data is stored in EU/UK data centres in compliance with UK GDPR and the Data Protection Act 2018. Your clients\' payroll data never leaves regulated jurisdictions.',
  },
  {
    title: 'Minimal data collection',
    description:
      'We only collect what\'s necessary to run the service. No invasive tracking, no unnecessary cookies, no behavioural profiling.',
  },
]

const PRACTICES = [
  'Automated dependency security audits on every build',
  'Content Security Policy, HSTS, and clickjacking protection headers on every response',
  'Source code never exposed to end users — source maps removed in production',
  'Secrets managed via encrypted environment variables — never hardcoded',
  'Continuous error monitoring with real-time alerting',
  'Rate limiting on all authentication and data mutation endpoints',
  'Regular code reviews with security as a first-class concern',
  'Incident response process documented and tested',
]
