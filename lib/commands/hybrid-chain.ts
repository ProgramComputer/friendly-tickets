import { SupabaseClient } from '@supabase/supabase-js'
import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'
import { VectorStoreRetriever } from '@langchain/core/vectorstores'
import { Document } from '@langchain/core/documents'
import { formatDocumentsAsString } from 'langchain/util/document'
import { LangChainCommandParser } from './langchain-parser'
import { CommandRole, ParsedCommand, CommandResult, ROLE_COMMANDS, OBJECT_TYPES } from './types'
import { OpenAIEmbeddings } from '@langchain/openai'

interface HybridChainOptions {
  maxCommandAttempts?: number
  minCommandConfidence?: number
  maxContextDocs?: number
  openAIApiKey: string
}

const COMMAND_CLASSIFIER_PROMPT = `You are a command classifier for a CRM system. Determine if the user's input should be treated as a command or a general question.

Input: {input}

Consider:
1. Does it request a specific action? (e.g., update, assign, create)
2. Does it reference specific objects? (e.g., tickets, agents, customers)
3. Does it include parameters? (e.g., priority, status)
4. Is it asking for information that would be in the knowledge base?

Return a JSON object with these exact fields:
{
  "isCommand": boolean,
  "confidence": number between 0 and 1,
  "reasoning": string explanation
}

Example responses:
{
  "isCommand": true,
  "confidence": 0.95,
  "reasoning": "Clear action (assign) with specific objects (ticket 123, agent John)"
}

{
  "isCommand": false,
  "confidence": 0.9,
  "reasoning": "General knowledge question about best practices"
}

Return ONLY the JSON object, no additional text, quotes, or markdown formatting.`

const RAG_PROMPT = `You are a helpful CRM assistant. Use the following context to answer the user's question.
If you don't find the answer in the context, say so - do not make up information.

Current user role: {userRole}
Available commands for this role: {availableCommands}

Context:
{context}

Question: {input}

Answer in a clear, professional manner. If suggesting actions, format them as commands the user can run.`

export class HybridChain {
  private commandParser: LangChainCommandParser
  private model: ChatOpenAI
  private retriever: VectorStoreRetriever
  private options: Required<Omit<HybridChainOptions, 'openAIApiKey'>>
  private embeddings: OpenAIEmbeddings
  private classifierChain: RunnableSequence
  private ragChain: RunnableSequence
  private requestTimeout: number = 30000 // 30 second timeout

