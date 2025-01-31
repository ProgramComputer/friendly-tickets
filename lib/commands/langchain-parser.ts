import { SupabaseClient } from '@supabase/supabase-js'
import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StructuredOutputParser } from 'langchain/output_parsers'
import { z } from 'zod'
import { RunnableSequence } from '@langchain/core/runnables'
import { CommandObjectType, ParsedCommand, CommandRole, OBJECT_TYPES, COMMAND_VERBS } from './types'
import { BaseMessage } from '@langchain/core/messages'

// Define the schema using Zod
const CommandSchema = z.object({
  action: z.string(),
  targets: z.array(z.object({
    type: z.enum(['ticket', 'agent', 'customer', 'team', 'message', 'template']),
    identifier: z.string(),
    context: z.string().optional()
  })),
  parameters: z.record(z.any()),
  sql: z.string().optional(),
  error: z.string().optional(),
  message: z.string().optional()
})

// Export the type for use in other files
export type CommandOutput = z.infer<typeof CommandSchema>

const COMMAND_PROMPT = `You are a command parser for a CRM system. Convert the user's natural language input into a structured command.
Available actions: {actions}
Available object types: {objectTypes}
Current user role: {userRole}

Role-based permissions:
- customer: view, update_priority, add_note
- agent: view, update_priority, add_note, reassign, link, close, update_status
- admin: view, update_priority, add_note, reassign, link, close, configure, report, manage, update_status

Valid ticket statuses: 'open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed'
Valid priorities: 'low', 'medium', 'high', 'urgent'

Input: {input}

Convert this into a structured command following these rules:
1. ONLY generate commands that are allowed for the current user role
2. Identify the main action (must be one of the available actions)
3. Identify any referenced objects and their types
4. Extract relevant parameters
5. For ticket status updates, ensure the status value is one of the valid statuses
6. For SQL generation:
   - Use proper SQL syntax with single quotes for strings
   - Include the schema name (public) in table references
   - Format dates using ISO 8601 format
   - Properly escape string values
   - Include WHERE clauses for safety

For example:
Input: "show me ticket 123"
Output: {{
  "action": "view",
  "targets": [{{ "type": "ticket", "identifier": "123" }}],
  "parameters": {{}}
}}

Input: "change the priority of ticket 456 to high"
Output: {{
  "action": "update_priority",
  "targets": [{{ "type": "ticket", "identifier": "456" }}],
  "parameters": {{ "priority": "high" }},
  "sql": "UPDATE public.tickets SET priority = 'high' WHERE id = '456'"
}}

Input: "update status of ticket 789 to open"
Output: {{
  "action": "update_status",
  "targets": [{{ "type": "ticket", "identifier": "789" }}],
  "parameters": {{ "status": "open" }},
  "sql": "UPDATE public.tickets SET status = 'open' WHERE id = '789'"
}}

If the requested action is not allowed for the current role, respond with:
{{
  "error": "Permission denied",
  "message": "The current role does not have permission for this action"
}}

Respond only with the JSON object, no additional text.`

export class LangChainCommandParser {
  private model: ChatOpenAI
  private parser: StructuredOutputParser<CommandOutput>
  private chain: RunnableSequence

  constructor(
    private supabase: SupabaseClient,
    private userRole: CommandRole,
    modelName: string = 'gpt-4-0125-preview'
  ) {
    this.model = new ChatOpenAI({ modelName })
    this.parser = StructuredOutputParser.fromZodSchema(CommandSchema)
    
    // Create the prompt template
    const prompt = new PromptTemplate({
      template: COMMAND_PROMPT,
      inputVariables: ['input'],
      partialVariables: {
        actions: Object.keys(COMMAND_VERBS).join(', '),
        objectTypes: Object.keys(OBJECT_TYPES).join(', '),
        userRole: this.userRole
      }
    })

    // Create the chain
    this.chain = RunnableSequence.from([
      prompt,
      this.model,
      this.parser
    ])
  }

  async parseCommand(input: string): Promise<ParsedCommand | null> {
    try {
      // First try structured @mention parsing
      const structuredCommand = await this.parseStructuredCommand(input)
      if (structuredCommand) {
        return structuredCommand
      }

      // Fall back to natural language parsing
      return await this.parseNaturalLanguage(input)
    } catch (error) {
      console.error('Error parsing command:', error)
      return null
    }
  }

