export type CommandRole = 'customer' | 'agent' | 'admin'

export type CommandObjectType = 'ticket' | 'agent' | 'customer' | 'team' | 'message' | 'template'

export interface TaggedObject {
  type: CommandObjectType
  id: string
  reference: string // e.g., "@ticket/123"
  displayName?: string
}

export interface ParsedCommand {
  action: string
  targets: TaggedObject[]
  parameters: Record<string, any>
  rawText: string
  generatedSql?: string
}

export interface CommandResult {
  success: boolean
  message: string
  data?: any
  error?: any
  canRollback: boolean
  transactionId?: string
}

// Role-based command permissions
export const ROLE_COMMANDS: Record<CommandRole, string[]> = {
  customer: ['view', 'update_priority', 'add_note'],
  agent: ['view', 'update_priority', 'add_note', 'reassign', 'link', 'close', 'update_status'],
  admin: ['view', 'update_priority', 'add_note', 'reassign', 'link', 'close', 'configure', 'report', 'manage', 'update_status']
}

// Command verbs and their aliases
export const COMMAND_VERBS = {
  view: ['show', 'display', 'get', 'find'],
  update_status: ['set status', 'change status', 'update status'],
  update_priority: ['set priority', 'change priority', 'update priority'],
  add_note: ['note', 'comment', 'annotate'],
  reassign: ['assign', 'transfer', 'move'],
  link: ['connect', 'attach', 'associate'],
  close: ['resolve', 'complete', 'finish'],
  configure: ['setup', 'set', 'config'],
  report: ['analyze', 'summarize', 'report on'],
  manage: ['admin', 'manage', 'control']
} as const

// Command object types and their validation rules
export const OBJECT_TYPES: Record<CommandObjectType, {
  table: string
  displayField: string
  allowedRoles: CommandRole[]
  validateAccess?: (userId: string, objectId: string) => Promise<boolean>
}> = {
  ticket: {
    table: 'tickets',
    displayField: 'title',
    allowedRoles: ['customer', 'agent', 'admin'],
    validateAccess: async (userId, ticketId) => {
      // Customers can only access their own tickets
      // Agents and admins can access all tickets
      return true // TODO: Implement actual validation
    }
  },
  agent: {
    table: 'team_members',
    displayField: 'name',
    allowedRoles: ['agent', 'admin']
  },
  customer: {
    table: 'customers',
    displayField: 'name',
    allowedRoles: ['agent', 'admin']
  },
  team: {
    table: 'teams',
    displayField: 'name',
    allowedRoles: ['admin']
  },
  message: {
    table: 'chat_messages',
    displayField: 'content',
    allowedRoles: ['customer', 'agent', 'admin'],
    validateAccess: async (userId, messageId) => {
      // Users can only access messages from their conversations
      return true // TODO: Implement actual validation
    }
  },
  template: {
    table: 'chat_quick_responses',
    displayField: 'title',
    allowedRoles: ['agent', 'admin']
  }
} 