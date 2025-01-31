import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

let supabase: SupabaseClient<Database>

export function useSupabase() {
  const [client] = useState(() => {
    if (supabase) return supabase

    supabase = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    return supabase
  })

  useEffect(() => {
    // Cleanup function
    return () => {
      // Optional: Add any cleanup if needed
    }
  }, [])

  return client
} 