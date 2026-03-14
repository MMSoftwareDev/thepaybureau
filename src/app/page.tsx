import type { Metadata } from 'next'
import { MARKETING_DOMAIN } from '@/lib/domains'
import { Navbar } from '@/components/marketing/Navbar'
import { Hero } from '@/components/marketing/Hero'
import { TrustBar } from '@/components/marketing/TrustBar'
import { ProblemStatement } from '@/components/marketing/ProblemStatement'
import { FeatureGrid } from '@/components/marketing/FeatureGrid'
import { ProductShowcase } from '@/components/marketing/ProductShowcase'
import { PricingSection } from '@/components/marketing/PricingSection'
import { FAQSection } from '@/components/marketing/FAQSection'
import { FinalCTA } from '@/components/marketing/FinalCTA'
import { Footer } from '@/components/marketing/Footer'

export const metadata: Metadata = {
  title: 'ThePayBureau — Never Miss Another Payroll Deadline',
  description:
    'Professional payroll bureau management for UK specialists. Track HMRC deadlines, manage client checklists, auto-enrolment tracking, and pension compliance. Free forever for individuals.',
  alternates: {
    canonical: MARKETING_DOMAIN,
  },
}

export default function LandingPage() {
  return (
    <div className="overflow-x-clip w-screen" style={{ background: 'var(--mkt-bg)', fontFamily: 'var(--font-body), Plus Jakarta Sans, system-ui, sans-serif' }}>
      <Navbar />
      <Hero />
      <TrustBar />
      <ProblemStatement />
      <FeatureGrid />
      <ProductShowcase />
      <PricingSection />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </div>
  )
}
