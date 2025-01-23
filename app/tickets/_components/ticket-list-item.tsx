'use client'

import { MessageSquare, MoreVertical } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { Ticket } from '@/types/tickets'
import { cn } from '@/lib/utils'
import { useUpdateTicket } from '@/lib/hooks/tickets/use-tickets'
import { Button } from '@/components/ui/button'
import { PriorityIndicator } from '@/components/priority-indicator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TicketListItemProps {
  ticket: Ticket
  className?: string
}

const statusColors = {
  open: 'bg-green-500/10 text-green-700 dark:text-green-400',
  pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  resolved: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  closed: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
} as const

export function TicketListItem({ ticket, className }: TicketListItemProps) {
  const { mutate: updateTicket } = useUpdateTicket()

  const handleStatusChange = (status: Ticket['status']) => {
    updateTicket({
      id: ticket.id,
      input: { status },
    })
  }

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/50',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/tickets/${ticket.id}`}
              className="font-medium hover:underline"
            >
              {ticket.title}
            </Link>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                statusColors[ticket.status]
              )}
            >
              {ticket.status}
            </span>
          </div>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {ticket.description}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <PriorityIndicator priority={ticket.priority} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleStatusChange('open')}
                disabled={ticket.status === 'open'}
              >
                Mark as Open
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange('pending')}
                disabled={ticket.status === 'pending'}
              >
                Mark as Pending
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange('resolved')}
                disabled={ticket.status === 'resolved'}
              >
                Mark as Resolved
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange('closed')}
                disabled={ticket.status === 'closed'}
              >
                Mark as Closed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>#{ticket.id}</span>
        <span>Created {format(new Date(ticket.created_at), 'MMM d, yyyy')}</span>
        {ticket.messages_count > 0 && (
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {ticket.messages_count}
          </span>
        )}
      </div>
    </div>
  )
} 