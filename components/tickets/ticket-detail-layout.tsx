import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { baseStyles } from '@/lib/constants/ui'

interface TicketDetailLayoutProps {
  children: React.ReactNode
  sidebar: React.ReactNode
  className?: string
}

export function TicketDetailLayout({
  children,
  sidebar,
  className
}: TicketDetailLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className={cn('flex h-full w-full', className)}>
      {/* Sidebar */}
      <div
        className={cn(
          'relative border-r border-border bg-background-primary transition-all duration-300',
          isSidebarCollapsed ? 'w-0' : 'w-[280px]'
        )}
      >
        <div className={cn('h-full overflow-hidden', isSidebarCollapsed && 'invisible')}>
          {sidebar}
        </div>
        
        {/* Collapse Toggle */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={cn(
            'absolute -right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background-primary shadow-sm',
            'hover:bg-background-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
          )}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className={cn(baseStyles.layout.content, 'py-6')}>{children}</div>
      </div>
    </div>
  )
} 