import { getServerClient } from '@/lib/supabase/server'
import type { TicketWithRelations, SLAPolicy } from '@/types/tickets'

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

  // First check if user is a team member
  const { data: teamMember, error: teamError } = await supabase
    .from('team_members')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (teamError) {
    console.error('Error fetching team member role:', teamError)
    return null
  }

  if (teamMember?.role) {
    return teamMember.role
  }

  // If not a team member, check if user is a customer
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (customerError) {
    console.error('Error fetching customer:', customerError)
    return null
  }

  return customer ? 'customer' : null
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
}

export async function getSLAPolicies(): Promise<SLAPolicy[]> {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('sla_policies')
    .select('*')
    .order('priority', { ascending: false })

  if (error) {
    throw error
  }

  return data
}

export async function checkSLABreaches(): Promise<void> {
  const supabase = await getServerClient()
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