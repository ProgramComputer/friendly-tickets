"use client"

import { CustomerNav } from "@/components/customer/customer-nav"
import { CustomerUserNav } from "@/components/customer/customer-user-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { authClient } from "@/lib/auth/auth-client"
import { ROUTES } from "@/lib/constants/routes"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface CustomerLayoutProps {
  children: React.ReactNode
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const user = await authClient.getCurrentUser()
      
      if (!user) {
        router.push(ROUTES.auth.login)
        return
      }

      if (user.role !== 'customer') {
        router.push(ROUTES.role[user.role])
        return
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [router])

  if (isLoading) {
    return null // or a loading spinner
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b">
        <div className="flex h-16 items-center px-4">
          <CustomerNav />
          <div className="ml-auto flex items-center space-x-4">
            <ThemeToggle />
            <CustomerUserNav />
          </div>
        </div>
      </header>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
} 