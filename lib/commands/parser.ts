import { SupabaseClient } from '@supabase/supabase-js'
import { 
  CommandObjectType, 
  TaggedObject, 
  ParsedCommand,
  COMMAND_VERBS,
  OBJECT_TYPES,
  CommandRole
} from './types'

export class CommandParser {
  constructor(
    private supabase: SupabaseClient,
    private userRole: CommandRole
  ) {}

  /**
   * Parse a command string into structured command data
   */
  async parseCommand(input: string): Promise<ParsedCommand | null> {
    // Extract @mentions
    const mentions = this.extractMentions(input)
    if (mentions.length === 0) {
      return null // Not a command if no @mentions
    }

    // Detect action verb
    const action = this.detectAction(input)
    if (!action) {
      return null // Not a command if no valid action verb
    }

    // Resolve mentioned objects
    const targets = await this.resolveMentions(mentions)
    if (targets.length === 0) {
      return null // Not a command if no valid targets
    }

    // Extract additional parameters
    const parameters = this.extractParameters(input)

    return {
      action,
      targets,
      parameters,
      rawText: input
    }
  }

  /**
   * Extract @mentions from input text
   * Matches patterns like @ticket/123, @agent/john, etc.
   */
  private extractMentions(input: string): Array<{type: CommandObjectType, id: string}> {
    // Match both @type/id and @type:id formats
    const mentionRegex = /@(ticket|agent|customer|team|message|template)[:\/]([a-zA-Z0-9-_]+)/g
    const matches = Array.from(input.matchAll(mentionRegex))
    
    return matches.map(match => ({
      type: match[1] as CommandObjectType,
      id: match[2]
    }))
  }

  /**
   * Detect the command action from input text
   */
  private detectAction(input: string): string | null {
    const normalizedInput = input.toLowerCase()
    
    for (const [action, aliases] of Object.entries(COMMAND_VERBS)) {
      if (aliases.some(alias => normalizedInput.includes(alias))) {
        return action
      }
    }
    
    return null
  }

  /**
   * Resolve @mentions to actual objects
   */
  private async resolveMentions(
    mentions: Array<{type: CommandObjectType, id: string}>
  ): Promise<TaggedObject[]> {
    const resolved: TaggedObject[] = []

    for (const mention of mentions) {
      const objectType = OBJECT_TYPES[mention.type]
      
      // Check role access
      if (!objectType.allowedRoles.includes(this.userRole)) {
        console.warn(`User role ${this.userRole} cannot access ${mention.type}`)
        continue
      }

      // Fetch object from database
      const { data, error } = await this.supabase
        .from(objectType.table)
        .select(`id, ${objectType.displayField}`)
        .eq('id', mention.id)
        .single()

      if (error || !data) {
        console.warn(`Failed to resolve ${mention.type}/${mention.id}:`, error)
        continue
      }

      // Validate access if required
      if (objectType.validateAccess) {
        const hasAccess = await objectType.validateAccess(
          await this.getCurrentUserId(),
          mention.id
        )
        if (!hasAccess) {
          console.warn(`Access denied to ${mention.type}/${mention.id}`)
          continue
        }
      }

      resolved.push({
        type: mention.type,
        id: mention.id,
        reference: `@${mention.type}/${mention.id}`,
        displayName: data[objectType.displayField]
      })
    }

    return resolved
  }

  /**
   * Extract additional parameters from the command
   */
  private extractParameters(input: string): Record<string, any> {
    const params: Record<string, any> = {}
    
    // Extract priority level
    const priorityMatch = input.match(/priority\s+(high|medium|low)/i)
    if (priorityMatch) {
      params.priority = priorityMatch[1].toLowerCase()
    }
    
    // Extract notes/comments
    const noteMatch = input.match(/note\s+['"]([^'"]+)['"]/i)
    if (noteMatch) {
      params.note = noteMatch[1]
    }
    
    // TODO: Add more parameter extraction as needed
    
    return params
  }

  /**
   * Get the current user's ID
   */
  private async getCurrentUserId(): Promise<string> {
    const { data: { user } } = await this.supabase.auth.getUser()
    if (!user) throw new Error('No authenticated user')
    return user.id
  }
}

// Example usage:
/*
const parser = new CommandParser(supabase, 'agent')

const command = await parser.parseCommand(
  'reassign @ticket/123 to @agent/john with note "Please handle this ASAP"'
)

// Result:
{
  action: 'reassign',
  targets: [
    {
      type: 'ticket',
      id: '123',
      reference: '@ticket/123',
      displayName: 'Issue with login'
    },
    {
      type: 'agent',
      id: 'john',
      reference: '@agent/john',
      displayName: 'John Smith'
    }
  ],
  parameters: {
    note: 'Please handle this ASAP'
  },
  rawText: 'reassign @ticket/123 to @agent/john with note "Please handle this ASAP"'
}
*/ 