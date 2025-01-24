'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth/auth-client"
import { ROUTES } from "@/lib/constants/routes"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface AuthCheckProps {
  children: React.ReactNode
  requiredRole?: 'customer' | 'agent' | 'admin'
}

export function AuthCheck({ children, requiredRole = 'customer' }: AuthCheckProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const user = await authClient.getCurrentUser()
      
      if (!user) {
        router.push(ROUTES.auth.login)
        return
      }

      if (user.role !== requiredRole) {
        // Redirect based on user's role
        switch (user.role) {
          case 'admin':
            router.push(ROUTES.admin.overview)
            break
          case 'agent':
            router.push(ROUTES.agent.workspace)
            break
          case 'customer':
            router.push(ROUTES.dashboard.home)
            break
          default:
            router.push(ROUTES.auth.login)
        }
        return
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [router, requiredRole])

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return <>{children}</>
} 