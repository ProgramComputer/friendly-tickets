import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  try {
    // Get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) throw sessionError

    // Public routes that don't require authentication
    const isAuthRoute = request.nextUrl.pathname === '/login' || 
                       request.nextUrl.pathname === '/signup'
    
    // If no session and trying to access protected route, redirect to login
    if (!session && !isAuthRoute) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // If has session and trying to access auth routes, redirect to appropriate dashboard
    if (session && isAuthRoute) {
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', session.user.id)
        .single()

      if (teamMember) {
        if (teamMember.role === 'admin') {
          return NextResponse.redirect(new URL('/employee/admin', request.url))
        } else if (teamMember.role === 'agent') {
          return NextResponse.redirect(new URL('/employee/agent', request.url))
        }
      } else {
        // If not in team_members, they must be a customer
        return NextResponse.redirect(new URL('/customer/tickets', request.url))
      }
    }

    // Role-based access control for protected routes
    if (session) {
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('role')
        .eq('user_id', session.user.id)
        .single()

      const isAdminRoute = request.nextUrl.pathname.startsWith('/employee/admin')
      const isAgentRoute = request.nextUrl.pathname.startsWith('/employee/agent')
      const isCustomerRoute = request.nextUrl.pathname.startsWith('/customer')

      // Protect admin routes
      if (isAdminRoute && (!teamMember || teamMember.role !== 'admin')) {
        if (teamMember?.role === 'agent') {
          return NextResponse.redirect(new URL('/employee/agent', request.url))
        }
        return NextResponse.redirect(new URL('/customer/tickets', request.url))
      }

      // Protect agent routes
      if (isAgentRoute && (!teamMember || (teamMember.role !== 'admin' && teamMember.role !== 'agent'))) {
        return NextResponse.redirect(new URL('/customer/tickets', request.url))
      }

      // Protect customer routes
      if (isCustomerRoute && teamMember) {
        if (teamMember.role === 'admin') {
          return NextResponse.redirect(new URL('/employee/admin', request.url))
        } else if (teamMember.role === 'agent') {
          return NextResponse.redirect(new URL('/employee/agent', request.url))
        }
      }
    }

    return response
  } catch (error) {
    // If there's an error, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/employee/:path*',
    '/customer/:path*'
  ]
} 