import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Client-side Supabase client - works in browser
// Uses placeholder values during build-time prerendering when env vars are unavailable
export const createClientSupabaseClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
  )
}
