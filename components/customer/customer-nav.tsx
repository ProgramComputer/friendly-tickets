"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/constants/routes"
import {
  Ticket,
  MessageSquare,
  Settings,
  HelpCircle,
} from "lucide-react"

const navItems = [
  {
    id: "tickets",
    title: "My Tickets",
    href: ROUTES.tickets.customer.list,
    icon: Ticket,
  },
  {
    id: "support",
    title: "Support",
    href: ROUTES.tickets.customer.create,
    icon: MessageSquare,
  },
  {
    id: "help",
    title: "Help Center",
    href: "/help",
    icon: HelpCircle,
  },
  {
    id: "settings",
    title: "Settings",
    href: ROUTES.settings.customer.profile,
    icon: Settings,
  },
]

export function CustomerNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-2">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.id}
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