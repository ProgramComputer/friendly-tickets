## Ticket System - Phase 1: Schema and Implementation

### Task Objective
Implement a comprehensive ticket management system with a flexible data model, conversation tracking, and metadata management.

### Current State Assessment
- Basic customer portal structure is in place
- No ticket system schema or functionality exists
- Need to implement ticket creation, tracking, and management

### Future State Goal
A fully functional ticket system with:
- Robust data model in Supabase
- Type-safe ticket management
- Real-time updates
- Conversation history
- Metadata and tagging system

### Implementation Plan

1. **Database Schema Setup**
   - [ ] Create tickets table with core fields
   - [ ] Create ticket_messages table for conversation history
   - [ ] Create ticket_tags table for categorization
   - [ ] Create ticket_metadata table for custom fields
   - [ ] Set up RLS policies for secure access
   - [ ] Generate and update TypeScript types

2. **Ticket Management Service**
   - [ ] Create ticket service with CRUD operations
   - [ ] Implement ticket status management
   - [ ] Add tag management functionality
   - [ ] Create message thread management
   - [ ] Add metadata management

3. **Ticket List View**
   - [ ] Create ticket list component
   - [ ] Implement filtering and sorting
   - [ ] Add pagination
   - [ ] Create ticket preview cards
   - [ ] Add quick actions

4. **Ticket Detail View**
   - [ ] Create ticket detail layout
   - [ ] Implement conversation thread
   - [ ] Add status and priority management
   - [ ] Create metadata editor
   - [ ] Add tag management UI

5. **Ticket Creation**
   - [ ] Create ticket form
   - [ ] Add file attachment support
   - [ ] Implement template system
   - [ ] Add validation
   - [ ] Create success/error handling

### Database Schema Details

```sql
-- Core ticket table
create type ticket_status as enum ('open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed');
create type ticket_priority as enum ('low', 'medium', 'high', 'urgent');

create table tickets (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  status ticket_status not null default 'open',
  priority ticket_priority not null default 'medium',
  customer_id uuid references auth.users(id) not null,
  assigned_to uuid references team_members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  first_response_at timestamptz,
  due_date timestamptz
);

-- Conversation history
create table ticket_messages (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid references tickets(id) not null,
  sender_id uuid references auth.users(id) not null,
  message text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now(),
  attachments jsonb
);

-- Tags for categorization
create table ticket_tags (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  color text not null default '#000000',
  created_at timestamptz not null default now()
);

-- Junction table for ticket tags
create table ticket_tag_relations (
  ticket_id uuid references tickets(id) not null,
  tag_id uuid references ticket_tags(id) not null,
  created_at timestamptz not null default now(),
  primary key (ticket_id, tag_id)
);

-- Custom fields/metadata
create table ticket_metadata (
  ticket_id uuid references tickets(id) not null,
  key text not null,
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (ticket_id, key)
);

-- Indexes
create index tickets_customer_id_idx on tickets(customer_id);
create index tickets_assigned_to_idx on tickets(assigned_to);
create index tickets_status_idx on tickets(status);
create index ticket_messages_ticket_id_idx on ticket_messages(ticket_id);
create index ticket_tag_relations_ticket_id_idx on ticket_tag_relations(ticket_id);
create index ticket_metadata_ticket_id_idx on ticket_metadata(ticket_id);

-- Update timestamps trigger
create function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tickets_updated_at
  before update on tickets
  for each row
  execute function update_updated_at();

create trigger ticket_metadata_updated_at
  before update on ticket_metadata
  for each row
  execute function update_updated_at();

-- RLS Policies
alter table tickets enable row level security;
alter table ticket_messages enable row level security;
alter table ticket_tags enable row level security;
alter table ticket_tag_relations enable row level security;
alter table ticket_metadata enable row level security;

-- Customers can view their own tickets
create policy "Customers can view their own tickets"
  on tickets for select
  to authenticated
  using (auth.uid() = customer_id);

-- Customers can create tickets
create policy "Customers can create tickets"
  on tickets for insert
  to authenticated
  with check (auth.uid() = customer_id);

-- Customers can view their own ticket messages
create policy "Customers can view their own ticket messages"
  on ticket_messages for select
  to authenticated
  using (
    ticket_id in (
      select id from tickets where customer_id = auth.uid()
    ) and not is_internal
  );

-- Customers can create ticket messages
create policy "Customers can create ticket messages"
  on ticket_messages for insert
  to authenticated
  with check (
    ticket_id in (
      select id from tickets where customer_id = auth.uid()
    )
  );

-- Customers can view tags
create policy "Customers can view tags"
  on ticket_tags for select
  to authenticated
  using (true);

-- Customers can view tag relations for their tickets
create policy "Customers can view tag relations"
  on ticket_tag_relations for select
  to authenticated
  using (
    ticket_id in (
      select id from tickets where customer_id = auth.uid()
    )
  );

-- Customers can view metadata for their tickets
create policy "Customers can view ticket metadata"
  on ticket_metadata for select
  to authenticated
  using (
    ticket_id in (
      select id from tickets where customer_id = auth.uid()
    )
  );
```

### Additional Notes
- Ensure proper indexing for performance
- Implement real-time subscriptions for updates
- Add comprehensive error handling
- Consider implementing a caching strategy
- Plan for future scalability 