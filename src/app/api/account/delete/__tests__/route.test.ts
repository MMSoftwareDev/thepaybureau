import { POST } from '../route'
import { createMockSupabaseClient, createMockAuthUser } from '@/lib/__tests__/helpers/supabase-mock'

// Mock Supabase server
const mockSupabase = createMockSupabaseClient()
jest.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: () => mockSupabase.client,
  getAuthUser: jest.fn(),
}))

// Mock rate limit
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn().mockResolvedValue({ success: true, remaining: 4, resetAt: 0 }),
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
}))

// Mock Stripe
const mockStripeCustomersDel = jest.fn().mockResolvedValue({ id: 'cus_123', deleted: true })
jest.mock('@/lib/stripe', () => ({
  getStripe: () => ({
    customers: { del: mockStripeCustomersDel },
  }),
  PLANS: { free: { clients: 50 }, unlimited: { clients: Infinity } },
}))

import { getAuthUser } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rate-limit'

const mockGetAuthUser = getAuthUser as jest.MockedFunction<typeof getAuthUser>

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/account/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0]
}

describe('POST /api/account/delete', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAuthUser.mockResolvedValue(createMockAuthUser() as any)
  })

  it('returns 401 if not authenticated', async () => {
    mockGetAuthUser.mockResolvedValue(null)
    const res = await POST(makeRequest({ confirmation: 'DELETE MY ACCOUNT' }))
    expect(res.status).toBe(401)
  })

  it('returns 429 when rate limited', async () => {
    ;(rateLimit as jest.Mock).mockResolvedValueOnce({ success: false, remaining: 0, resetAt: 0 })
    const res = await POST(makeRequest({ confirmation: 'DELETE MY ACCOUNT' }))
    expect(res.status).toBe(429)
  })

  it('returns 400 for invalid confirmation text', async () => {
    const res = await POST(makeRequest({ confirmation: 'wrong text' }))
    expect(res.status).toBe(400)
  })

  it('cleans up Stripe customer when present', async () => {
    mockSupabase.mockTableResults({
      users: { data: { tenant_id: 'tenant-456', email: 'test@bureau.com', name: 'Test' }, error: null },
      tenants: { data: { settings: { stripe_customer_id: 'cus_123' } }, error: null },
      audit_logs: { data: null, error: null },
    })

    // Mock storage
    mockSupabase.client.auth.admin.deleteUser = jest.fn().mockResolvedValue({ error: null }) as any
    ;(mockSupabase.client as any).storage = {
      from: jest.fn().mockReturnValue({
        list: jest.fn().mockResolvedValue({ data: [], error: null }),
        remove: jest.fn().mockResolvedValue({ error: null }),
      }),
    }

    const res = await POST(makeRequest({ confirmation: 'DELETE MY ACCOUNT' }))
    expect(res.status).toBe(200)
    expect(mockStripeCustomersDel).toHaveBeenCalledWith('cus_123')
  })

  it('does not call Stripe when no customer ID exists', async () => {
    mockSupabase.mockTableResults({
      users: { data: { tenant_id: 'tenant-456', email: 'test@bureau.com', name: 'Test' }, error: null },
      tenants: { data: { settings: {} }, error: null },
      audit_logs: { data: null, error: null },
    })

    mockSupabase.client.auth.admin.deleteUser = jest.fn().mockResolvedValue({ error: null }) as any
    ;(mockSupabase.client as any).storage = {
      from: jest.fn().mockReturnValue({
        list: jest.fn().mockResolvedValue({ data: [], error: null }),
        remove: jest.fn().mockResolvedValue({ error: null }),
      }),
    }

    const res = await POST(makeRequest({ confirmation: 'DELETE MY ACCOUNT' }))
    expect(res.status).toBe(200)
    expect(mockStripeCustomersDel).not.toHaveBeenCalled()
  })

  it('continues if Stripe deletion fails (non-fatal)', async () => {
    mockStripeCustomersDel.mockRejectedValueOnce(new Error('Stripe error'))

    mockSupabase.mockTableResults({
      users: { data: { tenant_id: 'tenant-456', email: 'test@bureau.com', name: 'Test' }, error: null },
      tenants: { data: { settings: { stripe_customer_id: 'cus_fail' } }, error: null },
      audit_logs: { data: null, error: null },
    })

    mockSupabase.client.auth.admin.deleteUser = jest.fn().mockResolvedValue({ error: null }) as any
    ;(mockSupabase.client as any).storage = {
      from: jest.fn().mockReturnValue({
        list: jest.fn().mockResolvedValue({ data: [], error: null }),
        remove: jest.fn().mockResolvedValue({ error: null }),
      }),
    }

    const res = await POST(makeRequest({ confirmation: 'DELETE MY ACCOUNT' }))
    expect(res.status).toBe(200) // Should succeed despite Stripe failure
  })
})
