import { SupabaseClient } from '@supabase/supabase-js'
import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate, ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'
import { VectorStoreRetriever } from '@langchain/core/vectorstores'
import { Document } from '@langchain/core/documents'
import { formatDocumentsAsString } from 'langchain/util/document'
import { LangChainCommandParser } from './langchain-parser'
import { CommandRole, ParsedCommand, CommandResult, ROLE_COMMANDS, OBJECT_TYPES } from './types'
import { OpenAIEmbeddings } from '@langchain/openai'
import { BaseMessage } from '@langchain/core/messages'
import { LLMChain } from 'langchain/chains'
import { StructuredOutputParser } from 'langchain/output_parsers'
import { z } from 'zod'

interface HybridChainOptions {
  maxCommandAttempts?: number
  minCommandConfidence?: number
  maxContextDocs?: number
  openAIApiKey: string
}

// Define the system message template
const systemTemplate = `You are a command classifier for a CRM system. Your role is to determine if user inputs should be treated as commands.

A command is any input that:
1. Uses @mentions (e.g., @ticket/123, @agent/456)
2. Contains action verbs (update, change, assign, close, etc.)
3. Has clear parameters (status, priority, etc.)

Example command: "Change status of @ticket/123 to open"
Example non-command: "What is the current status?"

Return a JSON object with this exact format:
{{
  "isCommand": boolean,
  "confidence": number,
  "reasoning": string
}}

Input to classify: {input}`

// Define the RAG prompt
const RAG_PROMPT = `You are a helpful CRM assistant. Use the following context to answer the user's question.
If you don't find the answer in the context, say so - do not make up information.

Current user role: {userRole}
Available commands for this role: {availableCommands}

Context:
{context}

Question: {input}

Answer in a clear, professional manner. If suggesting actions, format them as commands the user can run.`

// Create the chat prompt template
const CHAT_PROMPT = ChatPromptTemplate.fromMessages([
  SystemMessagePromptTemplate.fromTemplate(systemTemplate),
  HumanMessagePromptTemplate.fromTemplate('Input to classify: {input}')
])

interface Classification {
  isCommand: boolean
  confidence: number
  reasoning: string
}

// Add new types for ticket commands
export type TicketCommandType = 'update_status' | 'update_priority' | 'assign_ticket'

export interface TicketCommandParams {
  ticket_id: string
  new_status?: string
  new_priority?: string
  agent_id?: string
}

export interface TicketCommandResult {
  success: boolean
  message: string
  error?: string
  ticket_id: string
  [key: string]: any
}

export class HybridChain {
  private commandParser: LangChainCommandParser
  private model: ChatOpenAI
  private retriever: VectorStoreRetriever
  private options: Required<Omit<HybridChainOptions, 'openAIApiKey'>>
  private embeddings: OpenAIEmbeddings
  private classifier: RunnableSequence
  private commandChain: LLMChain
  private ragChain: RunnableSequence
  private requestTimeout: number = 60000 // Increased to 60 seconds

