"use client"

import { useTickets } from "@/lib/hooks/tickets/use-tickets"
import { TicketList } from "@/components/tickets/ticket-list"
import { TicketFilters } from "@/components/tickets/ticket-filters"
import { useState } from "react"
import type { TicketListParams } from "@/types/tickets"

export default function TicketQueuePage() {
  const [filters, setFilters] = useState<TicketListParams["filters"]>({})
  const [sort, setSort] = useState<TicketListParams["sort"]>({
    field: "created_at",
    direction: "desc",
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Ticket Queue</h1>
      </div>

      <TicketFilters
        filters={filters}
        onFiltersChange={setFilters}
        sort={sort}
        onSortChange={setSort}
      />

      <TicketList
        filters={filters}
        sort={sort}
      />
    </div>
  )
} 