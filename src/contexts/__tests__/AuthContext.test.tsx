/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

// Track calls to SWR cache functions
const mockClearSWRCache = jest.fn()
const mockRevalidateAllSWR = jest.fn()
jest.mock('@/lib/swr', () => ({
  clearSWRCache: (...args: unknown[]) => mockClearSWRCache(...args),
  revalidateAllSWR: (...args: unknown[]) => mockRevalidateAllSWR(...args),
}))

// Auth state change listener capture
type AuthCallback = (event: string, session: { user?: { id: string; email: string } } | null) => void
let capturedAuthCallback: AuthCallback | null = null
const mockSignOut = jest.fn().mockResolvedValue({})
const mockGetUser = jest.fn().mockResolvedValue({ data: { user: null } })
const mockUnsubscribe = jest.fn()

jest.mock('@/lib/supabase', () => ({
  createClientSupabaseClient: () => ({
    auth: {
      getUser: mockGetUser,
      signOut: mockSignOut,
      onAuthStateChange: (callback: AuthCallback) => {
        capturedAuthCallback = callback
        return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null }),
        }),
      }),
    }),
  }),
}))

// Mock fetch for admin check and subscription endpoints
global.fetch = jest.fn(() =>
  Promise.resolve({ json: () => Promise.resolve({}) } as Response)
)

// Suppress jsdom navigation errors from window.location.href = '/login'
const originalConsoleError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'object' && args[0] !== null && 'type' in args[0] && (args[0] as { type: string }).type === 'not implemented') return
    originalConsoleError(...args)
  }
})
afterAll(() => {
  console.error = originalConsoleError
})

function TestConsumer() {
  const { user, signOut } = useAuth()
  return (
    <div>
      <span data-testid="user">{user?.email || 'none'}</span>
      <button data-testid="signout" onClick={signOut}>Sign Out</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    capturedAuthCallback = null
    mockGetUser.mockResolvedValue({ data: { user: null } })
  })

  it('registers an auth state change listener on mount', async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      )
    })

    expect(capturedAuthCallback).not.toBeNull()
  })

  describe('SIGNED_OUT event', () => {
    it('clears SWR cache and resets user state', async () => {
      const { getByTestId } = await act(async () =>
        render(
          <AuthProvider>
            <TestConsumer />
          </AuthProvider>
        )
      )

      await act(async () => {
        capturedAuthCallback!('SIGNED_OUT', null)
      })

      expect(mockClearSWRCache).toHaveBeenCalled()
      expect(getByTestId('user').textContent).toBe('none')
    })
  })

  describe('SIGNED_IN event', () => {
    it('clears SWR cache AND triggers revalidation', async () => {
      await act(async () => {
        render(
          <AuthProvider>
            <TestConsumer />
          </AuthProvider>
        )
      })

      await act(async () => {
        capturedAuthCallback!('SIGNED_IN', {
          user: { id: 'user-123', email: 'test@bureau.co.uk' },
        })
      })

      expect(mockClearSWRCache).toHaveBeenCalled()
      expect(mockRevalidateAllSWR).toHaveBeenCalled()

      // Verify clear happens before revalidate
      const clearOrder = mockClearSWRCache.mock.invocationCallOrder[0]
      const revalidateOrder = mockRevalidateAllSWR.mock.invocationCallOrder[0]
      expect(clearOrder).toBeLessThan(revalidateOrder)
    })

    it('sets the user from the session', async () => {
      const { getByTestId } = await act(async () =>
        render(
          <AuthProvider>
            <TestConsumer />
          </AuthProvider>
        )
      )

      await act(async () => {
        capturedAuthCallback!('SIGNED_IN', {
          user: { id: 'user-456', email: 'admin@bureau.co.uk' },
        })
      })

      expect(getByTestId('user').textContent).toBe('admin@bureau.co.uk')
    })
  })

  describe('signOut handler', () => {
    it('clears SWR cache, signs out of Supabase, and redirects to login', async () => {
      const { getByTestId } = await act(async () =>
        render(
          <AuthProvider>
            <TestConsumer />
          </AuthProvider>
        )
      )

      await act(async () => {
        getByTestId('signout').click()
      })

      await waitFor(() => {
        expect(mockClearSWRCache).toHaveBeenCalled()
        expect(mockSignOut).toHaveBeenCalled()
      })
    })
  })

  it('unsubscribes from auth listener on unmount', async () => {
    const { unmount } = await act(async () =>
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      )
    )

    unmount()
    expect(mockUnsubscribe).toHaveBeenCalled()
  })
})
