"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { supabase } from "@/lib/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Clock } from "lucide-react"
import Link from "next/link"
import { ROUTES } from "@/lib/constants/routes"
import { Ticket } from "@/lib/types/tickets"
import { use } from "react"

export default function TicketDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>
}) {
  const params = use(paramsPromise)

  const { data: ticket, isLoading } = useQuery<Ticket>({
    queryKey: ["ticket", params.id],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error("Not authenticated")

      const { data: ticket, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", params.id)
        .eq("customer_id", user.user.id)
        .single()

      if (error) throw error
      return ticket
    },
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Button variant="ghost" asChild>
          <Link href={ROUTES.tickets.customer.list}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tickets
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Ticket Not Found</CardTitle>
            <CardDescription>
              The ticket you're looking for doesn't exist or you don't have permission to view it.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Button variant="ghost" asChild>
        <Link href={ROUTES.tickets.customer.list}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tickets
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{ticket.title}</CardTitle>
              <CardDescription>
                Ticket #{ticket.id.split("-")[0]} • Created{" "}
                {new Date(ticket.created_at).toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm">
              <Clock className="h-4 w-4" />
              <span className="capitalize">{ticket.status.replace("_", " ")}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="mb-2 font-medium">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {ticket.description}
            </p>
          </div>

          <div className="flex gap-8">
            <div>
              <h3 className="mb-1 text-sm font-medium">Priority</h3>
              <p className="text-sm text-muted-foreground capitalize">
                {ticket.priority}
              </p>
            </div>
            <div>
              <h3 className="mb-1 text-sm font-medium">Category</h3>
              <p className="text-sm text-muted-foreground capitalize">
                {ticket.category}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TODO: Add ticket conversation thread */}
      {/* TODO: Add ability to add replies */}
      {/* TODO: Add ticket status updates */}
    </div>
  )
} 