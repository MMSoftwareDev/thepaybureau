import { NextRequest } from 'next/server'

// ── Mocks ────────────────────────────────────────────
const mockConstructEvent = jest.fn()
const mockGetStripe = jest.fn(() => ({
  webhooks: { constructEvent: mockConstructEvent },
}))

jest.mock('@/lib/stripe', () => ({
  getStripe: mockGetStripe,
  PLANS: {
    free: { price: 0, priceId: null, annualPriceId: null, clients: 100, name: 'Free', features: ['Basic'] },
    unlimited: {
      price: 9,
      priceId: 'price_monthly',
      annualPriceId: 'price_annual',
      annualPrice: 7,
      clients: Infinity,
      name: 'Unlimited',
      features: ['Everything'],
    },
  },
}))

const mockFrom = jest.fn()
const mockSupabase = { from: mockFrom }
jest.mock('@/lib/supabase-server', () => ({
  createServerSupabaseClient: () => mockSupabase,
}))

const mockWriteAuditLog = jest.fn().mockResolvedValue(undefined)
jest.mock('@/lib/audit', () => ({
  writeAuditLog: mockWriteAuditLog,
}))

// ── Import handler after mocks are registered ────────
import { POST } from '../route'

// ── Helpers ──────────────────────────────────────────
function makeRequest(body: string, sig?: string): NextRequest {
  const headers: Record<string, string> = { 'content-type': 'text/plain' }
  if (sig) headers['stripe-signature'] = sig
  return new NextRequest('http://localhost/api/stripe/webhook', {
    method: 'POST',
    headers,
    body,
  })
}

// ── Tests ────────────────────────────────────────────
describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 400 when stripe-signature header is missing', async () => {
    const res = await POST(makeRequest('{}'))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/Missing signature/i)
  })

  it('returns 400 when constructEvent throws (invalid signature)', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Signature mismatch')
    })

    const res = await POST(makeRequest('{}', 'bad_sig'))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/Invalid signature/i)
  })

  it('returns deduplicated when event was already processed', async () => {
    mockConstructEvent.mockReturnValue({ id: 'evt_dup', type: 'checkout.session.completed', data: { object: {} } })

    // stripe_events query returns existing row
    mockFrom.mockImplementation((table: string) => {
      if (table === 'stripe_events') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [{ id: '1' }] }),
            }),
          }),
        }
      }
      return {}
    })

    const res = await POST(makeRequest('{}', 'valid_sig'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.deduplicated).toBe(true)
  })

  it('handles checkout.session.completed — updates tenant plan', async () => {
    const event = {
      id: 'evt_checkout',
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { tenant_id: 'tenant_1', plan: 'unlimited' },
        },
      },
    }
    mockConstructEvent.mockReturnValue(event)

    const updateEq = jest.fn().mockResolvedValue({ data: null, error: null })
    const updateFn = jest.fn().mockReturnValue({ eq: updateEq })
    const insertFn = jest.fn().mockResolvedValue({ data: null, error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'stripe_events') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [] }),
            }),
          }),
          insert: insertFn,
        }
      }
      if (table === 'tenants') {
        return { update: updateFn }
      }
      return {}
    })

    const res = await POST(makeRequest('{}', 'valid_sig'))
    expect(res.status).toBe(200)

    // Verify tenant was updated to unlimited
    expect(updateFn).toHaveBeenCalledWith({ plan: 'unlimited' })
    expect(updateEq).toHaveBeenCalledWith('id', 'tenant_1')

    // Verify audit log was written
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant_1',
        action: 'UPDATE',
        resourceType: 'tenant',
      }),
    )

    // Verify event was marked as processed
    expect(insertFn).toHaveBeenCalledWith({
      stripe_event_id: 'evt_checkout',
      event_type: 'checkout.session.completed',
    })
  })

  it('handles customer.subscription.deleted — downgrades to free', async () => {
    const event = {
      id: 'evt_sub_del',
      type: 'customer.subscription.deleted',
      data: {
        object: { customer: 'cus_123' },
      },
    }
    mockConstructEvent.mockReturnValue(event)

    const updateEq = jest.fn().mockResolvedValue({ data: null, error: null })
    const updateFn = jest.fn().mockReturnValue({ eq: updateEq })
    const insertFn = jest.fn().mockResolvedValue({ data: null, error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'stripe_events') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [] }),
            }),
          }),
          insert: insertFn,
        }
      }
      if (table === 'tenants') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: { id: 'tenant_1' } }),
            }),
          }),
          update: updateFn,
        }
      }
      return {}
    })

    const res = await POST(makeRequest('{}', 'valid_sig'))
    expect(res.status).toBe(200)

    // Verify tenant was downgraded to free
    expect(updateFn).toHaveBeenCalledWith({ plan: 'free' })
    expect(updateEq).toHaveBeenCalledWith('id', 'tenant_1')

    // Verify audit log records the downgrade
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceName: expect.stringContaining('free'),
      }),
    )
  })

  it('handles invoice.payment_failed — records failure metadata', async () => {
    const event = {
      id: 'evt_inv_fail',
      type: 'invoice.payment_failed',
      data: {
        object: { id: 'in_999', customer: 'cus_456' },
      },
    }
    mockConstructEvent.mockReturnValue(event)

    const updateEq = jest.fn().mockResolvedValue({ data: null, error: null })
    const updateFn = jest.fn().mockReturnValue({ eq: updateEq })
    const insertFn = jest.fn().mockResolvedValue({ data: null, error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'stripe_events') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [] }),
            }),
          }),
          insert: insertFn,
        }
      }
      if (table === 'tenants') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'tenant_2', settings: { stripe_customer_id: 'cus_456' } },
              }),
            }),
          }),
          update: updateFn,
        }
      }
      return {}
    })

    const res = await POST(makeRequest('{}', 'valid_sig'))
    expect(res.status).toBe(200)

    // Verify settings were updated with failure metadata
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({
        settings: expect.objectContaining({
          stripe_customer_id: 'cus_456',
          payment_failed_invoice_id: 'in_999',
        }),
      }),
    )

    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceName: 'Payment failed',
        changes: { payment_failed_invoice_id: 'in_999' },
      }),
    )
  })
})
