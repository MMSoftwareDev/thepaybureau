// src/app/page.tsx — Marketing landing page (ClickUp-inspired redesign)
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ThePayBureau - Never Miss Another Payroll Deadline',
  description: 'Professional payroll bureau management for UK specialists. Track HMRC deadlines, manage client checklists, auto-enrolment tracking, and pension compliance. Free forever for individuals.',
  alternates: {
    canonical: '/',
  },
}

/* ─── Brand tokens ─── */
const brand = {
  purple: '#401D6C',
  purpleLight: '#5B2D99',
  purpleMuted: '#9B7ED8',
  pink: '#EC385D',
  peach: '#FF8073',
  cream: '#FBF8FF',
  textPrimary: '#1A1225',
  textSecondary: '#5E5470',
  textMuted: '#8E849A',
  border: '#E8E2F0',
} as const

/* ─── Data ─── */

const FEATURES = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
    label: 'CHECKLISTS',
    title: 'Payroll-Specific Checklists',
    desc: 'Pre-built for monthly, weekly, 4-weekly payrolls. Year-end, new starters, leavers — all ready to use.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
    label: 'DEADLINES',
    title: 'HMRC Deadline Intelligence',
    desc: 'Never miss RTI, FPS, EPS deadlines. Auto-calculates based on pay dates and frequencies.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    label: 'DASHBOARD',
    title: 'Client Dashboard',
    desc: "See every client's status instantly. Know who's done, in progress, or needs attention.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    label: 'REPORTS',
    title: 'Manager Reports',
    desc: 'Export professional status reports. Show your efficiency and never miss a deadline.',
  },
]

const BOTTOM_STATS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={brand.purpleMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" />
      </svg>
    ),
    title: '58 seconds',
    desc: 'Average setup time',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={brand.purpleMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22,4 12,14.01 9,11.01" />
      </svg>
    ),
    title: 'Zero missed',
    desc: 'Deadlines reported last month',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={brand.purpleMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    title: '500+',
    desc: 'Bureau specialists this month',
  },
]

const PAIN_POINTS = [
  { text: "Can't remember if you submitted RTI for Smith & Co" },
  { text: 'Manager asking for an update whilst you scramble through 15 spreadsheets' },
  { text: "3am wake-ups wondering if you missed someone's payroll" },
  { text: 'Getting client calls asking where their payslips are' },
  { text: 'Racing against HMRC deadlines with no clear overview' },
  { text: 'Spending hours updating multiple spreadsheets for the same information' },
]

const NEW_REALITY = [
  {
    title: 'Monday Morning',
    subtitle: "See all week's payrolls at a glance",
    desc: 'Know exactly what needs doing and when',
  },
  {
    title: 'Client Calls',
    subtitle: 'Answer their questions in seconds',
    desc: 'Look professional with instant access to their status',
  },
  {
    title: 'Manager Update',
    subtitle: 'Show professional dashboard',
    desc: 'Get complimented on your organisation',
  },
  {
    title: 'Year-End Chaos',
    subtitle: 'Everything already tracked and ready',
    desc: "Whilst others panic, you're already done",
  },
]

const STEPS = [
  { time: '0-30 seconds', title: 'Instant Access to Your Dashboard', desc: 'Clean, professional interface ready to use. No complex setup or training needed.' },
  { time: '30-45 seconds', title: 'Add Your First Client', desc: 'Enter client name, payroll frequency, next pay date. System auto-generates all deadlines.' },
  { time: '45-60 seconds', title: "See Tomorrow's Deadlines", desc: 'Immediately see what needs doing. Start checking off tasks. Feel organised instantly.' },
  { time: 'Next day', title: 'Import All Your Clients', desc: 'Bulk import from your spreadsheet. Watch your entire workload become manageable.' },
]

const TESTIMONIALS = [
  {
    quote: 'Last month, my manager asked for a status update during a client call. I pulled up my dashboard and had the answer in 5 seconds. She was amazed.',
    name: 'Jane Davies',
    detail: '47 clients, Birmingham Bureau',
    initials: 'JD',
  },
  {
    quote: 'Used to wake up at night worrying about RTI deadlines. Now I check my dashboard once in the morning and I\'m done. My stress levels have dropped massively.',
    name: 'Michael Singh',
    detail: '32 clients, London',
    initials: 'MS',
  },
  {
    quote: "Bureau owner asked how I manage 68 clients without missing deadlines. Showed him this tool. Now the whole bureau is switching over and I'm getting the credit!",
    name: 'Rachel Thompson',
    detail: '68 clients, Manchester',
    initials: 'RT',
  },
]

const DASHBOARD_ROWS = [
  { client: 'Miller & Associates', status: 'OVERDUE', statusColor: '#EF4444', due: 'Yesterday!' },
  { client: 'Brighton Care', status: 'DUE SOON', statusColor: '#F59E0B', due: 'Tomorrow' },
  { client: 'Clearview Dental', status: 'PROCESSING', statusColor: brand.purpleLight, due: 'Today' },
  { client: 'Johnson Engineering', status: 'COMPLETE', statusColor: '#188038', due: 'Done' },
  { client: 'Thompson Logistics', status: 'ON TRACK', statusColor: '#188038', due: '31st Jan' },
]

