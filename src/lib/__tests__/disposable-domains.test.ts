import { isDisposableEmail, DISPOSABLE_DOMAINS } from '@/lib/disposable-domains'

describe('isDisposableEmail', () => {
  it('identifies known disposable domains', () => {
    expect(isDisposableEmail('user@mailinator.com')).toBe(true)
    expect(isDisposableEmail('test@guerrillamail.com')).toBe(true)
    expect(isDisposableEmail('foo@yopmail.com')).toBe(true)
    expect(isDisposableEmail('bar@tempmail.com')).toBe(true)
    expect(isDisposableEmail('x@10minutemail.com')).toBe(true)
  })

  it('allows legitimate domains', () => {
    expect(isDisposableEmail('admin@acmecorp.com')).toBe(false)
    expect(isDisposableEmail('user@google.com')).toBe(false)
    expect(isDisposableEmail('hello@microsoft.com')).toBe(false)
    expect(isDisposableEmail('team@stripe.com')).toBe(false)
  })

  it('handles uppercase input', () => {
    expect(isDisposableEmail('USER@MAILINATOR.COM')).toBe(true)
    expect(isDisposableEmail('Admin@YopMail.Com')).toBe(true)
  })

  it('returns false for empty string', () => {
    expect(isDisposableEmail('')).toBe(false)
  })

  it('returns false when no @ present', () => {
    expect(isDisposableEmail('nodomain')).toBe(false)
  })

  it('DISPOSABLE_DOMAINS set has entries', () => {
    expect(DISPOSABLE_DOMAINS.size).toBeGreaterThan(50)
  })
})
