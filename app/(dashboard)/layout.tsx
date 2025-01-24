'use client'

import { AuthCheck } from "@/components/auth/auth-check"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { FloatingChatWidget } from "@/components/chat/floating-chat-widget"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AuthCheck requiredRole="customer">
      <div className="min-h-screen flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-8">
          {children}
        </main>
        <FloatingChatWidget />
      </div>
    </AuthCheck>
  )
} 