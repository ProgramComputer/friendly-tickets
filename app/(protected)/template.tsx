'use client'

import { ThemeProvider } from "@/components/theme-provider"
import { ToasterProvider } from "@/components/providers/toaster-provider"
import { Providers } from "../providers"
import { UserRoleProvider } from '@/lib/contexts/user-role-context'

export default function ProtectedTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserRoleProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            {children}
          </div>
          <ToasterProvider />
        </Providers>
      </ThemeProvider>
    </UserRoleProvider>
  )
} 