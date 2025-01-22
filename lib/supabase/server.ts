import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/cookies'

export async function createClient(cookieStore: ReadonlyRequestCookies = cookies()) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Handle cookies.set error in middleware
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Handle cookies.delete error in middleware
          }
        },
      },
    }
  )
}

export type SupabaseServer = ReturnType<typeof createClient> 