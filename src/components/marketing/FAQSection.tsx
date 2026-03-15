'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const FAQS = [
  {
    q: 'What is ThePayBureau?',
    a: 'ThePayBureau is a CRM built specifically for UK payroll bureaux and independent consultants. It helps you manage clients, track HMRC deadlines, run payroll checklists, and stay on top of pension auto-enrolment \u2014 all in one place.',
  },
  {
    q: 'How is this different from payroll software?',
    a: "We don\u2019t process payroll or calculate pay. ThePayBureau is a workflow management tool \u2014 think of it as the cockpit that keeps your payroll runs organised. You\u2019ll still use your existing payroll software (Sage, BrightPay, Moneysoft, etc.) to process the actual payroll.",
  },
  {
    q: 'Is it really free?',
    a: 'Yes. The Free tier is free forever for individual payroll consultants managing up to 50 clients. No credit card required, no time limits. The Unlimited plan at \u00A319/month unlocks all features and unlimited clients.',
  },
  {
    q: 'How long does setup take?',
    a: 'Under 60 seconds. Create your account, add your first client, and see your deadlines instantly. Most people are fully set up within a few minutes.',
  },
  {
    q: 'Can I import my existing clients?',
    a: 'Yes. You can bulk import clients via CSV upload. The importer handles up to 500 clients in batched chunks and validates data before import. You can also add clients individually.',
  },
  {
    q: 'What HMRC deadlines do you track?',
    a: 'RTI (Real Time Information), FPS (Full Payment Submission), and EPS (Employer Payment Summary) deadlines \u2014 all auto-calculated from your clients\u2019 pay dates and frequencies. Plus pension declaration tracking and re-enrolment date monitoring.',
  },
  {
    q: 'Is my data secure?',
    a: 'Absolutely. We use Supabase (built on PostgreSQL) with Row Level Security policies that isolate your data at the database level. All data is encrypted in transit (TLS 1.2+) and at rest. We are UK GDPR compliant and never share your data with third parties.',
  },
  {
    q: 'Can my whole bureau use this?',
    a: 'Yes. The Unlimited plan supports multi-user access within your bureau. Team features including bureau dashboards, org charts, and capacity planning are on our roadmap.',
  },
  {
    q: 'What if I want to leave?',
    a: 'You can export all your data at any time via CSV. After cancellation, we retain your data for 90 days so you can change your mind. No lock-in, no hidden fees.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. There are no long-term contracts. You can cancel your Unlimited subscription at any time and you\u2019ll keep access until the end of your billing period.',
  },
]

export function FAQSection() {
  return (
    <section id="faq" style={{ background: 'var(--mkt-bg-alt)' }}>
      <div className="max-w-[720px] mx-auto px-5 py-20 md:py-28">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="w-5 h-0.5 rounded-sm" style={{ background: 'var(--mkt-pink)' }} />
            <span
              className="text-xs font-bold tracking-[0.1em] uppercase"
              style={{ color: 'var(--mkt-pink)', fontFamily: 'var(--font-inter)' }}
            >
              FAQ
            </span>
          </div>
          <h2
            className="text-2xl md:text-[2.5rem] font-bold tracking-tight leading-tight"
            style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-display), DM Serif Display, serif' }}
          >
            Frequently asked questions
          </h2>
        </div>

        {/* Accordion */}
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border-b-0 mb-2"
            >
              <div
                className="rounded-xl border px-5 overflow-hidden"
                style={{
                  borderColor: 'var(--mkt-border)',
                  background: 'var(--mkt-surface)',
                }}
              >
                <AccordionTrigger
                  className="text-left text-[15px] font-semibold py-4 hover:no-underline"
                  style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-inter)' }}
                >
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent>
                  <p
                    className="text-sm leading-relaxed pb-1"
                    style={{ color: 'var(--mkt-text-2)', fontFamily: 'var(--font-body)' }}
                  >
                    {faq.a}
                  </p>
                </AccordionContent>
              </div>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
