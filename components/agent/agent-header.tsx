'use client'

import Link from "next/link"
import { AgentNav } from "@/components/agent/agent-nav"
import { UserNav } from "@/components/shared/user-nav"
import { ThemeToggle } from "@/components/theme-toggle"

export function AgentHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <span className="hidden font-bold sm:inline-block">
            AutoCRM
          </span>
        </Link>
        <AgentNav />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          <UserNav />
        </div>
      </div>
    </header>
  )
} 