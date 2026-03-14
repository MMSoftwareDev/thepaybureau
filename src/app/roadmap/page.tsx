import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import {
  SectionHeader,
  HeroBadge,
  HeroStats,
  PhaseCard,
  StatCard,
  SummaryCard,
  QuoteBlock,
  TimelineLayout,
  TimelineRow,
  LegendStrip,
  MarketingFooter,
} from '@/components/marketing'
import { APP_DOMAIN, MARKETING_DOMAIN } from '@/lib/domains'

export const metadata: Metadata = {
  title: 'Product Roadmap — ThePayBureau',
  description:
    "Four phases from solo consultant to enterprise platform. See what's live, what's coming, and what's on the horizon for ThePayBureau.",
  alternates: {
    canonical: `${MARKETING_DOMAIN}/roadmap`,
  },
}

/* ─── Brand tokens ─── */
const brand = {
  purple: '#401D6C',
  pink: '#EC385D',
  peach: '#FF8073',
  cream: '#FBF8FF',
  textPrimary: '#1A1225',
  textSecondary: '#5E5470',
  textMuted: '#8E849A',
  border: '#E8E2F0',
} as const

/* ─── Legend items ─── */
const LEGEND_ITEMS = [
  { color: 'rgba(64,29,108,0.45)', label: 'V1 Free' },
  { color: '#401D6C', label: 'V1 Unlimited' },
  { color: 'rgba(236,56,93,0.5)', label: 'V2 Team' },
  { color: '#EC385D', label: 'V2 Business' },
  { color: '#FF8073', label: 'V3 Enterprise' },
  { color: '#2B0F4E', label: 'Future Vision' },
]

/* ─── Navbar (shared with landing) ─── */
function RoadmapNav() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b" style={{ borderColor: brand.border }}>
      <div className="max-w-[1160px] mx-auto px-10 max-[880px]:px-5 h-[72px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="ThePayBureau" width={36} height={36} className="h-9 w-9" />
          <span className="text-lg font-bold tracking-tight hidden sm:inline" style={{ color: brand.textPrimary }}>
            ThePayBureau
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <a
            href={`${APP_DOMAIN}/login`}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-100"
            style={{ color: brand.textPrimary }}
          >
            Log in
          </a>
          <a
            href={`${APP_DOMAIN}/signup`}
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-bold text-white rounded-xl hover:opacity-90 transition-opacity duration-100"
            style={{ background: brand.purple }}
          >
            Get Started Free
          </a>
        </div>
      </div>
    </nav>
  )
}

