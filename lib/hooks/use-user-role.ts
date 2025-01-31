'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { UserRole } from '@/types/shared/auth'
import { useSession } from 'next-auth/react'
import { useQuery } from 'react-query'

export function useUserRole() {
  const { session } = useSession()
  const { data: role, isLoading } = useQuery({
    queryKey: ['user-role', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return null

      const { data: teamMember } = await supabase
        .from('team_members')
        .select('role')
        .eq('auth_user_id', session.user.id)
        .maybeSingle()

      return teamMember?.role || 'customer'
    },
    enabled: !!session?.user
  })

  return { role, isLoading }
}

export function useTeamMember() {
  const { session } = useSession()
  const { data: teamMember, isLoading } = useQuery({
    queryKey: ['team-member', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) return null

      const { data } = await supabase
        .from('team_members')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .maybeSingle()

      return data
    },
    enabled: !!session?.user
  })

  return { teamMember, isLoading }
}

export function useUserRoleOld() {
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

        // First try to get role from team_members with proper error handling
        const { data: teamMember, error: teamError } = await supabase
          .from('team_members')
          .select('role')
          .eq('auth_user_id', session.user.id)
          .limit(1)
          .maybeSingle()

        if (teamError && teamError.code !== 'PGRST116') {
          console.error('Error fetching team member:', teamError)
          throw teamError
        }

        if (teamMember?.role && mounted) {
          setRole(teamMember.role as UserRole)
          setIsLoading(false)
          return
        }

        // If not a team member, check customers with proper error handling
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('id')
          .eq('auth_user_id', session.user.id)
          .maybeSingle() // Use maybeSingle instead of single

        if (customerError && customerError.code !== 'PGRST116') {
          console.error('Error fetching customer:', customerError)
          throw customerError
        }

        if (mounted) {
          setRole(customer ? 'customer' : null)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error)
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
          const { data: teamMember, error: teamError } = await supabase
            .from('team_members')
            .select('role')
            .eq('auth_user_id', session.user.id)
            .limit(1)
            .maybeSingle()

          if (teamError && teamError.code !== 'PGRST116') {
            console.error('Error fetching team member:', teamError)
            throw teamError
          }

          if (teamMember?.role && mounted) {
            setRole(teamMember.role as UserRole)
            setIsLoading(false)
            return
          }

          // Then check customers
          const { data: customer, error: customerError } = await supabase
            .from('customers')
            .select('id')
            .eq('auth_user_id', session.user.id)
            .maybeSingle()

          if (customerError && customerError.code !== 'PGRST116') {
            console.error('Error fetching customer:', customerError)
            throw customerError
          }

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