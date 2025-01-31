import { supabase } from '@/lib/supabase/client'
import { createClient, createPagesClient } from '@/lib/supabase/server'
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
  TicketWithRelations,
  TicketStatus,
  Department,
  TicketPriority,
  MessageSenderType
} from '@/types'
import { Database } from '@/types/global/supabase'

type DbTicketPriority = Database['public']['Enums']['ticket_priority']

// For server-side operations in app directory
async function getServerClient() {
  return createClient()
}

// For pages directory and API routes
export async function getPagesServerClient(req: any, res: any) {
  return createPagesClient(req, res)
}

// Client-side queries
export async function getTickets({
  cursor,
  limit = 10,
  sort = { field: 'created_at', direction: 'desc' },
  filters,
}: TicketListParams): Promise<TicketListResponse> {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  console.log('[Tickets] Auth check:', { authenticated: !!user })
  if (!user) throw new Error('Not authenticated')

  // Try to get team member first
  const { data: teamMember } = await supabase
    .from('team_members')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single()

  // If not a team member, try to get customer
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  console.log('[Tickets] User role check:', { 
    isTeamMember: !!teamMember,
    isCustomer: !!customer,
    role: teamMember?.role || 'customer'
  })

  // Build the query based on user role
  let query = supabase
    .from('tickets')
    .select(`
      *,
      customer:customers!customer_id(id, auth_user_id, email, name, avatar_url, created_at, updated_at),
      assignee:team_members!assignee_id(*),
      department:departments!department_id(*),
      messages:ticket_messages(count),
      tags:ticket_tags(tag:tags(*))
    `)

  // Apply role-based filters
  if (teamMember) {
    // Team members can see assigned tickets or all tickets if admin
    if (teamMember.role === 'admin') {
      // Admins see all tickets
    } else {
      // Agents see assigned tickets
      query = query.eq('assignee_id', teamMember.id)
    }
  } else if (customer) {
    // Customers only see their own tickets
    query = query.eq('customer_id', customer.id)
  } else {
    throw new Error('User not found in system')
  }

  // Apply filters if they have values
  if (filters?.status?.length > 0) {
    query = query.in('status', filters.status)
    console.log('[Tickets] Applied status filter:', filters.status)
  }

  if (filters?.priority?.length > 0) {
    query = query.in('priority', filters.priority)
  }

  if (filters?.dateRange?.from && filters?.dateRange?.to) {
    query = query
      .gte('created_at', filters.dateRange.from.toISOString())
      .lte('created_at', filters.dateRange.to.toISOString())
  }

  if (filters?.search) {
    query = query.textSearch('title', filters.search)
  }

  // Apply sorting if sort field exists
  if (sort?.field) {
    query = query.order(sort.field, {
      ascending: sort.direction === 'asc',
    })
  }

  // Apply pagination
  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  query = query.limit(limit)

  const { data: tickets, error, count } = await query
  console.log('Query results:', { 
    ticketsFound: tickets?.length ?? 0,
    totalCount: count,
    error: error?.message,
    customerIdUsed: customer?.id
  })

  if (error) {
    console.error('Error fetching tickets:', error)
    throw error
  }

  // Get the next cursor
  const nextCursor =
    tickets.length === limit ? tickets[tickets.length - 1].created_at : undefined

  return {
    tickets: tickets as unknown as TicketWithRelations[],
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
      department:departments!department_id(*),
      messages:ticket_messages(
        *,
        sender:team_members(*),
        attachments:message_attachments(*)
      )
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
      department_id: 'departmentId' in input ? input.departmentId : undefined,
      metadata: {
        attachments: 'attachments' in input ? input.attachments : [],
        customFields: 'customFields' in input ? input.customFields : {},
        tags: 'tags' in input ? input.tags : [],
        templateId: 'templateId' in input ? input.templateId : undefined,
        slaId: 'slaId' in input ? input.slaId : undefined,
      },
      assignee_id: 'assignedToId' in input ? input.assignedToId : undefined,
    })
    .select(`
      *,
      customer:customers!customer_id(*),
      assignee:team_members!assignee_id(*),
      department:departments!department_id(*)
    `)
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
    ...(input.department_id && { department_id: input.department_id }),
    ...(input.assignee_id && { assignee_id: input.assignee_id }),
    ...(input.metadata && { metadata: input.metadata }),
  }

  const { data: ticket, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      customer:customers!customer_id(*),
      assignee:team_members!assignee_id(*),
      department:departments!department_id(*)
    `)
    .single()

  if (error) {
    throw error
  }

  return ticket as Ticket
}

export function subscribeToTicketUpdates(
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

  return (data || []).map(policy => ({
    id: policy.id,
    name: policy.name,
    description: policy.description || '',
    priority: policy.priority as TicketPriority,
    response_time_minutes: policy.response_time_hours * 60,
    resolution_time_minutes: policy.resolution_time_hours * 60,
    created_at: policy.created_at || new Date().toISOString(),
    updated_at: policy.updated_at || new Date().toISOString()
  }))
}

export async function createSLAPolicy(policy: Omit<SLAPolicy, 'id' | 'created_at' | 'updated_at'>): Promise<SLAPolicy> {
  const dbPolicy = {
    name: policy.name,
    description: policy.description,
    priority: policy.priority,
    response_time_hours: policy.response_time_minutes / 60,
    resolution_time_hours: policy.resolution_time_minutes / 60
  }

  const { data, error } = await supabase
    .from('sla_policies')
    .insert(dbPolicy)
    .select()
    .single()

  if (error) {
    throw error
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description || '',
    priority: data.priority as TicketPriority,
    response_time_minutes: data.response_time_hours * 60,
    resolution_time_minutes: data.resolution_time_hours * 60,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString()
  }
}

export async function updateSLAPolicy(id: string, policy: Partial<SLAPolicy>): Promise<SLAPolicy> {
  const dbUpdates = {
    ...(policy.name && { name: policy.name }),
    ...(policy.description && { description: policy.description }),
    ...(policy.priority && { priority: policy.priority }),
    ...(policy.response_time_minutes && { response_time_hours: policy.response_time_minutes / 60 }),
    ...(policy.resolution_time_minutes && { resolution_time_hours: policy.resolution_time_minutes / 60 })
  }

  const { data, error } = await supabase
    .from('sla_policies')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description || '',
    priority: data.priority as TicketPriority,
    response_time_minutes: data.response_time_hours * 60,
    resolution_time_minutes: data.resolution_time_hours * 60,
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString()
  }
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
    .in('status', ['open', 'pending'] as TicketStatus[])

  if (error) {
    throw error
  }

  for (const ticket of tickets) {
    const slaPolicy = ticket.sla_policy
    const createdAt = new Date(ticket.created_at)
    const now = new Date()
    const responseTimeMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60)

    if (responseTimeMinutes > (slaPolicy.response_time_hours * 60)) {
      await supabase
        .from('tickets')
        .update({
          sla_breach: true,
          sla_breach_time: now.toISOString()
        })
        .eq('id', ticket.id)
    }
  }
}

export async function getAllTickets(): Promise<TicketWithRelations[]> {
  const supabase = await createClient()
  
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
  const supabase = await createClient()

  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
      *,
      customer:customers(id, auth_user_id, email, name, avatar_url, created_at, updated_at),
      assignee:team_members(id, auth_user_id, email, name, role, department, created_at, updated_at),
      department:departments(id, name, description, created_at),
      messages:ticket_messages(
        id, ticket_id, sender_type, sender_id, content, is_internal, created_at,
        attachments
      ),
      sla_policy:sla_policies(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw error
  }

  if (!ticket) {
    throw new Error('Ticket not found')
  }

  // Transform the data to match TicketWithRelations type
  return {
    ...ticket,
    customer: ticket.customer,
    assignee: ticket.assignee,
    department: ticket.department ? {
      id: ticket.department.id,
      name: ticket.department.name,
      description: ticket.department.description || '',
      createdAt: ticket.department.created_at
    } : undefined,
    messages: ticket.messages || [],
    sla_policy: ticket.sla_policy ? {
      id: ticket.sla_policy.id,
      name: ticket.sla_policy.name,
      description: ticket.sla_policy.description || '',
      priority: ticket.sla_policy.priority,
      response_time_minutes: ticket.sla_policy.response_time_hours * 60,
      resolution_time_minutes: ticket.sla_policy.resolution_time_hours * 60,
      created_at: ticket.sla_policy.created_at,
      updated_at: ticket.sla_policy.updated_at
    } : undefined,
    tags: []  // TODO: Add tags support
  } as TicketWithRelations
}

export async function getUserRole(): Promise<string | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: teamMember, error } = await supabase
    .from('team_members')
    .select('role')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching role:', error)
    return null
  }

  return teamMember?.role || 'customer'
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tickets')
    .update({ status })
    .eq('id', ticketId)

  if (error) {
    throw error
  }
}

export async function updateTicketPriority(ticketId: string, priority: TicketPriority): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tickets')
    .update({ priority })
    .eq('id', ticketId)

  if (error) {
    throw error
  }
}

export async function updateTicketAssignee(ticketId: string, assigneeId: string | null): Promise<void> {
  const supabase = await createClient()
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
  const supabase = await createClient()
  
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

export async function createTicketMessage({
  ticketId,
  content,
  senderId,
  senderType,
  isInternal = false,
  attachments = []
}: {
  ticketId: string
  content: string
  senderId: string
  senderType: MessageSenderType
  isInternal?: boolean
  attachments?: string[]
}) {
  const { data: message, error } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: ticketId,
      content,
      sender_id: senderId,
      sender_type: senderType,
      is_internal: isInternal,
      attachments: attachments.length ? attachments : null
    })
    .select()
    .single()

  if (error) throw error
  return message
} 