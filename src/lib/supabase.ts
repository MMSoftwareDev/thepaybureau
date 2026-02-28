import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/database'

// Client-side Supabase client - works in browser
export const createClientSupabaseClient = () => {
  return createClientComponentClient<Database>()
}

// Re-export for backward compatibility
export const supabase = createClientSupabaseClient()