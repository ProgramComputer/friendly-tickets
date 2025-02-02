

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."agent_status_type" AS ENUM (
    'online',
    'away',
    'offline'
);


ALTER TYPE "public"."agent_status_type" OWNER TO "postgres";


CREATE TYPE "public"."command_status" AS ENUM (
    'pending',
    'executed',
    'rolled_back'
);


ALTER TYPE "public"."command_status" OWNER TO "postgres";


CREATE TYPE "public"."message_sender_type" AS ENUM (
    'team_member',
    'customer'
);


ALTER TYPE "public"."message_sender_type" OWNER TO "postgres";


CREATE TYPE "public"."team_member_role" AS ENUM (
    'admin',
    'agent'
);


ALTER TYPE "public"."team_member_role" OWNER TO "postgres";


CREATE TYPE "public"."ticket_command_params" AS (
	"ticket_id" "uuid",
	"new_status" "text",
	"new_priority" "text",
	"agent_id" "uuid"
);


ALTER TYPE "public"."ticket_command_params" OWNER TO "postgres";


CREATE TYPE "public"."ticket_command_type" AS ENUM (
    'update_status',
    'update_priority',
    'assign_ticket'
);


ALTER TYPE "public"."ticket_command_type" OWNER TO "postgres";


CREATE TYPE "public"."ticket_priority" AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE "public"."ticket_priority" OWNER TO "postgres";


CREATE TYPE "public"."ticket_status" AS ENUM (
    'open',
    'pending',
    'resolved',
    'closed'
);


ALTER TYPE "public"."ticket_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_ticket"("ticket_id" "uuid", "agent_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.tickets 
    SET assigned_to = agent_id,
        updated_at = CURRENT_TIMESTAMP 
    WHERE id = ticket_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Ticket assigned successfully',
        'ticket_id', ticket_id,
        'agent_id', agent_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'ticket_id', ticket_id,
        'agent_id', agent_id
    );
END;
$$;


