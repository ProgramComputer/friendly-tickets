'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants/routes'

const navItems = [
  { href: ROUTES.agent.workspace, label: 'Workspace' },
  { href: ROUTES.agent.queue, label: 'Ticket Queue' },
  { href: ROUTES.agent.templates, label: 'Templates' }
]

export function AgentNav() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-4">
      {navItems.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            pathname === href
              ? 'text-foreground'
              : 'text-muted-foreground'
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
} 