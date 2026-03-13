// src/lib/swr.ts
import useSWR, { type SWRConfiguration, mutate } from 'swr'

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  dedupingInterval: 5000,
}

export function useClients() {
  return useSWR('/api/clients', fetcher, defaultConfig)
}

export function useClient(id: string | null) {
  return useSWR(id ? `/api/clients/${id}` : null, fetcher, defaultConfig)
}

export function usePayrolls() {
  return useSWR('/api/payrolls', fetcher, defaultConfig)
}

export function usePayroll(id: string | null) {
  return useSWR(id ? `/api/payrolls/${id}` : null, fetcher, defaultConfig)
}

export function useDashboardStats() {
  return useSWR('/api/dashboard/stats', fetcher, defaultConfig)
}

export function useTrainingRecords() {
  return useSWR('/api/training', fetcher, defaultConfig)
}

export function clearSWRCache() {
  mutate(() => true, undefined, { revalidate: false })
}

export function useConversations() {
  return useSWR('/api/ai-assistant/conversations', fetcher, defaultConfig)
}

export function useConversation(id: string | null) {
  return useSWR(id ? `/api/ai-assistant/conversations/${id}` : null, fetcher, defaultConfig)
}

export function useSubscription() {
  return useSWR('/api/stripe/subscription', fetcher, defaultConfig)
}

export { fetcher, defaultConfig }
