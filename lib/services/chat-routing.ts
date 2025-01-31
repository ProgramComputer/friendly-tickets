import { ChatRequest, AgentStatus } from '@/types/features/chat/routing'

// Queue Management
export async function addToQueue(request: ChatRequest) {
  const response = await fetch('/api/chat/routing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'add_to_queue',
      ...request
    })
  })

  if (!response.ok) {
    throw new Error('Failed to add to queue')
  }
}

export async function removeFromQueue(sessionId: string) {
  const response = await fetch('/api/chat/routing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'remove_from_queue',
      sessionId
    })
  })

  if (!response.ok) {
    throw new Error('Failed to remove from queue')
  }
}

export async function getNextInQueue(): Promise<ChatRequest | null> {
  const response = await fetch('/api/chat/routing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'get_next_in_queue'
    })
  })

  if (!response.ok) {
    throw new Error('Failed to get next in queue')
  }

  return response.json()
}

// Agent Management
export async function updateAgentStatus(agentId: string, status: AgentStatus['status']) {
  const response = await fetch('/api/chat/routing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'update_agent_status',
      agentId,
      status
    })
  })

  if (!response.ok) {
    throw new Error('Failed to update agent status')
  }
}

export async function updateAgentLoad(agentId: string, currentLoad: number) {
  const response = await fetch('/api/chat/routing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'update_agent_load',
      agentId,
      currentLoad
    })
  })

  if (!response.ok) {
    throw new Error('Failed to update agent load')
  }
}

export async function setAgentMaxChats(agentId: string, maxChats: number) {
  const response = await fetch('/api/chat/routing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'set_agent_max_chats',
      agentId,
      maxChats
    })
  })

  if (!response.ok) {
    throw new Error('Failed to set agent max chats')
  }
}

export async function getAvailableAgent(): Promise<string | null> {
  const response = await fetch('/api/chat/routing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'get_available_agent'
    })
  })

  if (!response.ok) {
    throw new Error('Failed to get available agent')
  }

  return response.json()
}

export async function assignChat(sessionId: string, agentId: string) {
  const response = await fetch('/api/chat/routing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'assign_chat',
      sessionId,
      agentId
    })
  })

  if (!response.ok) {
    throw new Error('Failed to assign chat')
  }
}

export async function reassignChats(agentId: string) {
  const response = await fetch('/api/chat/routing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'reassign_chats',
      agentId
    })
  })

  if (!response.ok) {
    throw new Error('Failed to reassign chats')
  }
} 