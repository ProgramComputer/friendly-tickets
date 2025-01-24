'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/lib/constants/routes"
import { supabase } from "@/lib/supabase/client"

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

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        getRole(session.user.id)
      } else {
        setRole(null)
        setIsLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        getRole(session.user.id)
      } else {
        setRole(null)
        setIsLoading(false)
        router.push(ROUTES.auth.login)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  async function getRole(userId: string) {
    try {
      // First check if user is a team member
      const { data: teamMember, error: teamError } = await supabase
        .from("team_members")
        .select("role")
        .eq("user_id", userId)
        .single()

      if (teamError && teamError.code !== 'PGRST116') {
        throw teamError
      }

      if (teamMember) {
        setRole(teamMember.role as UserRole)
      } else {
        // If not a team member, check if they're a customer
        const { data: customer, error: customerError } = await supabase
          .from("customers")
          .select("id")
          .eq("user_id", userId)
          .single()

        if (customerError && customerError.code !== 'PGRST116') {
          throw customerError
        }

        if (customer) {
          setRole("customer")
        } else {
          // If neither team member nor customer, create as customer
          const { error: createError } = await supabase
            .from("customers")
            .insert({ user_id: userId })

          if (createError) throw createError
          setRole("customer")
        }
      }
    } catch (error) {
      console.error("Error fetching role:", error)
      // Don't set a default role on error anymore
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