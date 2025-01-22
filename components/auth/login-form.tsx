"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { login } from "@/app/auth/login/actions"

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)

  async function onSubmit(formData: FormData) {
    setIsLoading(true)

    try {
      const result = await login(formData)
      
      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success("Logged in successfully")
      
      if (result.redirectTo) {
        router.push(result.redirectTo)
      }
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