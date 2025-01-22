import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ROUTES } from '@/lib/constants/routes'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          return request.cookies.get(name)?.value
        },
        async set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        async remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { session }, error } = await supabase.auth.getSession()

  // If there's no session and we're not on an auth page, redirect to login
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth')
  if (!session && !isAuthRoute) {
    const redirectUrl = new URL(ROUTES.auth.login, request.url)
    redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If we have a session but we're on an auth page, redirect to appropriate dashboard
  if (session && isAuthRoute) {
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', session.user.id)
      .single()

    let redirectTo: string = ROUTES.tickets.customer.list
    if (teamMember) {
      redirectTo = teamMember.role === 'admin' ? ROUTES.role.admin : ROUTES.role.agent
    }

    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}