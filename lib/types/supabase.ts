export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          created_at: string
          user_id: string
          name: string
          email: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          name: string
          email: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          name?: string
          email?: string
        }
      }
      team_members: {
        Row: {
          id: string
          created_at: string
          user_id: string
          name: string
          email: string
          role: 'admin' | 'agent'
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          name: string
          email: string
          role: 'admin' | 'agent'
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          name?: string
          email?: string
          role?: 'admin' | 'agent'
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 