import { z } from 'zod'

const BLOCKED_DOMAINS = [
  'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 
  'aol.com', 'icloud.com', 'live.com', 'msn.com', 'protonmail.com'
]

export const adminRegistrationSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .refine((email) => {
      const domain = email.split('@')[1]?.toLowerCase()
      return !BLOCKED_DOMAINS.includes(domain)
    }, 'Please use your company email address. Personal email providers are not allowed.'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must include lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must include uppercase letter') 
    .regex(/(?=.*\d)/, 'Password must include number'),
  companyName: z.string()
    .min(1, 'Company name is required')
    .max(255, 'Company name too long'),
  adminName: z.string()
    .min(1, 'Your full name is required')
    .max(255, 'Name too long'),
  phone: z.string().optional()
})

export const teamInviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['consultant', 'viewer'])
})

export const validateBusinessEmail = (email: string) => {
  if (!email) return { valid: false, error: '' }
  
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' }
  }
  
  const domain = email.split('@')[1]?.toLowerCase()
  if (BLOCKED_DOMAINS.includes(domain)) {
    return { 
      valid: false, 
      error: 'Please use your company email address. Personal email providers are not allowed.' 
    }
  }
  
  return { valid: true, error: '' }
}

export const extractCompanyFromDomain = (email: string): string => {
  const domain = email.split('@')[1]
  if (!domain) return ''

  return domain
    .replace(/\.(com|co\.uk|org|net|ltd|io)$/, '')
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// ═══════════════════════════════════════════════════
// MVP Payroll Schemas
// ═══════════════════════════════════════════════════

// Client creation schema — full onboarding
export const clientOnboardingSchema = z.object({
  // Step 1: Company details
  name: z.string().min(1, 'Company name is required').max(255),
  paye_reference: z.string().optional(),
  accounts_office_ref: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    postcode: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  employee_count: z.number().int().positive().optional(),

  // Step 2: Payroll config
  pay_frequency: z.enum(['weekly', 'fortnightly', 'four_weekly', 'monthly']),
  pay_day: z.string().min(1, 'Pay day is required'),
  tax_period_start: z.string().optional(),

  // Step 3: Pension
  pension_provider: z.string().optional(),
  pension_staging_date: z.string().optional(),

  // Step 4: Contact
  contact_name: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),

  // Step 5: Checklist template
  checklist_items: z.array(z.object({
    name: z.string().min(1, 'Step name is required'),
    sort_order: z.number().int()
  })).min(1, 'At least one checklist item is required')
})

// Payroll run generation
export const generatePayrollRunSchema = z.object({
  client_id: z.string().uuid()
})

// Checklist item toggle
export const toggleChecklistItemSchema = z.object({
  id: z.string().uuid(),
  is_completed: z.boolean()
})