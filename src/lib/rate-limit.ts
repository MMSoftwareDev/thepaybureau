import { timingSafeEqual } from 'crypto'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number
  /** Window duration in seconds */
  windowSeconds: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

// In-memory fallback for local dev when Redis is not configured
const memoryStore = new Map<string, { count: number; resetAt: number }>()

function memoryRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const entry = memoryStore.get(key)

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 })
    return { success: true, remaining: config.limit - 1, resetAt: now + config.windowSeconds * 1000 }
  }

  if (entry.count >= config.limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { success: true, remaining: config.limit - entry.count, resetAt: entry.resetAt }
}

let redis: Redis | null = null
const limiters = new Map<string, Ratelimit>()

function getRedis(): Redis | null {
  if (redis) return redis
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
  return redis
}

function getLimiter(config: RateLimitConfig): Ratelimit | null {
  const r = getRedis()
  if (!r) return null

  const key = `${config.limit}:${config.windowSeconds}`
  let limiter = limiters.get(key)
  if (!limiter) {
    limiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSeconds} s`),
    })
    limiters.set(key, limiter)
  }
  return limiter
}

export async function rateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const limiter = getLimiter(config)

  // Fall back to in-memory if Redis is not configured
  // WARNING: In-memory rate limiting is per-instance and resets on deploy — not suitable for production
  if (!limiter) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('Rate limiting: Redis not configured — using in-memory fallback. Set UPSTASH_REDIS_REST_URL for production.')
    }
    return memoryRateLimit(key, config)
  }

  const result = await limiter.limit(key)
  return {
    success: result.success,
    remaining: result.remaining,
    resetAt: result.reset,
  }
}

/**
 * Extract client IP from request headers (works behind proxies).
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Timing-safe verification of the CRON_SECRET bearer token.
 * Uses crypto.timingSafeEqual to prevent timing attacks on secret comparison.
 * Returns true if the Authorization header matches `Bearer ${CRON_SECRET}`.
 */
export function verifyCronSecret(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false

  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false

  const prefix = 'Bearer '
  if (!authHeader.startsWith(prefix)) return false

  const token = authHeader.slice(prefix.length)
  if (token.length !== cronSecret.length) return false

  return timingSafeEqual(Buffer.from(token), Buffer.from(cronSecret))
}
