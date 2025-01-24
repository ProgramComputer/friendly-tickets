interface StartChatParams {
  customerId: string
  name: string
  email: string
  initialMessage: string
}

export async function startChatSession({
  customerId,
  name,
  email,
  initialMessage,
}: StartChatParams) {
  const response = await fetch('/api/chat/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'start_session',
      customerId,
      name,
      email,
      initialMessage,
    })
  })

  if (!response.ok) {
    throw new Error('Failed to start chat session')
  }

  return response.json()
}

export async function endChatSession(sessionId: string) {
  const response = await fetch('/api/chat/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'end_session',
      sessionId
    })
  })

  if (!response.ok) {
    throw new Error('Failed to end chat session')
  }
}

export async function submitChatRating(sessionId: string, rating: number, feedback?: string) {
  const response = await fetch('/api/chat/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'submit_rating',
      sessionId,
      rating,
      feedback
    })
  })

  if (!response.ok) {
    throw new Error('Failed to submit chat rating')
  }
}

export async function getActiveSessions(userId: string, role: 'customer' | 'agent') {
  const response = await fetch('/api/chat/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'get_active_sessions',
      userId,
      role
    })
  })

  if (!response.ok) {
    throw new Error('Failed to get active sessions')
  }

  return response.json()
}

export async function getSessionMessages(sessionId: string, limit = 50) {
  const response = await fetch('/api/chat/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'get_session_messages',
      sessionId,
      limit
    })
  })

  if (!response.ok) {
    throw new Error('Failed to get session messages')
  }

  return response.json()
}

export async function markMessagesAsRead(sessionId: string) {
  const response = await fetch('/api/chat/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'mark_messages_read',
      sessionId
    })
  })

  if (!response.ok) {
    throw new Error('Failed to mark messages as read')
  }
}

export async function transferChat(sessionId: string, newAgentId: string) {
  const response = await fetch('/api/chat/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'transfer_chat',
      sessionId,
      newAgentId
    })
  })

  if (!response.ok) {
    throw new Error('Failed to transfer chat')
  }
} 