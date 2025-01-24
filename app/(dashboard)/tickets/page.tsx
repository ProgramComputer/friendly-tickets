'use client'

import { useState } from "react"
import { Suspense } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { TicketList } from "@/components/tickets/list/ticket-list"
import { QuickFilters } from "@/components/tickets/quick-filters"
import { TicketChatView } from "@/components/tickets/ticket-chat-view"
import { Plus } from "lucide-react"
import { ROUTES } from "@/lib/constants/routes"

export default function TicketsPage() {
  const router = useRouter()
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    department: '',
    assignee: '',
    sort: 'created_desc'
  })

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden flex">
      {/* Left Panel - Tickets List */}
      <div className="w-80 border-r bg-background flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">My Tickets</h2>
            <Button 
              size="sm"
              onClick={() => router.push(`${ROUTES.dashboard.tickets}/new`)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New
            </Button>
          </div>
          <QuickFilters onFiltersChange={setFilters} />
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <Suspense fallback={<div>Loading tickets...</div>}>
            <TicketList 
              params={filters}
              onTicketSelect={setSelectedTicket}
              selectedTicketId={selectedTicket}
            />
          </Suspense>
        </div>
      </div>

      {/* Right Panel - Ticket/Chat View */}
      <div className="flex-1 flex flex-col">
        {selectedTicket ? (
          <TicketChatView ticketId={selectedTicket} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a ticket to view details
          </div>
        )}
      </div>
    </div>
  )
} 