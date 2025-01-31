# Natural Language Command Testing Checklist

## Test Environment
- Use existing GUI interface
- Test with seeded data from `seed-test-data.ts`
- Verify rollback functionality for each modifying command

## Test Users
- Customer: jack@gmail.com
- Agent: jack@agent.autocrm.com
- Admin: jack@admin.autocrm.com
- Enterprise: sarah@enterprise.com
- VIP: alex@vip.com

## 1. Basic Commands with Rollback

### Ticket Creation
- [ ] "Create a ticket about login issues"
  * Verify: New ticket created
  * Rollback: Should remove ticket

- [ ] "Submit a high priority ticket about billing"
  * Verify: Priority set correctly
  * Rollback: Should remove ticket

### Ticket Updates
- [ ] "Assign this ticket to Emma from tech support"
  * Verify: Assignee updated
  * Rollback: Should revert assignee

- [ ] "Change ticket priority to urgent"
  * Verify: Priority changed
  * Rollback: Should restore previous priority

## 2. Complex Commands

### Bulk Operations
- [ ] "Assign all open billing tickets to Lisa"
  * Verify: Multiple tickets updated
  * Rollback: Should revert all assignments

- [ ] "Close all resolved tickets from last week"
  * Verify: Status updates
  * Rollback: Should revert status changes

### Multi-step Operations
- [ ] "Transfer Sarah's tickets to Dave and notify her"
  * Verify: Assignments and notification
  * Rollback: Should revert transfers

## 3. Department-Specific Commands

### Technical Support
- [ ] "Find all unassigned technical issues"
- [ ] "Show active tech support agents"
- [ ] "List tickets handled by Emma today"

### Billing Support
- [ ] "Show pending billing inquiries"
- [ ] "List overdue invoices"
- [ ] "Find tickets with payment issues"

### Customer Success
- [ ] "Show VIP customer interactions"
- [ ] "List customer feedback from last month"
- [ ] "Find tickets needing follow-up"

## 4. Status and Reporting Commands

### Agent Status
- [ ] "Show available tech support agents"
- [ ] "List agents handling urgent tickets"
- [ ] "Display team workload summary"

### Ticket Analytics
- [ ] "Show ticket resolution times"
- [ ] "Display department performance metrics"
- [ ] "List most common customer issues"

## 5. Edge Cases

### Error Handling
- [ ] "Assign ticket to non-existent agent"
  * Verify: Error message
  * Rollback: Not needed

- [ ] "Close ticket without resolution"
  * Verify: Validation error
  * Rollback: Not needed

### Permission Tests
- [ ] Try admin commands as agent
- [ ] Try agent commands as customer
- [ ] Try customer commands as agent

## Rollback UI Verification

### UI Elements
- [ ] Rollback button visible for modifying commands
- [ ] Rollback confirmation dialog works
- [ ] Rollback status indicator shows correctly
- [ ] Multiple rollback handling works correctly

### Rollback States
- [ ] Verify command history shows original state
- [ ] Check rollback preview displays correctly
- [ ] Confirm rollback success message
- [ ] Validate database state after rollback

## Test Variations

For each command, test with:
1. Different phrasings
2. Additional context
3. Missing information
4. Edge case inputs

## Success Criteria

For each test:
- [ ] Command understood correctly
- [ ] Action executed properly
- [ ] Rollback available when applicable
- [ ] Rollback restores correct state
- [ ] Appropriate feedback provided

## Notes
- Document any unexpected behaviors
- Note any UI/UX issues
- Track command understanding accuracy
- Monitor rollback reliability

## RAG Context Enhancement Tests

### Ticket Context Scenarios
- [ ] "Show me similar tickets to this login issue"
  * Context should include:
    * Tickets with similar technical issues
    * Previous resolutions
    * Related KB articles

- [ ] "Find related billing complaints"
  * Context should include:
    * Similar billing tickets
    * Customer's billing history
    * Relevant payment templates

- [ ] "What's the usual resolution for this kind of issue?"
  * Context should include:
    * Historical resolutions
    * Common solutions
    * Success rates of different approaches

