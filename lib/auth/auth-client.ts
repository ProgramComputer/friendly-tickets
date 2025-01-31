'use client'

import { createBrowserClient } from '@supabase/ssr'
import { UserRole } from '@/types/shared/auth'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const authClient = {
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      
      if (!user) return null

      // Check team_members first
      const { data: teamMember } = await supabase
        .from('team_members')
        .select()
        .eq('auth_user_id', user.id)
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
        .from('customers')
        .select()
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
  },

  async signOut() {
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
  }
} 