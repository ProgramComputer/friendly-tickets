'use client'

import { useState } from 'react'
import { useTickets } from '@/lib/hooks/tickets/use-tickets'
import { useTeamMembers } from '@/lib/hooks/team/use-team-members'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { PriorityIndicator } from '@/components/tickets/priority-indicator'
import { formatDistanceToNow } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function QueueManagement() {
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = useState<string[]>([])

  const { data: tickets, isLoading: isLoadingTickets } = useTickets({
    filters: {
      status: statusFilter,
      priority: priorityFilter,
      search: searchQuery,
    },
  })

  const { data: teamMembers, isLoading: isLoadingTeam } = useTeamMembers()

  const handleAssign = async () => {
    if (!selectedAgent || selectedTickets.length === 0) {
      toast.error('Please select an agent and at least one ticket')
      return
    }

    try {
      // Implement ticket assignment logic here
      toast.success('Tickets assigned successfully')
      setSelectedTickets([])
      setSelectedAgent('')
    } catch (error) {
      console.error('Error assigning tickets:', error)
      toast.error('Failed to assign tickets')
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
      prev.length === tickets?.length ? [] : tickets?.map(t => t.id) ?? []
    )
  }

  if (isLoadingTickets || isLoadingTeam) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter.join(',')}
          onValueChange={value => setStatusFilter(value ? value.split(',') : [])}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="waiting_on_customer">Waiting on Customer</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={priorityFilter.join(',')}
          onValueChange={value => setPriorityFilter(value ? value.split(',') : [])}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedTickets.length > 0 && (
        <div className="flex items-center gap-4 rounded-lg border bg-muted p-4">
          <span className="text-sm font-medium">
            {selectedTickets.length} tickets selected
          </span>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Assign to agent" />
            </SelectTrigger>
            <SelectContent>
              {teamMembers?.map(member => (
                <SelectItem key={member.id} value={member.id}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="default"
            onClick={handleAssign}
            disabled={!selectedAgent}
          >
            Assign Tickets
          </Button>
        </div>
      )}

      {/* Tickets Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={
                    tickets?.length
                      ? selectedTickets.length === tickets.length
                      : false
                  }
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Assignee</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets?.map(ticket => (
              <TableRow key={ticket.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedTickets.includes(ticket.id)}
                    onCheckedChange={() => toggleTicket(ticket.id)}
                  />
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
                  <PriorityIndicator priority={ticket.priority} showLabel />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{ticket.customer.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {ticket.customer.email}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(ticket.created_at), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  {ticket.assignee?.name || (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 