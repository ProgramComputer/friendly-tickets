import { Database } from "../../global/supabase";
import { TicketStatus } from "./props";
// Create type aliases first
type DbTicket = Database["public"]["Tables"]["tickets"]["Row"]
type DbTicketMessage = Database["public"]["Tables"]["ticket_messages"]["Row"]
type DbTicketTag = Database["public"]["Tables"]["tags"]["Row"]
type DbTicketTagRelation = Database["public"]["Tables"]["ticket_tags"]["Row"]
type DbTeamMember = Database["public"]["Tables"]["team_members"]["Row"]
type DbCustomer = Database["public"]["Tables"]["customers"]["Row"]
type DbDepartment = Database["public"]["Tables"]["departments"]["Row"]
type DbTicketHistory = Database["public"]["Tables"]["ticket_history"]["Row"]
type DbTicketStatusHistory = Database["public"]["Tables"]["ticket_status_history"]["Row"]
type DbTicketCustomField = Database["public"]["Tables"]["ticket_custom_fields"]["Row"]
type DbCustomFieldDefinition = Database["public"]["Tables"]["custom_field_definitions"]["Row"]
type DbTicketTemplate = Database["public"]["Tables"]["ticket_templates"]["Row"]
type DbTicketWatcher = Database["public"]["Tables"]["ticket_watchers"]["Row"]
type DbSLAPolicy = Database["public"]["Tables"]["sla_policies"]["Row"]

// Now use the aliases in interfaces
export interface Ticket extends DbTicket {}
export interface TicketMessage extends DbTicketMessage {}
export interface TicketTag extends DbTicketTag {}
export interface TicketTagRelation extends DbTicketTagRelation {}

// Enums
export type TicketPriority = Database["public"]["Enums"]["ticket_priority"]

// Input Types
export interface CreateTicketInput {
  title: string;
  description?: string;
  priority?: TicketPriority;
  customer_id: string;
  department_id?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignee_id?: string;
  department_id?: string;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface CreateTicketMessageInput {
  ticket_id: string;
  content: string;
  sender_id: string;
  sender_type: Database["public"]["Enums"]["message_sender_type"];
  is_internal?: boolean;
  attachments?: {
    name: string;
    type: string;
    url: string;
  }[];
}

// Extended Types
export interface TicketWithDetails extends Ticket {
  messages: TicketMessage[]
  tags: TicketTag[]
  assignee?: DbTeamMember
  customer?: DbCustomer
  department?: DbDepartment
}

// History Types
export interface TicketHistoryEntry extends DbTicketHistory {}
export interface TicketStatusHistoryEntry extends DbTicketStatusHistory {}

// Custom Field Types
export interface TicketCustomField extends DbTicketCustomField {}
export interface CustomFieldDefinition extends DbCustomFieldDefinition {}

// Template Types
export interface TicketTemplate extends DbTicketTemplate {}

// Watcher Types
export interface TicketWatcher extends DbTicketWatcher {}

// SLA Types
export interface SLAPolicy extends DbSLAPolicy {} 