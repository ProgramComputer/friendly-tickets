

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


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






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

SET default_tablespace = '';

SET default_table_access_method = "heap";


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
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text" NOT NULL,
    "avatar_url" "text",
    "company" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


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
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "name" "text" NOT NULL,
    "role" "public"."team_member_role" NOT NULL,
    "avatar_url" "text",
    "department" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


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
    "sla_breach" boolean DEFAULT false
);


ALTER TABLE "public"."tickets" OWNER TO "postgres";


ALTER TABLE ONLY "public"."custom_field_definitions"
    ADD CONSTRAINT "custom_field_definitions_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."custom_field_definitions"
    ADD CONSTRAINT "custom_field_definitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."sla_policies"
    ADD CONSTRAINT "sla_policies_name_priority_key" UNIQUE ("name", "priority");



ALTER TABLE ONLY "public"."sla_policies"
    ADD CONSTRAINT "sla_policies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_user_id_key" UNIQUE ("user_id");



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



CREATE INDEX "customers_user_id_idx" ON "public"."customers" USING "btree" ("user_id");



CREATE INDEX "tags_name_idx" ON "public"."tags" USING "btree" ("name");



CREATE INDEX "team_members_role_idx" ON "public"."team_members" USING "btree" ("role");



CREATE INDEX "team_members_user_id_idx" ON "public"."team_members" USING "btree" ("user_id");



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



CREATE INDEX "tickets_sla_due_at_idx" ON "public"."tickets" USING "btree" ("sla_due_at");



CREATE INDEX "tickets_sla_policy_id_idx" ON "public"."tickets" USING "btree" ("sla_policy_id");



CREATE INDEX "tickets_status_idx" ON "public"."tickets" USING "btree" ("status");



CREATE OR REPLACE TRIGGER "update_customers_updated_at" BEFORE UPDATE ON "public"."customers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_team_members_updated_at" BEFORE UPDATE ON "public"."team_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tickets_updated_at" BEFORE UPDATE ON "public"."tickets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "validate_message_sender_trigger" BEFORE INSERT OR UPDATE ON "public"."ticket_messages" FOR EACH ROW EXECUTE FUNCTION "public"."validate_message_sender"();



CREATE OR REPLACE TRIGGER "validate_response_sender_trigger" BEFORE INSERT OR UPDATE ON "public"."ticket_responses" FOR EACH ROW EXECUTE FUNCTION "public"."validate_response_sender"();



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."ticket_custom_fields"
    ADD CONSTRAINT "ticket_custom_fields_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "public"."custom_field_definitions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_custom_fields"
    ADD CONSTRAINT "ticket_custom_fields_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_history"
    ADD CONSTRAINT "ticket_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."team_members"("user_id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."ticket_history"
    ADD CONSTRAINT "ticket_history_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_messages"
    ADD CONSTRAINT "ticket_messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id");



ALTER TABLE ONLY "public"."ticket_responses"
    ADD CONSTRAINT "ticket_responses_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."ticket_status_history"
    ADD CONSTRAINT "ticket_status_history_changed_by_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."team_members"("user_id");



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
    ADD CONSTRAINT "tickets_sla_policy_id_fkey" FOREIGN KEY ("sla_policy_id") REFERENCES "public"."sla_policies"("id");



CREATE POLICY "Admins can delete tags" ON "public"."tags" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."user_id" = "auth"."uid"()) AND ("team_members"."role" = 'admin'::"public"."team_member_role")))));



CREATE POLICY "Admins can delete templates" ON "public"."ticket_templates" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."user_id" = "auth"."uid"()) AND ("team_members"."role" = 'admin'::"public"."team_member_role")))));



CREATE POLICY "Admins can insert tags" ON "public"."tags" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."user_id" = "auth"."uid"()) AND ("team_members"."role" = 'admin'::"public"."team_member_role")))));



CREATE POLICY "Admins can insert templates" ON "public"."ticket_templates" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."user_id" = "auth"."uid"()) AND ("team_members"."role" = 'admin'::"public"."team_member_role")))));



CREATE POLICY "Admins can manage SLA policies" ON "public"."sla_policies" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."user_id" = "auth"."uid"()) AND ("team_members"."role" = 'admin'::"public"."team_member_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."user_id" = "auth"."uid"()) AND ("team_members"."role" = 'admin'::"public"."team_member_role")))));



CREATE POLICY "Admins can manage custom fields" ON "public"."custom_field_definitions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."user_id" = "auth"."uid"()) AND ("team_members"."role" = 'admin'::"public"."team_member_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."user_id" = "auth"."uid"()) AND ("team_members"."role" = 'admin'::"public"."team_member_role")))));



CREATE POLICY "Admins can update tags" ON "public"."tags" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."user_id" = "auth"."uid"()) AND ("team_members"."role" = 'admin'::"public"."team_member_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."user_id" = "auth"."uid"()) AND ("team_members"."role" = 'admin'::"public"."team_member_role")))));



CREATE POLICY "Admins can update templates" ON "public"."ticket_templates" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."user_id" = "auth"."uid"()) AND ("team_members"."role" = 'admin'::"public"."team_member_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE (("team_members"."user_id" = "auth"."uid"()) AND ("team_members"."role" = 'admin'::"public"."team_member_role")))));



CREATE POLICY "All users can view tags" ON "public"."tags" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Team members can manage watchers" ON "public"."ticket_watchers" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE ("team_members"."user_id" = "auth"."uid"())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE ("team_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "Team members can view templates" ON "public"."ticket_templates" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE ("team_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "Team members can view ticket history" ON "public"."ticket_history" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE ("team_members"."user_id" = "auth"."uid"()))));



CREATE POLICY "Users can create responses to their tickets" ON "public"."ticket_responses" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."tickets"
  WHERE (("tickets"."id" = "ticket_responses"."ticket_id") AND (("tickets"."customer_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."team_members"
          WHERE ("team_members"."user_id" = "auth"."uid"()))))))));



CREATE POLICY "Users can view custom fields of accessible tickets" ON "public"."ticket_custom_fields" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."tickets" "t"
  WHERE (("t"."id" = "ticket_custom_fields"."ticket_id") AND (("t"."customer_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."team_members"
          WHERE ("team_members"."user_id" = "auth"."uid"()))))))));



CREATE POLICY "Users can view responses to their tickets" ON "public"."ticket_responses" FOR SELECT TO "authenticated" USING ((((NOT "is_internal") AND (EXISTS ( SELECT 1
   FROM "public"."tickets"
  WHERE (("tickets"."id" = "ticket_responses"."ticket_id") AND ("tickets"."customer_id" = "auth"."uid"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."team_members"
  WHERE ("team_members"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view tags of accessible tickets" ON "public"."ticket_tags" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."tickets" "t"
  WHERE (("t"."id" = "ticket_tags"."ticket_id") AND (("t"."customer_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."team_members"
          WHERE ("team_members"."user_id" = "auth"."uid"()))))))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_message_sender"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_message_sender"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_message_sender"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_response_sender"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_response_sender"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_response_sender"() TO "service_role";


















GRANT ALL ON TABLE "public"."custom_field_definitions" TO "anon";
GRANT ALL ON TABLE "public"."custom_field_definitions" TO "authenticated";
GRANT ALL ON TABLE "public"."custom_field_definitions" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



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