ALTER FUNCTION "public"."assign_ticket"("ticket_id" "uuid", "agent_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."begin_command_transaction"("command_text" "text", "target_tables" "text"[], "target_ids" "text"[]) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
DECLARE
    transaction_id UUID;
    i INTEGER;
    current_user_id UUID;
BEGIN
    -- Get current user's ID from team_members or customers
    SELECT id INTO current_user_id
    FROM (
        SELECT id FROM team_members WHERE auth_user_id = auth.uid()
        UNION ALL
        SELECT id FROM customers WHERE auth_user_id = auth.uid()
        LIMIT 1
    ) AS user_lookup;

    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found in team_members or customers';
    END IF;

    -- Generate transaction ID
    transaction_id := gen_random_uuid();
    
    -- Store initial state for each target
    FOR i IN 1..array_length(target_tables, 1) LOOP
        -- Store the current state in command_data
        EXECUTE format(
            'INSERT INTO chat_messages (content, command_data, sender_id) 
             SELECT $1, jsonb_build_object(
                ''transaction_id'', $2,
                ''action'', ''begin_transaction'',
                ''target_table'', $3,
                ''target_id'', $4,
                ''previous_state'', row_to_json(t)::jsonb,
                ''status'', ''pending''
             ), $5
             FROM %I t WHERE id = $4',
            target_tables[i]
        ) USING command_text, transaction_id, target_tables[i], target_ids[i], current_user_id;
    END LOOP;
    
    RETURN transaction_id;
END;
$_$;


ALTER FUNCTION "public"."begin_command_transaction"("command_text" "text", "target_tables" "text"[], "target_ids" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_message_sender"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if sender is a team member
  IF NOT EXISTS (SELECT 1 FROM team_members WHERE auth_user_id = NEW.sender_id) THEN
    -- If not a team member, check if sender is a customer
    IF NOT EXISTS (SELECT 1 FROM customers WHERE auth_user_id = NEW.sender_id) THEN
      RAISE EXCEPTION 'Invalid sender_id: User must be either a team member or customer';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_message_sender"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_transaction_settings"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN jsonb_build_object(
    'isolation_level', current_setting('transaction_isolation'),
    'read_only', current_setting('transaction_read_only'),
    'in_transaction', EXISTS (
      SELECT 1 FROM pg_stat_activity 
      WHERE pid = pg_backend_pid() 
      AND state LIKE '%transaction%'
    ),
    'session_user', session_user,
    'current_user', current_user
  );
END;
$$;


ALTER FUNCTION "public"."check_transaction_settings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_user_is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members 
    WHERE auth_user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$;


ALTER FUNCTION "public"."check_user_is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_agent_load"("agent_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
  UPDATE public.agent_status
  SET current_load = GREATEST(0, current_load - 1)
  WHERE agent_id = $1;
END;
$_$;


ALTER FUNCTION "public"."decrement_agent_load"("agent_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_ticket_chat_sessions"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- Delete any chat sessions associated with the ticket being deleted
  delete from chat_sessions where ticket_id = old.id;
  return old;
end;
$$;


ALTER FUNCTION "public"."delete_ticket_chat_sessions"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."delete_ticket_chat_sessions"() IS 'Function to delete chat sessions when their associated ticket is deleted';



CREATE OR REPLACE FUNCTION "public"."drop_if_exists_without_exception"("type" "text", "name" "text", "cascade" boolean DEFAULT false) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF type = 'index' THEN
        EXECUTE format('DROP INDEX IF EXISTS %I %s', name, CASE WHEN cascade THEN 'CASCADE' ELSE '' END);
    ELSIF type = 'constraint' THEN
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I %s', 
            split_part(name, '.', 1), 
            split_part(name, '.', 2), 
            CASE WHEN cascade THEN 'CASCADE' ELSE '' END);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Do nothing, suppress the exception
END;
$$;


ALTER FUNCTION "public"."drop_if_exists_without_exception"("type" "text", "name" "text", "cascade" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."execute_sql_internal"("sql" "text", VARIADIC "params" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  execute sql using params;
end;
$$;


ALTER FUNCTION "public"."execute_sql_internal"("sql" "text", VARIADIC "params" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."execute_ticket_command"("command_type" "text", "params" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_ticket_id uuid;
  v_new_status text;
  v_new_priority text;
  v_agent_id uuid;
  v_command_history_id int;
  v_previous_state jsonb;
  v_result jsonb;
begin
  -- Extract parameters
  v_ticket_id := (params->>'ticket_id')::uuid;
  v_new_status := params->>'new_status';
  v_new_priority := params->>'new_priority';
  v_agent_id := (params->>'agent_id')::uuid;

  -- Store previous state before update
  select jsonb_build_object(
    'status', status,
    'priority', priority,
    'assignee_id', assignee_id
  )
  into v_previous_state
  from tickets
  where id = v_ticket_id;

  -- Execute the command based on type
  case command_type
    when 'update_status' then
      if v_new_status is not null then
        update tickets 
        set status = v_new_status::ticket_status
        where id = v_ticket_id;
      end if;

    when 'update_priority' then
      if v_new_priority is not null then
        update tickets 
        set priority = v_new_priority::ticket_priority
        where id = v_ticket_id;
      end if;

    when 'assign_ticket' then
      if v_agent_id is not null then
        update tickets 
        set assignee_id = v_agent_id
        where id = v_ticket_id;
      end if;

    else
      raise exception 'Invalid command type: %', command_type;
  end case;

  -- Record command in history
  insert into command_history (
    ticket_id,
    command_type,
    previous_state,
    new_state,
    executed_by
  ) values (
    v_ticket_id,
    command_type,
    v_previous_state,
    case command_type
      when 'update_status' then jsonb_build_object('status', v_new_status)
      when 'update_priority' then jsonb_build_object('priority', v_new_priority)
      when 'assign_ticket' then jsonb_build_object('assignee_id', v_agent_id)
    end,
    auth.uid()
  )
  returning id into v_command_history_id;

  -- Build success result
  v_result := jsonb_build_object(
    'success', true,
    'message', 'Command executed successfully',
    'ticket_id', v_ticket_id,
    'command_history_id', v_command_history_id
  );

  -- Add command-specific data
  case command_type
    when 'update_status' then
      v_result := v_result || jsonb_build_object('new_status', v_new_status);
    when 'update_priority' then
      v_result := v_result || jsonb_build_object('new_priority', v_new_priority);
    when 'assign_ticket' then
      v_result := v_result || jsonb_build_object('new_assignee', v_agent_id);
  end case;

  return v_result;

exception
  when others then
    return jsonb_build_object(
      'success', false,
      'message', 'Failed to execute command',
      'error', SQLERRM,
      'ticket_id', v_ticket_id
    );
end;
$$;


ALTER FUNCTION "public"."execute_ticket_command"("command_type" "text", "params" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_kb_article_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  -- Call edge function to generate embeddings
  perform net.http_post(
    url := (select value from public.config where key = 'SUPABASE_FUNCTIONS_URL') || '/generate-kb-embeddings',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select value from public.config where key = 'SUPABASE_SERVICE_ROLE_KEY')
    ),
    body := jsonb_build_object(
      'record', jsonb_build_object(
        'new', row_to_json(NEW)
      )
    )
  );
  return NEW;
end;
$$;


ALTER FUNCTION "public"."handle_kb_article_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_agent_load"("agent_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
  UPDATE public.agent_status
  SET current_load = current_load + 1
  WHERE agent_id = $1;
END;
$_$;


ALTER FUNCTION "public"."increment_agent_load"("agent_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_count" integer DEFAULT NULL::integer, "filter" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("id" "text", "content" "text", "metadata" "jsonb", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
#variable_conflict use_column
begin
  return query
  select
    kb_articles.id,
    kb_articles.content,
    jsonb_build_object(
      'title', kb_articles.title,
      'created_at', kb_articles.created_at,
      'updated_at', kb_articles.updated_at
    ) as metadata,
    1 - (kb_articles.content_embedding <=> query_embedding) as similarity
  from kb_articles
  where 
    case 
      when filter ? 'title' then kb_articles.title = filter->>'title'
      else true
    end
  order by kb_articles.content_embedding <=> query_embedding
  limit match_count;
end;
$$;


ALTER FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_kb_articles"("query_embedding" "public"."vector", "match_threshold" double precision DEFAULT 0.7, "match_count" integer DEFAULT 3) RETURNS TABLE("id" "text", "title" "text", "content" "text", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
begin
  return query
  select
    kb_articles.id,
    kb_articles.title,
    kb_articles.content,
    1 - (kb_articles.content_embedding <=> query_embedding) as similarity
  from kb_articles
  where 1 - (kb_articles.content_embedding <=> query_embedding) > match_threshold
  order by kb_articles.content_embedding <=> query_embedding
  limit match_count;
end;
$$;


ALTER FUNCTION "public"."match_kb_articles"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_tickets"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) RETURNS TABLE("id" "text", "title" "text", "description" "text", "status" "text", "priority" "text", "category" "text", "department" "text", "created_at" timestamp with time zone, "similarity" double precision)
    LANGUAGE "sql" STABLE
    AS $$
  SELECT
    id,
    title,
    description,
    status,
    priority,
    category,
    department,
    created_at,
    1 - (embedding <=> query_embedding) as similarity
  FROM public.tickets
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;


ALTER FUNCTION "public"."match_tickets"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."match_tickets"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) IS 'Searches for similar tickets using embeddings';



CREATE OR REPLACE FUNCTION "public"."revert_command"("command_id" bigint) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  cmd record;
  ticket record;
  result json;
begin
  -- Get the command to revert
  select * into cmd
  from command_history
  where id = command_id
  and reverted_at is null
  for update;

  if not found then
    return json_build_object(
      'success', false,
      'message', 'Command not found or already reverted'
    );
  end if;

  -- Get current ticket state
  select * into ticket
  from tickets
  where id = cmd.ticket_id
  for update;

  if not found then
    return json_build_object(
      'success', false,
      'message', 'Ticket not found'
    );
  end if;

  -- Update ticket with previous state
  update tickets
  set
    status = coalesce((cmd.previous_state->>'status')::ticket_status, status),
    priority = coalesce((cmd.previous_state->>'priority')::ticket_priority, priority),
    assignee_id = coalesce((cmd.previous_state->>'assigned_to')::uuid, assignee_id),
    updated_at = now()
  where id = cmd.ticket_id;

  -- Mark command as reverted
  update command_history
  set
    reverted_at = now(),
    reverted_by = auth.uid()
  where id = command_id;

  return json_build_object(
    'success', true,
    'message', 'Command reverted successfully',
    'ticket_id', cmd.ticket_id
  );
end;
$$;


ALTER FUNCTION "public"."revert_command"("command_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."truncate_tables"("table_names" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  table_name text;
BEGIN
  -- Disable triggers temporarily
  SET session_replication_role = 'replica';
  
  -- Truncate each table
  FOREACH table_name IN ARRAY table_names
  LOOP
    EXECUTE format('TRUNCATE TABLE %I CASCADE', table_name);
  END LOOP;
  
  -- Re-enable triggers
  SET session_replication_role = 'origin';
END;
$$;


ALTER FUNCTION "public"."truncate_tables"("table_names" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_article_feedback_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  if TG_OP = 'INSERT' then
    if NEW.is_helpful then
      update public.kb_articles
      set helpful_count = helpful_count + 1
      where id = NEW.article_id;
    else
      update public.kb_articles
      set not_helpful_count = not_helpful_count + 1
      where id = NEW.article_id;
    end if;
  end if;
  return NEW;
end;
$$;


ALTER FUNCTION "public"."update_article_feedback_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_ticket_priority"("ticket_id" "uuid", "new_priority" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.tickets 
    SET priority = new_priority,
        updated_at = CURRENT_TIMESTAMP 
    WHERE id = ticket_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Ticket priority updated successfully',
        'ticket_id', ticket_id,
        'new_priority', new_priority
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'ticket_id', ticket_id,
        'new_priority', new_priority
    );
END;
$$;


ALTER FUNCTION "public"."update_ticket_priority"("ticket_id" "uuid", "new_priority" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_ticket_status"("ticket_id" "uuid", "new_status" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.tickets 
    SET status = new_status,
        updated_at = CURRENT_TIMESTAMP 
    WHERE id = ticket_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Ticket status updated successfully',
        'ticket_id', ticket_id,
        'new_status', new_status
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'ticket_id', ticket_id,
        'new_status', new_status
    );
END;
$$;


ALTER FUNCTION "public"."update_ticket_status"("ticket_id" "uuid", "new_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_message_sender"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if new.sender_type = 'team_member' then
    if not exists (select 1 from team_members where user_id = new.sender_id) then
      raise exception 'Invalid team member sender';
    end if;
  elsif new.sender_type = 'customer' then
    if not exists (select 1 from customers where user_id = new.sender_id) then
      raise exception 'Invalid customer sender';
    end if;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."validate_message_sender"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_response_sender"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.sender_type = 'team_member' THEN
    IF NOT EXISTS (SELECT 1 FROM team_members WHERE user_id = NEW.sender_id) THEN
      RAISE EXCEPTION 'Invalid team member sender';
    END IF;
  ELSIF NEW.sender_type = 'customer' THEN
    IF NOT EXISTS (SELECT 1 FROM customers WHERE user_id = NEW.sender_id) THEN
      RAISE EXCEPTION 'Invalid customer sender';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_response_sender"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_sender_id"("sender_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_members WHERE id = sender_id
        UNION ALL
        SELECT 1 FROM customers WHERE id = sender_id
    );
END;
$$;


ALTER FUNCTION "public"."validate_sender_id"("sender_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."agent_status" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agent_id" "uuid" NOT NULL,
    "status" "public"."agent_status_type" DEFAULT 'offline'::"public"."agent_status_type" NOT NULL,
    "current_load" integer DEFAULT 0 NOT NULL,
    "max_chats" integer DEFAULT 3 NOT NULL,
    "last_seen" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."agent_status" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_agent_preferences" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "team_member_id" "uuid" NOT NULL,
    "max_concurrent_chats" integer DEFAULT 3 NOT NULL,
    "auto_accept_chats" boolean DEFAULT false NOT NULL,
    "away_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chat_agent_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "sender_type" "text" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "attachment_url" "text",
    "attachment_type" "text",
    "attachment_name" "text",
    "is_internal" boolean DEFAULT false NOT NULL,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chat_messages_sender_type_check" CHECK (("sender_type" = ANY (ARRAY['customer'::"text", 'agent'::"text", 'system'::"text"]))),
    CONSTRAINT "valid_sender_check" CHECK ("public"."validate_sender_id"("sender_id"))
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


COMMENT ON COLUMN "public"."chat_messages"."sender_id" IS 'References either team_members.id or customers.id. Validated by validate_sender_id function.';



CREATE TABLE IF NOT EXISTS "public"."chat_quick_responses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "team_member_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "shortcut" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "category" "text" DEFAULT 'general'::"text" NOT NULL,
    "is_shared" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."chat_quick_responses" OWNER TO "postgres";


COMMENT ON COLUMN "public"."chat_quick_responses"."is_shared" IS 'Indicates if this quick response is shared with all team members';



CREATE TABLE IF NOT EXISTS "public"."chat_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "agent_id" "uuid",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone,
    "rating" smallint,
    "feedback" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ticket_id" "uuid",
    CONSTRAINT "chat_sessions_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5))),
    CONSTRAINT "chat_sessions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'ended'::"text", 'transferred'::"text"])))
);


ALTER TABLE "public"."chat_sessions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."chat_sessions"."ticket_id" IS 'Reference to the ticket this chat session is associated with';



CREATE TABLE IF NOT EXISTS "public"."chat_widget_settings" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "theme_color" "text" DEFAULT '#0F172A'::"text" NOT NULL,
    "widget_position" "text" DEFAULT 'bottom-right'::"text" NOT NULL,
    "title" "text" DEFAULT 'Chat with us'::"text" NOT NULL,
    "tagline" "text" DEFAULT 'Ask us anything'::"text" NOT NULL,
    "avatar_url" "text",
    "badge_enabled" boolean DEFAULT true NOT NULL,
    "badge_message" "text" DEFAULT 'Chat with us'::"text" NOT NULL,
    "badge_background_color" "text" DEFAULT '#0F172A'::"text" NOT NULL,
    "badge_position" "text" DEFAULT 'right'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chat_widget_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."command_history" (
    "id" bigint NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "command_type" "text" NOT NULL,
    "previous_state" "jsonb" NOT NULL,
    "new_state" "jsonb" NOT NULL,
    "executed_by" "uuid" NOT NULL,
    "executed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reverted_at" timestamp with time zone,
    "reverted_by" "uuid"
);


ALTER TABLE "public"."command_history" OWNER TO "postgres";


ALTER TABLE "public"."command_history" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."command_history_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."config" (
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."config" OWNER TO "postgres";


COMMENT ON TABLE "public"."config" IS 'Configuration values for the application';



CREATE TABLE IF NOT EXISTS "public"."custom_field_definitions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "label" "text" NOT NULL,
    "field_type" "text" NOT NULL,
    "options" "jsonb" DEFAULT '[]'::"jsonb",
    "required" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "custom_field_definitions_field_type_check" CHECK (("field_type" = ANY (ARRAY['text'::"text", 'number'::"text", 'date'::"text", 'select'::"text", 'multiselect'::"text", 'checkbox'::"text"])))
);


ALTER TABLE "public"."custom_field_definitions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" "text" NOT NULL,
    "name" "text" NOT NULL,
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "auth_user_id" "uuid"
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


COMMENT ON TABLE "public"."customers" IS 'Customers who can create tickets and chat with support. Each record represents a customer with their own internal ID while linking to their auth account.';



COMMENT ON COLUMN "public"."customers"."id" IS 'Primary key for application use - internal customer identity';



COMMENT ON COLUMN "public"."customers"."auth_user_id" IS 'Reference to Supabase auth.users(id) - the user''s authentication identity';



CREATE TABLE IF NOT EXISTS "public"."departments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."departments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kb_article_feedback" (
    "id" bigint NOT NULL,
    "article_id" "text" NOT NULL,
    "user_id" "uuid",
    "is_helpful" boolean NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."kb_article_feedback" OWNER TO "postgres";


COMMENT ON TABLE "public"."kb_article_feedback" IS 'User feedback on knowledge base articles';



ALTER TABLE "public"."kb_article_feedback" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."kb_article_feedback_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."kb_articles" (
    "id" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "excerpt" "text",
    "category_id" "text" NOT NULL,
    "read_time_minutes" integer DEFAULT 5 NOT NULL,
    "helpful_count" integer DEFAULT 0 NOT NULL,
    "not_helpful_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "content_embedding" "public"."vector"(1536)
);


ALTER TABLE "public"."kb_articles" OWNER TO "postgres";


COMMENT ON TABLE "public"."kb_articles" IS 'Knowledge base articles';



CREATE TABLE IF NOT EXISTS "public"."kb_categories" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."kb_categories" OWNER TO "postgres";


COMMENT ON TABLE "public"."kb_categories" IS 'Knowledge base article categories';



CREATE TABLE IF NOT EXISTS "public"."sla_policies" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "response_time_hours" integer NOT NULL,
    "resolution_time_hours" integer NOT NULL,
    "priority" "public"."ticket_priority" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."sla_policies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "color" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" "text" NOT NULL,
    "name" "text" NOT NULL,
    "role" "public"."team_member_role" NOT NULL,
    "avatar_url" "text",
    "department" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "department_id" "uuid",
    "auth_user_id" "uuid"
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


COMMENT ON TABLE "public"."team_members" IS 'Team members (agents/admins) with their roles and departments. Each record represents a staff member with their own internal ID while linking to their auth account.';



COMMENT ON COLUMN "public"."team_members"."id" IS 'Primary key for application use - internal team member identity';



COMMENT ON COLUMN "public"."team_members"."auth_user_id" IS 'Reference to Supabase auth.users(id) - the user''s authentication identity';



CREATE TABLE IF NOT EXISTS "public"."ticket_custom_fields" (
    "ticket_id" "uuid" NOT NULL,
    "field_id" "uuid" NOT NULL,
    "value" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ticket_custom_fields" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "changed_by" "uuid" NOT NULL,
    "field_name" "text" NOT NULL,
    "old_value" "text",
    "new_value" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ticket_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "sender_type" "public"."message_sender_type" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "is_internal" boolean DEFAULT false,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ticket_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_responses" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "sender_type" "public"."message_sender_type" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "is_internal" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."ticket_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_status_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "ticket_id" "uuid" NOT NULL,
    "status" "public"."ticket_status" NOT NULL,
    "changed_by" "uuid" NOT NULL,
    "note" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ticket_status_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_tags" (
    "ticket_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."ticket_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "default_title" "text",
    "default_description" "text",
    "default_priority" "public"."ticket_priority",
    "default_department" "text",
    "custom_fields" "jsonb" DEFAULT '[]'::"jsonb",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."ticket_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_watchers" (
    "ticket_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "watcher_type" "text" NOT NULL,
    "added_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "ticket_watchers_watcher_type_check" CHECK (("watcher_type" = ANY (ARRAY['cc'::"text", 'bcc'::"text"])))
);


ALTER TABLE "public"."ticket_watchers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tickets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "status" "public"."ticket_status" DEFAULT 'open'::"public"."ticket_status",
    "priority" "public"."ticket_priority" DEFAULT 'medium'::"public"."ticket_priority",
    "customer_id" "uuid" NOT NULL,
    "assignee_id" "uuid",
    "department" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "sla_policy_id" "uuid",
    "sla_due_at" timestamp with time zone,
    "first_response_at" timestamp with time zone,
    "category" "text" DEFAULT 'support'::"text",
    "tags" "text"[] DEFAULT ARRAY[]::"text"[],
    "sla_breach" boolean DEFAULT false,
    "department_id" "uuid",
    "embedding" "public"."vector"(1536)
);


ALTER TABLE "public"."tickets" OWNER TO "postgres";


ALTER TABLE ONLY "public"."agent_status"
    ADD CONSTRAINT "agent_status_agent_id_key" UNIQUE ("agent_id");



ALTER TABLE ONLY "public"."agent_status"
    ADD CONSTRAINT "agent_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_agent_preferences"
    ADD CONSTRAINT "chat_agent_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_agent_preferences"
    ADD CONSTRAINT "chat_agent_preferences_team_member_id_key" UNIQUE ("team_member_id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_quick_responses"
    ADD CONSTRAINT "chat_quick_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_sessions"
    ADD CONSTRAINT "chat_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_widget_settings"
    ADD CONSTRAINT "chat_widget_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."command_history"
    ADD CONSTRAINT "command_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."config"
    ADD CONSTRAINT "config_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."custom_field_definitions"
    ADD CONSTRAINT "custom_field_definitions_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."custom_field_definitions"
    ADD CONSTRAINT "custom_field_definitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."departments"
    ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kb_article_feedback"
    ADD CONSTRAINT "kb_article_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kb_articles"
    ADD CONSTRAINT "kb_articles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kb_categories"
    ADD CONSTRAINT "kb_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sla_policies"
    ADD CONSTRAINT "sla_policies_name_priority_key" UNIQUE ("name", "priority");



ALTER TABLE ONLY "public"."sla_policies"
    ADD CONSTRAINT "sla_policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_auth_user_id_key" UNIQUE ("auth_user_id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_custom_fields"
    ADD CONSTRAINT "ticket_custom_fields_pkey" PRIMARY KEY ("ticket_id", "field_id");



ALTER TABLE ONLY "public"."ticket_history"
    ADD CONSTRAINT "ticket_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_history"
    ADD CONSTRAINT "ticket_history_ticket_id_idx" UNIQUE ("ticket_id", "created_at");



ALTER TABLE ONLY "public"."ticket_messages"
    ADD CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_messages"
    ADD CONSTRAINT "ticket_messages_ticket_id_sender_id_content_key" UNIQUE ("ticket_id", "sender_id", "content");



ALTER TABLE ONLY "public"."ticket_responses"
    ADD CONSTRAINT "ticket_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_responses"
    ADD CONSTRAINT "ticket_responses_ticket_id_idx" UNIQUE ("ticket_id", "created_at");



ALTER TABLE ONLY "public"."ticket_status_history"
    ADD CONSTRAINT "ticket_status_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_tags"
    ADD CONSTRAINT "ticket_tags_pkey" PRIMARY KEY ("ticket_id", "tag_id");



ALTER TABLE ONLY "public"."ticket_templates"
    ADD CONSTRAINT "ticket_templates_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."ticket_templates"
    ADD CONSTRAINT "ticket_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_watchers"
    ADD CONSTRAINT "ticket_watchers_pkey" PRIMARY KEY ("ticket_id", "email");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_title_customer_id_key" UNIQUE ("title", "customer_id");



CREATE INDEX "chat_messages_sender_id_idx" ON "public"."chat_messages" USING "btree" ("sender_id");



CREATE INDEX "chat_messages_session_id_idx" ON "public"."chat_messages" USING "btree" ("session_id");



CREATE INDEX "chat_quick_responses_shortcut_idx" ON "public"."chat_quick_responses" USING "btree" ("shortcut");



CREATE INDEX "chat_quick_responses_team_member_id_idx" ON "public"."chat_quick_responses" USING "btree" ("team_member_id");



CREATE INDEX "chat_sessions_agent_id_idx" ON "public"."chat_sessions" USING "btree" ("agent_id");



CREATE INDEX "chat_sessions_customer_id_idx" ON "public"."chat_sessions" USING "btree" ("customer_id");



CREATE INDEX "chat_sessions_ticket_id_idx" ON "public"."chat_sessions" USING "btree" ("ticket_id");



CREATE INDEX "customers_auth_user_id_idx" ON "public"."customers" USING "btree" ("auth_user_id");



CREATE INDEX "idx_chat_messages_sender_id" ON "public"."chat_messages" USING "btree" ("sender_id");



CREATE INDEX "idx_command_history_executed_at" ON "public"."command_history" USING "btree" ("executed_at" DESC);



CREATE INDEX "idx_command_history_executed_by" ON "public"."command_history" USING "btree" ("executed_by");



CREATE INDEX "idx_command_history_ticket" ON "public"."command_history" USING "btree" ("ticket_id");



CREATE INDEX "idx_customers_id" ON "public"."customers" USING "btree" ("id");



CREATE INDEX "idx_team_members_department_id" ON "public"."team_members" USING "btree" ("department_id");



CREATE INDEX "idx_team_members_id" ON "public"."team_members" USING "btree" ("id");



CREATE INDEX "idx_tickets_department_id" ON "public"."tickets" USING "btree" ("department_id");



CREATE INDEX "kb_articles_content_embedding_idx" ON "public"."kb_articles" USING "ivfflat" ("content_embedding" "public"."vector_cosine_ops") WITH ("lists"='100');



CREATE INDEX "tags_name_idx" ON "public"."tags" USING "btree" ("name");



CREATE INDEX "team_members_auth_user_id_idx" ON "public"."team_members" USING "btree" ("auth_user_id");



CREATE INDEX "team_members_role_idx" ON "public"."team_members" USING "btree" ("role");



CREATE INDEX "ticket_custom_fields_field_id_idx" ON "public"."ticket_custom_fields" USING "btree" ("field_id");



CREATE INDEX "ticket_history_changed_by_idx" ON "public"."ticket_history" USING "btree" ("changed_by");



CREATE INDEX "ticket_messages_sender_id_idx" ON "public"."ticket_messages" USING "btree" ("sender_id");



CREATE INDEX "ticket_messages_ticket_id_idx" ON "public"."ticket_messages" USING "btree" ("ticket_id");



CREATE INDEX "ticket_responses_sender_id_idx" ON "public"."ticket_responses" USING "btree" ("sender_id");



CREATE INDEX "ticket_status_history_ticket_id_idx" ON "public"."ticket_status_history" USING "btree" ("ticket_id");



CREATE INDEX "ticket_watchers_email_idx" ON "public"."ticket_watchers" USING "btree" ("email");



CREATE INDEX "tickets_assignee_id_idx" ON "public"."tickets" USING "btree" ("assignee_id");



CREATE INDEX "tickets_created_at_idx" ON "public"."tickets" USING "btree" ("created_at");



CREATE INDEX "tickets_customer_id_idx" ON "public"."tickets" USING "btree" ("customer_id");



CREATE INDEX "tickets_embedding_idx" ON "public"."tickets" USING "ivfflat" ("embedding" "public"."vector_cosine_ops") WITH ("lists"='100');



CREATE INDEX "tickets_sla_due_at_idx" ON "public"."tickets" USING "btree" ("sla_due_at");



CREATE INDEX "tickets_sla_policy_id_idx" ON "public"."tickets" USING "btree" ("sla_policy_id");



CREATE INDEX "tickets_status_idx" ON "public"."tickets" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "Create KB Embedding" AFTER INSERT OR UPDATE ON "public"."kb_articles" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://paluzqdyjmgkiycpziiw.supabase.co/functions/v1/generate-kb-embeddings', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhbHV6cWR5am1na2l5Y3B6aWl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzQ4ODM3NCwiZXhwIjoyMDUzMDY0Mzc0fQ.CJFDQVNP2C2UFa2yl-JtIGpD9Xd4RyqR7_ZucuOqQik"}', '{}', '5000');



CREATE OR REPLACE TRIGGER "Create Ticket Embedding" AFTER INSERT OR UPDATE ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://paluzqdyjmgkiycpziiw.supabase.co/functions/v1/generate-ticket-embeddings', 'POST', '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhbHV6cWR5am1na2l5Y3B6aWl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzQ4ODM3NCwiZXhwIjoyMDUzMDY0Mzc0fQ.CJFDQVNP2C2UFa2yl-JtIGpD9Xd4RyqR7_ZucuOqQik"}', '{}', '5000');



CREATE OR REPLACE TRIGGER "delete_ticket_chat_sessions_trigger" BEFORE DELETE ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."delete_ticket_chat_sessions"();



COMMENT ON TRIGGER "delete_ticket_chat_sessions_trigger" ON "public"."tickets" IS 'Automatically deletes associated chat sessions when a ticket is deleted';



CREATE OR REPLACE TRIGGER "handle_quick_responses_updated_at" BEFORE UPDATE ON "public"."chat_quick_responses" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "kb_article_ai_trigger" AFTER INSERT OR UPDATE OF "title", "content" ON "public"."kb_articles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_kb_article_change"();



CREATE OR REPLACE TRIGGER "update_agent_status_updated_at" BEFORE UPDATE ON "public"."agent_status" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_article_feedback_counts_after_insert" AFTER INSERT ON "public"."kb_article_feedback" FOR EACH ROW EXECUTE FUNCTION "public"."update_article_feedback_counts"();



CREATE OR REPLACE TRIGGER "update_customers_updated_at" BEFORE UPDATE ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_departments_updated_at" BEFORE UPDATE ON "public"."departments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_team_members_updated_at" BEFORE UPDATE ON "public"."team_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tickets_updated_at" BEFORE UPDATE ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "validate_message_sender_trigger" BEFORE INSERT OR UPDATE ON "public"."ticket_messages" FOR EACH ROW EXECUTE FUNCTION "public"."validate_message_sender"();



CREATE OR REPLACE TRIGGER "validate_response_sender_trigger" BEFORE INSERT OR UPDATE ON "public"."ticket_responses" FOR EACH ROW EXECUTE FUNCTION "public"."validate_response_sender"();



ALTER TABLE ONLY "public"."chat_agent_preferences"
    ADD CONSTRAINT "chat_agent_preferences_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."chat_sessions"("id") ON DELETE CASCADE;



COMMENT ON CONSTRAINT "chat_messages_session_id_fkey" ON "public"."chat_messages" IS 'Automatically deletes chat messages when their associated chat session is deleted';



ALTER TABLE ONLY "public"."chat_quick_responses"
    ADD CONSTRAINT "chat_quick_responses_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_sessions"
    ADD CONSTRAINT "chat_sessions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."team_members"("id");



ALTER TABLE ONLY "public"."chat_sessions"
    ADD CONSTRAINT "chat_sessions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."chat_sessions"
    ADD CONSTRAINT "chat_sessions_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id");



ALTER TABLE ONLY "public"."command_history"
    ADD CONSTRAINT "command_history_executed_by_fkey" FOREIGN KEY ("executed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."command_history"
    ADD CONSTRAINT "command_history_reverted_by_fkey" FOREIGN KEY ("reverted_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."command_history"
    ADD CONSTRAINT "command_history_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."kb_article_feedback"
    ADD CONSTRAINT "kb_article_feedback_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "public"."kb_articles"("id");



ALTER TABLE ONLY "public"."kb_article_feedback"
    ADD CONSTRAINT "kb_article_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."kb_articles"
    ADD CONSTRAINT "kb_articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."kb_categories"("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id");



ALTER TABLE ONLY "public"."ticket_custom_fields"
    ADD CONSTRAINT "ticket_custom_fields_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "public"."custom_field_definitions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_custom_fields"
    ADD CONSTRAINT "ticket_custom_fields_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_history"
    ADD CONSTRAINT "ticket_history_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_messages"
    ADD CONSTRAINT "ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id");



ALTER TABLE ONLY "public"."ticket_responses"
    ADD CONSTRAINT "ticket_responses_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."team_members"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_responses"
    ADD CONSTRAINT "ticket_responses_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_status_history"
    ADD CONSTRAINT "ticket_status_history_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id");



ALTER TABLE ONLY "public"."ticket_tags"
    ADD CONSTRAINT "ticket_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_tags"
    ADD CONSTRAINT "ticket_tags_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_templates"
    ADD CONSTRAINT "ticket_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."team_members"("id");



ALTER TABLE ONLY "public"."ticket_watchers"
    ADD CONSTRAINT "ticket_watchers_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ticket_watchers"
    ADD CONSTRAINT "ticket_watchers_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "public"."team_members"("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_sla_policy_id_fkey" FOREIGN KEY ("sla_policy_id") REFERENCES "public"."sla_policies"("id");



CREATE POLICY "Admins have full access to command history" ON "public"."command_history" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."auth_user_id" = "auth"."uid"()) AND ("team_members"."role" = 'admin'::"public"."team_member_role")))));



CREATE POLICY "Agents can revert commands for their tickets" ON "public"."command_history" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."auth_user_id" = "auth"."uid"()) AND ("team_members"."role" = 'agent'::"public"."team_member_role") AND (EXISTS ( SELECT 1
           FROM "public"."tickets"
          WHERE (("tickets"."id" = "command_history"."ticket_id") AND (("tickets"."assignee_id" = "team_members"."id") OR ("tickets"."department_id" = "team_members"."department_id"))))))))) WITH CHECK (("reverted_at" IS NULL));



