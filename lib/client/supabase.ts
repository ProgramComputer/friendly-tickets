import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/shared/types/database'

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Helper to get a typed Supabase client
export function getClientSupabase() {
  return supabase
} 