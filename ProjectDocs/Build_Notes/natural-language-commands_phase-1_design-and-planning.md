# Natural Language Command System - Phase 1: Design and Planning

## Task Objective
Design and implement a hybrid natural language command system with role-based tag capabilities and efficient rollback using existing Supabase infrastructure.

## Current State Assessment
- Basic search palette exists for object lookup
- Existing LangChain integration for RAG (Retrieval Augmented Generation)
- Role-based access already implemented ('customer' | 'agent' | 'admin')
- Command infrastructure in place:
  - Command data storage in chat_messages
  - Universal transaction support with rollback capability for all SQL commands
  - Role-based command validation
  - Sender validation with proper indexing
  - Chat message UI with rollback support
  - Command result display and rollback UI
- Command-specific language processing implemented
- Object tagging capabilities enhanced

## Completed Steps
- [x] Added command_data JSONB column to chat_messages
- [x] Created command_status enum type
- [x] Implemented command data validation
- [x] Added transaction support functions:
  - begin_command_transaction
  - rollback_command_transaction
  - Ensured all SQL commands are wrapped in transactions for rollback support
- [x] Implemented RLS policies for command access
- [x] Added sender validation with proper indexing
- [x] Implemented chat message component with command display
- [x] Added command rollback UI component
- [x] Integrated rollback functionality in chat interface
- [x] Added command result tracking in messages

## Next Implementation Steps

### 1. Command Detection and Processing
- [x] Implement command parser in TypeScript:
  ```typescript
  interface CommandParser {
    parseCommand(input: string): {
      action: string
      targets: Array<{
        type: string
        id: string
        reference: string
      }>
      parameters: Record<string, any>
      sql?: string // Generated SQL that will be wrapped in a transaction
    }
  }
  ```

### 2. Hybrid Chain Integration
- [x] Create command chain wrapper:
  ```typescript
  class CommandChain {
    constructor(private supabase: SupabaseClient) {}
    
    async executeCommand(command: ParsedCommand) {
      // All commands that modify data must be wrapped in a transaction
      const txId = await this.beginTransaction(command)
      try {
        const result = await this.executeWithRollback(command, txId)
        return result
      } catch (error) {
        await this.rollback(txId)
        throw error
      }
    }
  }
  ```

### 3. UI Integration
- [x] Add command preview component:
  ```typescript
  interface CommandPreview {
    command: ParsedCommand
    status: 'preview' | 'executing' | 'completed' | 'failed'
    canRollback: boolean // Always true for SQL commands that modify data
    onExecute: () => Promise<void>
    onRollback: () => Promise<void>
  }
  ```

### 4. Testing Suite
- [ ] Create test cases for:
  - Command parsing
  - Role-based access
  - Transaction rollback for all SQL commands
  - UI interaction
  - Verify rollback functionality for each command type

## Dependencies
- Existing Supabase setup ✓
- Current LangChain RAG implementation ✓
- Role-based authentication ✓
- Chat interface ✓

## Next Steps
1. Complete test suite implementation
2. Add monitoring for rollback operations
3. Implement rollback history tracking
4. Add bulk rollback capabilities
5. Document rollback patterns and best practices

## Technical Notes
- Command data is stored in chat_messages.command_data as JSONB
- Sender validation ensures referential integrity across team_members and customers
- All SQL commands are wrapped in transactions to support atomic operations with rollback capability
- RLS policies enforce role-based access control
- Every command that modifies data must be tracked and support rollback functionality
- Rollback UI is integrated into chat messages for seamless user experience
- Command results are preserved in message history for audit purposes 