"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/constants/routes"
import {
  LayoutDashboard,
  Ticket,
  Users,
  Settings,
  BarChart,
} from "lucide-react"

const navItems = [
  {
    title: "Overview",
    href: ROUTES.role.admin,
    icon: LayoutDashboard,
  },
  {
    title: "Tickets",
    href: ROUTES.tickets.employee.list,
    icon: Ticket,
  },
  {
    title: "Team",
    href: ROUTES.team.list,
    icon: Users,
  },
  {
    title: "Reports",
    href: ROUTES.reports.dashboard,
    icon: BarChart,
  },
  {
    title: "Settings",
    href: ROUTES.settings.general,
    icon: Settings,
  },
]

export function EmployeeNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-2">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
              pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
          >
            <Icon className="w-4 h-4" />
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
} 