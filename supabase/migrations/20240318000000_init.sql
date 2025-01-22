-- Drop existing objects
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
DROP TRIGGER IF EXISTS update_team_members_updated_at ON team_members;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP POLICY IF EXISTS "Allow trigger to create customers" ON customers;
DROP POLICY IF EXISTS "Customers can view their own record" ON customers;
DROP POLICY IF EXISTS "Allow trigger to create team members" ON team_members;
DROP POLICY IF EXISTS "Team members can view their own record" ON team_members;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TABLE IF EXISTS ticket_history CASCADE;
DROP TRIGGER IF EXISTS track_ticket_changes ON tickets;
DROP FUNCTION IF EXISTS track_ticket_changes();

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'agent', 'customer');

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  department TEXT,
  position TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  company TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policies for team_members
CREATE POLICY "Team members can view their own record"
  ON team_members FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow trigger to create team members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for customers
CREATE POLICY "Customers can view their own record"
  ON customers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow trigger to create customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Create handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Log the function call
  RAISE NOTICE 'handle_new_user called for email: %', NEW.email;
  
  BEGIN
    IF NEW.email LIKE '%@admin.autocrm.com' THEN
      INSERT INTO public.team_members (user_id, role, email)
      VALUES (NEW.id, 'admin', NEW.email);
      RAISE NOTICE 'Created admin user in team_members';
    ELSIF NEW.email LIKE '%@agent.autocrm.com' THEN
      INSERT INTO public.team_members (user_id, role, email)
      VALUES (NEW.id, 'agent', NEW.email);
      RAISE NOTICE 'Created agent user in team_members';
    ELSE
      INSERT INTO public.customers (user_id, email)
      VALUES (NEW.id, NEW.email);
      RAISE NOTICE 'Created customer user';
    END IF;
    
    -- Verify the insert worked
    IF NEW.email LIKE '%@admin.autocrm.com' OR NEW.email LIKE '%@agent.autocrm.com' THEN
      SELECT COUNT(*) INTO v_count FROM public.team_members WHERE user_id = NEW.id;
    ELSE
      SELECT COUNT(*) INTO v_count FROM public.customers WHERE user_id = NEW.id;
    END IF;
    
    IF v_count = 0 THEN
      RAISE EXCEPTION 'Failed to create user record in the appropriate table';
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error in handle_new_user: %', SQLERRM;
      RAISE;
  END;
  
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- Create ticket status enum
CREATE TYPE ticket_status AS ENUM (
  'open',
  'in_progress',
  'pending',
  'resolved',
  'closed'
);

-- Create ticket priority enum
CREATE TYPE ticket_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Create ticket source enum
CREATE TYPE ticket_source AS ENUM (
  'web',
  'email',
  'phone',
  'chat'
);

-- Create tickets table
CREATE TABLE tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number SERIAL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  status ticket_status DEFAULT 'open',
  priority ticket_priority DEFAULT 'medium',
  source ticket_source DEFAULT 'web',
  category TEXT,
  
  -- Relations
  customer_id UUID NOT NULL REFERENCES auth.users(id),
  assignee_id UUID REFERENCES auth.users(id),
  department TEXT,
  
  -- Metadata
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_resolution CHECK (
    (status = 'resolved' AND resolved_at IS NOT NULL) OR
    (status != 'resolved' AND resolved_at IS NULL)
  )
);

-- Create ticket comments table
CREATE TABLE ticket_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ticket attachments table
CREATE TABLE ticket_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ticket history table
CREATE TABLE ticket_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) NOT NULL,
  changed_by UUID REFERENCES auth.users(id) NOT NULL,
  field_name TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX tickets_customer_id_idx ON tickets(customer_id);
CREATE INDEX tickets_assignee_id_idx ON tickets(assignee_id);
CREATE INDEX tickets_status_idx ON tickets(status);
CREATE INDEX tickets_created_at_idx ON tickets(created_at DESC);
CREATE INDEX ticket_comments_ticket_id_idx ON ticket_comments(ticket_id);
CREATE INDEX ticket_attachments_ticket_id_idx ON ticket_attachments(ticket_id);
CREATE INDEX ticket_history_ticket_id_idx ON ticket_history(ticket_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at triggers
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_comment_updated_at
  BEFORE UPDATE ON ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically track changes
CREATE OR REPLACE FUNCTION track_ticket_changes()
RETURNS TRIGGER AS $$
DECLARE
  field_name TEXT;
  old_value JSONB;
  new_value JSONB;
BEGIN
  -- Only track changes on update
  IF TG_OP = 'UPDATE' THEN
    -- Loop through each changed column
    FOR field_name IN 
      SELECT (json_each_text(row_to_json(NEW))).key 
      INTERSECT 
      SELECT (json_each_text(row_to_json(OLD))).key
    LOOP
      -- Get old and new values
      old_value := row_to_json(OLD)->>field_name;
      new_value := row_to_json(NEW)->>field_name;
      
      -- Only insert if values are different
      IF old_value IS DISTINCT FROM new_value THEN
        INSERT INTO ticket_history (
          ticket_id,
          changed_by,
          field_name,
          old_value,
          new_value
        ) VALUES (
          NEW.id,
          auth.uid(),
          field_name,
          old_value::jsonb,
          new_value::jsonb
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to track ticket changes
CREATE TRIGGER track_ticket_changes
  AFTER UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION track_ticket_changes();

-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Customers can view their own tickets"
  ON tickets FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Team members can view all tickets"
  ON tickets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Customers can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Team members can update tickets"
  ON tickets FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = auth.uid()
  ));

-- Create RLS policies for ticket history
CREATE POLICY "Team members can view ticket history"
  ON ticket_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Team members can create ticket history"
  ON ticket_history FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = auth.uid()
  )); 