'use client'

import { ThemeProvider } from "@/components/theme-provider"
import { ToasterProvider } from "@/components/providers/toaster-provider"
import { Providers } from "../providers"

export default function PublicTemplate({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Providers>
        <div className="relative flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>
        </div>
        <ToasterProvider />
      </Providers>
    </ThemeProvider>
  )
} 