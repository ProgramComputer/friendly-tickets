import { supabase } from '@/lib/supabase/client'
import { UserRole } from '@/types/auth'

export interface AuthResult {
  success: boolean
  error?: string
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
        .eq('user_id', authData.user.id)
        .single()

      if (profileError) throw profileError

      // Check if user has the required role
      if (profile.role !== role) {
        await supabase.auth.signOut()
        return {
          success: false,
          error: 'Invalid role for this user'
        }
      }

      return { success: true }
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
        .eq('user_id', user.id)
        .single()

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