"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"
import { ROUTES } from "@/lib/constants/routes"

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)

  async function onSubmit(formData: FormData) {
    setIsLoading(true)

    try {
      const email = formData.get('email') as string
      const password = formData.get('password') as string

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Check role based on email domain
      const role = email.endsWith('@admin.autocrm.com')
        ? 'admin'
        : email.endsWith('@agent.autocrm.com')
          ? 'agent'
          : 'customer'

      // Verify role in database
      const { data: profile, error: profileError } = await supabase
        .from(role === 'customer' ? 'customers' : 'team_members')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .single()

      if (profileError || !profile) {
        await supabase.auth.signOut()
        throw new Error('Invalid account type')
      }

      toast.success("Logged in successfully")
      if (role === 'customer') {
        router.push(ROUTES.dashboard.tickets)
      } else if (role === 'admin') {
        router.push(ROUTES.admin.overview)
      } else {
        router.push(ROUTES.agent.workspace)
      }
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid credentials")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <Input
          id="email"
          name="email"
          placeholder="name@example.com"
          type="email"
          disabled={isLoading}
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">Password</label>
        <Input
          id="password"
          name="password"
          placeholder="Enter your password"
          type="password"
          disabled={isLoading}
          required
        />
      </div>
      <Button className="w-full" type="submit" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  )
} 