-- Create enum for user roles
create type user_role as enum ('admin', 'agent', 'customer');

-- Create team_members table for employees and admins
create table team_members (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null unique,
  role user_role not null check (role in ('admin', 'agent')),
  name text,
  email text,
  department text,
  position text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create customers table
create table customers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null unique,
  name text,
  email text,
  company text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create trigger for updated_at
create function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger team_members_updated_at
  before update on team_members
  for each row
  execute function update_updated_at();

create trigger customers_updated_at
  before update on customers
  for each row
  execute function update_updated_at();

-- Enable RLS
alter table team_members enable row level security;
alter table customers enable row level security;

-- Policies for team_members
create policy "Team members can view their own record"
  on team_members for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can view all team members"
  on team_members for select
  to authenticated
  using (
    auth.uid() in (
      select user_id from team_members where role = 'admin'
    )
  );

-- Policies for customers
create policy "Customers can view their own record"
  on customers for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Team members can view all customers"
  on customers for select
  to authenticated
  using (
    auth.uid() in (
      select user_id from team_members
    )
  );

-- Function to handle new user registration
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Check if the email is for an admin (you can modify these patterns)
  if new.email like '%@admin.autocrm.com' then
    insert into team_members (user_id, role, email)
    values (new.id, 'admin', new.email);
  -- Check if the email is for an agent
  elsif new.email like '%@agent.autocrm.com' then
    insert into team_members (user_id, role, email)
    values (new.id, 'agent', new.email);
  -- All other users are customers
  else
    insert into customers (user_id, email)
    values (new.id, new.email);
  end if;
  return new;
end;
$$;

-- Trigger for new user registration
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user(); 