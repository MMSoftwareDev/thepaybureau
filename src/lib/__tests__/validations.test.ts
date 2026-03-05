import { adminRegistrationSchema, validateBusinessEmail, clientOnboardingSchema } from '@/lib/validations'

describe('adminRegistrationSchema', () => {
  const validData = {
    email: 'admin@company.co.uk',
    password: 'SecurePass1!',
    companyName: 'Test Bureau Ltd',
    adminName: 'Jane Smith',
  }

  it('accepts valid registration data', () => {
    const result = adminRegistrationSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('rejects personal email providers', () => {
    const result = adminRegistrationSchema.safeParse({
      ...validData,
      email: 'user@gmail.com',
    })
    expect(result.success).toBe(false)
  })

  it('rejects weak passwords', () => {
    const result = adminRegistrationSchema.safeParse({
      ...validData,
      password: 'weak',
    })
    expect(result.success).toBe(false)
  })

  it('rejects passwords without special characters', () => {
    const result = adminRegistrationSchema.safeParse({
      ...validData,
      password: 'NoSpecial1',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty company name', () => {
    const result = adminRegistrationSchema.safeParse({
      ...validData,
      companyName: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('validateBusinessEmail', () => {
  it('accepts business emails', () => {
    expect(validateBusinessEmail('user@company.co.uk').valid).toBe(true)
  })

  it('rejects Gmail', () => {
    const result = validateBusinessEmail('user@gmail.com')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('company email')
  })

  it('rejects invalid email format', () => {
    const result = validateBusinessEmail('not-an-email')
    expect(result.valid).toBe(false)
  })

  it('handles empty input', () => {
    const result = validateBusinessEmail('')
    expect(result.valid).toBe(false)
  })
})

describe('clientOnboardingSchema', () => {
  const validClient = {
    name: 'Test Client Ltd',
    pay_frequency: 'monthly' as const,
    pay_day: 'last_day_of_month',
    checklist_items: [
      { name: 'Process payroll', sort_order: 0 },
    ],
  }

  it('accepts valid client data', () => {
    const result = clientOnboardingSchema.safeParse(validClient)
    expect(result.success).toBe(true)
  })

  it('rejects missing company name', () => {
    const result = clientOnboardingSchema.safeParse({
      ...validClient,
      name: '',
    })
    expect(result.success).toBe(false)
  })

  it('requires at least one checklist item', () => {
    const result = clientOnboardingSchema.safeParse({
      ...validClient,
      checklist_items: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid pay frequency', () => {
    const result = clientOnboardingSchema.safeParse({
      ...validClient,
      pay_frequency: 'daily',
    })
    expect(result.success).toBe(false)
  })
})
