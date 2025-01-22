'use server'

import { createClient } from "@/lib/supabase/server"
import { UserRole } from "@/types/auth"
import { ROUTES } from "@/lib/constants/routes"
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export interface AuthResult {
  success: boolean
  error?: string
  redirectTo?: string
}

export async function login(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  const role = email.endsWith('@admin.autocrm.com')
    ? 'admin'
    : email.endsWith('@agent.autocrm.com')
      ? 'agent'
      : 'customer'

  try {
    const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) throw authError
    if (!session) throw new Error('Session not found')

    // Check if user exists in team_members or customers table based on role
    if (role === "customer") {
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select()
        .eq("user_id", session.user.id)
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
        .eq("user_id", session.user.id)
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

export async function signup(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = await createClient(cookieStore)
  
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, redirectTo: ROUTES.auth.login }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred during sign up"
    }
  }
} 