import { clearSWRCache, revalidateAllSWR, defaultConfig } from '@/lib/swr'
import { mutate } from 'swr'

jest.mock('swr', () => {
  const mockMutate = jest.fn()
  const mockUseSWR = jest.fn(() => ({
    data: undefined,
    error: undefined,
    isLoading: true,
    mutate: jest.fn(),
  }))
  return {
    __esModule: true,
    default: mockUseSWR,
    mutate: mockMutate,
  }
})

describe('SWR utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('defaultConfig', () => {
    it('disables revalidation on focus', () => {
      expect(defaultConfig.revalidateOnFocus).toBe(false)
    })

    it('sets dedupingInterval to 2000ms', () => {
      expect(defaultConfig.dedupingInterval).toBe(2000)
    })
  })

  describe('clearSWRCache', () => {
    it('clears all cache entries without revalidating', () => {
      clearSWRCache()

      expect(mutate).toHaveBeenCalledTimes(1)
      const [matcherFn, data, options] = (mutate as jest.Mock).mock.calls[0]
      expect(typeof matcherFn).toBe('function')
      expect(matcherFn('any-key')).toBe(true)
      expect(data).toBeUndefined()
      expect(options).toEqual({ revalidate: false })
    })
  })

  describe('revalidateAllSWR', () => {
    it('triggers revalidation on all mounted hooks', () => {
      revalidateAllSWR()

      expect(mutate).toHaveBeenCalledTimes(1)
      const [matcherFn] = (mutate as jest.Mock).mock.calls[0]
      expect(typeof matcherFn).toBe('function')
      expect(matcherFn('any-key')).toBe(true)
    })

    it('does not pass revalidate: false', () => {
      revalidateAllSWR()

      const call = (mutate as jest.Mock).mock.calls[0]
      // Should only pass the matcher function, no data or options
      expect(call.length).toBe(1)
    })
  })
})

describe('SWR hooks', () => {
  it('exports all expected hooks', () => {
    const swr = require('@/lib/swr')
    expect(typeof swr.useClients).toBe('function')
    expect(typeof swr.useClient).toBe('function')
    expect(typeof swr.usePayrolls).toBe('function')
    expect(typeof swr.usePayroll).toBe('function')
    expect(typeof swr.useDashboardStats).toBe('function')
    expect(typeof swr.useTrainingRecords).toBe('function')
    expect(typeof swr.useConversations).toBe('function')
    expect(typeof swr.useConversation).toBe('function')
    expect(typeof swr.useSubscription).toBe('function')
  })
})
