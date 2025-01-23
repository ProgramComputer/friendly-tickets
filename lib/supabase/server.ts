import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: { path: string; maxAge?: number }) {
          try {
            cookieStore.set(name, value, options)
          } catch (error) {
            // Handle cookie setting error
          }
        },
        remove(name: string, options: { path: string }) {
          try {
            cookieStore.delete(name)
          } catch (error) {
            // Handle cookie removal error
          }
        },
      },
    }
  )
}

export type SupabaseServer = Awaited<ReturnType<typeof createServerSupabaseClient>> 