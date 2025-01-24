'use client'

import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { CustomerUserNav } from "@/components/customer/customer-user-nav"
import { ThemeToggle } from "@/components/theme-toggle"

export function DashboardHeader() {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4">
        <DashboardNav />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          <CustomerUserNav />
        </div>
      </div>
    </header>
  )
} 