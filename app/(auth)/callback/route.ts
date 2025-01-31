import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ROUTES } from '@/lib/constants/routes'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) throw error

      // Get the user to determine their role
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError

      if (!user) {
        throw new Error('User not found after session exchange')
      }

      // First check if user is a team member
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('role')
        .eq('auth_user_id', user.id)
        .single()

      if (teamMember) {
        // Redirect to role-specific dashboard
        return NextResponse.redirect(new URL(ROUTES.role[teamMember.role], requestUrl.origin))
      }

      // If not a team member, check if they're a customer
      const { data: customer } = await supabase
        .from('customers')
        .select()
        .eq('auth_user_id', user.id)
        .single()

      if (customer) {
        // Redirect to customer dashboard
        return NextResponse.redirect(new URL(ROUTES.role.customer, requestUrl.origin))
      }

      // If no role found, sign out and redirect to login with error
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL(`${ROUTES.auth.login}?error=no_role_assigned`, requestUrl.origin))
    } catch (error) {
      console.error('Auth callback error:', error)
      // Sign out on error to clean up any partial session state
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL(`${ROUTES.auth.login}?error=auth_callback_failed`, requestUrl.origin))
    }
  }

  // If no code provided, redirect to login
  return NextResponse.redirect(new URL(ROUTES.auth.login, requestUrl.origin))
} 