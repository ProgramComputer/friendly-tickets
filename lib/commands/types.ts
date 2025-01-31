export type CommandRole = 'admin' | 'agent' | 'customer'

export type CommandType = 'update_status' | 'update_priority' | 'assign_ticket'

export interface ParsedCommand {
  type: CommandType
  ticketId: string
  params: {
    status?: string
    priority?: string
    assignedTo?: string
  }
}

export interface CommandResult {
  success: boolean
  message: string
  error?: string
  ticket_id: string
  command_history_id?: number  // Added for rollback support
}

export interface CommandHistory {
  id: number
  ticket_id: string
  command_type: CommandType
  previous_state: {
    status?: string
    priority?: string
    assigned_to?: string
  }
  new_state: {
    status?: string
    priority?: string
    assigned_to?: string
  }
  executed_by: string
  executed_at: Date
  reverted_at?: Date
  reverted_by?: string
}

// Map of roles to allowed commands
export const ROLE_COMMANDS: Record<CommandRole, CommandType[]> = {
  admin: ['update_status', 'update_priority', 'assign_ticket'],
  agent: ['update_status', 'update_priority', 'assign_ticket'],
  customer: ['update_status']
}

// Command function definitions for OpenAI
export const COMMAND_FUNCTIONS = [
  {
    name: 'update_ticket_status',
    description: 'Update the status of a ticket',
    parameters: {
      type: 'object',
      properties: {
        ticketId: {
          type: 'string',
          description: 'The ID of the ticket to update'
        },
        status: {
          type: 'string',
          enum: ['open', 'pending', 'resolved', 'closed'],
          description: 'The new status for the ticket'
        }
      },
      required: ['ticketId', 'status']
    }
  },
  {
    name: 'update_ticket_priority',
    description: 'Update the priority of a ticket',
    parameters: {
      type: 'object',
      properties: {
        ticketId: {
          type: 'string',
          description: 'The ID of the ticket to update'
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'The new priority for the ticket'
        }
      },
      required: ['ticketId', 'priority']
    }
  },
  {
    name: 'assign_ticket',
    description: 'Assign a ticket to an agent',
    parameters: {
      type: 'object',
      properties: {
        ticketId: {
          type: 'string',
          description: 'The ID of the ticket to update'
        },
        agentId: {
          type: 'string',
          description: 'The ID of the agent to assign the ticket to'
        }
      },
      required: ['ticketId', 'agentId']
    }
  }
]

// Rollback function definition
export const ROLLBACK_FUNCTION = {
  name: 'rollback_command',
  description: 'Rollback a previous command',
  parameters: {
    type: 'object',
    properties: {
      commandId: {
        type: 'string',
        description: 'The ID of the command to rollback'
      }
    },
    required: ['commandId']
  }
} 