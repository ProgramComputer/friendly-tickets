"use client"

import { AuthCheck } from "@/components/auth/auth-check"
import { AdminHeader } from "@/components/admin/admin-header"

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AuthCheck requiredRole="admin">
      <div className="min-h-screen flex flex-col">
        <AdminHeader />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </AuthCheck>
  )
} 