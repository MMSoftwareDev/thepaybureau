import { POST } from '../actions/route'
import { createMockAuthUser } from '@/lib/__tests__/helpers'

const mockFrom = jest.fn()
const mockSupabase = { from: mockFrom }

jest.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: jest.fn(() => mockSupabase),
  getAuthUser: jest.fn(),
}))

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn().mockResolvedValue({ success: true, remaining: 29 }),
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
}))

import { getAuthUser } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rate-limit'

const mockGetAuthUser = getAuthUser as jest.MockedFunction<typeof getAuthUser>
const mockRateLimit = rateLimit as jest.MockedFunction<typeof rateLimit>

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

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/payroll-runs/actions', {
    method: 'POST',
    headers: { 'x-forwarded-for': '127.0.0.1' },
    body: JSON.stringify(body),
  }) as never
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRateLimit.mockResolvedValue({ success: true, remaining: 29, resetAt: Date.now() + 60000 })
})

describe('POST /api/payroll-runs/actions', () => {
  it('returns 429 when rate limited', async () => {
    mockRateLimit.mockResolvedValue({ success: false, remaining: 0, resetAt: Date.now() + 60000 })

    const response = await POST(makeRequest({ action: 'toggle_item', item_id: '00000000-0000-0000-0000-000000000001', is_completed: true }))
    const body = await response.json()

    expect(response.status).toBe(429)
    expect(body.error).toContain('Too many requests')
  })

  it('returns 401 when not authenticated', async () => {
    mockGetAuthUser.mockResolvedValue(null)

    const response = await POST(makeRequest({ action: 'toggle_item', item_id: '00000000-0000-0000-0000-000000000001', is_completed: true }))
    expect(response.status).toBe(401)
  })

  it('returns 400 on invalid action schema', async () => {
    mockGetAuthUser.mockResolvedValue(createMockAuthUser() as never)

    mockFrom.mockImplementation(() =>
      chainMock({ data: { tenant_id: 'tenant-456' }, error: null })
    )

    const response = await POST(makeRequest({ action: 'invalid_action' }))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Validation error')
  })

  describe('toggle_item', () => {
    it('returns 404 when item not found', async () => {
      mockGetAuthUser.mockResolvedValue(createMockAuthUser() as never)

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return chainMock({ data: { tenant_id: 'tenant-456' }, error: null })
        }
        // checklist_items lookup — not found
        return chainMock({ data: null, error: null })
      })

      const response = await POST(makeRequest({
        action: 'toggle_item',
        item_id: '00000000-0000-0000-0000-000000000001',
        is_completed: true,
      }))
      const body = await response.json()

      expect(response.status).toBe(404)
      expect(body.error).toBe('Item not found')
    })

    it('successfully toggles item', async () => {
      mockGetAuthUser.mockResolvedValue(createMockAuthUser() as never)

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return chainMock({ data: { tenant_id: 'tenant-456' }, error: null })
        }
        if (callCount === 2) {
          // checklist_items lookup
          return chainMock({
            data: { id: 'item-1', name: 'Run payroll', payroll_run_id: 'run-1', is_completed: false },
            error: null,
          })
        }
        if (callCount === 3) {
          // payroll_runs tenant check
          return chainMock({
            data: { id: 'run-1', tenant_id: 'tenant-456', client_id: 'c1', payroll_id: 'p1', clients: { name: 'Acme' } },
            error: null,
          })
        }
        // update
        return chainMock({ data: null, error: null })
      })

      const response = await POST(makeRequest({
        action: 'toggle_item',
        item_id: '00000000-0000-0000-0000-000000000001',
        is_completed: true,
      }))
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.success).toBe(true)
    })
  })

  describe('mark_all_complete', () => {
    it('returns 404 when run not found', async () => {
      mockGetAuthUser.mockResolvedValue(createMockAuthUser() as never)

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return chainMock({ data: { tenant_id: 'tenant-456' }, error: null })
        }
        // payroll_runs lookup — not found
        return chainMock({ data: null, error: null })
      })

      const response = await POST(makeRequest({
        action: 'mark_all_complete',
        payroll_run_id: '00000000-0000-0000-0000-000000000001',
      }))
      const body = await response.json()

      expect(response.status).toBe(404)
    })

    it('returns success when all already complete', async () => {
      mockGetAuthUser.mockResolvedValue(createMockAuthUser() as never)

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return chainMock({ data: { tenant_id: 'tenant-456' }, error: null })
        }
        if (callCount === 2) {
          // run check
          return chainMock({
            data: { id: 'run-1', tenant_id: 'tenant-456', client_id: 'c1', clients: { name: 'Acme' } },
            error: null,
          })
        }
        // incomplete items — empty
        return chainMock({ data: [], error: null })
      })

      const response = await POST(makeRequest({
        action: 'mark_all_complete',
        payroll_run_id: '00000000-0000-0000-0000-000000000001',
      }))
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.message).toBe('All already complete')
    })
  })

  describe('save_notes', () => {
    it('returns 404 when run not found', async () => {
      mockGetAuthUser.mockResolvedValue(createMockAuthUser() as never)

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return chainMock({ data: { tenant_id: 'tenant-456' }, error: null })
        }
        return chainMock({ data: null, error: null })
      })

      const response = await POST(makeRequest({
        action: 'save_notes',
        payroll_run_id: '00000000-0000-0000-0000-000000000001',
        notes: 'Test notes',
      }))

      expect(response.status).toBe(404)
    })

    it('successfully saves notes', async () => {
      mockGetAuthUser.mockResolvedValue(createMockAuthUser() as never)

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return chainMock({ data: { tenant_id: 'tenant-456' }, error: null })
        }
        if (callCount === 2) {
          return chainMock({
            data: { id: 'run-1', tenant_id: 'tenant-456', notes: 'Old', client_id: 'c1', clients: { name: 'Acme' } },
            error: null,
          })
        }
        return chainMock({ data: null, error: null })
      })

      const response = await POST(makeRequest({
        action: 'save_notes',
        payroll_run_id: '00000000-0000-0000-0000-000000000001',
        notes: 'Updated notes',
      }))
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.success).toBe(true)
    })
  })

  describe('add_step', () => {
    it('returns 404 when run not found', async () => {
      mockGetAuthUser.mockResolvedValue(createMockAuthUser() as never)

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return chainMock({ data: { tenant_id: 'tenant-456' }, error: null })
        }
        return chainMock({ data: null, error: null })
      })

      const response = await POST(makeRequest({
        action: 'add_step',
        payroll_run_id: '00000000-0000-0000-0000-000000000001',
        name: 'New Step',
        sort_order: 0,
      }))

      expect(response.status).toBe(404)
    })

    it('successfully adds a step', async () => {
      mockGetAuthUser.mockResolvedValue(createMockAuthUser() as never)

      const newItem = { id: 'item-new', name: 'New Step', is_completed: false, sort_order: 5 }

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return chainMock({ data: { tenant_id: 'tenant-456' }, error: null })
        }
        if (callCount === 2) {
          return chainMock({
            data: { id: 'run-1', tenant_id: 'tenant-456', client_id: 'c1', clients: { name: 'Acme' } },
            error: null,
          })
        }
        return chainMock({ data: newItem, error: null })
      })

      const response = await POST(makeRequest({
        action: 'add_step',
        payroll_run_id: '00000000-0000-0000-0000-000000000001',
        name: 'New Step',
        sort_order: 5,
      }))
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.name).toBe('New Step')
    })
  })
})
