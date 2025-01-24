'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { useUpdateTicket } from '@/lib/hooks/tickets/use-tickets'
import { StatusBadge } from '@/components/shared/status-badge'
import { PriorityIndicator } from '@/components/shared/priority-indicator'
import type { Ticket } from '@/lib/supabase/database.types'

interface Props {
  ticket: Ticket
}

export function TicketDetail({ ticket }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [reply, setReply] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const updateTicket = useUpdateTicket()

  async function handleSubmitReply() {
    if (!reply.trim()) return

    try {
      setIsSubmitting(true)
      await updateTicket.mutateAsync({
        id: ticket.id,
        messages: [
          ...(ticket.messages || []),
          {
            content: reply,
            created_at: new Date().toISOString()
          }
        ]
      })
      setReply('')
      toast({
        title: 'Success',
        description: 'Reply added successfully'
      })
    } catch (error) {
      console.error('Error adding reply:', error)
      toast({
        title: 'Error',
        description: 'Failed to add reply. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{ticket.title}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Created {format(new Date(ticket.created_at), 'PPp')}</span>
                <StatusBadge status={ticket.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <PriorityIndicator priority={ticket.priority} showLabel />
                {ticket.category && (
                  <Badge variant="outline">{ticket.category}</Badge>
                )}
              </div>
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          <div className="mt-6 space-y-4">
            {ticket.messages?.map((message, index) => (
              <Card key={index}>
                <CardContent className="py-4">
                  <div className="flex items-start space-x-4">
                    <Avatar>
                      <AvatarImage src={message.user?.avatar_url} />
                      <AvatarFallback>
                        {message.user?.name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          {message.user?.name || 'Unknown User'}
                        </p>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(message.created_at), 'PPp')}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardContent className="py-4">
                <Textarea
                  placeholder="Write a reply..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="mb-4"
                />
                <Button
                  onClick={handleSubmitReply}
                  disabled={isSubmitting || !reply.trim()}
                >
                  {isSubmitting ? 'Sending...' : 'Send Reply'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div>
          <Card>
            <CardContent className="py-6 space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Status</p>
                <StatusBadge status={ticket.status} />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Priority</p>
                <PriorityIndicator priority={ticket.priority} showLabel />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Category</p>
                <Badge variant="outline">
                  {ticket.category || 'Uncategorized'}
                </Badge>
              </div>
              {ticket.assignee && (
                <div>
                  <p className="text-sm font-medium mb-2">Assigned To</p>
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src={ticket.assignee.avatar_url} />
                      <AvatarFallback>
                        {ticket.assignee.name?.[0] || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <span>{ticket.assignee.name}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 