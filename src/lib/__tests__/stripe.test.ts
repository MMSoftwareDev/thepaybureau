import { PLANS } from '@/lib/stripe'

describe('Stripe PLANS configuration', () => {
  it('has starter plan with no price (free)', () => {
    expect(PLANS.starter.price).toBe(0)
    expect(PLANS.starter.priceId).toBeNull()
  })

  it('has professional plan at £29', () => {
    expect(PLANS.professional.price).toBe(29)
    expect(PLANS.professional.clients).toBe(50)
  })

  it('has enterprise plan at £79 with unlimited clients', () => {
    expect(PLANS.enterprise.price).toBe(79)
    expect(PLANS.enterprise.clients).toBe(Infinity)
  })

  it('all plans have feature lists', () => {
    for (const [, plan] of Object.entries(PLANS)) {
      expect(plan.features.length).toBeGreaterThan(0)
      expect(plan.name).toBeTruthy()
    }
  })

  it('plans have ascending prices', () => {
    expect(PLANS.starter.price).toBeLessThan(PLANS.professional.price)
    expect(PLANS.professional.price).toBeLessThan(PLANS.enterprise.price)
  })

  it('plans have ascending client limits', () => {
    expect(PLANS.starter.clients).toBeLessThan(PLANS.professional.clients)
    expect(PLANS.professional.clients).toBeLessThan(PLANS.enterprise.clients)
  })
})
