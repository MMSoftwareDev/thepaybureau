import { PLANS } from '@/lib/stripe'

describe('Stripe PLANS configuration', () => {
  it('has free plan with no price', () => {
    expect(PLANS.free.price).toBe(0)
    expect(PLANS.free.priceId).toBeNull()
  })

  it('has unlimited plan at £9/month and £7/month annual', () => {
    expect(PLANS.unlimited.price).toBe(9)
    expect(PLANS.unlimited.annualPrice).toBe(7)
    expect(PLANS.unlimited.clients).toBe(Infinity)
  })

  it('free plan limited to 50 clients', () => {
    expect(PLANS.free.clients).toBe(50)
  })

  it('all plans have feature lists', () => {
    for (const [, plan] of Object.entries(PLANS)) {
      expect(plan.features.length).toBeGreaterThan(0)
      expect(plan.name).toBeTruthy()
    }
  })

  it('plans have ascending prices', () => {
    expect(PLANS.free.price).toBeLessThan(PLANS.unlimited.price)
  })

  it('plans have ascending client limits', () => {
    expect(PLANS.free.clients).toBeLessThan(PLANS.unlimited.clients)
  })
})