/* ─── Reusable sub-components ─── */

/** Faux browser chrome wrapper for mockup screenshots */
function MockupWindow({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] border overflow-hidden ${className}`} style={{ borderColor: brand.border }}>
      {/* Title bar */}
      <div className="px-5 py-3.5 border-b flex items-center gap-3" style={{ borderColor: brand.border, background: brand.cream }}>
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
          <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
          <span className="w-3 h-3 rounded-full bg-[#28C840]" />
        </div>
        <span className="text-sm font-semibold" style={{ color: brand.textPrimary, fontFamily: 'var(--font-inter)' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

/* ─── Page ─── */

export default function LandingPage() {
  return (
    <div className="overflow-x-clip w-screen bg-white" style={{ fontFamily: 'var(--font-body), Plus Jakarta Sans, system-ui, sans-serif' }}>

      {/* ═══ NAVBAR ═══ */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b" style={{ borderColor: brand.border }}>
        <div className="max-w-[1440px] mx-auto px-5 h-[72px] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="ThePayBureau" width={36} height={36} className="h-9 w-9" />
            <span className="text-lg font-bold tracking-tight hidden sm:inline" style={{ color: brand.textPrimary, fontFamily: 'var(--font-body)' }}>
              ThePayBureau
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-100"
              style={{ color: brand.textPrimary, fontFamily: 'var(--font-inter)' }}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold text-white rounded-xl hover:opacity-90 transition-opacity duration-100"
              style={{ background: brand.purple, fontFamily: 'var(--font-inter)' }}
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ HERO SECTION ═══ */}
      <section className="relative w-full pt-20 pb-0 md:pt-24">
        {/* Subtle brand gradient wash */}
        <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, white, ${brand.cream}, white)` }} />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Eyebrow badge */}
          <div className="animated-border-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold mb-6" style={{ background: brand.cream, color: brand.textPrimary, fontFamily: 'var(--font-inter)' }}>
            <span className="relative z-[2] flex items-center gap-1">
              For Bureau Owners &amp; Specialists
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12l4-4-4-4" stroke={brand.purpleLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </div>

          {/* Main title — DM Serif Display for display heading */}
          <h1 className="gradient-text-hero max-w-[760px] mx-auto mb-6 px-5 md:px-0 font-bold text-[40px] md:text-[76px] leading-[1.05] tracking-[-0.04em]" style={{ fontFamily: 'var(--font-display), DM Serif Display, serif' }}>
            Never Miss Another Payroll Deadline
          </h1>

          {/* Subtitle */}
          <p className="max-w-[560px] mx-auto mb-8 px-5 text-base md:text-lg leading-relaxed" style={{ color: brand.textSecondary, fontFamily: 'var(--font-inter)' }}>
            The professional dashboard for UK payroll specialists. Track HMRC deadlines, manage clients, and stay compliant — all in one place.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-center mb-14">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center h-12 px-6 rounded-xl text-white font-semibold text-lg tracking-tight hover:opacity-90 transition-opacity duration-100"
              style={{ background: brand.purple, fontFamily: 'var(--font-inter)', letterSpacing: '-0.36px' }}
            >
              Start Organising My Payrolls
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-1 px-5 py-3 rounded-lg font-semibold text-sm transition-colors duration-100"
              style={{ background: brand.cream, color: brand.textPrimary, fontFamily: 'var(--font-inter)' }}
            >
              Learn more
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 12l4-4-4-4" stroke={brand.purpleLight} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>
        </div>

        {/* ── Hero mockup: Main Dashboard ── */}
        <div className="relative z-[9] max-w-[1440px] mx-auto px-5">
          <div className="relative overflow-hidden rounded-none md:rounded-[0_0_40px_40px] h-auto" style={{ background: `linear-gradient(to bottom, transparent, ${brand.cream})` }}>
            <div className="noise-overlay absolute inset-0 opacity-30" />

            <div className="relative z-10 max-w-[1000px] mx-auto px-4 py-10 md:py-16">
              <MockupWindow title="Payroll Status Dashboard">
                {/* Status bar */}
                <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: brand.border }}>
                  <div className="flex items-center gap-2">
                    <Image src="/logo.png" alt="" width={20} height={20} className="h-5 w-5 opacity-60" />
                    <span className="text-xs font-medium" style={{ color: brand.textMuted }}>March 2026</span>
                  </div>
                  <span className="text-xs font-semibold text-[#188038] bg-[#E6F9ED] px-2.5 py-0.5 rounded-full">All Systems Live</span>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 md:grid-cols-4 border-b" style={{ borderColor: brand.border }}>
                  {[
                    { n: '12', label: 'Complete', color: '#188038' },
                    { n: '3', label: 'In Progress', color: brand.purpleLight },
                    { n: '2', label: 'Due Soon', color: '#F59E0B' },
                    { n: '1', label: 'Overdue', color: '#D93025' },
                  ].map((s) => (
                    <div key={s.label} className="px-4 py-3.5 text-center border-r last:border-r-0" style={{ borderColor: brand.border }}>
                      <div className="text-2xl font-extrabold" style={{ color: s.color }}>{s.n}</div>
                      <div className="text-xs font-medium" style={{ color: brand.textMuted }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Table */}
                <div className="hidden md:block">
                  <div className="grid grid-cols-[1fr_auto_auto] px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider border-b" style={{ color: brand.textMuted, borderColor: brand.border }}>
                    <span>Client</span>
                    <span>Status</span>
                    <span className="text-right">Due</span>
                  </div>
                  {DASHBOARD_ROWS.map((row) => (
                    <div key={row.client} className="grid grid-cols-[1fr_auto_auto] px-5 py-3 text-sm border-b items-center" style={{ borderColor: `${brand.border}80` }}>
                      <span className="font-semibold" style={{ color: brand.textPrimary }}>{row.client}</span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-md" style={{ color: row.statusColor, background: `${row.statusColor}12` }}>{row.status}</span>
                      <span className="text-sm text-right ml-4" style={{ color: brand.textSecondary }}>{row.due}</span>
                    </div>
                  ))}
                </div>
              </MockupWindow>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SOFTWARE PREVIEW: Client Management ═══ */}
      <section className="relative w-full py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-center">
            {/* Text */}
            <div className="md:w-[40%] text-center md:text-left">
              <span className="mono-accent text-xs font-semibold tracking-wider" style={{ color: brand.purpleLight }}>CLIENT MANAGEMENT</span>
              <h2 className="mt-3 font-bold text-[28px] md:text-[40px] leading-[1.15] tracking-[-0.03em]" style={{ color: brand.textPrimary, fontFamily: 'var(--font-display), DM Serif Display, serif' }}>
                Every Client, One View
              </h2>
              <p className="mt-4 text-base leading-relaxed" style={{ color: brand.textSecondary, fontFamily: 'var(--font-inter)' }}>
                Add clients in seconds. Set their payroll frequency, pay date, and pension details. The system auto-generates every deadline and checklist for you.
              </p>
            </div>

            {/* Mockup */}
            <div className="md:w-[60%]">
              <MockupWindow title="Client Management" className="hover-lift">
                <div className="p-5">
                  {/* Search bar */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: brand.border, background: brand.cream }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={brand.textMuted} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                      <span className="text-sm" style={{ color: brand.textMuted }}>Search clients...</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: brand.purple }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                      Add Client
                    </div>
                  </div>

                  {/* Client cards */}
                  {[
                    { name: 'Miller & Associates', freq: 'Monthly', employees: 24, nextPay: '28th Mar', status: 'On Track', sColor: '#188038' },
                    { name: 'Brighton Care', freq: 'Weekly', employees: 156, nextPay: '14th Mar', status: 'Due Soon', sColor: '#F59E0B' },
                    { name: 'Clearview Dental', freq: '4-Weekly', employees: 12, nextPay: '21st Mar', status: 'Processing', sColor: brand.purpleLight },
                  ].map((c) => (
                    <div key={c.name} className="flex items-center justify-between py-3.5 border-b last:border-b-0" style={{ borderColor: `${brand.border}80` }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${brand.purple}, ${brand.purpleLight})` }}>
                          {c.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: brand.textPrimary }}>{c.name}</p>
                          <p className="text-xs" style={{ color: brand.textMuted }}>{c.freq} &middot; {c.employees} employees</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: brand.textMuted }}>Next: {c.nextPay}</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ color: c.sColor, background: `${c.sColor}14` }}>{c.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </MockupWindow>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DARK FEATURE SECTION (Brain-style) ═══ */}
      <section id="features" className="relative w-full max-w-[1440px] mx-auto px-0 md:px-5 mt-0 md:mt-5">
        <div className="relative flex flex-col items-center overflow-hidden rounded-none md:rounded-[32px]" style={{ background: brand.textPrimary }}>
          {/* Noise overlay */}
          <div className="noise-overlay absolute inset-0 z-0 opacity-30" />

          {/* Dot patterns */}
          <div className="dot-pattern absolute top-[-128px] left-1/2 -translate-x-1/2 w-[305px] h-[434px] opacity-10 hidden md:block" />
          <div className="dot-pattern absolute top-[500px] right-5 w-[305px] h-[434px] opacity-10 hidden md:block" />

          {/* Glow effects — brand purple */}
          <div className="absolute top-[300px] -left-[400px] w-[487px] h-[487px] rounded-full opacity-40 hidden md:block" style={{ background: `radial-gradient(50% 50% at 50% 50%, ${brand.purpleLight}30 0%, transparent 100%)`, filter: 'blur(200px)' }} />
          <div className="absolute -top-[100px] -right-[200px] w-[487px] h-[487px] rounded-full opacity-40 hidden md:block" style={{ background: `radial-gradient(50% 50% at 50% 50%, ${brand.pink}20 0%, transparent 100%)`, filter: 'blur(200px)' }} />

          {/* Inner content */}
          <div className="relative z-10 flex flex-col gap-6 items-center w-full max-w-[1080px] px-5 py-20 md:py-32">
            {/* Header */}
            <div className="flex flex-col gap-6 items-center w-full max-w-[754px] mb-10">
              <p className="text-[#eee] font-extrabold text-[26px] text-center leading-[112%] tracking-[-1.3px]" style={{ fontFamily: 'var(--font-body)' }}>
                Built for Payroll Specialists
              </p>
              <h2 className="gradient-text-dark font-bold text-[40px] md:text-[76px] leading-[105%] tracking-[-0.04em] text-center pb-2" style={{ fontFamily: 'var(--font-display), DM Serif Display, serif' }}>
                Everything You Actually Need
              </h2>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center h-12 px-5 rounded-xl bg-white font-[650] text-lg cursor-pointer border-0 hover:opacity-90 transition-opacity duration-100"
                style={{ color: brand.purple, fontFamily: 'var(--font-inter)', letterSpacing: '-0.36px' }}
              >
                Get Started Free
              </Link>
            </div>

            {/* Feature cards grid */}
            <div className="flex flex-col md:flex-row gap-5 items-stretch w-full">
              {FEATURES.slice(0, 2).map((f) => (
                <div key={f.title} className="glass-card-dark rounded-3xl flex-1 flex flex-col justify-between">
                  <div className="px-8 pt-10 md:px-10 md:pt-10 flex flex-col gap-3">
                    <div className="flex gap-1.5 items-center">
                      <span style={{ color: brand.purpleMuted }}>{f.icon}</span>
                      <span className="mono-accent text-base font-medium leading-5" style={{ color: brand.purpleMuted }}>{f.label}</span>
                    </div>
                    <h3 className="text-[#eee] text-[26px] font-[650] leading-[125%] tracking-[-0.91px]">{f.title}</h3>
                    <p className="text-[#b4b4b4] text-base leading-6 tracking-[-0.32px] pb-10" style={{ fontFamily: 'var(--font-inter)' }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-5 items-stretch w-full">
              {FEATURES.slice(2, 4).map((f) => (
                <div key={f.title} className="glass-card-dark rounded-3xl flex-1 flex flex-col justify-between">
                  <div className="px-8 pt-10 md:px-10 md:pt-10 flex flex-col gap-3">
                    <div className="flex gap-1.5 items-center">
                      <span style={{ color: brand.purpleMuted }}>{f.icon}</span>
                      <span className="mono-accent text-base font-medium leading-5" style={{ color: brand.purpleMuted }}>{f.label}</span>
                    </div>
                    <h3 className="text-[#eee] text-[26px] font-[650] leading-[125%] tracking-[-0.91px]">{f.title}</h3>
                    <p className="text-[#b4b4b4] text-base leading-6 tracking-[-0.32px] pb-10" style={{ fontFamily: 'var(--font-inter)' }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Auto-Enrolment card with Pension Tracker mockup */}
            <div className="glass-card-dark rounded-3xl w-full">
              <div className="relative flex flex-col md:flex-row items-stretch justify-between overflow-hidden">
                <div className="flex flex-col gap-4 items-start p-8 md:p-14 md:w-1/2">
                  <div className="flex gap-1.5 items-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={brand.purpleMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
                    <span className="mono-accent text-base font-medium" style={{ color: brand.purpleMuted }}>AUTO-ENROLMENT</span>
                  </div>
                  <h3 className="text-[#eee] text-[26px] font-[650] leading-[125%] tracking-[-0.91px] mb-2">
                    Auto-Enrolment &amp; Pension Tracking
                  </h3>
                  <p className="text-[#b4b4b4] text-lg leading-6 tracking-[-0.36px]" style={{ fontFamily: 'var(--font-inter)' }}>
                    Track postponement dates, opt-outs, and re-enrolment cycles for every client. Plus client notes for special pay arrangements, director&apos;s NI, and irregular patterns.
                  </p>
                </div>
                {/* Pension mockup on right */}
                <div className="md:w-1/2 p-5 md:p-8 flex items-center">
                  <div className="w-full rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                      <span className="text-xs font-semibold text-white/70" style={{ fontFamily: 'var(--font-inter)' }}>Pension Declarations</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded text-[#188038] bg-[#188038]/20">3 On Track</span>
                    </div>
                    {[
                      { client: 'Miller & Associates', ae: 'Active', reEnrol: '12 Jun 2026', color: '#188038' },
                      { client: 'Brighton Care', ae: 'Postponed', reEnrol: '01 Apr 2026', color: '#F59E0B' },
                      { client: 'Johnson Engineering', ae: 'Active', reEnrol: '30 Sep 2026', color: '#188038' },
                    ].map((p) => (
                      <div key={p.client} className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 last:border-b-0">
                        <span className="text-xs text-white/80 font-medium">{p.client}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: p.color, background: `${p.color}20` }}>{p.ae}</span>
                          <span className="text-[10px] text-white/40">Re-enrol: {p.reEnrol}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom stats */}
            <div className="flex flex-col sm:flex-row gap-px items-stretch w-full relative">
              <div className="absolute top-0 left-0 right-0 h-px z-[1]" style={{ background: `radial-gradient(ellipse, ${brand.purpleLight}40 40%, transparent 100%)` }} />
              {BOTTOM_STATS.map((stat, i) => (
                <div key={stat.title} className="flex-1 flex flex-col gap-3 items-center py-8 px-6 relative">
                  {i === 1 && (
                    <div className="hidden md:block absolute inset-0 pointer-events-none" style={{
                      background: `linear-gradient(90deg,${brand.purpleLight}30,${brand.purpleLight}30) top/100% 1px no-repeat, linear-gradient(180deg,${brand.purpleLight}30,${brand.purpleLight}30 50%,transparent) 100%/1px 100% no-repeat, linear-gradient(180deg,${brand.purpleLight}30,${brand.purpleLight}30 50%,transparent) 0/1px 100% no-repeat`,
                    }} />
                  )}
                  {stat.icon}
                  <div className="flex flex-col gap-1 items-center">
                    <span className="text-[#eee] font-semibold text-lg leading-6 tracking-[-0.36px] text-center" style={{ fontFamily: 'var(--font-inter)' }}>{stat.title}</span>
                    <span className="text-[#b4b4b4] font-normal text-base leading-[22px] tracking-[-0.32px] text-center" style={{ fontFamily: 'var(--font-inter)' }}>{stat.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SOFTWARE PREVIEW: Deadline Tracker ═══ */}
      <section className="relative w-full py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex flex-col md:flex-row-reverse gap-10 md:gap-16 items-center">
            {/* Text */}
            <div className="md:w-[40%] text-center md:text-left">
              <span className="mono-accent text-xs font-semibold tracking-wider" style={{ color: brand.pink }}>DEADLINE TRACKING</span>
              <h2 className="mt-3 font-bold text-[28px] md:text-[40px] leading-[1.15] tracking-[-0.03em]" style={{ color: brand.textPrimary, fontFamily: 'var(--font-display), DM Serif Display, serif' }}>
                HMRC Deadlines, Sorted
              </h2>
              <p className="mt-4 text-base leading-relaxed" style={{ color: brand.textSecondary, fontFamily: 'var(--font-inter)' }}>
                Every RTI, FPS, and EPS deadline auto-calculated from your pay dates. Colour-coded traffic lights so you never miss a submission.
              </p>
            </div>

            {/* Mockup */}
            <div className="md:w-[60%]">
              <MockupWindow title="Upcoming Deadlines" className="hover-lift">
                <div className="p-5">
                  {/* Timeline */}
                  {[
                    { day: 'Today', items: [
                      { time: '11:59 PM', task: 'FPS Submission — Brighton Care', urgency: 'NOW', uColor: '#D93025' },
                    ]},
                    { day: 'Tomorrow', items: [
                      { time: '11:59 PM', task: 'RTI Submission — Miller & Associates', urgency: 'DUE SOON', uColor: '#F59E0B' },
                      { time: '11:59 PM', task: 'EPS Submission — Thompson Logistics', urgency: 'DUE SOON', uColor: '#F59E0B' },
                    ]},
                    { day: 'Thu 13 Mar', items: [
                      { time: 'All Day', task: 'Pension Declaration — Clearview Dental', urgency: 'SCHEDULED', uColor: brand.purpleLight },
                    ]},
                    { day: 'Fri 14 Mar', items: [
                      { time: '11:59 PM', task: 'FPS Submission — Johnson Engineering', urgency: 'ON TRACK', uColor: '#188038' },
                    ]},
                  ].map((group) => (
                    <div key={group.day} className="mb-4 last:mb-0">
                      <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: brand.textMuted }}>{group.day}</div>
                      {group.items.map((item) => (
                        <div key={item.task} className="flex items-center justify-between py-2.5 px-3 rounded-lg mb-1 last:mb-0" style={{ background: brand.cream }}>
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.uColor }} />
                            <div>
                              <p className="text-sm font-medium" style={{ color: brand.textPrimary }}>{item.task}</p>
                              <p className="text-xs" style={{ color: brand.textMuted }}>{item.time}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: item.uColor, background: `${item.uColor}14` }}>{item.urgency}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </MockupWindow>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PAIN POINTS ═══ */}
      <section className="relative w-full py-20 md:py-24" style={{ background: brand.cream }}>
        <div className="dot-pattern-dark absolute inset-0 opacity-30" />
        <div className="relative max-w-[900px] mx-auto px-5 text-center">
          <div className="flex flex-col items-center gap-6 mb-14">
            <span className="mono-accent text-sm font-semibold tracking-wider" style={{ color: brand.pink }}>THE DAILY STRUGGLE</span>
            <h2 className="font-bold text-[32px] md:text-[56px] leading-[1.1] tracking-[-0.03em]" style={{ color: brand.textPrimary, fontFamily: 'var(--font-display), DM Serif Display, serif' }}>
              Sound Familiar?
            </h2>
            <p className="text-base md:text-lg max-w-[480px]" style={{ color: brand.textMuted, fontFamily: 'var(--font-inter)' }}>
              Every payroll specialist knows these moments of panic...
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PAIN_POINTS.map((p) => (
              <div key={p.text} className="glass-card-light rounded-2xl p-6 text-left flex gap-4 items-start hover-lift">
                <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `${brand.pink}14` }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={brand.pink} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                </span>
                <span className="text-[15px] leading-relaxed" style={{ color: brand.textSecondary, fontFamily: 'var(--font-inter)' }}>{p.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SOFTWARE PREVIEW: Checklist View ═══ */}
      <section className="relative w-full py-16 md:py-24">
        <div className="max-w-[1200px] mx-auto px-5">
          <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-center">
            {/* Text */}
            <div className="md:w-[40%] text-center md:text-left">
              <span className="mono-accent text-xs font-semibold tracking-wider" style={{ color: brand.peach }}>CHECKLISTS</span>
              <h2 className="mt-3 font-bold text-[28px] md:text-[40px] leading-[1.15] tracking-[-0.03em]" style={{ color: brand.textPrimary, fontFamily: 'var(--font-display), DM Serif Display, serif' }}>
                Tick Off Every Step
              </h2>
              <p className="mt-4 text-base leading-relaxed" style={{ color: brand.textSecondary, fontFamily: 'var(--font-inter)' }}>
                Pre-built checklists for every payroll cycle. Monthly, weekly, 4-weekly — including year-end, new starters, and leavers. Never forget a step.
              </p>
            </div>

            {/* Mockup */}
            <div className="md:w-[60%]">
              <MockupWindow title="Payroll Checklist — Miller & Associates" className="hover-lift">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: brand.textMuted }}>Monthly Payroll • March 2026</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: brand.border }}>
                        <div className="h-full rounded-full" style={{ width: '60%', background: `linear-gradient(90deg, ${brand.purple}, ${brand.purpleLight})` }} />
                      </div>
                      <span className="text-xs font-bold" style={{ color: brand.purpleLight }}>60%</span>
                    </div>
                  </div>

                  {[
                    { task: 'Collect timesheets and absence records', done: true },
                    { task: 'Process starters (P45 / starter checklist)', done: true },
                    { task: 'Process leavers (P45, final pay calculation)', done: true },
                    { task: 'Calculate statutory payments (SSP, SMP, SPP)', done: false },
                    { task: 'Run payroll calculation and review', done: false },
                    { task: 'Submit FPS to HMRC', done: false },
                    { task: 'Send payslips to employees', done: false },
                    { task: 'Process pension contributions', done: false },
                  ].map((item) => (
                    <div key={item.task} className="flex items-center gap-3 py-2.5 border-b last:border-b-0" style={{ borderColor: `${brand.border}80` }}>
                      <div className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: item.done ? '#188038' : brand.border, background: item.done ? '#188038' : 'transparent' }}>
                        {item.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <span className="text-sm" style={{ color: item.done ? brand.textMuted : brand.textPrimary, textDecoration: item.done ? 'line-through' : 'none', fontFamily: 'var(--font-inter)' }}>{item.task}</span>
                    </div>
                  ))}
                </div>
              </MockupWindow>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ NEW REALITY ═══ */}
      <section className="relative w-full py-20 md:py-24" style={{ background: brand.cream }}>
        <div className="dot-pattern-dark absolute inset-0 opacity-40" />
        <div className="relative max-w-[1000px] mx-auto px-5 text-center">
          <div className="flex flex-col items-center gap-6 mb-14">
            <span className="mono-accent text-sm font-semibold tracking-wider" style={{ color: brand.purpleLight }}>YOUR NEW REALITY</span>
            <h2 className="font-bold text-[32px] md:text-[56px] leading-[1.1] tracking-[-0.03em]" style={{ color: brand.textPrimary, fontFamily: 'var(--font-display), DM Serif Display, serif' }}>
              This Could Be Your Day
            </h2>
            <p className="text-base md:text-lg max-w-[480px]" style={{ color: brand.textMuted, fontFamily: 'var(--font-inter)' }}>
              How organised payroll specialists work
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {NEW_REALITY.map((item) => (
              <div key={item.title} className="glass-card-light rounded-2xl p-7 text-left hover-lift">
                <h3 className="text-sm font-bold mb-2 uppercase tracking-wide" style={{ color: brand.purpleLight }}>{item.title}</h3>
                <p className="text-base font-semibold mb-1" style={{ color: brand.textPrimary }}>{item.subtitle}</p>
                <p className="text-sm" style={{ color: brand.textMuted, fontFamily: 'var(--font-inter)' }}>{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Recognition callout — dark card */}
          <div className="relative mt-14 overflow-hidden rounded-3xl text-white" style={{ background: brand.textPrimary }}>
            <div className="noise-overlay absolute inset-0 opacity-20" />
            <div className="relative z-10 p-10 md:p-14">
              <h3 className="gradient-text-dark text-[24px] md:text-[32px] font-bold tracking-[-0.03em] mb-4 pb-1" style={{ fontFamily: 'var(--font-display), DM Serif Display, serif' }}>
                When Your Manager Sees How Organised You Are...
              </h3>
              <p className="text-[#b4b4b4] text-base max-w-[560px] mx-auto mb-8 leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>
                They&apos;ll want the whole bureau on this system. When that happens, you&apos;ll be recognised as the one who brought positive change.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-w-[800px] mx-auto">
                {[
                  { text: 'Be seen as a problem-solver' },
                  { text: 'Stand out at reviews' },
                  { text: 'Get noticed by management' },
                  { text: 'Handle more, stress less' },
                ].map((b) => (
                  <div key={b.text} className="glass-card-dark rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: brand.purpleMuted }} />
                    <span className="text-sm font-semibold text-[#eee]">{b.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="relative w-full py-20 md:py-24">
        <div className="max-w-[800px] mx-auto px-5 text-center">
          <div className="flex flex-col items-center gap-6 mb-14">
            <span className="mono-accent text-sm font-semibold tracking-wider" style={{ color: brand.purpleLight }}>QUICK START</span>
            <h2 className="font-bold text-[32px] md:text-[56px] leading-[1.1] tracking-[-0.03em]" style={{ color: brand.textPrimary, fontFamily: 'var(--font-display), DM Serif Display, serif' }}>
              Set Up in 60 Seconds
            </h2>
            <p className="text-base md:text-lg" style={{ color: brand.textMuted, fontFamily: 'var(--font-inter)' }}>
              Be organised in literally one minute
            </p>
          </div>

          <div className="flex flex-col gap-0">
            {STEPS.map((step, i) => (
              <div key={step.title} className="flex gap-6 text-left py-7 items-start" style={{ borderBottom: i < STEPS.length - 1 ? `1px solid ${brand.border}` : 'none' }}>
                <div className="w-11 h-11 rounded-full text-white flex items-center justify-center font-extrabold text-base flex-shrink-0" style={{ background: brand.purple }}>
                  {i + 1}
                </div>
                <div>
                  <p className="mono-accent text-xs font-semibold mb-1" style={{ color: brand.purpleLight }}>{step.time}</p>
                  <h3 className="text-base font-bold mb-1.5" style={{ color: brand.textPrimary }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: brand.textMuted, fontFamily: 'var(--font-inter)' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="relative w-full py-20 md:py-24" style={{ background: brand.cream }}>
        <div className="dot-pattern-dark absolute inset-0 opacity-20" />
        <div className="relative max-w-[1000px] mx-auto px-5 text-center">
          <div className="flex flex-col items-center gap-6 mb-14">
            <span className="mono-accent text-sm font-semibold tracking-wider" style={{ color: brand.purpleLight }}>REAL STORIES</span>
            <h2 className="font-bold text-[32px] md:text-[56px] leading-[1.1] tracking-[-0.03em]" style={{ color: brand.textPrimary, fontFamily: 'var(--font-display), DM Serif Display, serif' }}>
              From Chaos to Control
            </h2>
            <p className="text-base md:text-lg" style={{ color: brand.textMuted, fontFamily: 'var(--font-inter)' }}>
              How payroll specialists transformed their work life
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="glass-card-light rounded-3xl p-7 text-left hover-lift">
                <div className="text-3xl mb-3" style={{ color: brand.border }}>&ldquo;</div>
                <p className="text-[15px] leading-relaxed mb-6" style={{ color: brand.textSecondary, fontFamily: 'var(--font-inter)' }}>{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${brand.purple}, ${brand.pink})` }}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: brand.textPrimary }}>{t.name}</p>
                    <p className="text-xs" style={{ color: brand.textMuted }}>{t.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA (ClickUp AI CTA style) ═══ */}
      <section className="w-full max-w-[1440px] mx-auto px-0 md:px-5 py-0 md:py-5">
        <div className="relative overflow-hidden rounded-none md:rounded-[32px] cta-gradient-bg flex flex-col items-center">
          {/* Noise */}
          <div className="noise-overlay absolute inset-0 z-[1] opacity-20" />

          {/* Content */}
          <div className="relative z-[2] flex flex-col gap-8 items-center py-12 md:py-14 px-5">
            {/* Icon */}
            <div className="w-[80px] h-[80px] md:w-[100px] md:h-[100px] p-4 rounded-[22px] md:rounded-[28px] bg-white flex items-center justify-center" style={{ boxShadow: `inset 0 0 4px 0 #fff, inset 0 -5px 14px -2px ${brand.purpleLight}AA, 0 22px 13px rgba(27,23,84,0.08), 0 10px 10px rgba(27,23,84,0.13), 0 2px 5px rgba(27,23,84,0.15)` }}>
              <Image src="/logo.png" alt="ThePayBureau" width={68} height={68} className="object-contain w-full h-full" />
            </div>

            {/* Text */}
            <h2 className="text-white font-bold text-[36px] md:text-[60px] leading-[110%] tracking-[-0.035em] text-center max-w-[600px]" style={{ fontFamily: 'var(--font-display), DM Serif Display, serif' }}>
              Ready to Impress Your Manager?
            </h2>

            {/* CTA Button */}
            <Link
              href="/signup"
              className="inline-flex items-center justify-center h-12 px-5 rounded-xl bg-white font-bold text-lg tracking-tight border-0 hover:bg-white/90 transition-opacity duration-100"
              style={{ color: brand.purple, fontFamily: 'var(--font-inter)', letterSpacing: '-0.72px' }}
            >
              Start Organising My Payrolls Now
            </Link>

            <p className="text-sm text-white/50 text-center max-w-[500px]" style={{ fontFamily: 'var(--font-inter)' }}>
              60-second setup &bull; No credit card &bull; Free forever for individuals &bull; Professional email required
            </p>
          </div>

          {/* Mockup preview (desktop only) */}
          <div className="relative z-[2] overflow-hidden px-10 md:px-24 hidden md:block" style={{ mask: 'linear-gradient(180deg, #000 0, #000 80%, transparent 110%)' }}>
            <div className="relative p-[7px] pt-[7px] pb-0 border border-white/40 rounded-t-[18px] bg-white/20 backdrop-blur-sm">
              <div className="bg-white rounded-t-[12px] overflow-hidden">
                <div className="px-5 py-3 border-b flex items-center justify-between" style={{ background: brand.cream, borderColor: brand.border }}>
                  <div className="flex items-center gap-2">
                    <Image src="/logo.png" alt="" width={16} height={16} className="h-4 w-4 opacity-60" />
                    <span className="text-xs font-bold" style={{ color: brand.textPrimary }}>Payroll Status Dashboard</span>
                  </div>
                  <span className="text-[10px] font-semibold text-[#188038] bg-[#E6F9ED] px-2 py-0.5 rounded-full">Live</span>
                </div>
                <div className="grid grid-cols-4 border-b" style={{ borderColor: brand.border }}>
                  {[
                    { n: '12', label: 'Complete', color: '#188038' },
                    { n: '3', label: 'In Progress', color: brand.purpleLight },
                    { n: '2', label: 'Due Soon', color: '#F59E0B' },
                    { n: '1', label: 'Overdue', color: '#D93025' },
                  ].map((s) => (
                    <div key={s.label} className="px-4 py-3 text-center border-r last:border-r-0" style={{ borderColor: brand.border }}>
                      <div className="text-xl font-extrabold" style={{ color: s.color }}>{s.n}</div>
                      <div className="text-[10px] font-medium" style={{ color: brand.textMuted }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {DASHBOARD_ROWS.slice(0, 3).map((row) => (
                  <div key={row.client} className="grid grid-cols-[1fr_auto_auto] px-5 py-2.5 text-sm border-b items-center" style={{ borderColor: `${brand.border}80` }}>
                    <span className="font-semibold text-xs" style={{ color: brand.textPrimary }}>{row.client}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ color: row.statusColor, background: `${row.statusColor}12` }}>{row.status}</span>
                    <span className="text-xs text-right ml-4" style={{ color: brand.textSecondary }}>{row.due}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-white py-8 px-5 border-t" style={{ borderColor: brand.border }}>
        <div className="max-w-[1440px] mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6 flex-wrap justify-center">
              <Link href="/terms" className="text-sm transition-colors hover:opacity-70" style={{ color: brand.textMuted, fontFamily: 'var(--font-inter)' }}>Terms</Link>
              <Link href="/privacy" className="text-sm transition-colors hover:opacity-70" style={{ color: brand.textMuted, fontFamily: 'var(--font-inter)' }}>Privacy</Link>
              <a href="mailto:support@thepaybureau.com" className="text-sm transition-colors hover:opacity-70" style={{ color: brand.textMuted, fontFamily: 'var(--font-inter)' }}>Support</a>
              <Link href="/login" className="text-sm transition-colors hover:opacity-70" style={{ color: brand.textMuted, fontFamily: 'var(--font-inter)' }}>Log in</Link>
            </div>
            <div className="text-center md:text-right">
              <p className="text-xs" style={{ color: brand.border, fontFamily: 'var(--font-inter)' }}>
                &copy; {new Date().getFullYear()} ThePayBureau Ltd. Built by payroll specialists, for payroll specialists.
              </p>
              <p className="text-[11px]" style={{ color: brand.border, fontFamily: 'var(--font-inter)' }}>
                ThePayBureau Ltd — Registered in England and Wales
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
