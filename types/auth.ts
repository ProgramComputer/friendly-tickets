export type UserRole = 'admin' | 'agent' | 'customer'

export interface User {
  id: string
  email: string
  role: UserRole
  name?: string
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  user_id: string
  role: UserRole
  name?: string
  email: string
  department?: string
  position?: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  user_id: string
  name?: string
  email: string
  company?: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface LoginFormData {
  email: string
  password: string
  role: UserRole
}

export interface AuthError {
  message: string
  code?: string
} 