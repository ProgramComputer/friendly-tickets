'use client'

import { MessageSquare, MoreVertical } from 'lucide-react'
import { format } from 'date-fns'
import type { Ticket } from '@/types/features/tickets'
import { cn } from '@/lib/utils'
import { baseStyles } from '@/lib/constants/ui'
import { PriorityIndicator } from '@/components/shared/priority-indicator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useUpdateTicket } from '@/lib/hooks/tickets/use-tickets'

interface TicketListItemProps {
  ticket: Ticket
  className?: string
  onSelect?: (ticketId: string) => void
  isSelected?: boolean
}

const statusColors = {
  open: 'bg-status-info text-white',
  pending: 'bg-status-warning text-white',
  resolved: 'bg-status-success text-white',
  closed: 'bg-secondary text-white',
}

export function TicketListItem({ ticket, className, onSelect, isSelected }: TicketListItemProps) {
  const updateTicket = useUpdateTicket()

  const handleStatusChange = async (status: Ticket['status']) => {
    await updateTicket.mutateAsync({
      id: ticket.id,
      status,
    })
  }

  return (
    <div
      onClick={() => onSelect?.(ticket.id)}
      className={cn(
        baseStyles.card.base,
        baseStyles.card.bordered,
        baseStyles.card.interactive,
        isSelected && 'border-primary',
        'p-4 cursor-pointer',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          {/* Title and Status */}
          <div className="flex items-center gap-2">
            <span className="text-base font-medium">
              {ticket.title}
            </span>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                statusColors[ticket.status]
              )}
            >
              {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
            </span>
          </div>

          {/* Description */}
          {ticket.description && (
            <p className="line-clamp-2 text-sm text-secondary">
              {ticket.description}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-xs text-secondary-light">
            <span>#{ticket.id.slice(0, 8)}</span>
            <span>
              Created {format(new Date(ticket.created_at), 'MMM d, yyyy')}
            </span>
            {ticket._count?.messages && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {ticket._count.messages}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <PriorityIndicator priority={ticket.priority} showLabel size="sm" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
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
    </div>
  )
} 