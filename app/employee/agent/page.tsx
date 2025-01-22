"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { createBrowserClient } from "@supabase/ssr"
import { useQuery } from "@tanstack/react-query"

interface AgentStats {
  assignedTickets: number
  openTickets: number
  resolvedTickets: number
}

export default function AgentDashboard() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: stats, isLoading } = useQuery<AgentStats>({
    queryKey: ["agentStats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Fetch agent statistics from Supabase
      const { data, error } = await supabase
        .from("tickets")
        .select("status, created_at")
        .eq("assigned_to", user.id)

      if (error) throw error

      const assignedTickets = data.length
      const openTickets = data.filter((ticket) => ticket.status === "open").length
      const resolvedTickets = data.filter(
        (ticket) => ticket.status === "resolved"
      ).length

      return {
        assignedTickets,
        openTickets,
        resolvedTickets,
      }
    },
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Agent Dashboard</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium">Assigned Tickets</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.assignedTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium">Open Tickets</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.openTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium">Resolved Tickets</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.resolvedTickets}</div>
          </CardContent>
        </Card>
      </div>

      {/* TODO: Add recent tickets table */}
      {/* TODO: Add performance metrics */}
      {/* TODO: Add response time tracking when the resolved_at column is added */}
    </div>
  )
} 