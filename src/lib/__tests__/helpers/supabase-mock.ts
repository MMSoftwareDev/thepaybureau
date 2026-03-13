// Reusable Supabase mock factory for API route tests
// Provides chainable builder pattern matching the real Supabase client

export interface MockQueryResult {
  data: unknown
  error: unknown
  count?: number
}

type MockQueryChain = {
  select: jest.Mock
  insert: jest.Mock
  update: jest.Mock
  delete: jest.Mock
  upsert: jest.Mock
  eq: jest.Mock
  neq: jest.Mock
  in: jest.Mock
  gte: jest.Mock
  lte: jest.Mock
  or: jest.Mock
  order: jest.Mock
  limit: jest.Mock
  single: jest.Mock
  maybeSingle: jest.Mock
  rpc: jest.Mock
}

/**
 * Creates a mock Supabase client with chainable methods.
 * Call `mockResult()` to set the resolved value for the current chain.
 */
export function createMockSupabaseClient() {
  let currentResult: MockQueryResult = { data: null, error: null }

  const chain: MockQueryChain = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    eq: jest.fn(),
    neq: jest.fn(),
    in: jest.fn(),
    gte: jest.fn(),
    lte: jest.fn(),
    or: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    rpc: jest.fn(),
  }

  // Every chainable method returns the chain itself (as a Promise-like)
  for (const key of Object.keys(chain) as Array<keyof MockQueryChain>) {
    chain[key].mockImplementation((..._args: unknown[]) => {
      return {
        ...chain,
        then: (resolve: (val: MockQueryResult) => void) => resolve(currentResult),
        data: currentResult.data,
        error: currentResult.error,
        count: currentResult.count,
      }
    })
  }

  const from = jest.fn((_table: string) => ({
    ...chain,
    then: (resolve: (val: MockQueryResult) => void) => resolve(currentResult),
    data: currentResult.data,
    error: currentResult.error,
  }))

  const rpc = jest.fn((_fn: string, _params?: unknown) => ({
    then: (resolve: (val: MockQueryResult) => void) => resolve(currentResult),
    data: currentResult.data,
    error: currentResult.error,
  }))

  const mockClient = {
    from,
    rpc,
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      admin: {
        createUser: jest.fn(),
        deleteUser: jest.fn(),
      },
    },
  }

  /**
   * Set the result that subsequent chain calls will resolve to.
   */
  function mockResult(result: MockQueryResult) {
    currentResult = result
  }

  /**
   * Set up a per-table result map. When `from(table)` is called,
   * it resolves to the mapped result.
   */
  function mockTableResults(tableMap: Record<string, MockQueryResult>) {
    from.mockImplementation((table: string) => {
      const result = tableMap[table] || { data: null, error: null }

      const tableChain: Record<string, jest.Mock> = {}
      for (const key of Object.keys(chain) as Array<keyof MockQueryChain>) {
        tableChain[key] = jest.fn().mockImplementation(() => ({
          ...tableChain,
          then: (resolve: (val: MockQueryResult) => void) => resolve(result),
          data: result.data,
          error: result.error,
          count: result.count,
        }))
      }

      return {
        ...tableChain,
        then: (resolve: (val: MockQueryResult) => void) => resolve(result),
        data: result.data,
        error: result.error,
      }
    })
  }

  return { client: mockClient, mockResult, mockTableResults, from, chain }
}

/**
 * Standard mock auth user for tests.
 */
export function createMockAuthUser(overrides: Partial<{
  id: string
  email: string
  user_metadata: Record<string, unknown>
}> = {}) {
  return {
    id: overrides.id ?? 'user-123',
    email: overrides.email ?? 'test@bureau.com',
    user_metadata: overrides.user_metadata ?? { name: 'Test User' },
    aud: 'authenticated',
    role: 'authenticated',
    created_at: '2026-01-01T00:00:00Z',
  }
}

/**
 * Standard mock user row from `users` table.
 */
export function createMockUser(overrides: Partial<{
  id: string
  tenant_id: string
  email: string
  name: string
}> = {}) {
  return {
    id: overrides.id ?? 'user-123',
    tenant_id: overrides.tenant_id ?? 'tenant-456',
    email: overrides.email ?? 'test@bureau.com',
    name: overrides.name ?? 'Test User',
  }
}
