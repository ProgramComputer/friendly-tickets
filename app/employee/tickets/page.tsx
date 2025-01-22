"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Ticket } from "@/lib/types/tickets"
import { useQuery } from "@tanstack/react-query"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  LayoutList,
  RefreshCcw,
  Search,
} from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface TicketQueueFilters {
  status: string[]
  priority: string[]
  assignee: string | null
  searchQuery: string
}

export default function TicketQueuePage() {
  const supabase = createClientComponentClient()

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["tickets", "queue"],
    queryFn: async () => {
      const { data: tickets, error } = await supabase
        .from("tickets")
        .select("*, profiles!tickets_customer_id_fkey(name, email)")
        .order("created_at", { ascending: false })

      if (error) throw error
      return tickets
    },
  })

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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ticket Queue</h1>
          <p className="text-muted-foreground">
            Manage and respond to customer tickets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <LayoutList className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <div className="mb-4 flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tickets..."
                className="pl-8"
              />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="waiting">Waiting on Customer</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="assigned">Assigned to Me</TabsTrigger>
              <TabsTrigger value="unassigned">Unassigned</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <div className="grid gap-4">
                {tickets?.map((ticket) => (
                  <Card key={ticket.id} className="cursor-pointer hover:bg-muted/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-medium">
                          {ticket.title}
                        </CardTitle>
                        <CardDescription>
                          {(ticket.profiles as any).name || (ticket.profiles as any).email} •{" "}
                          #{ticket.id.split("-")[0]}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <span className="text-sm font-medium capitalize text-muted-foreground">
                          {ticket.status.replace("_", " ")}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {ticket.description}
                      </p>
                      <div className="mt-4 flex items-center gap-4 text-sm">
                        <span className="capitalize">Priority: {ticket.priority}</span>
                        <span>•</span>
                        <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="assigned">
              {/* TODO: Show tickets assigned to current agent */}
            </TabsContent>
            <TabsContent value="unassigned">
              {/* TODO: Show unassigned tickets */}
            </TabsContent>
          </Tabs>
        </div>

        <Card className="h-fit w-80 shrink-0">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Open Tickets</span>
              <span className="text-sm text-muted-foreground">
                {tickets?.filter((t) => t.status === "open").length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">In Progress</span>
              <span className="text-sm text-muted-foreground">
                {tickets?.filter((t) => t.status === "in_progress").length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Waiting on Customer</span>
              <span className="text-sm text-muted-foreground">
                {tickets?.filter((t) => t.status === "waiting_on_customer").length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Resolved Today</span>
              <span className="text-sm text-muted-foreground">
                {tickets?.filter(
                  (t) =>
                    t.status === "resolved" &&
                    new Date(t.updated_at).toDateString() === new Date().toDateString()
                ).length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 