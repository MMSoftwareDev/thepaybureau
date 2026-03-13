import { GET, PUT, DELETE } from '../[id]/route'
import { createMockAuthUser } from '@/lib/__tests__/helpers'

const mockFrom = jest.fn()
const mockSupabase = { from: mockFrom }

jest.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: jest.fn(() => mockSupabase),
  getAuthUser: jest.fn(),
}))

import { getAuthUser } from '@/lib/supabase-server'

const mockGetAuthUser = getAuthUser as jest.MockedFunction<typeof getAuthUser>

function chainMock(result: { data: unknown; error: unknown }) {
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
    })
  }
  return chain
}

const mockParams = Promise.resolve({ id: 'client-789' })

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/clients/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetAuthUser.mockResolvedValue(null)

    const request = new Request('http://localhost/api/clients/client-789')
    const response = await GET(request as never, { params: mockParams })
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 404 when client not found', async () => {
    mockGetAuthUser.mockResolvedValue(createMockAuthUser() as never)

    const results: Array<{ data: unknown; error: unknown }> = [
      { data: { tenant_id: 'tenant-456' }, error: null },
      { data: null, error: { code: 'PGRST116', message: 'No rows' } },
    ]
    let callIdx = 0
    mockFrom.mockImplementation(() => {
      const result = results[Math.min(callIdx++, results.length - 1)]
      return chainMock(result)
    })

    const request = new Request('http://localhost/api/clients/client-789')
    const response = await GET(request as never, { params: mockParams })
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error).toBe('Client not found')
  })

  it('returns client with payroll runs when found', async () => {
    mockGetAuthUser.mockResolvedValue(createMockAuthUser() as never)

    const mockClient = { id: 'client-789', name: 'Acme Ltd', tenant_id: 'tenant-456' }
    const mockRuns = [{ id: 'run-1', pay_date: '2026-03-15', status: 'not_started' }]

    const results: Array<{ data: unknown; error: unknown }> = [
      { data: { tenant_id: 'tenant-456' }, error: null },
      { data: mockClient, error: null },
      { data: mockRuns, error: null },
    ]
    let callIdx = 0
    mockFrom.mockImplementation(() => {
      const result = results[Math.min(callIdx++, results.length - 1)]
      return chainMock(result)
    })

    const request = new Request('http://localhost/api/clients/client-789')
    const response = await GET(request as never, { params: mockParams })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.name).toBe('Acme Ltd')
    expect(body.payroll_runs).toHaveLength(1)
  })
})

describe('PUT /api/clients/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetAuthUser.mockResolvedValue(null)

    const request = new Request('http://localhost/api/clients/client-789', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
    })
    const response = await PUT(request as never, { params: mockParams })

    expect(response.status).toBe(401)
  })

  it('returns 404 when client not in tenant', async () => {
    mockGetAuthUser.mockResolvedValue(createMockAuthUser() as never)

    const results: Array<{ data: unknown; error: unknown }> = [
      { data: { tenant_id: 'tenant-456' }, error: null }, // users lookup
      { data: null, error: null }, // existing client — not found
    ]
    let callIdx = 0
    mockFrom.mockImplementation(() => {
      const result = results[Math.min(callIdx++, results.length - 1)]
      return chainMock(result)
    })

    const request = new Request('http://localhost/api/clients/client-789', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
    })
    const response = await PUT(request as never, { params: mockParams })
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error).toBe('Client not found')
  })

  it('returns 400 on validation error', async () => {
    mockGetAuthUser.mockResolvedValue(createMockAuthUser() as never)

    const request = new Request('http://localhost/api/clients/client-789', {
      method: 'PUT',
      body: JSON.stringify({ email: 'not-an-email' }),
    })
    const response = await PUT(request as never, { params: mockParams })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Validation error')
  })
})

describe('DELETE /api/clients/[id]', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetAuthUser.mockResolvedValue(null)

    const request = new Request('http://localhost/api/clients/client-789', { method: 'DELETE' })
    const response = await DELETE(request as never, { params: mockParams })

    expect(response.status).toBe(401)
  })

  it('returns 404 when client not found', async () => {
    mockGetAuthUser.mockResolvedValue(createMockAuthUser() as never)

    const results: Array<{ data: unknown; error: unknown }> = [
      { data: { tenant_id: 'tenant-456' }, error: null }, // users
      { data: null, error: null }, // client name lookup — not found
    ]
    let callIdx = 0
    mockFrom.mockImplementation(() => {
      const result = results[Math.min(callIdx++, results.length - 1)]
      return chainMock(result)
    })

    const request = new Request('http://localhost/api/clients/client-789', { method: 'DELETE' })
    const response = await DELETE(request as never, { params: mockParams })
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error).toBe('Client not found')
  })

  it('successfully deletes client', async () => {
    mockGetAuthUser.mockResolvedValue(createMockAuthUser() as never)

    const results: Array<{ data: unknown; error: unknown }> = [
      { data: { tenant_id: 'tenant-456' }, error: null }, // users
      { data: { name: 'Acme Ltd' }, error: null }, // client name
      { data: null, error: null }, // delete
    ]
    let callIdx = 0
    mockFrom.mockImplementation(() => {
      const result = results[Math.min(callIdx++, results.length - 1)]
      return chainMock(result)
    })

    const request = new Request('http://localhost/api/clients/client-789', { method: 'DELETE' })
    const response = await DELETE(request as never, { params: mockParams })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.message).toBe('Client deleted successfully')
    expect(body.id).toBe('client-789')
  })
})
