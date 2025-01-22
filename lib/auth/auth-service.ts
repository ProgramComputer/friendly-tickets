import { supabase } from "@/lib/supabase/client"
import { UserRole } from "@/types/auth"
import { ROUTES } from "@/lib/constants/routes"

export interface AuthResult {
  success: boolean
  error?: string
  redirectTo?: string
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

      // Check if user exists in team_members or customers table based on role
      if (role === "customer") {
        const { data: customer, error: customerError } = await supabase
          .from("customers")
          .select()
          .eq("user_id", authData.user.id)
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
          .eq("user_id", authData.user.id)
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
  },

  async signOut(): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { success: true, redirectTo: ROUTES.auth.login }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred during sign out"
      }
    }
  },

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      
      if (!user) return null

      // Check team_members first
      const { data: teamMember } = await supabase
        .from("team_members")
        .select()
        .eq("user_id", user.id)
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
        .from("customers")
        .select()
        .eq("user_id", user.id)
        .single()

      if (customer) {
        return {
          ...user,
          role: "customer" as UserRole,
          name: customer.name,
        }
      }

      return null
    } catch (error) {
      console.error("Error getting current user:", error)
      return null
    }
  },

  async isAuthorized(requiredRole: UserRole): Promise<boolean> {
    try {
      const user = await this.getCurrentUser()
      return user?.role === requiredRole
    } catch {
      return false
    }
  },

  getDefaultRoute(role: UserRole): string {
    return ROUTES.role[role] || ROUTES.auth.login
  }
} 