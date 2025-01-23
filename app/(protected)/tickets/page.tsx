import { Suspense } from "react"
import { TicketList } from "./_components/ticket-list"
import { TicketFilters } from "./_components/ticket-filters"
import { TicketListSkeleton } from "./_components/ticket-list-skeleton"

export default function TicketsPage() {
  return (
    <div className="container py-6 space-y-4">
      <TicketFilters />
      <Suspense fallback={<TicketListSkeleton />}>
        <TicketList />
      </Suspense>
    </div>
  )
} 