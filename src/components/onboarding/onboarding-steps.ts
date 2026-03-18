import {
  Rocket,
  Building2,
  CalendarClock,
  Shield,
  PartyPopper,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: LucideIcon
  route: string
  action: string
  actionHint?: string
  highlightSelector?: string
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: "Let's get you started",
    description:
      'Create your first client and payroll in under 3 minutes. We\'ll walk you through each step.',
    icon: Rocket,
    route: '/dashboard',
    action: 'Start Setup',
  },
  {
    id: 'create-client',
    title: 'Add your first client',
    description:
      'Enter a company name and contact details — you can always add more information later.',
    icon: Building2,
    route: '/dashboard/clients',
    action: 'Waiting for client...',
    actionHint: 'Click the "Add Client" button above to open the form',
    highlightSelector: '[data-onboarding="add-client"]',
  },
  {
    id: 'create-payroll',
    title: 'Set up a payroll',
    description:
      'Link a payroll to your client. Choose a pay frequency and pay day to get started.',
    icon: CalendarClock,
    route: '/dashboard/payrolls',
    action: 'Waiting for payroll...',
    actionHint: 'Click "Add Payroll" above and select your new client',
    highlightSelector: '[data-onboarding="add-payroll"]',
  },
  {
    id: 'pensions-overview',
    title: 'Pension re-enrolment dates',
    description:
      'This page tracks auto-enrolment status, re-enrolment dates, and declaration of compliance deadlines for each client.',
    icon: Shield,
    route: '/dashboard/pensions',
    action: 'Got it',
  },
  {
    id: 'complete',
    title: "You're all set!",
    description:
      "You've created your first client and payroll. Explore the dashboard to manage payroll runs, checklists, and more.",
    icon: PartyPopper,
    route: '/dashboard',
    action: 'Go to Dashboard',
  },
]

export const STORAGE_KEY_STEP = 'tpb_onboarding_step'
export const STORAGE_KEY_COMPLETED = 'tpb_onboarding_completed'
