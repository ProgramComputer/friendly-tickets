# Command Transaction System - Phase 1: Documentation

## Task Objective
Document the command transaction system that enables SQL command execution tracking and rollback functionality without relying on PostgreSQL transactions.

## Current State Assessment
- Command transactions are tracked in the `command_transactions` table
- Each command execution is recorded with its previous state
- Rollback capability is maintained without PostgreSQL transactions
- Status tracking through command lifecycle

## System Components

### 1. Command Transactions Table
```sql
command_transactions {
  id: uuid                  -- Unique identifier for the transaction
  action: string           -- The SQL command being executed
  targets: Json           -- Array of target tables affected
  parameters: Json        -- Parameters passed to the command
  previous_states: Json   -- Snapshot of data before modification
  status: command_status  -- Status enum: 'pending'|'executed'|'rolled_back'
  user_id: string        -- User who executed the command
  created_at: timestamp  -- When the transaction was created
  updated_at: timestamp  -- Last update timestamp
}
```

### 2. Command Status Lifecycle
1. **Pending**: Initial state when command is recorded
2. **Executed**: After successful execution
3. **Rolled Back**: If command fails or is manually rolled back

### 3. Previous State Capture
- Automatically captures affected rows before modification
- Stores complete row data for accurate rollback
- Handles both UPDATE and DELETE operations
- Uses safe SQL injection prevention with `format` and `%I`

### 4. Command Execution Process
1. Clean and validate SQL command and parameters
2. Extract target table and where clause
3. Capture previous state
4. Create transaction record
5. Execute command
6. Update transaction status
7. Return transaction ID for frontend tracking

## Implementation Details

### SQL Command Function
```sql
execute_sql_command(sql text, params jsonb) RETURNS text
```

#### Key Features:
- Parameter type detection (UUID vs text)
- SQL command cleaning and normalization
- Previous state capture for affected rows
- Transaction status management
- Error handling with detailed context

### Security Considerations
- Uses `SECURITY DEFINER` for elevated permissions
- Safe table name quoting with `format(%I)`
- Parameter validation and type checking
- Status tracking for audit purposes
- User ID tracking for accountability

## Frontend Integration

### Command Execution
```typescript
interface CommandResult {
  message: string
  transaction_id: string
}
```

### Transaction Status
```typescript
type CommandStatus = 'pending' | 'executed' | 'rolled_back'
```

### Rollback Support
- Frontend can track transaction_id
- Status can be monitored for completion
- Rollback can be triggered using transaction_id
- Previous states available for verification

## Best Practices

1. **Command Recording**
   - Always check command status before proceeding
   - Store transaction_id for potential rollback
   - Validate parameters before execution

2. **State Management**
   - Verify previous state capture for critical operations
   - Use appropriate WHERE clauses for precise state capture
   - Consider data volume in previous states

3. **Error Handling**
   - Check command status after execution
   - Handle rollback status appropriately
   - Provide clear error messages to users

4. **Security**
   - Validate user permissions before execution
   - Track all command executions
   - Maintain audit trail through transaction records

## Dependencies
- Supabase database ✓
- Command status enum type ✓
- User authentication system ✓
- Frontend state management ✓

## Next Steps
1. Implement rollback function
2. Add bulk command support
3. Enhance error reporting
4. Add command validation rules
5. Implement command history UI
6. Add command analytics and monitoring

## Technical Notes
- All commands are tracked in command_transactions
- Previous states enable accurate rollbacks
- Status tracking provides audit capability
- No reliance on PostgreSQL transactions
- Safe for use with connection pooling (e.g., Supavisor)

## Example Usage

```sql
-- Execute a command
SELECT execute_sql_command(
  'UPDATE tickets SET status = $1 WHERE id = $2',
  '["open", "0355b6c8-a49c-42c8-bc5f-e098bc9c2786"]'::jsonb
);

-- Check transaction status
SELECT status FROM command_transactions WHERE id = '123e4567-e89b-12d3-a456-426614174000';

-- View previous state
SELECT previous_states FROM command_transactions WHERE id = '123e4567-e89b-12d3-a456-426614174000';
```

## Monitoring and Maintenance
1. Regular cleanup of old transactions
2. Monitoring of transaction volume
3. Audit of rollback patterns
4. Performance impact assessment
5. Storage usage tracking 