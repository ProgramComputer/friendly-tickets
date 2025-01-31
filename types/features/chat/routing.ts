export interface ChatRequest {
  sessionId: string
  customerId: string
  priority: number
  timestamp: number
}

export interface AgentStatus {
  id: string
  status: 'online' | 'away' | 'offline'
  lastSeen: number
} 