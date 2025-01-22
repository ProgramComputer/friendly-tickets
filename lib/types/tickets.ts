export type TicketStatus = 'open' | 'in_progress' | 'waiting_on_customer' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Ticket {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  customer_id: string
  assigned_to?: string
  created_at: string
  updated_at: string
  resolved_at?: string
  first_response_at?: string
  due_date?: string
}

export interface TicketMessage {
  id: string
  ticket_id: string
  sender_id: string
  message: string
  is_internal: boolean
  created_at: string
  attachments?: {
    url: string
    filename: string
    content_type: string
    size: number
  }[]
}

export interface TicketTag {
  id: string
  name: string
  description?: string
  color: string
  created_at: string
}

export interface TicketTagRelation {
  ticket_id: string
  tag_id: string
  created_at: string
}

export interface TicketMetadata {
  ticket_id: string
  key: string
  value: any
  created_at: string
  updated_at: string
}

export interface CreateTicketInput {
  title: string
  description: string
  priority?: TicketPriority
  due_date?: string
  metadata?: Record<string, any>
  tags?: string[]
}

export interface UpdateTicketInput {
  title?: string
  description?: string
  status?: TicketStatus
  priority?: TicketPriority
  due_date?: string
  metadata?: Record<string, any>
  tags?: string[]
}

export interface CreateTicketMessageInput {
  ticket_id: string
  message: string
  attachments?: {
    url: string
    filename: string
    content_type: string
    size: number
  }[]
}

export interface TicketWithDetails extends Ticket {
  messages: TicketMessage[]
  tags: TicketTag[]
  metadata: Record<string, any>
} 