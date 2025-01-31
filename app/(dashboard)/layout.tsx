'use client'

import { AuthCheck } from "@/components/auth/auth-check"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { FloatingChatWidget } from "@/components/chat/floating-chat-widget"
import { useAuth } from "@/lib/hooks/use-auth"
import { useVectorStore } from "@/lib/hooks/use-vector-store"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { role } = useAuth()
  const retriever = useVectorStore()
  
  return (
    <AuthCheck requiredRole="customer">
      <div className="min-h-screen flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-8">
          {children}
        </main>
        {retriever && <FloatingChatWidget retriever={retriever} />}
      </div>
    </AuthCheck>
  )
} 