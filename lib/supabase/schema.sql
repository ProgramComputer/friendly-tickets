-- Create enum for user roles
create type user_role as enum ('admin', 'employee', 'customer');

-- Create team_members table
create table team_members (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) not null unique,
  role user_role not null,
  name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create trigger for updated_at
create trigger team_members_updated_at
  before update on team_members
  for each row
  execute function update_updated_at();

-- Enable RLS
alter table team_members enable row level security;

-- Policies
create policy "Users can view their own team member record"
  on team_members for select
  to authenticated
  using (auth.uid() = user_id);

-- Function to handle new user registration
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into team_members (user_id, role, email)
  values (new.id, 'customer', new.email);
  return new;
end;
$$;

-- Trigger for new user registration
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user(); 