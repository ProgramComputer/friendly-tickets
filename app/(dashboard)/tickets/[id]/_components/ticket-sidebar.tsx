'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDistanceToNow } from "date-fns"
import { Clock } from "lucide-react"
import { StatusBadge } from '@/components/shared/status-badge'
import { PriorityIndicator } from '@/components/shared/priority-indicator'
import { useUpdateTicket } from '@/lib/hooks/tickets/use-tickets'
import { useToast } from '@/hooks/use-toast'
import type { Ticket } from '@/lib/supabase/database.types'

interface TicketSidebarProps {
  ticket: Ticket
}

export function TicketSidebar({ ticket }: TicketSidebarProps) {
  const updateTicket = useUpdateTicket()
  const { toast } = useToast()

  const handleStatusChange = async (status: string) => {
    try {
      await updateTicket.mutateAsync({
        id: ticket.id,
        status,
      })
      toast({
        title: 'Success',
        description: 'Ticket status updated successfully'
      })
    } catch (error) {
      console.error('Error updating status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update ticket status',
        variant: 'destructive'
      })
    }
  }

  const handlePriorityChange = async (priority: string) => {
    try {
      await updateTicket.mutateAsync({
        id: ticket.id,
        priority,
      })
      toast({
        title: 'Success',
        description: 'Ticket priority updated successfully'
      })
    } catch (error) {
      console.error('Error updating priority:', error)
      toast({
        title: 'Error',
        description: 'Failed to update ticket priority',
        variant: 'destructive'
      })
    }
  }

  const handleAssigneeChange = async (assignee_id: string) => {
    try {
      await updateTicket.mutateAsync({
        id: ticket.id,
        assignee_id: assignee_id === 'unassigned' ? null : assignee_id,
      })
      toast({
        title: 'Success',
        description: 'Ticket assignment updated successfully'
      })
    } catch (error) {
      console.error('Error updating assignee:', error)
      toast({
        title: 'Error',
        description: 'Failed to update ticket assignment',
        variant: 'destructive'
      })
    }
  }

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
            <div className="flex items-center gap-4">
              <StatusBadge status={ticket.status} />
              <Select
                value={ticket.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Priority</p>
            <div className="flex items-center gap-4">
              <PriorityIndicator priority={ticket.priority} showLabel />
              <Select
                value={ticket.priority}
                onValueChange={handlePriorityChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Change priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Assignee</p>
            <Select
              value={ticket.assignee_id || "unassigned"}
              onValueChange={handleAssigneeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
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