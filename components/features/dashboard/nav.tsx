"use client"

import { authService } from "@/lib/auth/auth-service"
import { ROUTES } from "@/lib/constants/routes"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Settings, Ticket, Users } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "../../ui/button"
import { useEffect, useState } from "react"
import { UserRole } from "@/lib/types/auth"

export function DashboardNav() {
  const pathname = usePathname()
  const [role, setRole] = useState<UserRole | null>(null)

  useEffect(() => {
    const checkRole = async () => {
      const user = await authService.getCurrentUser()
      setRole(user?.role || null)
    }
    checkRole()
  }, [])

  const getNavItems = (userRole: UserRole | null) => {
    if (!userRole) return []

    switch (userRole) {
      case "admin":
        return [
          {
            title: "Overview",
            href: ROUTES.role.admin,
            icon: LayoutDashboard,
          },
          {
            title: "Tickets",
            href: ROUTES.tickets.list,
            icon: Ticket,
          },
          {
            title: "Team",
            href: ROUTES.team.list,
            icon: Users,
          },
          {
            title: "Settings",
            href: ROUTES.settings.employee.general,
            icon: Settings,
          },
        ]
      case "agent":
        return [
          {
            title: "Overview",
            href: ROUTES.role.agent,
            icon: LayoutDashboard,
          },
          {
            title: "Tickets",
            href: ROUTES.tickets.list,
            icon: Ticket,
          },
          {
            title: "Settings",
            href: ROUTES.settings.employee.general,
            icon: Settings,
          },
        ]
      case "customer":
        return [
          {
            title: "My Tickets",
            href: ROUTES.tickets.customer.list,
            icon: Ticket,
          },
          {
            title: "Settings",
            href: ROUTES.settings.customer.profile,
            icon: Settings,
          },
        ]
      default:
        return []
    }
  }

  const navItems = getNavItems(role)

  return (
    <nav className="grid items-start gap-2">
      {navItems.map((item, index) => {
        const Icon = item.icon
        return (
          <Link
            key={index}
            href={item.href}
          >
            <span
              className={cn(
                "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === item.href ? "bg-accent" : "transparent"
              )}
            >
              <Icon className="mr-2 h-4 w-4" />
              <span>{item.title}</span>
            </span>
          </Link>
        )
      })}
    </nav>
  )
} 