"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ticketService } from "@/lib/services/ticket-service"
import { Ticket } from "@/lib/types/tickets"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCcw,
} from "lucide-react"
import Link from "next/link"

function getStatusIcon(status: Ticket["status"]) {
  switch (status) {
    case "open":
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
    case "in_progress":
      return <Clock className="h-4 w-4 text-blue-500" />
    case "waiting_on_customer":
      return <RefreshCcw className="h-4 w-4 text-purple-500" />
    case "resolved":
    case "closed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    default:
      return null
  }
}

function getStatusColor(status: Ticket["status"]) {
  switch (status) {
    case "open":
      return "text-yellow-500"
    case "in_progress":
      return "text-blue-500"
    case "waiting_on_customer":
      return "text-purple-500"
    case "resolved":
    case "closed":
      return "text-green-500"
    default:
      return "text-muted-foreground"
  }
}

export default function TicketsPage() {
  const { data: tickets, isLoading } = useQuery({
    queryKey: ["tickets"],
    queryFn: ticketService.getTickets,
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Tickets</h1>
          <p className="text-muted-foreground">View and manage your support tickets</p>
        </div>
        <Button asChild>
          <Link href="/customer/tickets/new">
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {tickets?.map((ticket) => (
          <Link key={ticket.id} href={`/customer/tickets/${ticket.id}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  {ticket.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className={getStatusColor(ticket.status)}>
                    {getStatusIcon(ticket.status)}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    #{ticket.id.split("-")[0]}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-2">
                  {ticket.description}
                </CardDescription>
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    Created:{" "}
                    {format(new Date(ticket.created_at), "MMM d, yyyy h:mm a")}
                  </span>
                  <span>Priority: {ticket.priority}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}

        {tickets?.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No Tickets Found</CardTitle>
              <CardDescription>
                You haven't created any support tickets yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/customer/tickets/new">Create Your First Ticket</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 