import { createServerClient as createServerClientBase, type CookieOptions } from '@supabase/ssr'
import type { Database } from '@/types/global/supabase'
import { cookies } from 'next/headers'

let cookies: () => {
  get: (name: string) => { name: string; value: string } | undefined
  set: (options: { name: string; value: string; } & CookieOptions) => void
}

// Dynamically import cookies in app directory
if (process.env.NEXT_PUBLIC_RUNTIME === 'edge' || process.env.NEXT_PUBLIC_RUNTIME === 'nodejs') {
  import('next/headers').then((mod) => {
    cookies = mod.cookies
  })
}

export function createClient() {
  if (!cookies) {
    throw new Error('Cookies module not initialized. This client only works in Server Components.')
  }

  const cookieStore = cookies()

  return createServerClientBase<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookies in edge functions
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookies in edge functions
          }
        },
      },
    }
  )
}

// For pages directory and API routes
export function createPagesClient(req: any, res: any) {
  return createServerClientBase<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies[name]
        },
        set(name: string, value: string, options: CookieOptions) {
          res.setHeader('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; SameSite=Lax`)
        },
        remove(name: string, options: CookieOptions) {
          res.setHeader('Set-Cookie', `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
        },
      },
    }
  )
}

// For middleware
export function createMiddlewareClient(request: Request) {
  let response = new Response()

  const supabase = createServerClientBase<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.headers.get(`cookie`)?.split(';').find(c => c.trim().startsWith(`${name}=`))?.split('=')[1]
        },
        set(name: string, value: string, options: CookieOptions) {
          response.headers.append('Set-Cookie', `${name}=${value}; Path=/; HttpOnly; SameSite=Lax`)
        },
        remove(name: string, options: CookieOptions) {
          response.headers.append('Set-Cookie', `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
        },
      },
    }
  )

  return { supabase, response }
}

export function createServerSupabaseClient(cookieStore?: any, useServiceRole = false) {
  return createServerClientBase<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    useServiceRole ? process.env.SUPABASE_SERVICE_ROLE_KEY! : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore?.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookies().set(name, value, options)
          } catch (error) {
            // Handle edge case for middleware
          }
        },
        remove(name: string, options: any) {
          try {
            cookies().delete(name)
          } catch (error) {
            // Handle edge case for middleware
          }
        },
      },
    }
  )
}

export async function getSession() {
  const supabase = createClient()
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
} 