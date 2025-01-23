import { supabase } from '@/lib/supabase/client'
import type {
  Ticket,
  TicketListParams,
  TicketListResponse,
  CreateTicketInput,
  UpdateTicketInput,
  CreateCustomerTicketInput,
  CreateAgentTicketInput,
  CreateAdminTicketInput,
  SLAPolicy,
  TicketWithRelations
} from '@/types/tickets'

// Client-side queries
export async function getTickets({
  cursor,
  limit = 10,
  sort,
  filters,
}: TicketListParams): Promise<TicketListResponse> {
  let query = supabase
    .from('tickets')
    .select(`
      *,
      customer:customers!customer_id(*),
      assignee:team_members!assignee_id(*),
      messages:ticket_messages(count)
    `)

  // Apply filters
  if (filters.status?.length) {
    query = query.in('status', filters.status)
  }

  if (filters.priority?.length) {
    query = query.in('priority', filters.priority)
  }

  if (filters.dateRange) {
    query = query
      .gte('created_at', filters.dateRange.start.toISOString())
      .lte('created_at', filters.dateRange.end.toISOString())
  }

  if (filters.search) {
    query = query.textSearch('title', filters.search)
  }

  // Apply sorting
  query = query.order(sort.field, {
    ascending: sort.direction === 'asc',
  })

  // Apply pagination
  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  query = query.limit(limit)

  const { data: tickets, error, count } = await query

  if (error) {
    throw error
  }

  // Get the next cursor
  const nextCursor =
    tickets.length === limit ? tickets[tickets.length - 1].created_at : undefined

  return {
    tickets: tickets as Ticket[],
    nextCursor,
    total: count ?? 0,
  }
}

export async function getTicketById(id: string): Promise<Ticket> {
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
      *,
      customer:customers!customer_id(*),
      assignee:team_members!assignee_id(*),
      messages:ticket_messages(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw error
  }

  return ticket as Ticket
}

