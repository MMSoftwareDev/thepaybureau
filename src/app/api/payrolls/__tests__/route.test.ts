import { GET, POST } from '../route'
import { createMockAuthUser } from '@/lib/__tests__/helpers'

const mockFrom = jest.fn()
const mockSupabase = { from: mockFrom }

jest.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: jest.fn(() => mockSupabase),
  getAuthUser: jest.fn(),
}))

jest.mock('@/lib/hmrc-deadlines', () => ({
  calculateNextPayDate: jest.fn(() => new Date('2026-04-01')),
  calculatePeriodDates: jest.fn(() => ({
    periodStart: new Date('2026-03-01'),
    periodEnd: new Date('2026-03-31'),
  })),
  calculateRtiDueDate: jest.fn(() => new Date('2026-04-19')),
  calculateEpsDueDate: jest.fn(() => new Date('2026-04-19')),
}))

import { getAuthUser } from '@/lib/supabase-server'

const mockGetAuthUser = getAuthUser as jest.MockedFunction<typeof getAuthUser>

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

describe('GET /api/payrolls', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetAuthUser.mockResolvedValue(null)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns empty array when no payrolls', async () => {
    mockGetAuthUser.mockResolvedValue(createMockAuthUser() as never)

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

  it('returns payrolls with client names and latest run', async () => {
    mockGetAuthUser.mockResolvedValue(createMockAuthUser() as never)

    const mockPayrolls = [
      { id: 'p1', name: 'Monthly Payroll', clients: { name: 'Acme' } },
    ]
    const mockRuns = [
      { id: 'r1', payroll_id: 'p1', pay_date: '2026-03-15', status: 'not_started' },
    ]

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return chainMock({ data: { tenant_id: 'tenant-456' }, error: null })
      }
      if (callCount === 2) {
        return chainMock({ data: mockPayrolls, error: null })
      }
      // payroll_runs
      return chainMock({ data: mockRuns, error: null })
    })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toHaveLength(1)
    expect(body[0].name).toBe('Monthly Payroll')
    expect(body[0].latestRun).toBeDefined()
    expect(body[0].latestRun.id).toBe('r1')
  })
})

describe('POST /api/payrolls', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetAuthUser.mockResolvedValue(null)

    const request = new Request('http://localhost/api/payrolls', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request as never)
    expect(response.status).toBe(401)
  })

  it('returns 404 when client does not belong to tenant', async () => {
    mockGetAuthUser.mockResolvedValue(createMockAuthUser() as never)

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return chainMock({ data: { tenant_id: 'tenant-456' }, error: null })
      }
      // client check — not found
      return chainMock({ data: null, error: { code: 'PGRST116' } })
    })

    const request = new Request('http://localhost/api/payrolls', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Payroll',
        client_id: '00000000-0000-0000-0000-000000000099',
        pay_frequency: 'monthly',
        pay_day: '28',
        checklist_items: [{ name: 'Step 1', sort_order: 0 }],
      }),
    })

    const response = await POST(request as never)
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error).toBe('Client not found')
  })

  it('returns 400 on validation error', async () => {
    mockGetAuthUser.mockResolvedValue(createMockAuthUser() as never)

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      return chainMock({ data: { tenant_id: 'tenant-456' }, error: null })
    })

    const request = new Request('http://localhost/api/payrolls', {
      method: 'POST',
      body: JSON.stringify({}), // missing required fields
    })

    const response = await POST(request as never)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Validation error')
  })

  it('successfully creates payroll with checklist and first run', async () => {
    mockGetAuthUser.mockResolvedValue(createMockAuthUser() as never)

    const createdPayroll = { id: 'p-new', name: 'Monthly', status: 'active' }
    const createdTemplates = [{ id: 't1', name: 'Step 1', sort_order: 0 }]
    const createdRun = { id: 'r-new', status: 'not_started' }

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // users table
        return chainMock({ data: { tenant_id: 'tenant-456' }, error: null })
      }
      if (callCount === 2) {
        // client ownership check
        return chainMock({ data: { id: '00000000-0000-0000-0000-000000000001', name: 'Acme' }, error: null })
      }
      if (callCount === 3) {
        // payroll insert
        return chainMock({ data: createdPayroll, error: null })
      }
      if (callCount === 4) {
        // checklist templates insert
        return chainMock({ data: createdTemplates, error: null })
      }
      if (callCount === 5) {
        // payroll run insert
        return chainMock({ data: createdRun, error: null })
      }
      // checklist items insert
      return chainMock({ data: null, error: null })
    })

    const request = new Request('http://localhost/api/payrolls', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Monthly',
        client_id: '00000000-0000-0000-0000-000000000001',
        pay_frequency: 'monthly',
        pay_day: '28',
        checklist_items: [{ name: 'Step 1', sort_order: 0 }],
      }),
    })

    const response = await POST(request as never)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.id).toBe('p-new')
    expect(body.checklist_templates).toBeDefined()
    expect(body.payroll_run).toBeDefined()
  })
})
