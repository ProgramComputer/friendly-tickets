'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { UserRole } from '@/types/auth'

export function useUserRole() {
  const [role, setRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function fetchUserRole() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          if (mounted) {
            setRole(null)
            setIsLoading(false)
          }
          return
        }

        // First check if user is a team member (admin or agent)
        const { data: teamMember, error: teamError } = await supabase
          .from('team_members')
          .select('role')
          .eq('user_id', session.user.id)
          .single()

        if (teamMember && mounted) {
          setRole(teamMember.role as UserRole)
          setIsLoading(false)
          return
        }

        // If not a team member, check if they're a customer
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select()
          .eq('user_id', session.user.id)
          .single()

        if (mounted) {
          setRole(customer ? 'customer' : null)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
        if (mounted) {
          setRole(null)
          setIsLoading(false)
        }
      }
    }

    fetchUserRole()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        if (mounted) {
          setRole(null)
          setIsLoading(false)
        }
      } else if (event === 'SIGNED_IN' && session) {
        try {
          // Check team members first
          const { data: teamMember } = await supabase
            .from('team_members')
            .select('role')
            .eq('user_id', session.user.id)
            .single()

          if (teamMember && mounted) {
            setRole(teamMember.role as UserRole)
            setIsLoading(false)
            return
          }

          // Then check customers
          const { data: customer } = await supabase
            .from('customers')
            .select()
            .eq('user_id', session.user.id)
            .single()

          if (mounted) {
            setRole(customer ? 'customer' : null)
            setIsLoading(false)
          }
        } catch (error) {
          console.error('Error handling auth state change:', error)
          if (mounted) {
            setRole(null)
            setIsLoading(false)
          }
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { role, isLoading }
} 