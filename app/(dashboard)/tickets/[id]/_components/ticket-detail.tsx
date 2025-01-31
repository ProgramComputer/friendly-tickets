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
import type { TicketWithDetails } from '@/types/features/tickets'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/global/supabase'

interface Props {
  ticket: TicketWithDetails
}

export function TicketDetail({ ticket: initialTicket }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [reply, setReply] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const updateTicket = useUpdateTicket()
  const [isLoading, setIsLoading] = useState(false)
  const [ticket, setTicket] = useState<TicketWithDetails>(initialTicket)
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function refreshTicket() {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          id,
          title,
          description,
          status,
          priority,
          created_at,
          messages:ticket_messages(
            id,
            content,
            created_at,
            is_internal,
            sender:sender_id(*)
          ),
          tags:ticket_tags(
            id,
            tag:tags(*)
          ),
          assignee:team_members(*),
          customer:customers(*),
          department:departments(*)
        `)
        .eq("id", initialTicket.id)
        .single()

      if (error) throw error
      if (data) setTicket(data as TicketWithDetails)
    } catch (error) {
      console.error("Error loading ticket:", error)
      toast({
        title: 'Error',
        description: 'Failed to load ticket details',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmitReply() {
    if (!reply.trim()) return

    try {
      setIsSubmitting(true)
      
      // First create the message
      const { data: messageData, error: messageError } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          content: reply,
          is_internal: false
        })
        .select()
        .single()

      if (messageError) throw messageError

      // Then update the ticket to trigger any necessary hooks
      await updateTicket.mutateAsync({
        id: ticket.id,
        updated_at: new Date().toISOString()
      })

      setReply('')
      toast({
        title: 'Success',
        description: 'Reply added successfully'
      })
      refreshTicket() // Refresh to get the latest messages
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
                {ticket.tags?.map((tagRelation) => (
                  <Badge 
                    key={tagRelation.id} 
                    variant="outline" 
                    className="text-xs"
                  >
                    {tagRelation.tag.name}
                  </Badge>
                ))}
              </div>
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          <div className="mt-6 space-y-4">
            {ticket.messages?.map((message) => (
              <Card key={message.id}>
                <CardContent className="py-4">
                  <div className="flex items-start space-x-4">
                    <Avatar>
                      <AvatarImage src={message.sender?.avatar_url} />
                      <AvatarFallback>
                        {message.sender?.name?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          {message.sender?.name || 'Unknown User'}
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
                  {ticket.tags?.map(tagRelation => tagRelation.tag.name).join(', ') || 'Uncategorized'}
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