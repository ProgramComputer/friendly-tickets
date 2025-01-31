import { createClient } from '@/lib/supabase/server'
import { supabase } from '@/lib/supabase/client'
import { UserRole } from '@/types/shared/auth'
import { Session, User } from '@supabase/supabase-js'

export interface AuthResult {
  success: boolean
  error?: string
  role?: UserRole
}

export const authService = {
  async signIn({ email, password, role }: { 
    email: string
    password: string
    role: UserRole 
  }): Promise<AuthResult> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      // Verify user role
      const { data: profile, error: profileError } = await supabase
        .from('team_members')
        .select('role')
        .eq('auth_user_id', authData.user.id)
        .maybeSingle()

      if (profileError) throw profileError

      // Check if user has the required role
      if (profile.role !== role) {
        await supabase.auth.signOut()
        return {
          success: false,
          error: 'Invalid role for this user'
        }
      }

      return { success: true, role: profile.role as UserRole }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred during sign in'
      }
    }
  },

  async signOut(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred during sign out'
      }
    }
  },

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      
      if (!user) return null

      // Get user role
      const { data: profile } = await supabase
        .from('team_members')
        .select('role')
        .eq('auth_user_id', user.id)
        .limit(1)
        .maybeSingle()

      return {
        ...user,
        role: profile?.role as UserRole
      }
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }
}

export async function getTeamMemberRole(authData: Session): Promise<string | null> {
  const supabase = await createClient()

  const { data: teamMember, error } = await supabase
    .from('team_members')
    .select('role')
    .eq('auth_user_id', authData.user.id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching role:', error)
    return null
  }

  return teamMember?.role || null
}

export async function getUserRole(user: User): Promise<string | null> {
  const supabase = await createClient()

  const { data: teamMember, error } = await supabase
    .from('team_members')
    .select('role')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching role:', error)
    return null
  }

  return teamMember?.role || 'customer'
} 