CREATE POLICY "Agents can see command history for their tickets" ON "public"."command_history" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."auth_user_id" = "auth"."uid"()) AND ("team_members"."role" = 'agent'::"public"."team_member_role") AND (EXISTS ( SELECT 1
           FROM "public"."tickets"
          WHERE (("tickets"."id" = "command_history"."ticket_id") AND (("tickets"."assignee_id" = "team_members"."id") OR ("tickets"."department_id" = "team_members"."department_id")))))))));



CREATE POLICY "Customers can see command history for their tickets" ON "public"."command_history" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."tickets" "t"
  WHERE (("t"."id" = "command_history"."ticket_id") AND ("t"."customer_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete their own quick responses" ON "public"."chat_quick_responses" FOR DELETE USING (("auth"."uid"() IN ( SELECT "team_members"."auth_user_id"
   FROM "public"."team_members"
  WHERE ("team_members"."id" = "chat_quick_responses"."team_member_id"))));



CREATE POLICY "Users can insert their own quick responses" ON "public"."chat_quick_responses" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "team_members"."auth_user_id"
   FROM "public"."team_members"
  WHERE ("team_members"."id" = "chat_quick_responses"."team_member_id"))));



CREATE POLICY "Users can update their own quick responses" ON "public"."chat_quick_responses" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "team_members"."auth_user_id"
   FROM "public"."team_members"
  WHERE ("team_members"."id" = "chat_quick_responses"."team_member_id")))) WITH CHECK (("auth"."uid"() IN ( SELECT "team_members"."auth_user_id"
   FROM "public"."team_members"
  WHERE ("team_members"."id" = "chat_quick_responses"."team_member_id"))));