  constructor(
    private supabase: SupabaseClient,
    private userRole: CommandRole,
    retriever: VectorStoreRetriever,
    options: HybridChainOptions
  ) {
    const { openAIApiKey, ...restOptions } = options

    this.commandParser = new LangChainCommandParser(supabase, userRole)
    this.model = new ChatOpenAI({ 
      modelName: 'gpt-4-turbo-preview',
      openAIApiKey,
      timeout: this.requestTimeout
    })
    this.retriever = retriever
    this.options = {
      maxCommandAttempts: restOptions.maxCommandAttempts ?? 3,
      minCommandConfidence: restOptions.minCommandConfidence ?? 0.7,
      maxContextDocs: restOptions.maxContextDocs ?? 5
    }
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey,
      timeout: this.requestTimeout
    })

    // Initialize chains once
    this.classifierChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(COMMAND_CLASSIFIER_PROMPT),
      this.model,
      new StringOutputParser(),
    ])

    this.ragChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(RAG_PROMPT),
      this.model,
      new StringOutputParser()
    ])

    console.log('[HybridChain] Initialized with:', {
      userRole,
      hasRetriever: !!retriever,
      timeout: this.requestTimeout
    })
  }

  private async withTimeout<T>(promise: Promise<T>, operation: string): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation ${operation} timed out after ${this.requestTimeout}ms`))
      }, this.requestTimeout)
    })

    return Promise.race([promise, timeout])
  }

  private handleSystemQuery(input: string): string | null {
    const normalizedInput = input.toLowerCase().trim()
    
    // Handle role and command queries directly
    if (normalizedInput.includes('role') || normalizedInput.includes('who am i')) {
      return `You are currently logged in as a ${this.userRole}.`
    }
    
    if (normalizedInput.includes('command') || normalizedInput.includes('what can i do')) {
      const commands = ROLE_COMMANDS[this.userRole]
      return `As a ${this.userRole}, you can use the following commands:\n${commands.join(', ')}`
    }
    
    return null
  }

  async process(input: string): Promise<{
    type: 'command' | 'rag'
    result: CommandResult | string
  }> {
    // First check for system queries
    const systemResponse = this.handleSystemQuery(input)
    if (systemResponse) {
      return {
        type: 'rag',
        result: systemResponse
      }
    }

    // Continue with existing classification and processing
    const classification = await this.classifyInput(input)
    console.log('Input classification:', classification)

    if (classification.isCommand && classification.confidence >= this.options.minCommandConfidence) {
      // Try command processing
      try {
        const command = await this.commandParser.parseCommand(input)
        if (command) {
          // Validate command against user role
          const allowedCommands = ROLE_COMMANDS[this.userRole]
          if (!allowedCommands.includes(command.action)) {
            console.log(`[HybridChain] Command ${command.action} not allowed for role ${this.userRole}`)
            return {
              type: 'rag',
              result: `I apologize, but as a ${this.userRole} you don't have permission to ${command.action}. Here are the commands available to you: ${allowedCommands.join(', ')}`
            }
          }

          // Validate object access
          const hasInvalidAccess = command.targets.some(target => {
            const objectType = OBJECT_TYPES[target.type]
            return !objectType.allowedRoles.includes(this.userRole)
          })

          if (hasInvalidAccess) {
            console.log(`[HybridChain] User role ${this.userRole} cannot access some targets`)
            return {
              type: 'rag',
              result: `I apologize, but as a ${this.userRole} you don't have permission to access some of the requested resources.`
            }
          }

          return {
            type: 'command',
            result: await this.executeCommand(command)
          }
        }
      } catch (error) {
        console.error('Command processing failed:', error)
      }
    }

    // Fall back to RAG if:
    // 1. Not a command
    // 2. Command processing failed
    // 3. Low command confidence
    return {
      type: 'rag',
      result: await this.generateRAGResponse(input)
    }
  }

  private async classifyInput(input: string) {
    try {
      console.log('[HybridChain] Classifying input:', input.slice(0, 50))
      
      const result = await this.withTimeout(
        this.classifierChain.invoke({ input }),
        'classifyInput'
      )
      
      // Clean the result string to ensure it's valid JSON
      const cleanResult = result.trim().replace(/^```json\n|\n```$/g, '').trim()
      
      try {
        const parsed = JSON.parse(cleanResult)
        
        // Validate the required fields
        if (typeof parsed.isCommand !== 'boolean' || 
            typeof parsed.confidence !== 'number' || 
            typeof parsed.reasoning !== 'string') {
          console.error('[HybridChain] Invalid classifier response format:', parsed)
          return {
            isCommand: false,
            confidence: 0,
            reasoning: 'Error: Invalid response format'
          }
        }
        
        return parsed
      } catch (parseError) {
        console.error('[HybridChain] Failed to parse classifier response:', cleanResult, parseError)
        return {
          isCommand: false,
          confidence: 0,
          reasoning: 'Error: Failed to parse response'
        }
      }
    } catch (error) {
      console.error('[HybridChain] Classifier chain error:', error)
      return {
        isCommand: false,
        confidence: 0,
        reasoning: 'Error: Classification failed'
      }
    }
  }

  private async executeCommand(command: ParsedCommand): Promise<CommandResult> {
    console.log('Executing command:', command)

    // Start a transaction if the command modifies data
    let transactionId: string | undefined
    if (command.generatedSql) {
      const { data } = await this.supabase.rpc('begin_command_transaction', {
        command_data: command
      })
      transactionId = data?.transaction_id
    }

    try {
      // Execute the command
      if (command.generatedSql) {
        const { error } = await this.supabase.rpc('execute_sql_command', {
          sql: command.generatedSql,
          params: Object.values(command.parameters)
        })

        if (error) throw error
      }

      return {
        success: true,
        message: 'Command executed successfully',
        data: command,
        canRollback: !!transactionId,
        transactionId
      }
    } catch (error) {
      // Attempt to rollback if we have a transaction
      if (transactionId) {
        await this.supabase.rpc('rollback_command_transaction', {
          transaction_id: transactionId
        })
      }

      return {
        success: false,
        message: 'Command execution failed',
        error,
        canRollback: false
      }
    }
  }

  private async generateRAGResponse(input: string): Promise<string> {
    try {
      console.log('[HybridChain] Generating RAG response for:', input.slice(0, 50))
      
      // Get embedding for the input using LangChain's embeddings interface
      const embedding = await this.withTimeout(
        this.embeddings.embedQuery(input),
        'embedQuery'
      )

      // Retrieve relevant KB articles
      const { data: kbArticles } = await this.supabase.rpc('match_kb_articles', {
        query_embedding: embedding,
        match_threshold: 0.78,
        match_count: 3
      })

      // Retrieve relevant tickets
      const { data: tickets } = await this.supabase.rpc('match_tickets', {
        query_embedding: embedding,
        match_threshold: 0.78,
        match_count: 3
      })

      // Format documents for context
      const kbContext = kbArticles?.map(article => `
        KB Article: ${article.title}
        Content: ${article.content}
        Similarity: ${article.similarity}
      `).join('\n') || ''

      const ticketContext = tickets?.map(ticket => `
        Ticket: ${ticket.title}
        Description: ${ticket.description}
        Status: ${ticket.status}
        Priority: ${ticket.priority}
        Category: ${ticket.category}
        Department: ${ticket.department}
        Created: ${ticket.created_at}
        Similarity: ${ticket.similarity}
      `).join('\n') || ''

      const combinedContext = `
        Knowledge Base Articles:
        ${kbContext}

        Related Tickets:
        ${ticketContext}
      `.trim()

      // Generate response using RAG prompt
      return this.withTimeout(
        this.ragChain.invoke({
          context: combinedContext,
          input,
          userRole: this.userRole,
          availableCommands: ROLE_COMMANDS[this.userRole].join(', ')
        }),
        'generateRAGResponse'
      )
    } catch (error) {
      console.error('[HybridChain] Error generating RAG response:', error)
      return 'I apologize, but I encountered an error while searching the knowledge base. Please try rephrasing your question.'
    }
  }
}

// Example usage:
/*
const hybridChain = new HybridChain(supabase, 'agent', retriever, { openAIApiKey: 'your-api-key' })

// Command example
const result1 = await hybridChain.process('assign ticket 123 to John')
if (result1.type === 'command') {
  console.log('Command executed:', result1.result)
}

// RAG example
const result2 = await hybridChain.process('what are best practices for handling angry customers?')
if (result2.type === 'rag') {
  console.log('Knowledge base response:', result2.result)
}
*/ 