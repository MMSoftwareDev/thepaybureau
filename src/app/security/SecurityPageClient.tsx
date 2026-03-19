'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const FAQS = [
  {
    q: 'Who can access my data?',
    a: 'Only the team members within your bureau. Each bureau\'s data is completely isolated at the database level. Our support team cannot access your data without your explicit written permission.',
  },
  {
    q: 'Is my data backed up?',
    a: 'Yes. We run automated daily backups with point-in-time recovery. Your data is replicated across multiple availability zones for resilience against hardware failures.',
  },
  {
    q: 'What happens if there\'s a security incident?',
    a: 'We follow a documented incident response process. Affected customers are notified within 72 hours as required by UK GDPR. We investigate root causes and publish post-incident reports where appropriate.',
  },
  {
    q: 'Can I export or delete my data?',
    a: 'Yes. You can export all your data in JSON or CSV format from your Settings page at any time. You can also permanently delete your account and all associated data — the process is immediate and irreversible.',
  },
  {
    q: 'Do you have security certifications?',
    a: 'We follow SOC 2 and ISO 27001 frameworks in our security practices. As we grow, we plan to pursue formal certification. Our current practices include automated security audits, encrypted data storage, and strict access controls.',
  },
]

export function SecurityPageClient() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {FAQS.map((faq, i) => (
        <AccordionItem
          key={i}
          value={`item-${i}`}
          className="border-b"
          style={{ borderColor: 'var(--mkt-border)' }}
        >
          <AccordionTrigger
            className="text-left text-[15px] font-semibold py-5 hover:no-underline"
            style={{ color: 'var(--mkt-text)', fontFamily: 'var(--font-inter)' }}
          >
            {faq.q}
          </AccordionTrigger>
          <AccordionContent
            className="text-sm leading-relaxed pb-5"
            style={{ color: 'var(--mkt-text-2)', fontFamily: 'var(--font-body)' }}
          >
            {faq.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