CREATE POLICY "Users can view their own command data" ON "public"."chat_messages" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."team_members" "tm"
  WHERE (("tm"."id" = "chat_messages"."sender_id") AND ("tm"."auth_user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."customers" "c"
  WHERE (("c"."id" = "chat_messages"."sender_id") AND ("c"."auth_user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."team_members" "tm"
  WHERE (("tm"."auth_user_id" = "auth"."uid"()) AND ("tm"."role" = ANY (ARRAY['agent'::"public"."team_member_role", 'admin'::"public"."team_member_role"])))))));



CREATE POLICY "Users can view their own quick responses" ON "public"."chat_quick_responses" FOR SELECT USING ((("auth"."uid"() IN ( SELECT "team_members"."auth_user_id"
   FROM "public"."team_members"
  WHERE ("team_members"."id" = "chat_quick_responses"."team_member_id"))) OR ("is_shared" = true)));



CREATE POLICY "agents_can_create_responses" ON "public"."ticket_responses" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."team_members" "tm"
     JOIN "public"."tickets" "t" ON (("t"."id" = "ticket_responses"."ticket_id")))
  WHERE (("tm"."id" = "auth"."uid"()) AND (("t"."assignee_id" = "tm"."id") OR ("t"."department_id" = "tm"."department_id"))))));