### Customer History Context
- [ ] "How have we handled this customer's previous tickets?"
  * Context should include:
    * Customer's ticket history
    * Previous interactions
    * Preferred solutions

### Department Knowledge Context
- [ ] "Who's the best agent to handle this?"
  * Context should include:
    * Agent specializations
    * Resolution success rates
    * Current workload
    * Similar ticket history

### Template Enhancement
- [ ] "Draft a response based on similar cases"
  * Context should include:
    * Similar ticket responses
    * Successful templates
    * Customer communication style

## Context Relevance Verification

### Immediate Context
- [ ] Current ticket details fully included
- [ ] Related tickets properly linked
- [ ] Customer history accessible
- [ ] Department context available

### Extended Context
- [ ] Historical resolutions retrievable
- [ ] Similar cases findable
- [ ] Templates accessible
- [ ] Agent expertise matchable

### Context Quality Checks
- [ ] Relevance scoring accurate
- [ ] Time-based prioritization working
- [ ] Category matching effective
- [ ] Customer preference consideration

## Ticket-Based RAG Implementation

### Vector Store Setup
- [ ] Index fields to include:
  * Ticket title and description
  * Resolution steps
  * Category and tags
  * Priority and status
  * Resolution time
  * Customer feedback
  * Agent notes

### Retrieval Configuration
- [ ] Implement hybrid search:
  * Semantic similarity for context
  * Keyword matching for technical terms
  * Time-weighted relevance
  * Category/department filtering

### Context Window Construction
```typescript
const qa_system_prompt = `You are a CRM assistant helping with ticket management.
Use the following retrieved ticket context to inform your response:
{context}

Current ticket: {current_ticket}
User role: {user_role}
Department: {department}

Provide responses that are:
1. Relevant to the current ticket category
2. Consistent with previous similar resolutions
3. Appropriate for the user's role
4. Within department guidelines`
```

### Retrieval Patterns
- [ ] Similar Tickets Query:
```typescript
const similarTicketsQuery = {
  must: [
    { match: { category: currentTicket.category }},
    { match: { status: "resolved" }},
    { range: { created_at: { gte: "now-6M" }}}
  ],
  should: [
    { match: { description: currentTicket.description }},
    { match: { tags: currentTicket.tags }}
  ]
}
```

## LangChain Metrics Implementation

### Retrieval Quality Metrics
```typescript
interface RetrievalMetrics {
  relevanceScore: number      // 0-1 semantic similarity
  categoryMatch: number       // % of results in same category
  resolutionSuccess: number   // % of retrieved tickets successfully resolved
  timeRelevance: number      // time-weighted score
}
```

### Response Quality Metrics
```typescript
interface ResponseMetrics {
  contextUtilization: number  // % of retrieved context used
  responseLatency: number     // ms to generate response
  tokenUsage: {
    prompt: number,
    completion: number
  }
  confidenceScore: number     // LLM's confidence in response
}
```

### Tracking Setup
```typescript
const tracer = new LangChainTracer({
  projectName: "autocrm-nl-commands",
  metrics: {
    retrieval: RetrievalMetrics,
    response: ResponseMetrics,
    customMetrics: {
      ticketResolutionTime: "number",
      customerSatisfaction: "number",
      agentEfficiency: "number"
    }
  }
})
```

### Success Metrics Thresholds
- Retrieval Performance:
  * Relevance Score > 0.85
  * Category Match > 90%
  * Resolution Success > 80%
  * Time Relevance > 0.75

- Response Quality:
  * Context Utilization > 70%
  * Response Latency < 2000ms
  * Confidence Score > 0.85
  * Token Efficiency < 1000 tokens/response

### Monitoring Dashboards
- [ ] Real-time metrics:
  * Current retrieval performance
  * Response latency trends
  * Context utilization rates
  * Token usage patterns

- [ ] Historical analysis:
  * Resolution success rates
  * Category-wise performance
  * Agent efficiency metrics
  * Customer satisfaction correlation 