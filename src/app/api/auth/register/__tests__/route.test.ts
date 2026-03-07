import { NextRequest } from 'next/server'

// ── Mocks ────────────────────────────────────────────
const mockFrom = jest.fn()
const mockSignUp = jest.fn()
const mockDeleteUser = jest.fn()
const mockSupabase = {
  from: mockFrom,
  auth: {
    signUp: mockSignUp,
    admin: { deleteUser: mockDeleteUser },
  },
}

jest.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: () => mockSupabase,
}))

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn().mockResolvedValue({ success: true, remaining: 4, resetAt: Date.now() + 900_000 }),
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
}))

jest.mock('@/lib/resend', () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/lib/email-templates', () => ({
  welcomeEmail: jest.fn().mockReturnValue({ subject: 'Welcome', html: '<p>Hi</p>' }),
}))

jest.mock('dns/promises', () => ({
  resolveMx: jest.fn().mockResolvedValue([{ exchange: 'mx.example.com', priority: 10 }]),
}))

// ── Import handler after mocks ───────────────────────
import { POST } from '../route'
import { rateLimit } from '@/lib/rate-limit'

// ── Helpers ──────────────────────────────────────────
function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validBody = {
  email: 'admin@acmecorp.com',
  password: 'StrongP@ss1',
  companyName: 'Acme Corp',
  adminName: 'Jane Doe',
}

// ── Tests ────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(rateLimit as jest.Mock).mockResolvedValue({ success: true, remaining: 4, resetAt: Date.now() + 900_000 })
  })

  it('returns 429 when rate limited', async () => {
    ;(rateLimit as jest.Mock).mockResolvedValue({
      success: false,
      remaining: 0,
      resetAt: Date.now() + 60_000,
    })

    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(429)
    const json = await res.json()
    expect(json.error).toMatch(/too many/i)
  })

  it('rejects disposable email domains', async () => {
    const res = await POST(
      makeRequest({ ...validBody, email: 'user@mailinator.com' }),
    )
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/validation/i)
  })

  it('rejects personal email domains (gmail.com, etc.)', async () => {
    const res = await POST(
      makeRequest({ ...validBody, email: 'user@gmail.com' }),
    )
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/validation/i)
  })

  it('returns 400 for invalid input (missing required fields)', async () => {
    const res = await POST(makeRequest({ email: 'bad' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/validation/i)
  })

  it('creates tenant and user on valid registration', async () => {
    // users.select().eq().single() — no existing user
    const usersSelectChain = {
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      }),
    }

    const tenantInsertSingle = jest.fn().mockResolvedValue({
      data: { id: 'new_tenant_id' },
      error: null,
    })
    const tenantInsertSelect = jest.fn().mockReturnValue({ single: tenantInsertSingle })
    const tenantInsert = jest.fn().mockReturnValue({ select: tenantInsertSelect })

    const userInsertSingle = jest.fn().mockResolvedValue({
      data: { id: 'user_id' },
      error: null,
    })
    const userInsertSelect = jest.fn().mockReturnValue({ single: userInsertSingle })
    const userInsert = jest.fn().mockReturnValue({ select: userInsertSelect })

    let usersCallCount = 0

    mockFrom.mockImplementation((table: string) => {
      if (table === 'users') {
        usersCallCount++
        if (usersCallCount === 1) {
          return { select: jest.fn().mockReturnValue(usersSelectChain) }
        }
        return { insert: userInsert }
      }
      if (table === 'tenants') {
        return { insert: tenantInsert }
      }
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null }),
          }),
        }),
      }
    })

    mockSignUp.mockResolvedValue({
      data: { user: { id: 'auth_user_123' } },
      error: null,
    })

    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)

    // Verify auth signUp was called with the email
    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'admin@acmecorp.com',
        password: 'StrongP@ss1',
      }),
    )

    // Verify tenant was created with trial plan
    expect(tenantInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Acme Corp',
        plan: 'trial',
      }),
    )

    // Verify user profile was created with admin role
    expect(userInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'auth_user_123',
        tenant_id: 'new_tenant_id',
        email: 'admin@acmecorp.com',
        role: 'admin',
      }),
    )
  })
})
