import { GET, POST } from '../route'
import { createMockAuthUser } from '@/lib/__tests__/helpers'

// Mock supabase-server
const mockFrom = jest.fn()
const mockSupabase = { from: mockFrom }

jest.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: jest.fn(() => mockSupabase),
  getAuthUser: jest.fn(),
}))

jest.mock('@/lib/stripe', () => ({
  PLANS: {
    free: { clients: 5 },
    pro: { clients: Infinity },
  },
}))

import { getAuthUser } from '@/lib/supabase-server'

const mockGetAuthUser = getAuthUser as jest.MockedFunction<typeof getAuthUser>

// Helper to create chainable query mock
function chainMock(result: { data: unknown; error: unknown; count?: number }) {
  const chain: Record<string, jest.Mock> = {}
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'neq', 'in',
    'gte', 'lte', 'or', 'order', 'limit', 'single', 'maybeSingle']
  for (const m of methods) {
    chain[m] = jest.fn()
  }
  for (const m of methods) {
    chain[m].mockReturnValue({
      ...chain,
      then: (resolve: (v: unknown) => void) => resolve(result),
      data: result.data,
      error: result.error,
      count: result.count,
    })
  }
  return chain
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/clients', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetAuthUser.mockResolvedValue(null)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns clients list scoped by tenant', async () => {
    const authUser = createMockAuthUser()
    mockGetAuthUser.mockResolvedValue(authUser as never)

    const mockClients = [
      { id: 'c1', name: 'Client A', tenant_id: 'tenant-456' },
      { id: 'c2', name: 'Client B', tenant_id: 'tenant-456' },
    ]

    // First call: users table (getOrCreateUser)
    // Second call: clients table
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return chainMock({ data: { tenant_id: 'tenant-456' }, error: null })
      }
      return chainMock({ data: mockClients, error: null })
    })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toHaveLength(2)
    expect(body[0].name).toBe('Client A')
  })

  it('returns empty array when no clients exist', async () => {
    const authUser = createMockAuthUser()
    mockGetAuthUser.mockResolvedValue(authUser as never)

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return chainMock({ data: { tenant_id: 'tenant-456' }, error: null })
      }
      return chainMock({ data: [], error: null })
    })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual([])
  })
})

describe('POST /api/clients', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetAuthUser.mockResolvedValue(null)

    const request = new Request('http://localhost/api/clients', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Client' }),
    })

    const response = await POST(request as never)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 400 on validation error (missing name)', async () => {
    const authUser = createMockAuthUser()
    mockGetAuthUser.mockResolvedValue(authUser as never)

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return chainMock({ data: { tenant_id: 'tenant-456' }, error: null })
      }
      // tenant plan check
      return chainMock({ data: { plan: 'pro' }, error: null })
    })

    const request = new Request('http://localhost/api/clients', {
      method: 'POST',
      body: JSON.stringify({}), // missing required 'name'
    })

    const response = await POST(request as never)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Validation error')
  })

  it('returns 403 when client limit reached on free plan', async () => {
    const authUser = createMockAuthUser()
    mockGetAuthUser.mockResolvedValue(authUser as never)

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // users table
        return chainMock({ data: { tenant_id: 'tenant-456' }, error: null })
      }
      if (callCount === 2) {
        // tenants table (plan check)
        return chainMock({ data: { plan: 'free' }, error: null })
      }
      // clients count check
      return chainMock({ data: null, error: null, count: 5 })
    })

    const request = new Request('http://localhost/api/clients', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Client' }),
    })

    const response = await POST(request as never)
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body.upgrade).toBe(true)
  })

  it('successfully creates a client', async () => {
    const authUser = createMockAuthUser()
    mockGetAuthUser.mockResolvedValue(authUser as never)

    const createdClient = {
      id: 'new-client-id',
      name: 'New Client',
      tenant_id: 'tenant-456',
      status: 'active',
    }

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return chainMock({ data: { tenant_id: 'tenant-456' }, error: null })
      }
      if (callCount === 2) {
        return chainMock({ data: { plan: 'pro' }, error: null })
      }
      // client insert
      return chainMock({ data: createdClient, error: null })
    })

    const request = new Request('http://localhost/api/clients', {
      method: 'POST',
      body: JSON.stringify({ name: 'New Client' }),
    })

    const response = await POST(request as never)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.name).toBe('New Client')
    expect(body.id).toBe('new-client-id')
  })
})
