'use server'

import { createClient } from "@/lib/supabase/server"
import { UserRole } from "@/types/shared/auth"
import { ROUTES } from "@/lib/constants/routes"
import { cookies } from 'next/headers'

export interface AuthResult {
  success: boolean
  error?: string
  redirectTo?: string
}

async function signIn({ email, password }: { 
  email: string
  password: string
}): Promise<AuthResult> {
  try {
    const supabase = await createClient()

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) throw authError

    // First check if user is a team member
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('role')
      .eq('auth_user_id', authData.user.id)
      .single()

    if (teamMember) {
      return {
        success: true,
        redirectTo: ROUTES.role[teamMember.role]
      }
    }

    // If not a team member, check/create customer record
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select()
      .eq('auth_user_id', authData.user.id)
      .single()

    if (customerError || !customer) {
      // For new customers, create a customer record
      const { error: createError } = await supabase
        .from('customers')
        .insert({
          auth_user_id: authData.user.id,
          email: email,
          name: email.split('@')[0], // Use email prefix as initial name
        })

      if (createError) {
        await supabase.auth.signOut()
        return {
          success: false,
          error: "Failed to create customer profile"
        }
      }
    }

    return {
      success: true,
      redirectTo: ROUTES.role.customer
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred during sign in"
    }
  }
}

async function signOut(): Promise<AuthResult> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true, redirectTo: ROUTES.auth.login }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred during sign out"
    }
  }
}

async function getCurrentUser() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return null

    // First check team members
    const { data: teamMember } = await supabase
      .from('team_members')
      .select('role, name')
      .eq('auth_user_id', user.id)
      .single()

    if (teamMember) {
      return {
        ...user,
        role: teamMember.role as UserRole,
        name: teamMember.name,
      }
    }

    // Then check customers
    const { data: customer } = await supabase
      .from('customers')
      .select('name')
      .eq('auth_user_id', user.id)
      .single()

    if (customer) {
      return {
        ...user,
        role: 'customer' as UserRole,
        name: customer.name,
      }
    }

    return null
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

async function isAuthorized(requiredRole: UserRole): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    return user?.role === requiredRole
  } catch {
    return false
  }
}

async function getDefaultRoute(role: UserRole): Promise<string> {
  return ROUTES.role[role] || ROUTES.auth.login
}

export const authService = {
  signIn,
  signOut,
  getCurrentUser,
  isAuthorized,
  getDefaultRoute,
}

// Export individual functions for server actions
export {
  signIn,
  signOut,
  getCurrentUser,
  isAuthorized,
  getDefaultRoute,
} 