export async function createTicket(input: CreateCustomerTicketInput | CreateAgentTicketInput | CreateAdminTicketInput): Promise<Ticket> {
  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert({
      title: input.title,
      description: input.description,
      priority: input.priority,
      department: 'department' in input ? input.department : undefined,
      metadata: {
        attachments: 'attachments' in input ? input.attachments : [],
        customFields: 'customFields' in input ? input.customFields : {},
        tags: 'tags' in input ? input.tags : [],
        templateId: 'templateId' in input ? input.templateId : undefined,
        slaId: 'slaId' in input ? input.slaId : undefined,
      },
      assignee_id: 'assignedToId' in input ? input.assignedToId : undefined,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return ticket as Ticket
}

export async function updateTicket(
  id: string,
  input: UpdateTicketInput
): Promise<Ticket> {
  const updates: Record<string, unknown> = {
    ...(input.title && { title: input.title }),
    ...(input.description && { description: input.description }),
    ...(input.priority && { priority: input.priority }),
    ...(input.status && { status: input.status }),
    ...(input.department && { department: input.department }),
    ...(input.assigneeId && { assignee_id: input.assigneeId }),
    ...(input.metadata && { metadata: input.metadata }),
  }

  const { data: ticket, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return ticket as Ticket
}

export async function subscribeToTicketUpdates(
  callback: (payload: { ticket: Ticket }) => void
) {
  const subscription = supabase
    .channel('ticket-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tickets',
      },
      (payload) => {
        callback({ ticket: payload.new as Ticket })
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}

export async function getSLAPolicies(): Promise<SLAPolicy[]> {
  const { data, error } = await supabase
    .from('sla_policies')
    .select('*')
    .order('priority', { ascending: false })

  if (error) {
    throw error
  }

  return data
}

export async function createSLAPolicy(policy: Omit<SLAPolicy, 'id' | 'created_at'>): Promise<SLAPolicy> {
  const { data, error } = await supabase
    .from('sla_policies')
    .insert(policy)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateSLAPolicy(id: string, policy: Partial<SLAPolicy>): Promise<SLAPolicy> {
  const { data, error } = await supabase
    .from('sla_policies')
    .update(policy)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function deleteSLAPolicy(id: string): Promise<void> {
  const { error } = await supabase
    .from('sla_policies')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }
}

export async function assignSLAToTicket(ticketId: string, slaPolicyId: string): Promise<void> {
  const { error } = await supabase
    .from('tickets')
    .update({ sla_policy_id: slaPolicyId })
    .eq('id', ticketId)

  if (error) {
    throw error
  }
}

export async function checkSLABreaches(): Promise<void> {
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select(`
      *,
      sla_policy:sla_policies(*)
    `)
    .not('sla_policy_id', 'is', null)
    .in('status', ['open', 'in_progress'])

  if (error) {
    throw error
  }

  for (const ticket of tickets) {
    const slaPolicy = ticket.sla_policy
    const createdAt = new Date(ticket.created_at)
    const now = new Date()
    const responseTime = (now.getTime() - createdAt.getTime()) / (1000 * 60) // in minutes

    if (responseTime > slaPolicy.response_time_minutes) {
      await supabase
        .from('tickets')
        .update({
          sla_breached: true,
          sla_breach_time: now.toISOString()
        })
        .eq('id', ticket.id)
    }
  }
}

export async function getAllTickets(): Promise<TicketWithRelations[]> {
  const supabase = await getServerClient()
  
  const { data, error } = await supabase
    .from("tickets")
    .select(`
      *,
      customer:customers(*),
      assignee:team_members(*),
      department:departments(*),
      sla_policy:sla_policies(*),
      tags:ticket_tags(tag:tags(*))
    `)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error("Failed to fetch tickets")
  }

  return data as TicketWithRelations[]
}

export async function getTicketWithRelations(id: string): Promise<TicketWithRelations> {
  const supabase = await getServerClient()

  const { data, error } = await supabase
    .from("tickets")
    .select(`
      *,
      customer:customers(*),
      assignee:team_members(*),
      department:departments(*),
      sla_policy:sla_policies(*),
      tags:ticket_tags(tag:tags(*)),
      messages:ticket_messages(
        *,
        sender:team_members(*),
        attachments:message_attachments(*)
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    throw new Error("Failed to fetch ticket")
  }

  return data as TicketWithRelations
}

export async function getUserRole(): Promise<string | null> {
  const supabase = await getServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: teamMember, error } = await supabase
    .from('team_members')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Error fetching role:', error)
    return null
  }

  return teamMember?.role || 'customer'
}

export async function updateTicketStatus(ticketId: string, status: string): Promise<void> {
  const supabase = await getServerClient()
  const { error } = await supabase
    .from('tickets')
    .update({ status })
    .eq('id', ticketId)

  if (error) {
    throw new Error('Failed to update ticket status')
  }

  return
}

export async function updateTicketPriority(ticketId: string, priority: string): Promise<void> {
  const supabase = await getServerClient()
  const { error } = await supabase
    .from('tickets')
    .update({ priority })
    .eq('id', ticketId)

  if (error) {
    throw new Error('Failed to update ticket priority')
  }

  return
}

export async function updateTicketAssignee(ticketId: string, assigneeId: string | null): Promise<void> {
  const supabase = await getServerClient()
  const { error } = await supabase
    .from('tickets')
    .update({ assignee_id: assigneeId })
    .eq('id', ticketId)

  if (error) {
    throw new Error('Failed to update ticket assignee')
  }

  return
}

export async function addTicketReply(
  ticketId: string,
  content: string,
  attachments: { name: string; url: string; size: number }[] = []
): Promise<void> {
  const supabase = await getServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error: messageError } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: ticketId,
      content,
      sender_id: user.id,
    })

  if (messageError) {
    throw new Error('Failed to add ticket reply')
  }

  if (attachments.length > 0) {
    const { error: attachmentError } = await supabase
      .from('message_attachments')
      .insert(
        attachments.map(attachment => ({
          message_id: ticketId,
          name: attachment.name,
          url: attachment.url,
          size: attachment.size
        }))
      )

    if (attachmentError) {
      throw new Error('Failed to add message attachments')
    }
  }

  return
} 