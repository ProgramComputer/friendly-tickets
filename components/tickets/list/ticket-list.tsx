'use client'

import { Fragment } from 'react'
import { useTickets, useInfiniteScroll } from '@/lib/hooks/tickets/use-tickets'
import type { TicketListParams } from '@/types/tickets'
import { cn } from '@/lib/utils'
import { baseStyles } from '@/lib/constants/ui'
import { Skeleton } from '@/components/ui/skeleton'
import { TicketListItem } from './ticket-list-item'

interface TicketListProps {
  params: TicketListParams
  className?: string
  onTicketSelect?: (ticketId: string) => void
  selectedTicketId?: string | null
}

export function TicketList({ params, className, onTicketSelect, selectedTicketId }: TicketListProps) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useTickets(params)

  // Setup infinite scroll
  useInfiniteScroll(
    () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    {
      threshold: 0.5,
      rootMargin: '100px',
    }
  )

  if (error) {
    return (
      <div className="p-4 text-center text-status-error">
        Error loading tickets. Please try again.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <TicketListItemSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!data?.pages[0].tickets.length) {
    return (
      <div className="p-4 text-center text-secondary">
        No tickets found. Create your first ticket to get started.
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {data.pages.map((page, i) => (
        <Fragment key={i}>
          {page.tickets.map((ticket) => (
            <TicketListItem 
              key={ticket.id} 
              ticket={ticket} 
              onSelect={onTicketSelect}
              isSelected={selectedTicketId === ticket.id}
            />
          ))}
        </Fragment>
      ))}

      {/* Infinite scroll trigger */}
      {hasNextPage && (
        <div id="infinite-scroll-trigger" className="h-4">
          {isFetchingNextPage && <TicketListItemSkeleton />}
        </div>
      )}
    </div>
  )
}

function TicketListItemSkeleton() {
  return (
    <div
      className={cn(
        baseStyles.card.base,
        baseStyles.card.bordered,
        'p-4 space-y-4'
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
} 