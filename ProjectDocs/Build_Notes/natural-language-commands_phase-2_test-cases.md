# Natural Language CRM Commands - Test Cases

## Overview
This document outlines test cases for natural language commands in AutoCRM, using LangChain tracer for monitoring and evaluation.

## Test Environment Setup
- **LangChain Project**: `autocrm-nl-commands`
- **Test Data Source**: `seed-test-data.ts`
- **Monitoring Tools**: LangChain Tracer, LangFuse Integration
- **Test Users**:
  - Customer: jack@gmail.com
  - Agent: jack@agent.autocrm.com
  - Admin: jack@admin.autocrm.com
  - Enterprise Customer: sarah@enterprise.com
  - VIP Customer: alex@vip.com

## Test Categories

### 1. Ticket Management

#### 1.1 Basic Ticket Operations

##### TC-101: Create Basic Ticket
```yaml
Input: "Create a ticket about login issues"
Expected Output:
  - New ticket created in tickets table
  - Fields:
    - title: Contains "login issues"
    - status: "open"
    - priority: "medium"
    - category: "technical"
Context: Customer user
Success Criteria:
  - Ticket appears in database
  - Customer receives confirmation
  - Correct default fields set
LangChain Trace:
  - Input classification
  - Entity extraction
  - Priority determination
  - Category classification
```

##### TC-102: Assign Ticket
```yaml
Input: "Assign ticket #123 to Emma from tech support"
Expected Output:
  - tickets.assignee_id updated
  - ticket_history entry created
Context: Agent/Admin user
Success Criteria:
  - Correct assignee set
  - History recorded
  - Notification sent
LangChain Trace:
  - Agent name resolution
  - Department validation
  - Permission check
```

##### TC-103: Update Ticket Priority
```yaml
Input: "Set ticket #123 to high priority"
Expected Output:
  - tickets.priority updated to "high"
  - ticket_history entry created
Context: Agent/Admin user
Success Criteria:
  - Priority updated
  - History recorded
  - SLA timers adjusted
LangChain Trace:
  - Priority level validation
  - SLA impact assessment
```

#### 1.2 Complex Ticket Operations

##### TC-201: Multi-tag Assignment
```yaml
Input: "Assign all open billing tickets to Lisa from billing support"
Expected Output:
  - Multiple tickets.assignee_id updated
  - Bulk ticket_history entries
Context: Admin user
Success Criteria:
  - All matching tickets updated
  - Correct filter application
LangChain Trace:
  - Tag parsing
  - Bulk update validation
  - Permission escalation check
```

##### TC-202: Contextual Status Update
```yaml
Input: "Mark all of Sarah's resolved tickets as closed"
Expected Output:
  - tickets.status updated to "closed"
  - Multiple ticket_history entries
Context: Agent/Admin user
Success Criteria:
  - Only resolved tickets affected
  - Correct customer filter
LangChain Trace:
  - Customer identification
  - Status transition validation
```

### 2. Customer Management

##### TC-301: Customer Info Retrieval
```yaml
Input: "Show me Sarah's ticket history"
Expected Output:
  - Query results from tickets table
  - Formatted ticket history
Context: Agent user
Success Criteria:
  - Correct customer identification
  - Proper data formatting
LangChain Trace:
  - Customer lookup
  - History aggregation
  - Permission verification
```

##### TC-302: Customer Status Update
```yaml
Input: "Update Alex's VIP status to active"
Expected Output:
  - customers.vip_status updated
  - customer_history entry created
Context: Admin user
Success Criteria:
  - Status updated
  - History recorded
LangChain Trace:
  - Status validation
  - Customer verification
```

### 3. Agent Operations

##### TC-401: Agent Availability
```yaml
Input: "Set my status to away for 1 hour"
Expected Output:
  - team_members presence updated
  - Scheduled status reversion
Context: Agent user
Success Criteria:
  - Status updated
  - Timer set correctly
LangChain Trace:
  - Duration parsing
  - Presence system integration
```

