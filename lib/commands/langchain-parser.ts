import { SupabaseClient } from '@supabase/supabase-js'
import { ChatOpenAI } from '@langchain/openai'
import { CommandRole, ParsedCommand, ROLE_COMMANDS, COMMAND_FUNCTIONS, CommandType } from './types'

export class LangChainCommandParser {
  private model: ChatOpenAI

  constructor(
    private supabase: SupabaseClient,
    private userRole: CommandRole
  ) {
    this.model = new ChatOpenAI({
      modelName: 'gpt-4-0125-preview',
      temperature: 0
    })
  }

  async parseCommand(input: string): Promise<ParsedCommand | null> {
    try {
      // Get allowed commands for user role
      const allowedCommands = ROLE_COMMANDS[this.userRole]
      
      // Filter functions based on user role
      const availableFunctions = COMMAND_FUNCTIONS.filter(fn => {
        const commandType = fn.name.replace('_ticket_', '_') as CommandType
        return allowedCommands.includes(commandType)
      })

      if (availableFunctions.length === 0) {
        console.error('[LangChainCommandParser] No available functions for role:', this.userRole)
        return null
      }

      // Call the model with function definitions
      const response = await this.model.invoke([
        {
          role: 'system',
          content: `You are a command parser for a CRM system.
Current user role: ${this.userRole}
Available commands: ${allowedCommands.join(', ')}

Your task is to:
1. Extract ticket IDs from @ticket/ID mentions (e.g., "@ticket/123" -> "123")
2. Determine the command type (${allowedCommands.join(', ')})
3. Extract relevant parameters based on the command type

If you cannot parse the input as a valid command, respond with "null".
If the command is not allowed for the current role, respond with "null".`
        },
        {
          role: 'user',
          content: input
        }
      ], {
        functions: availableFunctions,
        function_call: { name: availableFunctions[0].name }
      })

      // Check if we got a function call
      if (!response.additional_kwargs.function_call) {
        return null
      }

      const functionCall = response.additional_kwargs.function_call
      const parsedArgs = JSON.parse(functionCall.arguments)

      // Map the function call to our ParsedCommand format
      const commandType = functionCall.name.replace('_ticket_', '_') as CommandType

      const command: ParsedCommand = {
        type: commandType,
        ticketId: parsedArgs.ticketId,
        params: {
          status: parsedArgs.status,
          priority: parsedArgs.priority,
          assignedTo: parsedArgs.agentId
        }
      }

      // Validate the command
      if (!this.validateCommand(command)) {
        return null
      }

      return command
    } catch (error) {
      console.error('[LangChainCommandParser] Error parsing command:', error)
      return null
    }
  }

  private validateCommand(command: ParsedCommand): boolean {
    // Check if command has required fields
    if (!command.type || !command.ticketId) {
      return false
    }

    // Validate parameters based on command type
    switch (command.type) {
      case 'update_status':
        return !!command.params?.status
      case 'update_priority':
        return !!command.params?.priority
      case 'assign_ticket':
        return !!command.params?.assignedTo
      default:
        return false
    }
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