  private async parseStructuredCommand(input: string): Promise<ParsedCommand | null> {
    // Use existing @mention parser
    const mentionRegex = /@(ticket|agent|customer|team|message|template)[:\/]([a-zA-Z0-9-_]+)/g
    const matches = Array.from(input.matchAll(mentionRegex))
    
    if (matches.length === 0) {
      return null
    }

    // Extract action from the input
    const normalizedInput = input.toLowerCase()
    let action: string | null = null
    for (const [cmd, aliases] of Object.entries(COMMAND_VERBS)) {
      if (aliases.some(alias => normalizedInput.includes(alias))) {
        action = cmd
        break
      }
    }

    if (!action) {
      return null
    }

    // Resolve mentioned objects
    const resolvedTargets = await Promise.all(
      matches.map(async match => {
        const type = match[1] as CommandObjectType
        const id = match[2]
        const objectType = OBJECT_TYPES[type]
        
        // Check role access
        if (!objectType.allowedRoles.includes(this.userRole)) {
          console.warn(`User role ${this.userRole} cannot access ${type}`)
          return null
        }

        // Fetch object from database
        const { data, error } = await this.supabase
          .from(objectType.table)
          .select(`id, ${objectType.displayField}`)
          .eq('id', id)
          .single()

        if (error || !data) {
          console.warn(`Failed to resolve ${type}/${id}:`, error)
          return null
        }

        return {
          type,
          id,
          reference: `@${type}/${id}`,
          displayName: data[objectType.displayField]
        }
      })
    )

    // Filter out any null results
    const validTargets = resolvedTargets.filter(Boolean)
    
    if (validTargets.length === 0) {
      return null
    }

    // Extract parameters based on the action
    const parameters: Record<string, any> = {}
    
    // Extract status for update_status command
    if (action === 'update_status') {
      const statusMatch = normalizedInput.match(/\b(open|in_progress|waiting_on_customer|resolved|closed)\b/)
      if (statusMatch) {
        parameters.status = statusMatch[1]
      }
    }

    // Extract priority for update_priority command
    if (action === 'update_priority') {
      const priorityMatch = normalizedInput.match(/\b(high|medium|low)\b/)
      if (priorityMatch) {
        parameters.priority = priorityMatch[1]
      }
    }

    // Extract note for add_note command
    if (action === 'add_note') {
      const noteMatch = input.match(/note\s+['"]([^'"]+)['"]/i)
      if (noteMatch) {
        parameters.note = noteMatch[1]
      }
    }

    // Generate SQL for data modification commands
    let sql: string | undefined
    if (['update_status', 'update_priority', 'add_note'].includes(action)) {
      sql = await this.generateSql({
        action,
        targets: validTargets,
        parameters,
        rawText: input
      })
    }

    return {
      action,
      targets: validTargets,
      parameters,
      rawText: input,
      generatedSql: sql
    }
  }

  private async parseNaturalLanguage(input: string): Promise<ParsedCommand | null> {
    // Use LangChain to parse the natural language input
    const result = await this.chain.invoke(input)
    
    // Validate and resolve the parsed objects
    const resolvedTargets = await Promise.all(
      result.targets.map(async target => {
        const objectType = OBJECT_TYPES[target.type]
        
        // Check role access
        if (!objectType.allowedRoles.includes(this.userRole)) {
          console.warn(`User role ${this.userRole} cannot access ${target.type}`)
          return null
        }

        // Fetch object from database
        const { data, error } = await this.supabase
          .from(objectType.table)
          .select(`id, ${objectType.displayField}`)
          .eq('id', target.identifier)
          .single()

        if (error || !data) {
          console.warn(`Failed to resolve ${target.type}/${target.identifier}:`, error)
          return null
        }

        return {
          type: target.type,
          id: target.identifier,
          reference: `@${target.type}/${target.identifier}`,
          displayName: data[objectType.displayField]
        }
      })
    )

    // Filter out any null results
    const validTargets = resolvedTargets.filter(Boolean)
    
    if (validTargets.length === 0) {
      return null
    }

    return {
      action: result.action,
      targets: validTargets,
      parameters: result.parameters,
      rawText: input,
      generatedSql: result.sql
    }
  }

  /**
   * Get SQL for the command if it modifies data
   */
  async generateSql(command: ParsedCommand): Promise<string | null> {
    const prompt = PromptTemplate.fromTemplate(`
      Generate a SQL query for the following command:
      Action: {action}
      Targets: {targets}
      Parameters: {parameters}
      
      Available tables and their key columns:
      {schema}
      
      Generate a single SQL query that implements this command safely.
      Include appropriate WHERE clauses to ensure proper access control.
      Use parameterized queries with $1, $2, etc. for values.
    `)

    const schema = Object.entries(OBJECT_TYPES)
      .map(([type, info]) => `${info.table} (id, ${info.displayField})`)
      .join('\n')

    const result = await this.model.invoke(
      await prompt.format({
        action: command.action,
        targets: JSON.stringify(command.targets),
        parameters: JSON.stringify(command.parameters),
        schema
      })
    )

    return result.content.toString()
  }
}

// Example usage:
/*
const parser = new LangChainCommandParser(supabase, 'agent')

// Structured command
const cmd1 = await parser.parseCommand('reassign @ticket/123 to @agent/john')

// Natural language
const cmd2 = await parser.parseCommand('show me all high priority tickets assigned to John')
const cmd3 = await parser.parseCommand('change the status of ticket 456 to resolved and add a note saying "Fixed in latest update"')
*/ 