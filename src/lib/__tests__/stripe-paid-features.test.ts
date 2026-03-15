import { hasPaidFeature, PLANS, PAID_ONLY_ROUTES, isRoutePaidOnly } from '@/lib/stripe'

describe('hasPaidFeature', () => {
  it('returns true for unlimited plan', () => {
    expect(hasPaidFeature('unlimited')).toBe(true)
  })

  it('returns false for free plan', () => {
    expect(hasPaidFeature('free')).toBe(false)
  })

  it('returns false for trial plan', () => {
    expect(hasPaidFeature('trial')).toBe(false)
  })

  it('returns false for null/undefined', () => {
    expect(hasPaidFeature(null)).toBe(false)
    expect(hasPaidFeature(undefined)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(hasPaidFeature('')).toBe(false)
  })
})

describe('PAID_ONLY_ROUTES', () => {
  it('includes AI assistant route', () => {
    expect(PAID_ONLY_ROUTES).toContain('/dashboard/ai-assistant')
  })

  it('includes training route', () => {
    expect(PAID_ONLY_ROUTES).toContain('/dashboard/training')
  })
})

describe('isRoutePaidOnly', () => {
  it('returns true for AI assistant path', () => {
    expect(isRoutePaidOnly('/dashboard/ai-assistant')).toBe(true)
    expect(isRoutePaidOnly('/dashboard/ai-assistant/chat')).toBe(true)
  })

  it('returns true for training path', () => {
    expect(isRoutePaidOnly('/dashboard/training')).toBe(true)
  })

  it('returns false for free routes', () => {
    expect(isRoutePaidOnly('/dashboard')).toBe(false)
    expect(isRoutePaidOnly('/dashboard/clients')).toBe(false)
    expect(isRoutePaidOnly('/dashboard/payrolls')).toBe(false)
    expect(isRoutePaidOnly('/dashboard/settings')).toBe(false)
  })
})

describe('PLANS consistency', () => {
  it('free plan does not include AI Assistant feature', () => {
    expect(PLANS.free.features).not.toContain('AI Assistant')
  })

  it('unlimited plan includes AI Assistant feature', () => {
    expect(PLANS.unlimited.features).toContain('AI Assistant')
  })

  it('unlimited plan includes Training & CPD tracking', () => {
    expect(PLANS.unlimited.features).toContain('Training & CPD tracking')
  })
})
