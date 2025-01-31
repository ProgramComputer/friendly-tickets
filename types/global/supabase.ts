export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agent_status: {
        Row: {
          agent_id: string
          created_at: string | null
          current_load: number
          id: string
          last_seen: string | null
          max_chats: number
          status: Database["public"]["Enums"]["agent_status_type"]
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          current_load?: number
          id?: string
          last_seen?: string | null
          max_chats?: number
          status?: Database["public"]["Enums"]["agent_status_type"]
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          current_load?: number
          id?: string
          last_seen?: string | null
          max_chats?: number
          status?: Database["public"]["Enums"]["agent_status_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_agent_preferences: {
        Row: {
          auto_accept_chats: boolean
          away_message: string | null
          created_at: string
          id: string
          max_concurrent_chats: number
          team_member_id: string
          updated_at: string
        }
        Insert: {
          auto_accept_chats?: boolean
          away_message?: string | null
          created_at?: string
          id?: string
          max_concurrent_chats?: number
          team_member_id: string
          updated_at?: string
        }
        Update: {
          auto_accept_chats?: boolean
          away_message?: string | null
          created_at?: string
          id?: string
          max_concurrent_chats?: number
          team_member_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_agent_preferences_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: true
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachment_name: string | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          created_at: string
          id: string
          is_internal: boolean
          read_at: string | null
          sender_id: string
          sender_type: string
          session_id: string
          updated_at: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean
          read_at?: string | null
          sender_id: string
          sender_type: string
          session_id: string
          updated_at?: string
        }
        Update: {
          attachment_name?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          read_at?: string | null
          sender_id?: string
          sender_type?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_quick_responses: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_shared: boolean
          shortcut: string | null
          team_member_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          is_shared?: boolean
          shortcut?: string | null
          team_member_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_shared?: boolean
          shortcut?: string | null
          team_member_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_quick_responses_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          agent_id: string | null
          created_at: string
          customer_id: string
          ended_at: string | null
          feedback: string | null
          id: string
          rating: number | null
          started_at: string
          status: string
          ticket_id: string | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          customer_id: string
          ended_at?: string | null
          feedback?: string | null
          id?: string
          rating?: number | null
          started_at?: string
          status?: string
          ticket_id?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          customer_id?: string
          ended_at?: string | null
          feedback?: string | null
          id?: string
          rating?: number | null
          started_at?: string
          status?: string
          ticket_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_sessions_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_widget_settings: {
        Row: {
          avatar_url: string | null
          badge_background_color: string
          badge_enabled: boolean
          badge_message: string
          badge_position: string
          created_at: string
          id: string
          tagline: string
          theme_color: string
          title: string
          updated_at: string
          widget_position: string
        }
        Insert: {
          avatar_url?: string | null
          badge_background_color?: string
          badge_enabled?: boolean
          badge_message?: string
          badge_position?: string
          created_at?: string
          id?: string
          tagline?: string
          theme_color?: string
          title?: string
          updated_at?: string
          widget_position?: string
        }
        Update: {
          avatar_url?: string | null
          badge_background_color?: string
          badge_enabled?: boolean
          badge_message?: string
          badge_position?: string
          created_at?: string
          id?: string
          tagline?: string
          theme_color?: string
          title?: string
          updated_at?: string
          widget_position?: string
        }
        Relationships: []
      }
      command_history: {
        Row: {
          command_type: string
          executed_at: string
          executed_by: string
          id: number
          new_state: Json
          previous_state: Json
          reverted_at: string | null
          reverted_by: string | null
          ticket_id: string
        }
        Insert: {
          command_type: string
          executed_at?: string
          executed_by: string
          id?: never
          new_state: Json
          previous_state: Json
          reverted_at?: string | null
          reverted_by?: string | null
          ticket_id: string
        }
        Update: {
          command_type?: string
          executed_at?: string
          executed_by?: string
          id?: never
          new_state?: Json
          previous_state?: Json
          reverted_at?: string | null
          reverted_by?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "command_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      config: {
        Row: {
          created_at: string
          description: string | null
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      custom_field_definitions: {
        Row: {
          created_at: string | null
          field_type: string
          id: string
          label: string
          name: string
          options: Json | null
          required: boolean | null
        }
        Insert: {
          created_at?: string | null
          field_type: string
          id?: string
          label: string
          name: string
          options?: Json | null
          required?: boolean | null
        }
        Update: {
          created_at?: string | null
          field_type?: string
          id?: string
          label?: string
          name?: string
          options?: Json | null
          required?: boolean | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      kb_article_feedback: {
        Row: {
          article_id: string
          created_at: string
          id: number
          is_helpful: boolean
          user_id: string | null
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: never
          is_helpful: boolean
          user_id?: string | null
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: never
          is_helpful?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_article_feedback_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "kb_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_articles: {
        Row: {
          category_id: string
          content: string
          content_embedding: string | null
          created_at: string
          excerpt: string | null
          helpful_count: number
          id: string
          not_helpful_count: number
          read_time_minutes: number
          title: string
          updated_at: string
        }
        Insert: {
          category_id: string
          content: string
          content_embedding?: string | null
          created_at?: string
          excerpt?: string | null
          helpful_count?: number
          id: string
          not_helpful_count?: number
          read_time_minutes?: number
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          content?: string
          content_embedding?: string | null
          created_at?: string
          excerpt?: string | null
          helpful_count?: number
          id?: string
          not_helpful_count?: number
          read_time_minutes?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kb_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "kb_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sla_policies: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolution_time_hours: number
          response_time_hours: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolution_time_hours: number
          response_time_hours: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolution_time_hours?: number
          response_time_hours?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          auth_user_id: string | null
          avatar_url: string | null
          created_at: string | null
          department: string | null
          department_id: string | null
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["team_member_role"]
          updated_at: string | null
        }
        Insert: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          department_id?: string | null
          email: string
          id?: string
          name: string
          role: Database["public"]["Enums"]["team_member_role"]
          updated_at?: string | null
        }
        Update: {
          auth_user_id?: string | null
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          department_id?: string | null
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["team_member_role"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_custom_fields: {
        Row: {
          created_at: string | null
          field_id: string
          ticket_id: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          field_id: string
          ticket_id: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          field_id?: string
          ticket_id?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_custom_fields_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "custom_field_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_custom_fields_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_history: {
        Row: {
          changed_by: string
          created_at: string
          field_name: string
          id: string
          new_value: string | null
          old_value: string | null
          ticket_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string
          field_name: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          ticket_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string
          field_name?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string | null
          id: string
          is_internal: boolean | null
          sender_id: string
          sender_type: Database["public"]["Enums"]["message_sender_type"]
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          sender_id: string
          sender_type: Database["public"]["Enums"]["message_sender_type"]
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string | null
          id?: string
          is_internal?: boolean | null
          sender_id?: string
          sender_type?: Database["public"]["Enums"]["message_sender_type"]
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_responses: {
        Row: {
          content: string
          created_at: string
          id: string
          is_internal: boolean
          sender_id: string
          sender_type: Database["public"]["Enums"]["message_sender_type"]
          ticket_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean
          sender_id: string
          sender_type: Database["public"]["Enums"]["message_sender_type"]
          ticket_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          sender_id?: string
          sender_type?: Database["public"]["Enums"]["message_sender_type"]
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_responses_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_status_history: {
        Row: {
          changed_by: string
          created_at: string | null
          id: string
          note: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_id: string
        }
        Insert: {
          changed_by: string
          created_at?: string | null
          id?: string
          note?: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string | null
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_status_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_tags: {
        Row: {
          tag_id: string
          ticket_id: string
        }
        Insert: {
          tag_id: string
          ticket_id: string
        }
        Update: {
          tag_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_tags_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_templates: {
        Row: {
          created_at: string | null
          created_by: string
          custom_fields: Json | null
          default_department: string | null
          default_description: string | null
          default_priority:
            | Database["public"]["Enums"]["ticket_priority"]
            | null
          default_title: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          custom_fields?: Json | null
          default_department?: string | null
          default_description?: string | null
          default_priority?:
            | Database["public"]["Enums"]["ticket_priority"]
            | null
          default_title?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          custom_fields?: Json | null
          default_department?: string | null
          default_description?: string | null
          default_priority?:
            | Database["public"]["Enums"]["ticket_priority"]
            | null
          default_title?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_watchers: {
        Row: {
          added_by: string
          created_at: string | null
          email: string
          ticket_id: string
          watcher_type: string
        }
        Insert: {
          added_by: string
          created_at?: string | null
          email: string
          ticket_id: string
          watcher_type: string
        }
        Update: {
          added_by?: string
          created_at?: string | null
          email?: string
          ticket_id?: string
          watcher_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_watchers_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assignee_id: string | null
          category: string | null
          created_at: string | null
          customer_id: string
          department: string | null
          department_id: string | null
          description: string | null
          embedding: string | null
          first_response_at: string | null
          id: string
          metadata: Json | null
          priority: Database["public"]["Enums"]["ticket_priority"] | null
          sla_breach: boolean | null
          sla_due_at: string | null
          sla_policy_id: string | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          category?: string | null
          created_at?: string | null
          customer_id: string
          department?: string | null
          department_id?: string | null
          description?: string | null
          embedding?: string | null
          first_response_at?: string | null
          id?: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          sla_breach?: boolean | null
          sla_due_at?: string | null
          sla_policy_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          category?: string | null
          created_at?: string | null
          customer_id?: string
          department?: string | null
          department_id?: string | null
          description?: string | null
          embedding?: string | null
          first_response_at?: string | null
          id?: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          sla_breach?: boolean | null
          sla_due_at?: string | null
          sla_policy_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_sla_policy_id_fkey"
            columns: ["sla_policy_id"]
            isOneToOne: false
            referencedRelation: "sla_policies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_ticket: {
        Args: {
          ticket_id: string
          agent_id: string
        }
        Returns: Json
      }
      begin_command_transaction: {
        Args: {
          command_text: string
          target_tables: string[]
          target_ids: string[]
        }
        Returns: string
      }
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      check_transaction_settings: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_user_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      decrement_agent_load: {
        Args: {
          agent_id: string
        }
        Returns: undefined
      }
      drop_if_exists_without_exception: {
        Args: {
          type: string
          name: string
          cascade?: boolean
        }
        Returns: undefined
      }
      execute_sql_internal: {
        Args: {
          sql: string
        }
        Returns: undefined
      }
      execute_ticket_command: {
        Args: {
          command_type: Database["public"]["Enums"]["ticket_command_type"]
          params: Database["public"]["CompositeTypes"]["ticket_command_params"]
        }
        Returns: Json
      }
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      increment_agent_load: {
        Args: {
          agent_id: string
        }
        Returns: undefined
      }
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      match_documents: {
        Args: {
          query_embedding: string
          match_count?: number
          filter?: Json
        }
        Returns: {
          id: string
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      match_kb_articles: {
        Args: {
          query_embedding: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          title: string
          content: string
          similarity: number
        }[]
      }
      match_tickets: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: string
          title: string
          description: string
          status: string
          priority: string
          category: string
          department: string
          created_at: string
          similarity: number
        }[]
      }
      revert_auth_user_id_changes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      revert_command: {
        Args: {
          command_id: number
        }
        Returns: Json
      }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      truncate_tables: {
        Args: {
          table_names: string[]
        }
        Returns: undefined
      }
      update_ticket_priority: {
        Args: {
          ticket_id: string
          new_priority: string
        }
        Returns: Json
      }
      update_ticket_status: {
        Args: {
          ticket_id: string
          new_status: string
        }
        Returns: Json
      }
      validate_sender_id: {
        Args: {
          sender_id: string
        }
        Returns: boolean
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
    }
    Enums: {
      agent_status_type: "online" | "away" | "offline"
      command_status: "pending" | "executed" | "rolled_back"
      message_sender_type: "team_member" | "customer"
      team_member_role: "admin" | "agent"
      ticket_command_type: "update_status" | "update_priority" | "assign_ticket"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status: "open" | "pending" | "resolved" | "closed"
    }
    CompositeTypes: {
      ticket_command_params: {
        ticket_id: string | null
        new_status: string | null
        new_priority: string | null
        agent_id: string | null
      }
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
