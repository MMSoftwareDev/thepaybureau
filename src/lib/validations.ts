import { z } from 'zod'
import { isDisposableEmail } from '@/lib/disposable-domains'

const BLOCKED_DOMAINS = [
  'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com',
  'aol.com', 'icloud.com', 'live.com', 'msn.com', 'protonmail.com',
  'pm.me', 'tutanota.com', 'mail.com', 'yandex.com', 'yandex.ru',
  'gmx.com', 'gmx.net', 'zoho.com',
]

export const adminRegistrationSchema = z.object({
  email: z.string()
    .email('Please enter a valid email address')
    .refine((email) => {
      const domain = email.split('@')[1]?.toLowerCase()
      return !BLOCKED_DOMAINS.includes(domain)
    }, 'Please use your company email address. Personal email providers are not allowed.')
    .refine((email) => {
      return !isDisposableEmail(email)
    }, 'Disposable or temporary email addresses are not allowed.'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/(?=.*[a-z])/, 'Password must include lowercase letter')
    .regex(/(?=.*[A-Z])/, 'Password must include uppercase letter')
    .regex(/(?=.*\d)/, 'Password must include number')
    .regex(/(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, 'Password must include a special character'),
  companyName: z.string()
    .min(1, 'Company name is required')
    .max(255, 'Company name too long'),
  adminName: z.string()
    .min(1, 'Your full name is required')
    .max(255, 'Name too long'),
  phone: z.string().optional()
})

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
  pay_frequency: z.enum(['weekly', 'two_weekly', 'four_weekly', 'monthly', 'annually']),
  pay_day: z.string().min(1, 'Pay day is required'),
  period_start: z.string().optional(),
  period_end: z.string().optional(),
  payroll_software: z.string().optional(),
  employment_allowance: z.boolean().optional(),

  // Step 3: Pension
  pension_provider: z.string().optional(),
  pension_staging_date: z.string().optional(),
  pension_reenrolment_date: z.string().optional(),
  declaration_of_compliance_deadline: z.string().optional(),

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

// Client creation schema — simplified (no payroll fields)
export const createClientSchema = z.object({
  name: z.string().min(1, 'Company name is required').max(255),
  company_number: z.string().max(20).optional(),
  industry: z.string().optional(),
  employee_count: z.number().int().positive().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    postcode: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  contact_name: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
  domain: z.string().optional(),
  secondary_contact_name: z.string().optional(),
  secondary_contact_email: z.string().email().optional().or(z.literal('')),
  secondary_contact_phone: z.string().optional(),
  accountant_name: z.string().optional(),
  accountant_email: z.string().email().optional().or(z.literal('')),
  accountant_phone: z.string().optional(),
  // Tax & Compliance
  vat_number: z.string().optional(),
  utr: z.string().optional(),
  cis_registered: z.boolean().optional(),
  sic_code: z.string().optional(),
  hmrc_agent_authorised: z.boolean().optional(),
  auto_enrolment_status: z.enum(['enrolled', 'exempt', 'currently_not_required']).optional(),
  // Company Details
  company_type: z.enum(['ltd', 'llp', 'sole_trader', 'charity', 'public_sector', 'partnership']).optional(),
  incorporation_date: z.string().optional(),
  // Billing
  fee: z.string().optional(),
  billing_frequency: z.enum(['monthly', 'per_run', 'quarterly', 'annually']).optional(),
  payment_method: z.enum(['bacs', 'standing_order', 'card', 'invoice', 'direct_debit']).optional(),
  // Contract
  contract_type: z.enum(['fixed_term', 'rolling']).optional(),
  start_date: z.string().optional(),
  contract_end_date: z.string().optional(),
  notice_period_value: z.number().int().positive().optional(),
  notice_period_unit: z.enum(['days', 'weeks', 'months']).optional(),
  assigned_to: z.string().uuid().optional().or(z.literal('')),
  referral_source: z.string().optional(),
  bacs_bureau_number: z.string().optional(),
  tags: z.array(z.string()).optional(),
  document_storage_url: z.string().url().optional().or(z.literal('')),
  portal_access_enabled: z.boolean().optional(),
})

// Payroll creation schema
export const createPayrollSchema = z.object({
  name: z.string().min(1, 'Payroll name is required').max(255),
  client_id: z.string().uuid('Client is required'),
  pay_frequency: z.enum(['weekly', 'two_weekly', 'four_weekly', 'monthly', 'annually']),
  pay_day: z.string().min(1, 'Pay day is required'),
  paye_reference: z.string().optional(),
  accounts_office_ref: z.string().max(13).optional(),
  period_start: z.string().optional(),
  period_end: z.string().optional(),
  payroll_software: z.string().optional(),
  employment_allowance: z.boolean().optional(),
  pension_provider: z.string().optional(),
  pension_staging_date: z.string().optional(),
  pension_reenrolment_date: z.string().optional(),
  declaration_of_compliance_deadline: z.string().optional(),
  checklist_items: z.array(z.object({
    name: z.string().min(1, 'Step name is required'),
    sort_order: z.number().int()
  })).min(1, 'At least one checklist item is required')
})

// Payroll update schema
export const updatePayrollSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  client_id: z.string().uuid().optional(),
  pay_frequency: z.enum(['weekly', 'two_weekly', 'four_weekly', 'monthly', 'annually']).optional(),
  pay_day: z.string().min(1).optional(),
  paye_reference: z.string().optional(),
  accounts_office_ref: z.string().max(13).optional(),
  period_start: z.string().optional(),
  period_end: z.string().optional(),
  payroll_software: z.string().optional(),
  employment_allowance: z.boolean().optional(),
  pension_provider: z.string().optional(),
  pension_staging_date: z.string().optional(),
  pension_reenrolment_date: z.string().optional(),
  declaration_of_compliance_deadline: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  checklist_templates: z.array(z.object({
    name: z.string().min(1),
    sort_order: z.number().int()
  })).optional()
})

// Payroll run generation — now uses payroll_id
export const generatePayrollRunSchema = z.object({
  payroll_id: z.string().uuid()
})

// Named checklist templates (tenant-level)
export const checklistTemplateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Template name is required').max(100),
  is_default: z.boolean(),
  steps: z.array(z.object({
    name: z.string().min(1, 'Step name is required').max(255),
    sort_order: z.number().int().min(0),
  })).min(1, 'At least one step is required'),
})

export const checklistTemplatesSchema = z.array(checklistTemplateSchema).min(1, 'At least one template is required')

// ═══════════════════════════════════════════════════
// AI Assistant Schemas
// ═══════════════════════════════════════════════════

export const aiChatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(4000),
  conversation_id: z.string().uuid().optional(),
})

export const aiDocumentUploadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  source_url: z.string().url().max(2000).optional().or(z.literal('')),
  category: z.enum(['paye', 'nic', 'statutory_pay', 'pensions', 'rti', 'expenses', 'general']).optional(),
  content: z.string().min(1, 'Document content is required'),
})

export const aiApiKeyCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  rate_limit: z.number().int().min(1).max(10000).optional(),
  expires_at: z.string().optional(),
})

export const aiExternalChatSchema = z.object({
  message: z.string().min(1, 'Message is required').max(4000),
  conversation_id: z.string().uuid().optional(),
})