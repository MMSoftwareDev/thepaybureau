import { GET } from '../stats/route'
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

beforeEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/dashboard/stats', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetAuthUser.mockResolvedValue(null)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns correct KPI counts with no data', async () => {
    mockGetAuthUser.mockResolvedValue(createMockAuthUser() as never)

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // users table
        return chainMock({ data: { tenant_id: 'tenant-456' }, error: null })
      }
      if (callCount === 2) {
        // clients table
        return chainMock({ data: [], error: null })
      }
      // payroll_runs table
      return chainMock({ data: [], error: null })
    })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.totalClients).toBe(0)
    expect(body.totalEmployees).toBe(0)
    expect(body.dueThisWeek).toBe(0)
    expect(body.overdue).toBe(0)
    expect(body.completedThisMonth).toBe(0)
    expect(body.completionTrend).toHaveLength(6)
    expect(body.recentActivity).toEqual([])
  })

  it('returns correct client counts and employee totals', async () => {
    mockGetAuthUser.mockResolvedValue(createMockAuthUser() as never)

    const mockClients = [
      { id: 'c1', name: 'Acme', status: 'active', employee_count: 10, created_at: '2026-01-01' },
      { id: 'c2', name: 'Beta', status: 'active', employee_count: 25, created_at: '2026-02-01' },
      { id: 'c3', name: 'Gamma', status: 'inactive', employee_count: 5, created_at: '2026-03-01' },
    ]

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return chainMock({ data: { tenant_id: 'tenant-456' }, error: null })
      }
      if (callCount === 2) {
        return chainMock({ data: mockClients, error: null })
      }
      return chainMock({ data: [], error: null })
    })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.totalClients).toBe(3)
    expect(body.totalEmployees).toBe(40)
    expect(body.clientStatusDistribution).toContainEqual({ name: 'Active', value: 2 })
    expect(body.clientStatusDistribution).toContainEqual({ name: 'Inactive', value: 1 })
  })

  it('returns correct completion trend (6 months)', async () => {
    mockGetAuthUser.mockResolvedValue(createMockAuthUser() as never)

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return chainMock({ data: { tenant_id: 'tenant-456' }, error: null })
      }
      if (callCount === 2) {
        return chainMock({ data: [], error: null })
      }
      return chainMock({ data: [], error: null })
    })

    const response = await GET()
    const body = await response.json()

    expect(body.completionTrend).toHaveLength(6)
    for (const month of body.completionTrend) {
      expect(month).toHaveProperty('month')
      expect(month).toHaveProperty('completed')
      expect(month).toHaveProperty('total')
    }
  })

  it('identifies overdue runs correctly', async () => {
    mockGetAuthUser.mockResolvedValue(createMockAuthUser() as never)

    // Create a run with a pay date in the past and not complete
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 3)
    const pastDate = yesterday.toISOString().split('T')[0]

    const mockRuns = [
      {
        id: 'run-1',
        client_id: 'c1',
        pay_date: pastDate,
        status: 'not_started',
        rti_due_date: null,
        eps_due_date: null,
        created_at: '2026-03-01',
        updated_at: '2026-03-01',
        clients: { name: 'Acme', id: 'c1' },
        checklist_items: [{ id: 'i1', is_completed: false }],
      },
    ]

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return chainMock({ data: { tenant_id: 'tenant-456' }, error: null })
      }
      if (callCount === 2) {
        return chainMock({ data: [{ id: 'c1', name: 'Acme', status: 'active', employee_count: 10, created_at: '2026-01-01' }], error: null })
      }
      return chainMock({ data: mockRuns, error: null })
    })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.overdue).toBeGreaterThanOrEqual(1)
    expect(body.overdueRuns.length).toBeGreaterThanOrEqual(1)
    expect(body.overdueRuns[0].clientName).toBe('Acme')
    expect(body.overdueRuns[0].daysOverdue).toBeGreaterThanOrEqual(1)
  })

  it('sorts action required: red first, then amber', async () => {
    mockGetAuthUser.mockResolvedValue(createMockAuthUser() as never)

    const today = new Date()
    const twoDaysAgo = new Date(today)
    twoDaysAgo.setDate(today.getDate() - 2)
    const twoDaysFromNow = new Date(today)
    twoDaysFromNow.setDate(today.getDate() + 2)

    const mockRuns = [
      {
        id: 'run-overdue',
        client_id: 'c1',
        pay_date: twoDaysAgo.toISOString().split('T')[0],
        status: 'not_started',
        rti_due_date: null,
        eps_due_date: null,
        created_at: '2026-03-01',
        updated_at: '2026-03-01',
        clients: { name: 'Overdue Co', id: 'c1' },
        checklist_items: [{ id: 'i1', is_completed: false }],
      },
      {
        id: 'run-upcoming',
        client_id: 'c2',
        pay_date: twoDaysFromNow.toISOString().split('T')[0],
        status: 'not_started',
        rti_due_date: null,
        eps_due_date: null,
        created_at: '2026-03-01',
        updated_at: '2026-03-01',
        clients: { name: 'Upcoming Co', id: 'c2' },
        checklist_items: [{ id: 'i2', is_completed: false }],
      },
    ]

    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return chainMock({ data: { tenant_id: 'tenant-456' }, error: null })
      }
      if (callCount === 2) {
        return chainMock({
          data: [
            { id: 'c1', name: 'Overdue Co', status: 'active', employee_count: 5, created_at: '2026-01-01' },
            { id: 'c2', name: 'Upcoming Co', status: 'active', employee_count: 10, created_at: '2026-01-01' },
          ],
          error: null,
        })
      }
      return chainMock({ data: mockRuns, error: null })
    })

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    if (body.actionRequired.length >= 2) {
      // Red items should come before amber items
      const firstRed = body.actionRequired.findIndex((a: { severity: string }) => a.severity === 'red')
      const firstAmber = body.actionRequired.findIndex((a: { severity: string }) => a.severity === 'amber')
      if (firstRed !== -1 && firstAmber !== -1) {
        expect(firstRed).toBeLessThan(firstAmber)
      }
    }
  })
})
