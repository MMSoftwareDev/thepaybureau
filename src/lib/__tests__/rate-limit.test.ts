// Tests for the in-memory rate limiter fallback (no Redis needed)

// Force in-memory mode by not setting Redis env vars
delete process.env.UPSTASH_REDIS_REST_URL
delete process.env.UPSTASH_REDIS_REST_TOKEN

import { rateLimit } from '@/lib/rate-limit'

describe('rateLimit (in-memory fallback)', () => {
  it('allows requests within the limit', async () => {
    const key = `test-allow-${Date.now()}`
    const config = { limit: 3, windowSeconds: 60 }

    const r1 = await rateLimit(key, config)
    expect(r1.success).toBe(true)
    expect(r1.remaining).toBe(2)

    const r2 = await rateLimit(key, config)
    expect(r2.success).toBe(true)
    expect(r2.remaining).toBe(1)

    const r3 = await rateLimit(key, config)
    expect(r3.success).toBe(true)
    expect(r3.remaining).toBe(0)
  })

  it('blocks requests exceeding the limit', async () => {
    const key = `test-block-${Date.now()}`
    const config = { limit: 2, windowSeconds: 60 }

    await rateLimit(key, config)
    await rateLimit(key, config)

    const r3 = await rateLimit(key, config)
    expect(r3.success).toBe(false)
    expect(r3.remaining).toBe(0)
  })

  it('uses separate counters for different keys', async () => {
    const config = { limit: 1, windowSeconds: 60 }
    const ts = Date.now()

    const r1 = await rateLimit(`key-a-${ts}`, config)
    expect(r1.success).toBe(true)

    const r2 = await rateLimit(`key-b-${ts}`, config)
    expect(r2.success).toBe(true)
  })
})