CREATE POLICY "agents_can_view_responses" ON "public"."ticket_responses" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."team_members" "tm"
     JOIN "public"."tickets" "t" ON (("t"."id" = "ticket_responses"."ticket_id")))
  WHERE (("tm"."id" = "auth"."uid"()) AND (("t"."assignee_id" = "tm"."id") OR ("t"."department_id" = "tm"."department_id"))))));



ALTER TABLE "public"."command_history" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_ticket"("ticket_id" "uuid", "agent_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."assign_ticket"("ticket_id" "uuid", "agent_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_ticket"("ticket_id" "uuid", "agent_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."begin_command_transaction"("command_text" "text", "target_tables" "text"[], "target_ids" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."begin_command_transaction"("command_text" "text", "target_tables" "text"[], "target_ids" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."begin_command_transaction"("command_text" "text", "target_tables" "text"[], "target_ids" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_message_sender"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_message_sender"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_message_sender"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_transaction_settings"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_transaction_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_transaction_settings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_user_is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_user_is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_user_is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_agent_load"("agent_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_agent_load"("agent_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_agent_load"("agent_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_ticket_chat_sessions"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_ticket_chat_sessions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_ticket_chat_sessions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."drop_if_exists_without_exception"("type" "text", "name" "text", "cascade" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."drop_if_exists_without_exception"("type" "text", "name" "text", "cascade" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."drop_if_exists_without_exception"("type" "text", "name" "text", "cascade" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."execute_sql_internal"("sql" "text", VARIADIC "params" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."execute_sql_internal"("sql" "text", VARIADIC "params" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."execute_sql_internal"("sql" "text", VARIADIC "params" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."execute_ticket_command"("command_type" "text", "params" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."execute_ticket_command"("command_type" "text", "params" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."execute_ticket_command"("command_type" "text", "params" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_kb_article_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_kb_article_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_kb_article_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_agent_load"("agent_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_agent_load"("agent_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_agent_load"("agent_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_documents"("query_embedding" "public"."vector", "match_count" integer, "filter" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."match_kb_articles"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."match_kb_articles"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_kb_articles"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."match_tickets"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."match_tickets"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."match_tickets"("query_embedding" "public"."vector", "match_threshold" double precision, "match_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."revert_command"("command_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."revert_command"("command_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."revert_command"("command_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."truncate_tables"("table_names" "text"[]) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."truncate_tables"("table_names" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."truncate_tables"("table_names" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."truncate_tables"("table_names" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_article_feedback_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_article_feedback_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_article_feedback_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_ticket_priority"("ticket_id" "uuid", "new_priority" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_ticket_priority"("ticket_id" "uuid", "new_priority" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_ticket_priority"("ticket_id" "uuid", "new_priority" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_ticket_status"("ticket_id" "uuid", "new_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_ticket_status"("ticket_id" "uuid", "new_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_ticket_status"("ticket_id" "uuid", "new_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_message_sender"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_message_sender"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_message_sender"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_response_sender"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_response_sender"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_response_sender"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_sender_id"("sender_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_sender_id"("sender_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_sender_id"("sender_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."agent_status" TO "anon";
GRANT ALL ON TABLE "public"."agent_status" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_status" TO "service_role";



GRANT ALL ON TABLE "public"."chat_agent_preferences" TO "anon";
GRANT ALL ON TABLE "public"."chat_agent_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_agent_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."chat_quick_responses" TO "anon";
GRANT ALL ON TABLE "public"."chat_quick_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_quick_responses" TO "service_role";



GRANT ALL ON TABLE "public"."chat_sessions" TO "anon";
GRANT ALL ON TABLE "public"."chat_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."chat_widget_settings" TO "anon";
GRANT ALL ON TABLE "public"."chat_widget_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_widget_settings" TO "service_role";



GRANT ALL ON TABLE "public"."command_history" TO "anon";
GRANT ALL ON TABLE "public"."command_history" TO "authenticated";
GRANT ALL ON TABLE "public"."command_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."command_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."command_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."command_history_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."config" TO "anon";
GRANT ALL ON TABLE "public"."config" TO "authenticated";
GRANT ALL ON TABLE "public"."config" TO "service_role";



GRANT ALL ON TABLE "public"."custom_field_definitions" TO "anon";
GRANT ALL ON TABLE "public"."custom_field_definitions" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_field_definitions" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON TABLE "public"."departments" TO "anon";
GRANT ALL ON TABLE "public"."departments" TO "authenticated";
GRANT ALL ON TABLE "public"."departments" TO "service_role";



GRANT ALL ON TABLE "public"."kb_article_feedback" TO "anon";
GRANT ALL ON TABLE "public"."kb_article_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."kb_article_feedback" TO "service_role";



GRANT ALL ON SEQUENCE "public"."kb_article_feedback_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."kb_article_feedback_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."kb_article_feedback_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."kb_articles" TO "anon";
GRANT ALL ON TABLE "public"."kb_articles" TO "authenticated";
GRANT ALL ON TABLE "public"."kb_articles" TO "service_role";



GRANT ALL ON TABLE "public"."kb_categories" TO "anon";
GRANT ALL ON TABLE "public"."kb_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."kb_categories" TO "service_role";



GRANT ALL ON TABLE "public"."sla_policies" TO "anon";
GRANT ALL ON TABLE "public"."sla_policies" TO "authenticated";
GRANT ALL ON TABLE "public"."sla_policies" TO "service_role";



GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";



GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_custom_fields" TO "anon";
GRANT ALL ON TABLE "public"."ticket_custom_fields" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_custom_fields" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_history" TO "anon";
GRANT ALL ON TABLE "public"."ticket_history" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_history" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_messages" TO "anon";
GRANT ALL ON TABLE "public"."ticket_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_messages" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_responses" TO "anon";
GRANT ALL ON TABLE "public"."ticket_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_responses" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_status_history" TO "anon";
GRANT ALL ON TABLE "public"."ticket_status_history" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_status_history" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_tags" TO "anon";
GRANT ALL ON TABLE "public"."ticket_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_tags" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_templates" TO "anon";
GRANT ALL ON TABLE "public"."ticket_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_templates" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_watchers" TO "anon";
GRANT ALL ON TABLE "public"."ticket_watchers" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_watchers" TO "service_role";



GRANT ALL ON TABLE "public"."tickets" TO "anon";
GRANT ALL ON TABLE "public"."tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."tickets" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






RESET ALL;
