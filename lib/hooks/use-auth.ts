'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/constants/routes"
import { useSupabase } from "@/lib/supabase/client"

export type UserRole = "customer" | "agent" | "admin"

interface UseAuthReturn {
  user: any | null
  role: UserRole | null
  isLoading: boolean
  isAgent: boolean
  isAdmin: boolean
  isCustomer: boolean
  canAccessFeature: (feature: FeatureFlag) => boolean
}

// Define feature flags for role-based access
export type FeatureFlag =
  | "create_ticket"
  | "view_tickets"
  | "edit_tickets"
  | "delete_tickets"
  | "internal_notes"
  | "assign_tickets"
  | "manage_templates"
  | "manage_tags"
  | "manage_custom_fields"
  | "manage_sla"
  | "bulk_actions"
  | "view_analytics"
  | "manage_team"
  | "manage_departments"

// Define role-based feature access
const roleFeatureMap: Record<UserRole, FeatureFlag[]> = {
  customer: ["create_ticket", "view_tickets"],
  agent: [
    "create_ticket",
    "view_tickets",
    "edit_tickets",
    "internal_notes",
    "assign_tickets",
    "bulk_actions",
  ],
  admin: [
    "create_ticket",
    "view_tickets",
    "edit_tickets",
    "delete_tickets",
    "internal_notes",
    "assign_tickets",
    "manage_templates",
    "manage_tags",
    "manage_custom_fields",
    "manage_sla",
    "bulk_actions",
    "view_analytics",
    "manage_team",
    "manage_departments",
  ],
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<any | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = useSupabase()

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[Auth] Initial session:', {
        hasSession: !!session,
        user: session?.user?.email
      })
      setUser(session?.user ?? null)
      if (session?.user) {
        checkRole(session.user.id)
      } else {
        setRole(null)
        setIsLoading(false)
      }
    })

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Auth state changed:', { event, user: session?.user?.email })
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await checkRole(session.user.id)
      } else {
        setRole(null)
        setIsLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  async function checkRole(userId: string) {
    console.log('[Auth] Checking role for user:', userId)
    try {
      setIsLoading(true)

      // Check if user is a team member (agent/admin)
      const { data: teamMember, error: teamError } = await supabase
        .from('team_members')
        .select('role')
        .eq('auth_user_id', userId)
        .maybeSingle()

      console.log('[Auth] Team member check:', { teamMember, error: teamError })

      if (teamMember) {
        setRole(teamMember.role as UserRole)
        setIsLoading(false)
        return
      }

      // If not a team member, check if they're a customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('auth_user_id', userId)
        .maybeSingle()

      console.log('[Auth] Customer check:', { customer, error: customerError })

      if (customer) {
        setRole('customer')
      } else {
        setRole(null)
      }
    } catch (error) {
      console.error('[Auth] Error checking role:', error)
      setRole(null)
    } finally {
      setIsLoading(false)
    }
  }

  const isAgent = role === "agent"
  const isAdmin = role === "admin"
  const isCustomer = role === "customer"

  const canAccessFeature = (feature: FeatureFlag): boolean => {
    if (!role) return false
    return roleFeatureMap[role].includes(feature)
  }

  return {
    user,
    role,
    isLoading,
    isAgent,
    isAdmin,
    isCustomer,
    canAccessFeature,
  }
} 