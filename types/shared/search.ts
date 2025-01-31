import { ReactNode } from 'react'

export interface SearchObjectType {
  id: string
  name: string
  icon: ReactNode
  roles: ('customer' | 'agent' | 'admin')[]
  table: string
  displayField: string
}

export interface SearchResult {
  id: string
  display: string
}

export interface SearchPaletteProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (type: SearchObjectType, instance?: { id: string, display: string }) => void
  searchTerm: string
  onSearchChange: (value: string) => void
  role?: 'customer' | 'agent' | 'admin'
} 