export default function RoadmapPage() {
  return (
    <div className="overflow-x-clip w-screen bg-white" style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <RoadmapNav />

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden flex items-center pt-[100px] pb-20 max-[880px]:pt-16 max-[880px]:pb-14" style={{ background: `linear-gradient(135deg, #fdfeff 0%, ${brand.cream} 30%, #ffffff 70%, #fafbfe 100%)` }}>
        {/* Decorative radials */}
        <div className="absolute -top-1/2 -right-[20%] w-full h-[200%] bg-[radial-gradient(ellipse,rgba(64,29,108,0.04)_0%,transparent_60%)] rotate-[15deg] animate-[marketing-float_30s_ease-in-out_infinite] pointer-events-none" />
        <div className="absolute -bottom-[30%] -left-[20%] w-4/5 h-[150%] bg-[radial-gradient(ellipse,rgba(236,56,93,0.03)_0%,transparent_60%)] -rotate-[10deg] animate-[marketing-float_35s_ease-in-out_infinite_reverse] pointer-events-none" />

        <div className="max-w-[1160px] mx-auto px-10 max-[880px]:px-5 relative z-[1]">
          <HeroBadge>Built by Bureau Owners, for Bureau Owners</HeroBadge>

          <h1 className="text-[clamp(2.4rem,4.5vw,3.8rem)] font-extrabold leading-[1.08] tracking-[-0.035em] text-gray-900 mb-[18px]">
            The UK&apos;s First Payroll CRM<br />
            <span className="text-[#EC385D]">Powered by AI.</span>
          </h1>

          <p className="text-[1.05rem] text-gray-500 font-normal leading-[1.7] max-w-[520px] mb-9">
            Purpose-built for payroll consultants and bureaus — designed by someone who has lived the problem every day. Four phases from solo consultant to enterprise platform.
          </p>

          <p className="text-[0.82rem] text-gray-400 font-medium leading-[1.6] mb-8 italic">
            📣 This roadmap evolves with customer and community feedback — your voice shapes what we build next.
          </p>

          <HeroStats
            stats={[
              { value: '4', label: 'Phases' },
              { value: '46', label: 'Features' },
              { value: '2026', label: 'Launch' },
            ]}
          />
        </div>
      </section>

      {/* ═══ LEGEND ═══ */}
      <LegendStrip items={LEGEND_ITEMS} />

      {/* ═══ ROADMAP PHASES ═══ */}
      <section className="py-20 max-[880px]:py-12">
        <div className="max-w-[1160px] mx-auto px-10 max-[880px]:px-5">
          <SectionHeader
            eyebrow="Product Roadmap"
            title="Four Phases. One Vision."
            description="From a free tool every payroll consultant can use today, to the operating system every UK payroll bureau will rely on."
          />

          <TimelineLayout>
            {/* ── V1 ── */}
            <TimelineRow
              node={{ phase: 'v1', label: 'V1' }}
              leftContent={
                <PhaseCard
                  phase="v1"
                  tag="V1 · Available Now"
                  title="Individual<br>Consultant"
                  description="Everything a payroll consultant needs in one place. Replace spreadsheets and missed deadlines with a professional dashboard — free, forever, for individual consultants."
                  priceChip="Free Forever  ·  Unlimited from £9.99/mo"
                  tiers={[
                    {
                      label: 'Free tier — all consultants',
                      tier: 'free',
                      features: ['Client Management', 'Payroll Management', 'Pension Declarations', 'Automated Emails', 'Audit Logs', 'Reporting (Basic)', 'Email Support'],
                    },
                    {
                      label: 'Unlimited only',
                      tier: 'unlimited',
                      features: ['Payroll AI Assistant', 'CPD / Training Log'],
                    },
                  ]}
                />
              }
              rightContent={
                <div className="pt-6 flex justify-center max-[880px]:hidden">
                  <StatCard
                    phase="v1"
                    value={7}
                    label="features free<br>from day one"
                    note="+2 on Unlimited<br>from £9.99/mo"
                  />
                </div>
              }
            />

            {/* ── V2 ── */}
            <TimelineRow
              node={{ phase: 'v2', label: 'V2' }}
              leftContent={
                <div className="pt-6 flex justify-center max-[880px]:hidden">
                  <StatCard
                    phase="v2"
                    value={14}
                    label="bureau &amp; team<br>features unlock"
                    note="Pricing TBC"
                  />
                </div>
              }
              rightContent={
                <PhaseCard
                  phase="v2"
                  tag="V2 · Coming Soon"
                  title="Bureau<br>&amp; Team"
                  description="Built for bureaus that want visibility, control and the commercial tools to run a proper payroll operation. Team management, client health tracking, invoicing, contracts and more."
                  priceChip="Pricing to be confirmed"
                  tiers={[
                    {
                      label: 'Team tier',
                      tier: 'team',
                      features: ['Bureau / Team Dashboard', 'Organisation Chart', 'Insights & Analytics', 'HMRC Auth Dashboard', 'Client Surveys', 'Client Health Scores', 'Priority Support'],
                    },
                    {
                      label: 'Business tier (additional)',
                      tier: 'business',
                      features: ['Time Tracking', 'Client Onboarding', 'Forms', 'Custom Fields', 'Invoicing', 'Contracts & Engagement Letters', 'E-signatures'],
                    },
                  ]}
                />
              }
            />

            {/* ── V3 ── */}
            <TimelineRow
              node={{ phase: 'v3', label: 'V3' }}
              leftContent={
                <PhaseCard
                  phase="v3"
                  tag="V3 · Enterprise"
                  title="Enterprise<br>Suite"
                  description="Advanced compliance, intelligent forecasting and the commercial tooling larger bureaus and accountancy firms need to run a regulated payroll operation with confidence."
                  priceChip="Pricing on application"
                  tiers={[
                    {
                      label: 'Enterprise features',
                      tier: 'enterprise',
                      features: ['AML / KYC Checks', 'Deep Analytics', 'Capacity Forecasting', 'Churn Risk Scoring', 'Revenue Forecasting', 'Fee Management', 'Referral Tracking', 'White Labelling', 'Bureau Comparison', 'Team Performance Reviews'],
                    },
                  ]}
                />
              }
              rightContent={
                <div className="pt-6 flex justify-center max-[880px]:hidden">
                  <StatCard
                    phase="v3"
                    value={10}
                    label="enterprise-grade<br>intelligence features"
                    note="Compliance · Analytics<br>Forecasting · Branding · Benchmarking"
                  />
                </div>
              }
            />

            {/* ── Future Vision ── */}
            <TimelineRow
              node={{ phase: 'fv', label: '∞' }}
              isLast
              leftContent={
                <div className="pt-6 flex justify-center max-[880px]:hidden">
                  <StatCard
                    phase="fv"
                    value={13}
                    label="platform &amp;<br>vision features"
                    note="Client portal · Automation<br>HMRC API · Multi-bureau"
                  />
                </div>
              }
              rightContent={
                <PhaseCard
                  phase="fv"
                  tag="Future Vision · Platform"
                  title="The Operating<br>System"
                  description="Our long-term vision — a platform every UK payroll bureau relies on. Client portals, workflow automation, direct HMRC connectivity and open integrations with your existing software."
                  priceChip="Platform pricing · To be confirmed"
                  tiers={[
                    {
                      label: 'Platform & vision features',
                      tier: 'vision',
                      features: ['Client-Facing Portal', 'Self-Service Data Submission', 'Contract Renewal Portal', 'Custom Workflow Builder', 'Recurring Task Templates', 'Anomaly Detection', 'Internal Team Messaging', 'Client Communication Log', 'Document Storage', 'HMRC API Direct', 'Multi-Bureau Groups', 'Accounting Integration', 'API Integrations (Open)'],
                    },
                  ]}
                />
              }
            />
          </TimelineLayout>
        </div>
      </section>

      {/* ═══ SUMMARY ═══ */}
      <section className="py-20 max-[880px]:py-12 bg-gray-50">
        <div className="max-w-[1160px] mx-auto px-10 max-[880px]:px-5">
          <SectionHeader
            eyebrow="At a Glance"
            title="Every Phase, Every Tier"
            description="A clear path from free individual tools to a full bureau operating system."
          />

          <div className="grid grid-cols-4 gap-5 mb-12 max-[880px]:grid-cols-2 max-[540px]:grid-cols-1">
            <SummaryCard phase="v1" version="V1" name="Free for every consultant" description="No credit card. No catch. Unlimited from £9.99/mo." />
            <SummaryCard phase="v2" version="V2" name="Built for bureaus" description="Team management & commercial tools." />
            <SummaryCard phase="v3" version="V3" name="Enterprise-grade compliance" description="For larger bureaus & accountancy firms." />
            <SummaryCard phase="fv" version="Vision" name="The platform for UK payroll" description="Client portals · Automation · Open API." />
          </div>

          <QuoteBlock
            quote="Purpose-built for payroll professionals. Finally."
            linkText="thepaybureau.com"
            linkHref="/"
          />
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <MarketingFooter />
    </div>
  )
}
