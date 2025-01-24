'use client'

import { useEffect, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { TicketPriority, TicketStatus } from '@/types/tickets'
import { getTickets } from '@/lib/supabase/domain/tickets/queries'
import { Button } from '@/components/ui/button'
import { TicketFilterPanel } from './ticket-filter-panel'
import { TicketSortControls } from './ticket-sort-controls'
import { TicketListItem } from './ticket-list-item'

interface TicketListProps {
  showAgentFilters?: boolean
}

export function TicketList({ showAgentFilters = false }: TicketListProps) {
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus[]>([])
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority[]>([])
  const [dateRange, setDateRange] = useState<{
    start: Date
    end: Date
  }>()
  const [sort, setSort] = useState<{
    field: 'created_at' | 'updated_at' | 'priority' | 'status'
    direction: 'asc' | 'desc'
  }>({
    field: 'created_at',
    direction: 'desc',
  })

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['tickets', selectedStatus, selectedPriority, dateRange, sort],
    queryFn: ({ pageParam }) =>
      getTickets({
        cursor: pageParam,
        limit: 10,
        filters: {
          status: selectedStatus,
          priority: selectedPriority,
          dateRange,
        },
        sort,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
  })

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 100 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  if (isError) {
    return (
      <div className="flex h-[200px] items-center justify-center text-muted-foreground">
        Failed to load tickets. Please try again later.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <TicketFilterPanel
          selectedStatus={selectedStatus}
          selectedPriority={selectedPriority}
          dateRange={dateRange}
          onStatusChange={setSelectedStatus}
          onPriorityChange={setSelectedPriority}
          onDateRangeChange={setDateRange}
        />
        <TicketSortControls sort={sort} onSortChange={setSort} />
      </div>

      {isLoading ? (
        <div className="flex h-[200px] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : data?.pages[0].tickets.length === 0 ? (
        <div className="flex h-[200px] items-center justify-center text-muted-foreground">
          No tickets found.
        </div>
      ) : (
        <div className="space-y-2">
          {data?.pages.map((page, i) => (
            <div key={i} className="space-y-2">
              {page.tickets.map((ticket) => (
                <TicketListItem key={ticket.id} ticket={ticket} />
              ))}
            </div>
          ))}

          {hasNextPage && (
            <div className="flex justify-center py-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 