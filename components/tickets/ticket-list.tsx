"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/hooks/use-auth"
import { RoleGate } from "@/components/auth/role-gate"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface Ticket {
  id: string
  title: string
  status: string
  priority: string
  created_at: string
  customer: {
    name: string
  }
  assignee: {
    name: string
  } | null
  department: {
    name: string
  } | null
}

export function TicketList() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { role, canAccessFeature } = useAuth()

  useEffect(() => {
    loadTickets()
  }, [])

  async function loadTickets() {
    try {
      let query = supabase
        .from("tickets")
        .select(`
          id,
          title,
          status,
          priority,
          created_at,
          customer:customer_id(name),
          assignee:assignee_id(name),
          department:department_id(name)
        `)

      // Role-based filtering
      if (role === "customer") {
        const { data: { user } } = await supabase.auth.getUser()
        query = query.eq("customer_id", user?.id)
      } else if (role === "agent") {
        const { data: { user } } = await supabase.auth.getUser()
        query = query.or(`assignee_id.eq.${user?.id},assignee_id.is.null`)
      }

      const { data, error } = await query

      if (error) throw error

      setTickets(data || [])
    } catch (error) {
      console.error("Error loading tickets:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTicket = (ticketId: string) => {
    setSelectedTickets(prev =>
      prev.includes(ticketId)
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    )
  }

  const toggleAll = () => {
    setSelectedTickets(prev =>
      prev.length === tickets.length ? [] : tickets.map(t => t.id)
    )
  }

  if (isLoading) {
    return <div>Loading tickets...</div>
  }

  return (
    <div className="space-y-4">
      <RoleGate requireFeature="bulk_actions">
        {selectedTickets.length > 0 && (
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <span className="text-sm font-medium">
              {selectedTickets.length} tickets selected
            </span>
            <Button variant="outline" size="sm">
              Assign
            </Button>
            <Button variant="outline" size="sm">
              Update Status
            </Button>
            <Button variant="outline" size="sm">
              Set Priority
            </Button>
          </div>
        )}
      </RoleGate>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <RoleGate requireFeature="bulk_actions">
                  <Checkbox
                    checked={selectedTickets.length === tickets.length}
                    onCheckedChange={toggleAll}
                  />
                </RoleGate>
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Customer</TableHead>
              <RoleGate requireFeature="assign_tickets">
                <TableHead>Assignee</TableHead>
              </RoleGate>
              <RoleGate requireFeature="manage_departments">
                <TableHead>Department</TableHead>
              </RoleGate>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>
                  <RoleGate requireFeature="bulk_actions">
                    <Checkbox
                      checked={selectedTickets.includes(ticket.id)}
                      onCheckedChange={() => toggleTicket(ticket.id)}
                    />
                  </RoleGate>
                </TableCell>
                <TableCell>
                  <a
                    href={`/tickets/${ticket.id}`}
                    className="font-medium hover:underline"
                  >
                    {ticket.title}
                  </a>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{ticket.status}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn({
                      "bg-red-100 text-red-800": ticket.priority === "urgent",
                      "bg-yellow-100 text-yellow-800": ticket.priority === "high",
                      "bg-blue-100 text-blue-800": ticket.priority === "medium",
                      "bg-gray-100 text-gray-800": ticket.priority === "low",
                    })}
                  >
                    {ticket.priority}
                  </Badge>
                </TableCell>
                <TableCell>{ticket.customer?.name}</TableCell>
                <RoleGate requireFeature="assign_tickets">
                  <TableCell>{ticket.assignee?.name || "Unassigned"}</TableCell>
                </RoleGate>
                <RoleGate requireFeature="manage_departments">
                  <TableCell>{ticket.department?.name || "None"}</TableCell>
                </RoleGate>
                <TableCell>
                  {formatDistanceToNow(new Date(ticket.created_at), {
                    addSuffix: true,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 