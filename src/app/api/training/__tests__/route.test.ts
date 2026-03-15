import { GET, POST, PUT, DELETE } from '../route'
import { createMockSupabaseClient, createMockAuthUser } from '@/lib/__tests__/helpers/supabase-mock'

// Mock Supabase server
const mockSupabase = createMockSupabaseClient()
jest.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: () => mockSupabase.client,
  getAuthUser: jest.fn(),
}))

// Mock stripe
jest.mock('@/lib/stripe', () => ({
  hasPaidFeature: jest.fn((plan: string) => plan === 'unlimited'),
  PLANS: { free: { clients: 50 }, unlimited: { clients: Infinity } },
}))

import { getAuthUser } from '@/lib/supabase-server'

const mockGetAuthUser = getAuthUser as jest.MockedFunction<typeof getAuthUser>

function makeRequest(body?: unknown) {
  return new Request('http://localhost/api/training', {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }) as unknown as Parameters<typeof POST>[0]
}

function makeDeleteRequest(id: string) {
  return new Request(`http://localhost/api/training?id=${id}`, {
    method: 'DELETE',
  }) as unknown as Parameters<typeof DELETE>[0]
}

describe('Training API - Subscription Enforcement', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetAuthUser.mockResolvedValue(createMockAuthUser() as any)
  })

  describe('free plan users get 403', () => {
    beforeEach(() => {
      mockSupabase.mockTableResults({
        users: { data: { tenant_id: 'tenant-456' }, error: null },
        tenants: { data: { plan: 'free' }, error: null },
      })
    })

    it('GET returns 403 for free plan', async () => {
      const res = await GET()
      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error).toContain('Unlimited plan')
    })

    it('POST returns 403 for free plan', async () => {
      const res = await POST(makeRequest({ title: 'Test Training' }))
      expect(res.status).toBe(403)
    })

    it('DELETE returns 403 for free plan', async () => {
      const res = await DELETE(makeDeleteRequest('some-id'))
      expect(res.status).toBe(403)
    })
  })

  describe('unlimited plan users get access', () => {
    beforeEach(() => {
      mockSupabase.mockTableResults({
        users: { data: { tenant_id: 'tenant-456' }, error: null },
        tenants: { data: { plan: 'unlimited' }, error: null },
        training_records: { data: [], error: null },
      })
    })

    it('GET returns 200 for unlimited plan', async () => {
      const res = await GET()
      expect(res.status).toBe(200)
    })
  })

  it('returns 401 if not authenticated', async () => {
    mockGetAuthUser.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })
})
