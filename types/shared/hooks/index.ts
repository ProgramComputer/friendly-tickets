export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
}

export interface KBArticle {
  id: string
  title: string
  content: string
  category: string
}

export interface ObjectReference {
  type: string
  id: string
  name: string
}

export interface CreateTeamMemberInput {
  email: string
  role: 'agent' | 'admin'
  name: string
  department?: string
}

export interface Tag {
  id: string
  name: string
  color?: string
  description?: string
} 