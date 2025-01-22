"use client"

import { CustomerNav } from "@/components/customer/customer-nav"
import { CustomerUserNav } from "@/components/customer/customer-user-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { authService } from "@/lib/auth/auth-service"
import { ROUTES } from "@/lib/constants/routes"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const user = await authService.getCurrentUser()
      if (!user || user.role !== "customer") {
        router.push(ROUTES.auth.login)
        return
      }
      setIsLoading(false)
    }
    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-background">
        <div className="flex h-14 items-center border-b px-4">
          <h2 className="text-lg font-semibold">AutoCRM</h2>
        </div>
        <CustomerNav />
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold">Customer Dashboard</h1>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <CustomerUserNav />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-background p-8">
          {children}
        </main>
      </div>
    </div>
  )
} 