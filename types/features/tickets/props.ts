import { Ticket } from './index'

import { Database } from "../../global/supabase";
export type TicketStatus = Database["public"]["Enums"]["ticket_status"]
export interface TicketListProps {
  params: {
    status?: TicketStatus[]
    sort?: {
      field: string
      direction: 'asc' | 'desc'
    }
  }
  onTicketSelect?: (id: string) => void
  selectedTicketId?: string | null
  view?: 'default' | 'compact'
}

export interface TicketDetailProps {
  ticketId: string
}

export interface TicketSidebarProps {
  ticket: Ticket
}

export interface TicketMetadataProps {
  ticket: Ticket
}

export interface TicketAssigneeSelectProps {
  value?: string
  onValueChange: (value: string) => void
}

export interface TicketTagSelectProps {
  ticketId: string
  selectedTags?: string[]
  onTagsChange?: (tags: string[]) => void
}

export interface TicketPrioritySelectProps {
  ticketId: string
  currentPriority?: string
  onPriorityChange?: (priority: string) => void
}

export interface TicketCategorySelectProps {
  ticketId: string
  currentCategory?: string
  onCategoryChange?: (category: string) => void
}

export interface TicketTemplateSelectProps {
  onSelect: (template: string) => void
}

export interface TicketResponseFormProps {
  ticketId: string
  onResponse?: (response: string) => void
}

export interface TicketFilterPanelProps {
  onFiltersChange: (filters: any) => void
  currentFilters?: any
}

export interface TicketSortControlsProps {
  onSortChange: (sort: { field: string, direction: 'asc' | 'desc' }) => void
  currentSort?: { field: string, direction: 'asc' | 'desc' }
}

export interface TicketListItemProps {
  ticket: Ticket
  isSelected?: boolean
  onClick?: () => void
  view?: 'default' | 'compact'
} 