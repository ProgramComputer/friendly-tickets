'use client'

import { createBrowserClient } from '@supabase/ssr'
import { UserRole } from '@/types/shared/auth'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const SIGNOUT_TIMEOUT = 10000 // 10 seconds timeout

interface SignOutResult {
  success: boolean
  error?: string
  localDataCleared?: boolean
  isTimeout?: boolean
}

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

  async signOut(): Promise<SignOutResult> {
    console.log('[Auth Client] Starting sign out process')
    
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Sign out timed out after 10 seconds'))
        }, SIGNOUT_TIMEOUT)
      })

      // Create the sign out promise
      const signOutPromise = async (): Promise<SignOutResult> => {
        console.log('[Auth Client] Calling Supabase signOut')
        const { error } = await supabase.auth.signOut()
        console.log('[Auth Client] Supabase signOut response received', { error })
        
        if (error) {
          console.error('[Auth Client] Sign out error:', error)
          throw error
        }

        return { success: true }
      }

      // Clear local data regardless of timeout
      const clearLocalData = () => {
        console.log('[Auth Client] Clearing local storage and session data')
        try {
          localStorage.clear()
          sessionStorage.clear()
          console.log('[Auth Client] Local storage and session cleared')
        } catch (e) {
          console.warn('[Auth Client] Error clearing storage:', e)
        }
      }

      try {
        // Race between timeout and sign out
        const result = await Promise.race([signOutPromise(), timeoutPromise])
        clearLocalData()
        return { 
          ...(result as SignOutResult), 
          localDataCleared: true 
        }
      } catch (error) {
        // If timeout or error, still clear local data
        clearLocalData()
        return {
          success: true, // Consider it a "soft" success if we cleared local data
          localDataCleared: true,
          error: error instanceof Error ? error.message : 'An error occurred during sign out',
          isTimeout: error instanceof Error && error.message.includes('timed out')
        }
      }
    } catch (error) {
      console.error('[Auth Client] Sign out failed:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An error occurred during sign out'
      }
    }
  }
} 