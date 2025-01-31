'use client'

import { useEffect, useState } from 'react'
import { ChatContainer } from "@/components/chat/chat-container"
import { Button } from "@/components/ui/button"
import { useSupabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Badge } from "@/components/ui/badge"
import { useAuth } from '@/lib/hooks/use-auth'
import { XCircle, MoreHorizontal } from 'lucide-react'

interface TicketChatViewProps {
  ticketId: string
  agentId?: string
  agentName?: string
}

export function TicketChatView({ ticketId, agentId = "agent-id", agentName = "Support Agent" }: TicketChatViewProps) {
  const [chatSessionId, setChatSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [ticketDetails, setTicketDetails] = useState<{ 
    title: string
    status: string
    created_at: string 
  } | null>(null)
  const supabase = useSupabase()
  const { toast } = useToast()
  const { isAgent, isAdmin } = useAuth()

  // Fetch ticket details
  useEffect(() => {
    async function fetchTicketDetails() {
      try {
        const { data: ticket, error } = await supabase
          .from('tickets')
          .select('title, status, created_at')
          .eq('id', ticketId)
          .single()

        if (error) throw error
        setTicketDetails(ticket)
      } catch (error) {
        console.error('Error fetching ticket details:', error)
      }
    }

    fetchTicketDetails()
  }, [ticketId, supabase])

  useEffect(() => {
    async function initializeChatSession() {
      try {
        // First check if a chat session already exists for this ticket
        const { data: existingSession, error: fetchError } = await supabase
          .from('chat_sessions')
          .select('id')
          .eq('ticket_id', ticketId)
          .single()

        if (existingSession) {
          console.log('Found existing chat session:', existingSession.id)
          setChatSessionId(existingSession.id)
          setIsLoading(false)
          return
        }

        // If no session exists, first get the authenticated user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          throw new Error('No authenticated user found')
        }

        console.log('Initializing chat session for user:', user.id)

        // Try to get team member first
        const { data: teamMember, error: teamMemberError } = await supabase
          .from('team_members')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()

        // If user is a team member, create session as agent
        if (teamMember && !teamMemberError) {
          console.log('Creating chat session as agent:', teamMember.id)
          const { data: newSession, error: createError } = await supabase
            .from('chat_sessions')
            .insert({
              ticket_id: ticketId,
              agent_id: teamMember.id,
              status: 'active'
            })
            .select()
            .single()

          if (createError) throw createError
          console.log('Created new agent chat session:', newSession.id)
          setChatSessionId(newSession.id)
          return
        }

        // If not a team member, try customer record
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()

        if (customerError || !customer) {
          console.error('Error getting customer:', customerError)
          throw new Error('User not found as team member or customer')
        }

        // Create new chat session with the customer_id
        const { data: newSession, error: createError } = await supabase
          .from('chat_sessions')
          .insert({
            ticket_id: ticketId,
            customer_id: customer.id,
            status: 'active'
          })
          .select()
          .single()

        if (createError) throw createError

        console.log('Created new customer chat session:', newSession.id)
        setChatSessionId(newSession.id)
      } catch (error) {
        console.error('Error initializing chat session:', error)
        toast({
          title: 'Error',
          description: 'Failed to initialize chat session. Please ensure you are logged in as a customer or team member.',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    initializeChatSession()
  }, [ticketId, supabase, toast])

  const handleUpdateStatus = async () => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: 'in_progress' })
        .eq('id', ticketId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Ticket status updated successfully'
      })

      // Refresh ticket details
      fetchTicketDetails()
    } catch (error) {
      console.error('Error updating ticket status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update ticket status',
        variant: 'destructive'
      })
    }
  }

  if (isLoading) {
    return <div>Loading chat...</div>
  }

  if (!chatSessionId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <XCircle className="h-12 w-12 text-destructive mx-auto" />
          <h3 className="font-medium">Failed to initialize chat session</h3>
          <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Ticket Header */}
      <div className="border-b px-6 py-4 bg-card/50">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">
              {ticketDetails?.title || 'Loading...'}
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge variant="outline" className="font-medium">
                  {ticketDetails?.status || 'unknown'}
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                Created {ticketDetails?.created_at ? new Date(ticketDetails.created_at).toLocaleString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Unknown'}
              </span>
            </div>
          </div>
          {(isAgent || isAdmin) && (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleUpdateStatus}
                disabled={isLoading}
                className="font-medium"
              >
                Update Status
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Chat Container - Fill remaining height */}
      <div className="flex-1 min-h-0">
        <ChatContainer
          sessionId={chatSessionId}
          recipientId={agentId}
          recipientName={agentName}
          retriever={null}
        />
      </div>
    </div>
  )
} 