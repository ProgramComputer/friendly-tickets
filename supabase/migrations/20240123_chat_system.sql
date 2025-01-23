-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Chat widget settings
create table public.chat_widget_settings (
  id uuid primary key default uuid_generate_v4(),
  theme_color text not null default '#0F172A',
  widget_position text not null default 'bottom-right',
  title text not null default 'Chat with us',
  tagline text not null default 'Ask us anything',
  avatar_url text,
  badge_enabled boolean not null default true,
  badge_message text not null default 'Chat with us',
  badge_background_color text not null default '#0F172A',
  badge_position text not null default 'right',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Chat sessions
create table public.chat_sessions (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references public.customers(id),
  agent_id uuid references public.team_members(id),
  status text not null default 'pending' check (status in ('pending', 'active', 'ended', 'transferred')),
  started_at timestamp with time zone not null default now(),
  ended_at timestamp with time zone,
  rating smallint check (rating between 1 and 5),
  feedback text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Chat messages
create table public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.chat_sessions(id),
  sender_type text not null check (sender_type in ('customer', 'agent', 'system')),
  sender_id uuid not null,
  content text not null,
  attachment_url text,
  attachment_type text,
  attachment_name text,
  is_internal boolean not null default false,
  read_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Chat quick responses
create table public.chat_quick_responses (
  id uuid primary key default uuid_generate_v4(),
  team_member_id uuid not null references public.team_members(id),
  title text not null,
  content text not null,
  shortcut text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Chat agent preferences
create table public.chat_agent_preferences (
  id uuid primary key default uuid_generate_v4(),
  team_member_id uuid not null references public.team_members(id) unique,
  max_concurrent_chats integer not null default 3,
  auto_accept_chats boolean not null default false,
  away_message text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Indexes
create index chat_sessions_customer_id_idx on public.chat_sessions(customer_id);
create index chat_sessions_agent_id_idx on public.chat_sessions(agent_id);
create index chat_messages_session_id_idx on public.chat_messages(session_id);
create index chat_messages_sender_id_idx on public.chat_messages(sender_id);
create index chat_quick_responses_team_member_id_idx on public.chat_quick_responses(team_member_id);

-- RLS Policies
alter table public.chat_widget_settings enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_quick_responses enable row level security;
alter table public.chat_agent_preferences enable row level security;

-- Widget settings policies (admin only)
create policy "Widget settings are viewable by all"
  on public.chat_widget_settings for select
  to authenticated
  using (true);

create policy "Widget settings are editable by admins only"
  on public.chat_widget_settings for all
  to authenticated
  using (
    exists (
      select 1 from public.team_members
      where user_id = auth.uid()
      and role = 'admin'
    )
  );

-- Chat sessions policies
create policy "Customers can view their own chat sessions"
  on public.chat_sessions for select
  to authenticated
  using (
    exists (
      select 1 from public.customers
      where user_id = auth.uid()
      and id = customer_id
    )
  );

create policy "Agents can view assigned chat sessions"
  on public.chat_sessions for select
  to authenticated
  using (
    exists (
      select 1 from public.team_members
      where user_id = auth.uid()
      and id = agent_id
    )
  );

-- Chat messages policies
create policy "Chat participants can view messages"
  on public.chat_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.chat_sessions s
      where s.id = session_id
      and (
        exists (
          select 1 from public.customers
          where user_id = auth.uid()
          and id = s.customer_id
        )
        or
        exists (
          select 1 from public.team_members
          where user_id = auth.uid()
          and id = s.agent_id
        )
      )
    )
  );

create policy "Chat participants can insert messages"
  on public.chat_messages for insert
  to authenticated
  with check (
    exists (
      select 1 from public.chat_sessions s
      where s.id = session_id
      and (
        exists (
          select 1 from public.customers
          where user_id = auth.uid()
          and id = s.customer_id
        )
        or
        exists (
          select 1 from public.team_members
          where user_id = auth.uid()
          and id = s.agent_id
        )
      )
    )
  );

-- Quick responses policies
create policy "Agents can manage their quick responses"
  on public.chat_quick_responses for all
  to authenticated
  using (
    exists (
      select 1 from public.team_members
      where user_id = auth.uid()
      and id = team_member_id
    )
  );

-- Agent preferences policies
create policy "Agents can manage their preferences"
  on public.chat_agent_preferences for all
  to authenticated
  using (
    exists (
      select 1 from public.team_members
      where user_id = auth.uid()
      and id = team_member_id
    )
  ); 