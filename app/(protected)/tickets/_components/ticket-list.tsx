'use client'

import { useEffect, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { TicketListItem } from './ticket-list-item'
import { TicketFilterPanel } from './ticket-filter-panel'
import { TicketSortControls } from './ticket-sort-controls'
import type { Database } from '@/types/supabase'

const ITEMS_PER_PAGE = 10

interface TicketListProps {
  showAgentFilters?: boolean
}

export function TicketList({ showAgentFilters = false }: TicketListProps) {
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedPriority, setSelectedPriority] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null])
  const [sort, setSort] = useState<{ field: string; direction: 'asc' | 'desc' }>({
    field: 'created_at',
    direction: 'desc',
  })

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['tickets', selectedStatus, selectedPriority, dateRange, sort],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('tickets')
        .select('*, customer:customers(*), assignee:team_members(*)')
        .range(pageParam * ITEMS_PER_PAGE, (pageParam + 1) * ITEMS_PER_PAGE - 1)
        .order(sort.field, { ascending: sort.direction === 'asc' })

      if (selectedStatus) {
        query = query.eq('status', selectedStatus)
      }
      if (selectedPriority) {
        query = query.eq('priority', selectedPriority)
      }
      if (dateRange[0] && dateRange[1]) {
        query = query
          .gte('created_at', dateRange[0].toISOString())
          .lte('created_at', dateRange[1].toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      return {
        tickets: data,
        nextPage: data.length === ITEMS_PER_PAGE ? pageParam + 1 : undefined,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
  })

  if (isError) {
    return (
      <Card className="p-6">
        <div className="text-center text-sm text-destructive">
          Failed to load tickets. Please try again later.
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-[300px,1fr] gap-6">
        <div className="bg-card rounded-lg border p-4 space-y-6">
          <TicketFilterPanel
            selectedStatus={selectedStatus}
            selectedPriority={selectedPriority}
            dateRange={dateRange}
            onStatusChange={setSelectedStatus}
            onPriorityChange={setSelectedPriority}
            onDateRangeChange={setDateRange}
          />
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-end">
            <TicketSortControls sort={sort} onSortChange={setSort} />
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-muted animate-pulse rounded-lg"
                />
              ))}
            </div>
          ) : data?.pages[0].tickets.length === 0 ? (
            <Card className="p-6">
              <div className="text-center text-sm text-muted-foreground">
                No tickets found.
              </div>
            </Card>
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
                    className="w-full max-w-[200px]"
                  >
                    {isFetchingNextPage ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading more tickets...
                      </div>
                    ) : (
                      'Load More Tickets'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 