  constructor(
    private supabase: SupabaseClient,
    private userRole: CommandRole,
    retriever: VectorStoreRetriever,
    options: HybridChainOptions
  ) {
    if (!retriever) {
      throw new Error('Retriever is required for HybridChain initialization')
    }

    console.log('[HybridChain] Initializing with config:', {
      userRole,
      hasRetriever: !!retriever,
      options: {
        maxCommandAttempts: options.maxCommandAttempts,
        minCommandConfidence: options.minCommandConfidence,
        maxContextDocs: options.maxContextDocs
      }
    })

    const { openAIApiKey, ...restOptions } = options

    this.commandParser = new LangChainCommandParser(supabase, userRole)
    this.model = new ChatOpenAI({ 
      modelName: 'gpt-4-0125-preview',
      openAIApiKey,
      timeout: this.requestTimeout,
      maxRetries: 3
    })
    this.retriever = retriever
    this.options = {
      maxCommandAttempts: restOptions.maxCommandAttempts ?? 3,
      minCommandConfidence: restOptions.minCommandConfidence ?? 0.7,
      maxContextDocs: restOptions.maxContextDocs ?? 5
    }
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey,
      timeout: this.requestTimeout,
      maxRetries: 3
    })

    console.log('[HybridChain] Initialized model:', {
      modelName: this.model.modelName,
      timeout: this.requestTimeout
    })

    // Initialize chains with detailed logging
    console.log('[HybridChain] Initializing chains')
    
    const parseJson = (output: string): Classification => {
      console.log('[Classifier] Attempting to parse output:', output)
      try {
        const result = JSON.parse(output) as Classification
        console.log('[Classifier] Successfully parsed result:', result)
        return {
          isCommand: !!result.isCommand,
          confidence: Number(result.confidence) || 0,
          reasoning: result.reasoning || 'No reasoning provided'
        }
      } catch (e) {
        console.error('[Classifier] Parse error:', e)
        console.log('[Classifier] Failed output:', output)
        return {
          isCommand: false,
          confidence: 0,
          reasoning: `Error: Failed to parse classification - ${e instanceof Error ? e.message : 'Unknown error'}`
        }
      }
    }

    // Create the classifier chain
    this.classifier = RunnableSequence.from([
      CHAT_PROMPT,
      this.model,
      new StringOutputParser(),
      parseJson
    ])

    // Create the RAG chain
    this.ragChain = RunnableSequence.from([
      PromptTemplate.fromTemplate(RAG_PROMPT),
      this.model,
      new StringOutputParser()
    ])

    this.commandChain = new LLMChain({
      llm: this.model,
      prompt: PromptTemplate.fromTemplate(RAG_PROMPT),
      outputParser: new StringOutputParser(),
      verbose: true // Enable verbose logging
    })

    console.log('[HybridChain] Chains initialized')

    console.log('[HybridChain] Initialized with:', {
      userRole,
      hasRetriever: !!retriever,
      timeout: this.requestTimeout
    })
  }

  private async withTimeout<T>(promise: Promise<T>, operation: string): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      const id = setTimeout(() => {
        clearTimeout(id)
        reject(new Error(`Operation ${operation} timed out after ${this.requestTimeout}ms`))
      }, this.requestTimeout)
    })

    try {
      const result = await Promise.race([promise, timeoutPromise])
      return result as T
    } catch (error) {
      if (error instanceof Error && error.message.includes('timed out')) {
        console.error(`[HybridChain] Timeout in ${operation}:`, error)
        throw new Error(`The operation took too long to complete. Please try again with a simpler query.`)
      }
      throw error
    }
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
    result: TicketCommandResult | string
  }> {
    console.log('[HybridChain] Processing input:', {
      input: input.slice(0, 100),
      userRole: this.userRole,
      timestamp: new Date().toISOString()
    })

    // First check for system queries
    const systemResponse = this.handleSystemQuery(input)
    if (systemResponse) {
      console.log('[HybridChain] Handled as system query:', { response: systemResponse })
      return {
        type: 'rag',
        result: systemResponse
      }
    }

    // Continue with classification
    const classification = await this.classifyInput(input)
    console.log('[HybridChain] Classification result:', {
      isCommand: classification.isCommand,
      confidence: classification.confidence,
      reasoning: classification.reasoning,
      meetsThreshold: classification.confidence >= this.options.minCommandConfidence
    })

    if (classification.isCommand && classification.confidence >= this.options.minCommandConfidence) {
      try {
        const command = await this.commandParser.parseCommand(input)
        if (command) {
          const { data, error } = await this.supabase.rpc('execute_ticket_command', {
            command_type: command.type as TicketCommandType,
            params: {
              ticket_id: command.ticketId,
              new_status: command.params?.status,
              new_priority: command.params?.priority,
              agent_id: command.params?.assignedTo
            }
          })

          console.log('[HybridChain] Command execution details:', {
            command_type: command.type,
            params: {
              ticket_id: command.ticketId,
              new_status: command.params?.status,
              new_priority: command.params?.priority,
              agent_id: command.params?.assignedTo
            },
            response: { data, error }
          })

          if (error) {
            console.error('[HybridChain] Command execution error:', error)
            return {
              type: 'command',
              result: {
                success: false,
                message: 'Failed to execute command',
                error: error.message,
                ticket_id: command.ticketId
              }
            }
          }

          console.log('[HybridChain] Command executed successfully:', data)
          return {
            type: 'command',
            result: data
          }
        }
      } catch (error) {
        console.error('[HybridChain] Command parsing error:', error)
        return {
          type: 'rag',
          result: `I couldn't process that as a command. ${error instanceof Error ? error.message : 'Please try rephrasing.'}`
        }
      }
    }

    // Handle as RAG query
    try {
      const docs = await this.withTimeout(
        this.retriever.getRelevantDocuments(input),
        'retrieve documents'
      )

      const limitedDocs = docs.slice(0, this.options.maxContextDocs)
      const context = formatDocumentsAsString(limitedDocs)

      const response = await this.withTimeout(
        this.ragChain.invoke({
          input,
          context,
          userRole: this.userRole,
          availableCommands: ROLE_COMMANDS[this.userRole].join(', ')
        }),
        'generate response'
      )

      return {
        type: 'rag',
        result: response
      }
    } catch (error) {
      console.error('[HybridChain] RAG processing error:', error)
      throw error
    }
  }

  private async classifyInput(input: string): Promise<Classification> {
    console.log('[HybridChain] Starting classification:', {
      inputLength: input.length,
      inputPreview: input.slice(0, 100),
      timestamp: new Date().toISOString()
    })

    try {
      const result = await this.withTimeout(
        this.classifier.invoke({ input }),
        'classifyInput'
      )
      
      console.log('[HybridChain] Classification complete:', {
        result,
        timestamp: new Date().toISOString()
      })
      
      return result as Classification
    } catch (error) {
      console.error('[HybridChain] Classification failed:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })
      
      return {
        isCommand: false,
        confidence: 0,
        reasoning: `Error: ${error instanceof Error ? error.message : 'Classification failed'}`
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
          input,
          context: combinedContext,
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