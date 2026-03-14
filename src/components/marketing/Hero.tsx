import Image from 'next/image'
import { APP_DOMAIN } from '@/lib/domains'
import { HeroBadge } from './HeroBadge'
import { MockupWindow } from './MockupWindow'

const DASHBOARD_ROWS = [
  { client: 'Miller & Associates', status: 'OVERDUE', statusColor: '#EF4444', due: 'Yesterday!' },
  { client: 'Brighton Care', status: 'DUE SOON', statusColor: '#F59E0B', due: 'Tomorrow' },
  { client: 'Clearview Dental', status: 'PROCESSING', statusColor: 'var(--mkt-purple-l)', due: 'Today' },
  { client: 'Johnson Engineering', status: 'COMPLETE', statusColor: '#188038', due: 'Done' },
  { client: 'Thompson Logistics', status: 'ON TRACK', statusColor: '#188038', due: '31st Jan' },
]

/* Avatar stack colours for social proof */
const AVATAR_COLORS = ['#7C5CBF', '#EC385D', '#FF8073', '#188038']

export function Hero() {
  return (
    <section className="relative w-full pt-16 pb-0 md:pt-24 overflow-hidden">
      {/* Subtle gradient bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, var(--mkt-bg) 0%, var(--mkt-bg-alt) 100%)' }}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-[1200px] mx-auto px-5">
        {/* Badge */}
        <HeroBadge>For Bureau Owners &amp; Specialists</HeroBadge>

        {/* Headline — CRM positioning */}
        <h1
          className="max-w-[780px] mx-auto mb-5 font-bold text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[1.08] tracking-[-0.035em]"
          style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-display), DM Serif Display, serif' }}
        >
          The Payroll CRM That Runs{' '}
          <span style={{ color: 'var(--mkt-pink)' }}>Your Bureau</span> For You
        </h1>

        {/* Subtitle — benefit-driven */}
        <p
          className="max-w-[540px] mx-auto mb-8 text-base md:text-[17px] leading-relaxed"
          style={{ color: 'var(--mkt-text-2)', fontFamily: 'var(--font-body)' }}
        >
          Stop juggling spreadsheets. Track every HMRC deadline, manage every client, and tick off every checklist — all from one dashboard. Set up in 60 seconds.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 items-center mb-6">
          <a
            href={`${APP_DOMAIN}/signup`}
            className="inline-flex items-center justify-center h-11 px-6 rounded-lg text-white font-semibold text-[15px] transition-opacity duration-150 hover:opacity-90"
            style={{ background: 'var(--mkt-purple)', fontFamily: 'var(--font-inter)' }}
          >
            Start Free in 60 Seconds
          </a>
          <a
            href="#features"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors duration-150"
            style={{
              background: 'var(--mkt-bg-alt)',
              color: 'var(--mkt-text)',
              fontFamily: 'var(--font-inter)',
              border: '1px solid var(--mkt-border)',
            }}
          >
            See how it works
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>

        {/* Social proof line */}
        <div className="flex items-center gap-3 mb-16">
          {/* Avatar stack */}
          <div className="flex -space-x-2">
            {AVATAR_COLORS.map((color, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: color, borderColor: 'var(--mkt-bg)' }}
              >
                {['JD', 'MS', 'RT', 'AK'][i]}
              </div>
            ))}
            <div
              className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[9px] font-bold"
              style={{ background: 'var(--mkt-bg-alt)', borderColor: 'var(--mkt-bg)', color: 'var(--mkt-text-3)' }}
            >
              +497
            </div>
          </div>
          <span className="text-sm" style={{ color: 'var(--mkt-text-3)', fontFamily: 'var(--font-inter)' }}>
            Trusted by <strong style={{ color: 'var(--mkt-text-2)' }}>500+</strong> UK payroll specialists
          </span>
        </div>

        {/* Product Screenshot Mockup */}
        <div className="w-full max-w-[960px] mx-auto relative">
          {/* Subtle glow behind mockup */}
          <div
            className="absolute inset-0 -inset-x-20 -inset-y-10 rounded-full pointer-events-none blur-3xl opacity-30"
            style={{ background: 'radial-gradient(ellipse at center, var(--mkt-purple), transparent 70%)' }}
          />
          <MockupWindow title="Payroll Status Dashboard" className="relative hover-lift">
            {/* Status bar */}
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--mkt-border)' }}>
              <div className="flex items-center gap-2">
                <Image src="/logo.png" alt="" width={20} height={20} className="h-5 w-5 opacity-60" />
                <span className="text-xs font-medium" style={{ color: 'var(--mkt-text-3)' }}>March 2026</span>
              </div>
              <span className="text-xs font-semibold text-[#188038] bg-[#E6F9ED] dark:bg-[#188038]/20 px-2.5 py-0.5 rounded-full">All Systems Live</span>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 border-b" style={{ borderColor: 'var(--mkt-border)' }}>
              {[
                { n: '12', label: 'Complete', color: '#188038' },
                { n: '3', label: 'In Progress', color: 'var(--mkt-purple-l)' },
                { n: '2', label: 'Due Soon', color: '#F59E0B' },
                { n: '1', label: 'Overdue', color: '#D93025' },
              ].map((s) => (
                <div key={s.label} className="px-4 py-3.5 text-center border-r last:border-r-0" style={{ borderColor: 'var(--mkt-border)' }}>
                  <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.n}</div>
                  <div className="text-xs font-medium" style={{ color: 'var(--mkt-text-3)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="hidden md:block">
              <div
                className="grid grid-cols-[1fr_auto_auto] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider border-b"
                style={{ color: 'var(--mkt-text-3)', borderColor: 'var(--mkt-border)' }}
              >
                <span>Client</span>
                <span>Status</span>
                <span className="text-right">Due</span>
              </div>
              {DASHBOARD_ROWS.map((row) => (
                <div key={row.client} className="grid grid-cols-[1fr_auto_auto] px-5 py-3 text-sm border-b last:border-b-0 items-center" style={{ borderColor: 'color-mix(in srgb, var(--mkt-border) 50%, transparent)' }}>
                  <span className="font-semibold" style={{ color: 'var(--mkt-text)' }}>{row.client}</span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md" style={{ color: row.statusColor, background: `color-mix(in srgb, ${row.statusColor} 10%, transparent)` }}>{row.status}</span>
                  <span className="text-sm text-right ml-4" style={{ color: 'var(--mkt-text-2)' }}>{row.due}</span>
                </div>
              ))}
            </div>
          </MockupWindow>
        </div>
      </div>
    </section>
  )
}
