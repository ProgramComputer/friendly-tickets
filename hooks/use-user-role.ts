'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type UserRole = 'customer' | 'agent' | 'admin' | null

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          setRole(null)
          return
        }

        // Get user's profile with role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        setRole(profile?.role || 'customer')
      } catch (error) {
        console.error('Error fetching user role:', error)
        setRole(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserRole()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setRole(null)
      } else if (event === 'SIGNED_IN' && session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        setRole(profile?.role || 'customer')
      }
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return { role, isLoading }
} 