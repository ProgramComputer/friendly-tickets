'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDistanceToNow } from "date-fns"
import { Clock } from "lucide-react"
import type { TicketWithRelations } from "@/types/tickets"
import { handleStatusChange, handlePriorityChange, handleAssigneeChange } from "../actions"

interface TicketSidebarProps {
  ticket: TicketWithRelations
}

export function TicketSidebar({ ticket }: TicketSidebarProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={ticket.customer?.avatar_url || "/avatars/default.svg"} />
              <AvatarFallback>
                {ticket.customer?.name?.charAt(0).toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{ticket.customer?.name}</p>
              <p className="text-sm text-muted-foreground">
                {ticket.customer?.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Status</p>
            <Select
              value={ticket.status}
              onValueChange={(value) => handleStatusChange(ticket.id, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="waiting_on_customer">Waiting on Customer</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-sm font-medium">Priority</p>
            <Select
              value={ticket.priority}
              onValueChange={(value) => handlePriorityChange(ticket.id, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <p className="text-sm font-medium">Assignee</p>
            <Select
              value={ticket.assignee_id || ""}
              onValueChange={(value) => handleAssigneeChange(ticket.id, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {/* Add team members here */}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 