##### TC-402: Department Transfer
```yaml
Input: "Transfer all billing tickets from Mark to Sarah"
Expected Output:
  - Multiple tickets.assignee_id updated
  - Bulk ticket_history entries
Context: Admin user
Success Criteria:
  - All relevant tickets transferred
  - Notifications sent
LangChain Trace:
  - Agent validation
  - Workload assessment
```

### 4. Knowledge Base Operations

##### TC-501: Article Creation
```yaml
Input: "Create KB article about login troubleshooting"
Expected Output:
  - New kb_articles entry
  - Category assignment
Context: Agent/Admin user
Success Criteria:
  - Article created
  - Proper categorization
LangChain Trace:
  - Content classification
  - Template application
```

##### TC-502: Article Update
```yaml
Input: "Update the billing FAQ with new payment methods"
Expected Output:
  - kb_articles content updated
  - article_history entry created
Context: Agent/Admin user
Success Criteria:
  - Content updated
  - Version tracked
LangChain Trace:
  - Article identification
  - Content merger
```

### 5. Reporting and Analytics

##### TC-601: Basic Report Generation
```yaml
Input: "Show me today's ticket statistics"
Expected Output:
  - Aggregated ticket data
  - Formatted report
Context: Agent/Admin user
Success Criteria:
  - Accurate metrics
  - Proper formatting
LangChain Trace:
  - Time range parsing
  - Metric aggregation
```

##### TC-602: Complex Analysis
```yaml
Input: "Generate a performance report for the tech support team this month"
Expected Output:
  - Comprehensive team metrics
  - Trend analysis
Context: Admin user
Success Criteria:
  - Multiple metric inclusion
  - Trend identification
LangChain Trace:
  - Department filtering
  - Multi-metric analysis
```

## RAG Context Enhancement

### Current Context
- Ticket details
- User roles and permissions
- Department information
- Basic templates

### Proposed Context Additions
1. Related Tickets
   - Similar issues
   - Same customer
   - Same category
2. Historical Interactions
   - Previous resolutions
   - Customer preferences
3. Team Knowledge
   - Agent specialties
   - Department workload
4. SLA Requirements
   - Priority rules
   - Response times

## Monitoring Setup

### LangChain Tracer Configuration
```python
from langchain.callbacks import LangChainTracer
tracer = LangChainTracer(
    project_name="autocrm-nl-commands"
)
```

### Key Metrics
1. Command Understanding
   - Classification accuracy
   - Entity extraction success
2. Execution Accuracy
   - Field update correctness
   - Permission compliance
3. Response Quality
   - Completion time
   - Error rate
4. Context Utilization
   - RAG relevance
   - Context window usage

## Test Execution Plan

### Phase 1: Basic Functionality
- Run each test case with exact phrasing
- Verify database updates
- Check response formatting

### Phase 2: Variation Testing
- Test alternative phrasings
- Test with different users
- Test with varying contexts

### Phase 3: Edge Cases
- Test with missing information
- Test with ambiguous requests
- Test with conflicting data

### Phase 4: Load Testing
- Test multiple simultaneous requests
- Test with large data sets
- Test with complex queries

## Success Metrics

### Accuracy Targets
- Command Understanding: >95%
- Execution Accuracy: >99%
- Response Time: <2s
- Error Rate: <1%

### Quality Metrics
- Context Relevance: >90%
- User Satisfaction: >4.5/5
- First-Time Success: >85%

## Error Handling

### Common Error Types
1. Ambiguous Commands
2. Missing Context
3. Permission Issues
4. Invalid Operations

### Recovery Procedures
1. Clarification Requests
2. Context Gathering
3. Permission Escalation
4. Operation Validation

## Next Steps

1. Implement LangChain tracing
2. Set up automated test runs
3. Create variation test cases
4. Establish baseline metrics
5. Begin systematic testing
6. Document edge cases
7. Refine RAG context
8. Optimize response times 