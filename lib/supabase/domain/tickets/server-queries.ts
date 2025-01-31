import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/global/supabase'
import type { Ticket } from '@/types/features/tickets'

type TicketStatus = Database['public']['Enums']['ticket_status']
type TicketPriority = Database['public']['Enums']['ticket_priority']

export type TicketWithRelations = Ticket & {
  customer: {
    id: string
    email: string
    name: string
    avatar_url: string | null
    created_at: string
    updated_at: string
  }
  assignee?: {
    id: string
    email: string
    name: string
    role: string
    department: string | null
    created_at: string
    updated_at: string
  }
  department?: {
    id: string
    name: string
    description: string | null
  }
  sla_policy?: {
    id: string
    name: string
    description: string | null
    response_time_hours: number
    resolution_time_hours: number
  }
  tags?: {
    tag: {
      id: string
      name: string
      color: string | null
    }
  }[]
  messages?: {
    id: string
    content: string
    created_at: string | null
    is_internal: boolean | null
    sender_id: string
    sender_type: Database['public']['Enums']['message_sender_type']
    attachments: Database['public']['Tables']['ticket_messages']['Row']['attachments']
  }[]
}

export async function getAllTickets(): Promise<TicketWithRelations[]> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // First check if user is a customer
  const { data: customer } = await supabase
    .from('customers')
    .select()
    .eq('auth_user_id', user.id)
    .single()

  // Then check if user is a team member
  const { data: teamMember } = await supabase
    .from('team_members')
    .select()
    .eq('auth_user_id', user.id)
    .single()

  const query = supabase
    .from('tickets')
    .select(`
      *,
      customer:customers(*),
      assignee:team_members(*),
      department:departments(*),
      sla_policy:sla_policies(*),
      tags:ticket_tags(tag:tags(*)),
      messages:ticket_messages(*)
    `)
    .order('created_at', { ascending: false })

  if (customer) {
    // If customer, only show their tickets
    query.eq('customer_id', customer.id)
  } else if (teamMember) {
    // If team member, show assigned tickets or all tickets based on role
    if (teamMember.role !== 'admin') {
      query.eq('assignee_id', teamMember.id)
    }
  }

  const { data, error } = await query

  if (error) throw error
  return data as TicketWithRelations[]
}

export async function getTicketWithRelations(id: string): Promise<TicketWithRelations> {
  const supabase = await createClient()

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
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // First check if user is a customer
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (customerError) {
    console.error('Error fetching customer:', customerError)
    return null
  }

  if (customer) {
    return 'customer'
  }

  // If not a customer, check if they're a team member
  const { data: teamMember, error: teamError } = await supabase
    .from('team_members')
    .select('role')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (teamError) {
    console.error('Error fetching team member role:', teamError)
    return null
  }

  return teamMember?.role || null
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus): Promise<void> {
  const supabase = await createClient()
  console.log('[Ticket Status Update] Attempting update:', { ticketId, status })
  
  const { data, error } = await supabase
    .from('tickets')
    .update({ status })
    .eq('id', ticketId)
    .select()
  
  console.log('[Ticket Status Update] Response:', { data, error })

  if (error) {
    console.error('[Ticket Status Update] Error:', error)
    throw error
  }
}

export async function updateTicketPriority(ticketId: string, priority: TicketPriority): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tickets')
    .update({ priority })
    .eq('id', ticketId)

  if (error) throw error
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
}

export async function addTicketMessage(
  ticketId: string,
  content: string,
  senderId: string,
  senderType: Database['public']['Enums']['message_sender_type'],
  isInternal: boolean = false,
  attachments: Database['public']['Tables']['ticket_messages']['Row']['attachments'] = null
): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: ticketId,
      content,
      sender_id: senderId,
      sender_type: senderType,
      is_internal: isInternal,
      attachments
    })

  if (error) throw error
}

export async function getSLAPolicies(): Promise<Database['public']['Tables']['sla_policies']['Row'][]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sla_policies')
    .select()

  if (error) throw error
  return data
}

export async function checkSLABreaches(): Promise<void> {
  const supabase = await createClient()
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select(`
      *,
      sla_policy:sla_policies(*)
    `)
    .eq('status', 'open')
    .is('sla_breach', null)

  if (error) throw error

  for (const ticket of tickets) {
    if (!ticket.sla_policy) continue

    const createdAt = new Date(ticket.created_at!)
    const now = new Date()
    const responseTimeMs = ticket.sla_policy.response_time_hours * 60 * 60 * 1000

    if (now.getTime() - createdAt.getTime() > responseTimeMs) {
      await supabase
        .from('tickets')
        .update({ sla_breach: true })
        .eq('id', ticket.id)
    }
  }
} 