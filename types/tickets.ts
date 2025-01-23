export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type MessageSenderType = 'customer' | 'team_member'
export type TeamMemberRole = 'admin' | 'agent'

export interface User {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  role: 'customer' | 'agent' | 'admin'
  departmentId: string | null
  preferences: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface Department {
  id: string
  name: string
  description: string | null
  createdAt: string
}

export interface TeamMember {
  id: string
  user_id: string
  email: string
  name: string
  role: TeamMemberRole
  avatar_url: string | null
  department: string | null
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  user_id: string
  email: string
  name: string
  avatar_url: string | null
  company: string | null
  created_at: string
  updated_at: string
}

export interface Ticket {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  customer_id: string
  assignee_id?: string
  department_id?: string
  sla_policy_id?: string
  created_at: string
  updated_at: string
  resolved_at?: string
  first_response_at?: string
  due_date?: string
  sla_breached?: boolean
  sla_breach_time?: string
  metadata?: Record<string, any>
}

export interface TicketWithRelations extends Ticket {
  customer: Customer
  assignee?: TeamMember
  department?: Department
  sla_policy?: SLAPolicy
  messages: TicketMessage[]
  tags: Tag[]
}

export interface TicketMessage {
  id: string
  ticket_id: string
  sender_type: MessageSenderType
  sender_id: string
  content: string
  is_internal: boolean
  attachments?: MessageAttachment[]
  created_at: string
}

export interface MessageAttachment {
  id: string
  message_id: string
  name: string
  url: string
  type: string
  size: number
  created_at: string
}

export interface TicketResponse {
  id: string
  ticket_id: string
  sender_type: MessageSenderType
  sender_id: string
  content: string
  is_internal: boolean
  created_at: string
  updated_at: string
}

export interface TicketHistory {
  id: string
  ticket_id: string
  changed_by: string
  field_name: string
  old_value: string | null
  new_value: string | null
  created_at: string
}

export interface TicketStatusHistory {
  id: string
  ticket_id: string
  status: TicketStatus
  changed_by: string
  note: string | null
  created_at: string
}

export interface Tag {
  id: string
  name: string
  description?: string
  color: string
  created_at: string
}

export interface TicketTag {
  ticket_id: string
  tag_id: string
  created_at: string
}

export interface TicketCustomField {
  id: string
  ticket_id: string
  name: string
  value: string
  created_at: string
}

// List view types
export interface TicketListParams {
  cursor?: string
  limit?: number
  filters?: {
    search?: string
    status?: TicketStatus[]
    priority?: TicketPriority[]
    department_id?: string
    assignee_id?: string
    tags?: string[]
    dateRange?: {
      from: Date
      to: Date
    }
  }
  sort?: {
    field: 'created_at' | 'updated_at' | 'priority' | 'status'
    direction: 'asc' | 'desc'
  }
}

export interface TicketListResponse {
  tickets: TicketWithRelations[]
  nextCursor?: string
  total: number
}

// Form types
export interface CreateTicketInput {
  title: string
  description: string
  priority: TicketPriority
  department_id?: string
  attachments?: Array<{
    name: string
    url: string
    type: string
    size: number
  }>
}

export interface CreateCustomerTicketInput extends CreateTicketInput {}

export interface CreateAgentTicketInput extends CreateTicketInput {
  customer_id: string
  assignee_id?: string
  tags?: string[]
  custom_fields?: Array<{
    name: string
    value: string
  }>
}

export interface CreateAdminTicketInput extends CreateAgentTicketInput {
  sla_policy_id?: string
}

export interface UpdateTicketInput extends Partial<CreateTicketInput> {
  status?: TicketStatus
  assignee_id?: string
  department_id?: string
  sla_policy_id?: string
  tags?: string[]
  custom_fields?: Array<{
    name: string
    value: string
  }>
}

export interface CreateTicketMessageInput {
  ticket_id: string
  content: string
  is_internal?: boolean
  attachments?: Array<{
    name: string
    url: string
    type: string
    size: number
  }>
}

export interface TicketFilters {
  search?: string
  status?: TicketStatus
  priority?: TicketPriority
  department?: string
  assignee?: string
  tags?: string[]
  dateRange?: {
    from: Date
    to: Date
  }
  sort?: string
}

export interface SLAPolicy {
  id: string
  name: string
  description: string
  priority: number
  response_time_minutes: number
  resolution_time_minutes: number
  created_at: string
} 