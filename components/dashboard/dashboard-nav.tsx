"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/constants/routes"

export function DashboardNav() {
  const pathname = usePathname()

  const links = [
    {
      href: ROUTES.dashboard.home,
      label: "Dashboard",
      active: pathname === ROUTES.dashboard.home,
    },
    {
      href: ROUTES.dashboard.tickets,
      label: "Tickets",
      active: pathname.startsWith(ROUTES.dashboard.tickets),
    }
  ]

  return (
    <nav className="flex items-center space-x-6 lg:space-x-8">
      {links.map((link) => (
        <Link
          key={`${link.href}-${link.label}`}
          href={link.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            link.active
              ? "text-black dark:text-white"
              : "text-muted-foreground"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
} 