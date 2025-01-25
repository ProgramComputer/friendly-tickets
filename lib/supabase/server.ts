import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export async function createServerSupabaseClient(cookieStore = cookies(), useServiceRole = false) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }

  const supabaseKey = useServiceRole 
    ? process.env.SUPABASE_SERVICE_ROLE_KEY 
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseKey) {
    throw new Error(useServiceRole 
      ? 'Missing SUPABASE_SERVICE_ROLE_KEY environment variable'
      : 'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable'
    )
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          try {
            cookieStore.set(name, value, options)
          } catch (error) {
            // Handle cookies.set error in middleware
          }
        },
        remove(name, options) {
          try {
            cookieStore.delete(name, options)
          } catch (error) {
            // Handle cookies.delete error in middleware
          }
        },
      },
      auth: useServiceRole ? {
        autoRefreshToken: false,
        persistSession: false
      } : undefined
    }
  )
}

// Also export as createClient for backward compatibility
export const createClient = createServerSupabaseClient 