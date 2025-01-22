'use server'

import { createClient } from "@/lib/supabase/server"
import { UserRole } from "@/types/auth"
import { ROUTES } from "@/lib/constants/routes"
import { cookies } from 'next/headers'

export interface AuthResult {
  success: boolean
  error?: string
  redirectTo?: string
}

async function getSupabaseClient() {
  const cookieStore = cookies()
  return createClient(cookieStore)
}

async function signIn({ email, password }: { 
  email: string
  password: string
}): Promise<AuthResult> {
  try {
    const supabase = await getSupabaseClient()

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) throw authError

    // Determine role based on email domain
    const role = email.endsWith('@admin.autocrm.com')
      ? 'admin'
      : email.endsWith('@agent.autocrm.com')
        ? 'agent'
        : 'customer'

    // Check if user exists in team_members or customers table based on role
    if (role === "customer") {
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select()
        .eq("user_id", authData.user.id)
        .single()

      if (customerError || !customer) {
        await supabase.auth.signOut()
        return {
          success: false,
          error: "Invalid customer account"
        }
      }
    } else {
      // For admin and agent roles
      const { data: teamMember, error: teamMemberError } = await supabase
        .from("team_members")
        .select()
        .eq("user_id", authData.user.id)
        .eq("role", role)
        .single()

      if (teamMemberError || !teamMember) {
        await supabase.auth.signOut()
        return {
          success: false,
          error: "Invalid role for this user"
        }
      }
    }

    return { 
      success: true,
      redirectTo: ROUTES.role[role]
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
    const supabase = await getSupabaseClient()
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
    const supabase = await getSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    
    if (!user) return null

    // Check team_members first
    const { data: teamMember } = await supabase
      .from("team_members")
      .select()
      .eq("user_id", user.id)
      .single()

    if (teamMember) {
      return {
        ...user,
        role: teamMember.role as UserRole,
        name: teamMember.name,
      }
    }

    // If not a team member, check customers
    const { data: customer } = await supabase
      .from("customers")
      .select()
      .eq("user_id", user.id)
      .single()

    if (customer) {
      return {
        ...user,
        role: "customer" as UserRole,
        name: customer.name,
      }
    }

    return null
  } catch (error) {
    console.error("Error getting current user:", error)
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
  async getSupabase() {
    const cookieStore = await cookies()
    return createClient(cookieStore)
  },
  signIn,
  signOut,
  getCurrentUser,
  isAuthorized,
  getDefaultRoute,
} 