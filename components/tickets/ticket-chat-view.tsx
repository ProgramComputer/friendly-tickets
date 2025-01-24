'use client'

import { ChatContainer } from "@/components/chat/chat-container"
import { Button } from "@/components/ui/button"

interface TicketChatViewProps {
  ticketId: string
  agentId?: string
  agentName?: string
}

export function TicketChatView({ ticketId, agentId = "agent-id", agentName = "Support Agent" }: TicketChatViewProps) {
  return (
    <>
      {/* Ticket Header */}
      <div className="h-14 border-b px-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Ticket #{ticketId}</h2>
          <p className="text-sm text-muted-foreground">Status: Open</p>
        </div>
        <Button variant="outline" size="sm">Update Status</Button>
      </div>

      {/* Ticket Content */}
      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-auto">
            <ChatContainer
              sessionId={ticketId}
              recipientId={agentId}
              recipientName={agentName}
            />
          </div>
        </div>
      </div>
    </>
  )
} 