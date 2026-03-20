import type { Metadata } from 'next'
import { MARKETING_DOMAIN } from '@/lib/domains'
import { Navbar } from '@/components/marketing/Navbar'
import { Hero } from '@/components/marketing/Hero'
import { TrustBar } from '@/components/marketing/TrustBar'
import { ProblemStatement } from '@/components/marketing/ProblemStatement'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { FeatureGrid } from '@/components/marketing/FeatureGrid'
import { ProductShowcase } from '@/components/marketing/ProductShowcase'
import { PricingSection } from '@/components/marketing/PricingSection'
import { FAQSection } from '@/components/marketing/FAQSection'
import { FinalCTA } from '@/components/marketing/FinalCTA'
import { Footer } from '@/components/marketing/Footer'
import { FadeInOnScroll } from '@/components/marketing/FadeInOnScroll'

export const metadata: Metadata = {
  title: 'ThePayBureau — The Payroll CRM That Runs Your Bureau For You',
  description:
    'Professional payroll bureau management for UK specialists. Track HMRC deadlines, manage client checklists, auto-enrolment tracking, and pension compliance. Free forever for individuals.',
  alternates: {
    canonical: MARKETING_DOMAIN,
  },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: MARKETING_DOMAIN,
    siteName: 'ThePayBureau',
    title: 'ThePayBureau — The Payroll CRM That Runs Your Bureau For You',
    description: 'Professional payroll bureau management for UK specialists. Track HMRC deadlines, manage client checklists, auto-enrolment tracking, and pension compliance.',
    images: [
      {
        url: `${MARKETING_DOMAIN}/logo-full.png`,
        width: 1200,
        height: 630,
        alt: 'ThePayBureau - Professional Payroll Management',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ThePayBureau — The Payroll CRM That Runs Your Bureau For You',
    description: 'Professional payroll bureau management for UK specialists. Track HMRC deadlines, manage client checklists, auto-enrolment tracking, and pension compliance.',
    images: [`${MARKETING_DOMAIN}/logo-full.png`],
  },
}

export default function LandingPage() {
  return (
    <div
      className="overflow-x-clip w-full scroll-smooth"
      style={{ background: 'var(--mkt-bg)', fontFamily: 'var(--font-body), Plus Jakarta Sans, system-ui, sans-serif' }}
    >
      <Navbar />
      <Hero />
      <TrustBar />
      <FadeInOnScroll>
        <ProblemStatement />
      </FadeInOnScroll>
      <FadeInOnScroll>
        <HowItWorks />
      </FadeInOnScroll>
      <FadeInOnScroll>
        <FeatureGrid />
      </FadeInOnScroll>
      <FadeInOnScroll>
        <ProductShowcase />
      </FadeInOnScroll>
      <FadeInOnScroll>
        <PricingSection />
      </FadeInOnScroll>
      <FadeInOnScroll>
        <FAQSection />
      </FadeInOnScroll>
      <FadeInOnScroll>
        <FinalCTA />
      </FadeInOnScroll>
      <Footer />
    </div>
  )
}
