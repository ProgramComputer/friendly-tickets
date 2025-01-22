import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/lib/types/supabase"

export const createClient = () => {
  return createClientComponentClient<Database>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })
}

// Create a singleton instance
export const supabase = createClient()

export type SupabaseClient = typeof supabase 