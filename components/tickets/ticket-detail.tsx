"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/lib/hooks/use-auth"
import { RoleGate } from "@/components/auth/role-gate"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { TicketResponse } from "@/lib/supabase/types"
import { ChatInput } from "@/components/chat/chat-input"
import { toast } from "sonner"

interface TicketDetail {
  id: string
  title: string
  description: string
  status: string
  priority: string
  created_at: string
  customer: {
    name: string
    email: string
  }
  assignee: {
    name: string
    email: string
  } | null
  department: {
    name: string
  } | null
  sla_policy: {
    name: string
    response_time: number
    resolution_time: number
  } | null
  tags: { name: string; color: string }[]
  watchers: { email: string; type: "cc" | "bcc" }[]
  custom_fields: Record<string, any>
  responses: TicketResponse[]
  metadata: Record<string, any>
}

export function TicketDetail({ ticketId }: { ticketId: string }) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { role, canAccessFeature, user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    console.log('[TicketDetail] Loading ticket:', { ticketId })
    loadTicket()
  }, [ticketId])

  async function loadTicket() {
    console.log('[TicketDetail] Starting ticket load')
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          id,
          title,
          description,
          status,
          priority,
          created_at,
          customer:customer_id(name, email),
          assignee:assignee_id(name, email),
          department:department_id(name),
          sla_policy:sla_policy_id(name, response_time_hours, resolution_time_hours),
          tags:ticket_tags(tag:tag_id(name, color)),
          watchers:ticket_watchers(email, watcher_type),
          metadata,
          responses:ticket_responses(
            id,
            content,
            created_at,
            is_internal,
            sender:sender_id(name, email)
          )
        `)
        .eq("id", ticketId)
        .single()

      console.log('[TicketDetail] Ticket query result:', {
        found: !!data,
        error: error?.message,
        ticketId,
        customerId: data?.customer?.id,
        assigneeId: data?.assignee?.id,
        status: data?.status
      })

      if (error) throw error

      setTicket(data)
    } catch (error) {
      console.error("[TicketDetail] Error loading ticket:", error)
      if (error instanceof Error) {
        console.error("[TicketDetail] Error details:", {
          message: error.message,
          name: error.name,
          stack: error.stack
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    console.log('[TicketDetail] Ticket is loading')
    return <div>Loading ticket details...</div>
  }

  if (!ticket) {
    console.log('[TicketDetail] No ticket found')
    return <div>Ticket not found</div>
  }

  console.log('[TicketDetail] Rendering ticket:', {
    id: ticket.id,
    status: ticket.status,
    hasCustomer: !!ticket.customer,
    hasAssignee: !!ticket.assignee,
    responsesCount: ticket.responses?.length
  })

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{ticket.title}</h1>
          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            <span>Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
            <Badge variant="outline">{ticket.status}</Badge>
            <Badge variant="outline">{ticket.priority}</Badge>
          </div>
        </div>
        <RoleGate requireFeature="manage_tickets">
          <div className="flex items-center gap-2">
            <Button variant="outline">Edit</Button>
            <Button variant="outline">Close</Button>
            <Button variant="outline">Delete</Button>
          </div>
        </RoleGate>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2">
          <Tabs defaultValue="conversation">
            <TabsList>
              <TabsTrigger value="conversation">Conversation</TabsTrigger>
              <RoleGate requireFeature="view_internal_notes">
                <TabsTrigger value="internal">Internal Notes</TabsTrigger>
              </RoleGate>
            </TabsList>
            <TabsContent value="conversation" className="space-y-4">
              <div className="space-y-4">
                {ticket.responses
                  .filter(r => !r.is_internal)
                  .map(response => (
                    <Card key={response.id}>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">
                          {response.sender.name}
                          <span className="ml-2 text-muted-foreground">
                            {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-wrap">{response.content}</p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
              
              <Card>
                <CardContent className="p-4">
                  <ChatInput
                    onSendMessage={async (content) => {
                      try {
                        const { data, error } = await supabase
                          .from('ticket_responses')
                          .insert({
                            ticket_id: ticket.id,
                            content,
                            sender_id: user?.id,
                            sender_type: role === 'customer' ? 'customer' : 'team_member',
                            is_internal: false
                          })
                          .select()
                          .single()

                        if (error) throw error
                        
                        // Optimistically update the UI
                        setTicket(prev => ({
                          ...prev!,
                          responses: [...prev!.responses, data]
                        }))
                      } catch (error) {
                        console.error('Error sending response:', error)
                        toast.error('Failed to send response')
                      }
                    }}
                    disabled={isSubmitting}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <RoleGate requireFeature="view_internal_notes">
              <TabsContent value="internal" className="space-y-4">
                {ticket.responses
                  .filter(r => r.is_internal)
                  .map(response => (
                    <Card key={response.id}>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">
                          {response.sender.name}
                          <span className="ml-2 text-muted-foreground">
                            {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-wrap">{response.content}</p>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>
            </RoleGate>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="font-medium">{ticket.customer?.name}</p>
                <p className="text-sm text-muted-foreground">{ticket.customer?.email}</p>
              </div>
            </CardContent>
          </Card>

          <RoleGate requireFeature="assign_tickets">
            <Card>
              <CardHeader>
                <CardTitle>Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                {ticket.assignee ? (
                  <div className="space-y-2">
                    <p className="font-medium">{ticket.assignee.name}</p>
                    <p className="text-sm text-muted-foreground">{ticket.assignee.email}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Unassigned</p>
                )}
              </CardContent>
            </Card>
          </RoleGate>

          <RoleGate requireFeature="manage_departments">
            <Card>
              <CardHeader>
                <CardTitle>Department</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{ticket.department?.name || "None"}</p>
              </CardContent>
            </Card>
          </RoleGate>

          <RoleGate requireFeature="view_sla">
            <Card>
              <CardHeader>
                <CardTitle>SLA Policy</CardTitle>
              </CardHeader>
              <CardContent>
                {ticket.sla_policy ? (
                  <div className="space-y-2">
                    <p className="font-medium">{ticket.sla_policy.name}</p>
                    <div className="text-sm text-muted-foreground">
                      <p>Response time: {ticket.sla_policy.response_time}h</p>
                      <p>Resolution time: {ticket.sla_policy.resolution_time}h</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No SLA policy</p>
                )}
              </CardContent>
            </Card>
          </RoleGate>

          {ticket.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {ticket.tags.map(tag => (
                    <Badge
                      key={tag.name}
                      variant="outline"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {ticket.watchers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Watchers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ticket.watchers.map(watcher => (
                    <div key={watcher.email} className="flex items-center gap-2">
                      <Badge variant="outline">{watcher.type.toUpperCase()}</Badge>
                      <span className="text-sm">{watcher.email}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {ticket.metadata && Object.keys(ticket.metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Custom Fields</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(ticket.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium">{key}</span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 