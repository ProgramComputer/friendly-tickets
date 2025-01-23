"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/hooks/use-auth"
import { RoleGate } from "@/components/auth/role-gate"

interface NavItem {
  title: string
  href: string
  requireFeature?: FeatureFlag
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    requireFeature: "view_tickets",
  },
  {
    title: "Tickets",
    href: "/tickets",
    requireFeature: "view_tickets",
  },
  {
    title: "Templates",
    href: "/templates",
    requireFeature: "manage_templates",
  },
  {
    title: "Team",
    href: "/team",
    requireFeature: "manage_team",
  },
  {
    title: "Reports",
    href: "/reports",
    requireFeature: "view_analytics",
  },
  {
    title: "Settings",
    href: "/settings",
    requireFeature: "manage_team",
  },
]

export function MainNav() {
  const pathname = usePathname()
  const { role, isLoading } = useAuth()

  if (isLoading) {
    return null
  }

  return (
    <nav className="flex items-center space-x-6">
      {navItems.map((item) => 
        item.requireFeature ? (
          <RoleGate key={item.href} requireFeature={item.requireFeature}>
            <Link
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === item.href
                  ? "text-foreground"
                  : "text-foreground/60"
              )}
            >
              {item.title}
            </Link>
          </RoleGate>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === item.href
                ? "text-foreground"
                : "text-foreground/60"
            )}
          >
            {item.title}
          </Link>
        )
      )}
    </nav>
  )
} 