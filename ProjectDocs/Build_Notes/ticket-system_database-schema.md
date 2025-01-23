# Ticket System Database Schema
Created: 2024-01-21

## Task Objective
Design and implement a comprehensive database schema that supports the ticket system across all phases and user roles (Customer, Admin, Agent).

## Current State Assessment
- Basic authentication system in place
- Need comprehensive schema for tickets, users, and related entities
- Must support future features like knowledge base, chat, and feedback

## Future State Goal
- Complete schema supporting all planned features
- Proper relationships and constraints
- Row Level Security (RLS) policies for each role
- Support for real-time features

## Implementation Plan

### 1. Core Tables

#### Users & Profiles
```sql
-- Extend Supabase auth.users
create table profiles (
  id uuid references auth.users primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text not null check (role in ('customer', 'agent', 'admin')),
  department_id uuid references departments,
  preferences jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.departments (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  created_at timestamptz default now()
);
```

#### Tickets & Related
```sql
create type ticket_status as enum ('open', 'pending', 'resolved', 'closed');
create type ticket_priority as enum ('low', 'medium', 'high', 'urgent');

create table public.tickets (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  status ticket_status default 'open',
  priority ticket_priority default 'medium',
  customer_id uuid references profiles not null,
  assignee_id uuid references profiles,
  department_id uuid references departments,
  category_id uuid references categories,
  due_date timestamptz,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.ticket_messages (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid references tickets not null,
  sender_id uuid references profiles not null,
  content text not null,
  is_internal boolean default false,
  attachments jsonb default '[]',
  created_at timestamptz default now()
);

create table public.ticket_status_history (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid references tickets not null,
  status ticket_status not null,
  changed_by uuid references profiles not null,
  note text,
  created_at timestamptz default now()
);

create table public.ticket_tags (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  description text,
  color text,
  created_at timestamptz default now()
);

create table public.ticket_tag_relations (
  ticket_id uuid references tickets not null,
  tag_id uuid references ticket_tags not null,
  primary key (ticket_id, tag_id)
);
```

### 2. Knowledge Base Tables
```sql
create table public.kb_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  parent_id uuid references kb_categories,
  created_at timestamptz default now()
);

create table public.kb_articles (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  category_id uuid references kb_categories,
  author_id uuid references profiles not null,
  status text not null check (status in ('draft', 'published', 'archived')),
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  published_at timestamptz
);

create table public.kb_article_versions (
  id uuid primary key default uuid_generate_v4(),
  article_id uuid references kb_articles not null,
  content text not null,
  changed_by uuid references profiles not null,
  created_at timestamptz default now()
);
```

### 3. Feedback System Tables
```sql
create table public.ticket_feedback (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid references tickets not null,
  customer_id uuid references profiles not null,
  rating integer check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

create table public.kb_article_feedback (
  id uuid primary key default uuid_generate_v4(),
  article_id uuid references kb_articles not null,
  user_id uuid references profiles not null,
  helpful boolean not null,
  comment text,
  created_at timestamptz default now()
);
```

### 4. Chat & Communication Tables
```sql
create table public.chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references profiles not null,
  agent_id uuid references profiles,
  status text not null check (status in ('waiting', 'active', 'ended')),
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  ended_at timestamptz
);

create table public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references chat_sessions not null,
  sender_id uuid references profiles not null,
  content text not null,
  attachments jsonb default '[]',
  created_at timestamptz default now()
);
```

### 5. Notification Tables
```sql
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles not null,
  type text not null,
  title text not null,
  content text,
  read boolean default false,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);
```

## RLS Policies

### Ticket Policies
```sql
-- Customers can view their own tickets
create policy "Customers can view own tickets"
  on tickets for select
  using (auth.uid() = customer_id);

-- Agents can view assigned tickets and department tickets
create policy "Agents can view relevant tickets"
  on tickets for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'agent'
      and (
        tickets.assignee_id = auth.uid()
        or tickets.department_id = profiles.department_id
      )
    )
  );

-- Admins can view all tickets
create policy "Admins can view all tickets"
  on tickets for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );
```

## Indexes
```sql
-- Tickets
create index tickets_customer_id_idx on tickets(customer_id);
create index tickets_assignee_id_idx on tickets(assignee_id);
create index tickets_status_idx on tickets(status);
create index tickets_created_at_idx on tickets(created_at);

-- Messages
create index ticket_messages_ticket_id_idx on ticket_messages(ticket_id);
create index ticket_messages_created_at_idx on ticket_messages(created_at);

-- Knowledge Base
create index kb_articles_category_id_idx on kb_articles(category_id);
create index kb_articles_status_idx on kb_articles(status);
```

## Functions & Triggers
```sql
-- Update ticket updated_at
create function update_ticket_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tickets_updated_at
  before update on tickets
  for each row
  execute function update_ticket_updated_at();

-- Create ticket status history
create function log_ticket_status_change()
returns trigger as $$
begin
  if (old.status is distinct from new.status) then
    insert into ticket_status_history (ticket_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end;
$$ language plpgsql;

create trigger log_ticket_status
  after update on tickets
  for each row
  execute function log_ticket_status_change();
```

## Success Metrics
- Zero data anomalies
- Query performance under 100ms for common operations
- Successful real-time updates
- All security policies working as intended

## Dependencies
- Supabase project setup
- UUID extension enabled
- PostGIS for future location features
- pg_trgm for search functionality

## Notes
- Consider partitioning for large tables
- Monitor query performance
- Regular backup strategy
- Consider data retention policies 