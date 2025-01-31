import { ReactNode } from 'react'

export interface ChatObjectType {
  id: string
  name: string
  icon: ReactNode
  roles: ('customer' | 'agent' | 'admin')[]
}

export interface ChatObjectReference {
  type: string
  id: string
  display: string
} 