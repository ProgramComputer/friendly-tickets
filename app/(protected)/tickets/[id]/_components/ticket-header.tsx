'use client'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { TicketWithRelations } from "@/types/tickets"

interface TicketHeaderProps {
  ticket: TicketWithRelations
}

export function TicketHeader({ ticket }: TicketHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{ticket.title}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Ticket #{ticket.id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(ticket.status)}>
              {ticket.status}
            </Badge>
            <Badge variant={getPriorityVariant(ticket.priority)}>
              {ticket.priority}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap">{ticket.description}</p>
      </CardContent>
    </Card>
  )
}

function getStatusVariant(status: string) {
  switch (status) {
    case 'open':
      return 'default'
    case 'pending':
      return 'warning'
    case 'resolved':
      return 'success'
    case 'closed':
      return 'secondary'
    default:
      return 'default'
  }
}

function getPriorityVariant(priority: string) {
  switch (priority) {
    case 'low':
      return 'secondary'
    case 'medium':
      return 'default'
    case 'high':
      return 'warning'
    case 'urgent':
      return 'destructive'
    default:
      return 'default'
  }
} 