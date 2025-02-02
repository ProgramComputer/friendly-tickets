import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ROUTES } from './lib/constants/routes'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public routes that don't require authentication
  if (request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/signup') ||
      request.nextUrl.pathname.startsWith('/forgot-password') ||
      request.nextUrl.pathname.startsWith('/reset-password') ||
      request.nextUrl.pathname === '/' ||
      request.nextUrl.pathname.startsWith('/about') ||
      request.nextUrl.pathname.startsWith('/contact')) {
    return supabaseResponse
  }

  // Check if user is authenticated
  if (!user) {
    return NextResponse.redirect(new URL(ROUTES.auth.login, request.url))
  }

  // Get user role
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('role')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  const role = teamMember ? teamMember.role : 'customer'

  // Redirect based on role and requested path
  const path = request.nextUrl.pathname
  if (path.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL(ROUTES.role[role], request.url))
  }
  if (path.startsWith('/agent') && role !== 'agent') {
    return NextResponse.redirect(new URL(ROUTES.role[role], request.url))
  }
  if (path.startsWith('/dashboard') && role !== 'customer') {
    return NextResponse.redirect(new URL(ROUTES.role[role], request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}