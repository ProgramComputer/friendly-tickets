import { createClient } from '@supabase/supabase-js'
import { Redis } from '@upstash/redis'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const redis = Redis.fromEnv()

// Queue keys
const CHAT_QUEUE = 'chat:queue'
const AGENT_LOAD = 'chat:agent:load:'
const AGENT_MAX_CHATS = 'chat:agent:max:'
const AGENT_STATUS = 'chat:agent:status:'

interface ChatRequest {
  sessionId: string
  customerId: string
  priority: number
  timestamp: number
}

interface AgentStatus {
  id: string
  status: 'online' | 'away' | 'offline'
  currentLoad: number
  maxChats: number
}

export async function addToQueue(sessionId: string, customerId: string, priority = 1) {
  const request: ChatRequest = {
    sessionId,
    customerId,
    priority,
    timestamp: Date.now(),
  }

  // Add to sorted set with score as priority
  await redis.zadd(CHAT_QUEUE, {
    score: priority,
    member: JSON.stringify(request),
  })

  return request
}

export async function removeFromQueue(sessionId: string) {
  const members = await redis.zrange(CHAT_QUEUE, 0, -1)
  const target = members.find((m) => {
    const request = JSON.parse(m) as ChatRequest
    return request.sessionId === sessionId
  })

  if (target) {
    await redis.zrem(CHAT_QUEUE, target)
  }
}

export async function getNextInQueue(): Promise<ChatRequest | null> {
  const [request] = await redis.zrange(CHAT_QUEUE, 0, 0)
  return request ? JSON.parse(request) : null
}

export async function updateAgentStatus(
  agentId: string,
  status: 'online' | 'away' | 'offline'
) {
  await redis.set(AGENT_STATUS + agentId, status)

  // If going offline, reassign their chats
  if (status === 'offline') {
    await reassignChats(agentId)
  }
}

export async function updateAgentLoad(agentId: string, currentLoad: number) {
  await redis.set(AGENT_LOAD + agentId, currentLoad)
}

export async function setAgentMaxChats(agentId: string, maxChats: number) {
  await redis.set(AGENT_MAX_CHATS + agentId, maxChats)
}

export async function getAvailableAgent(): Promise<string | null> {
  // Get all online agents
  const agents = await supabase
    .from('team_members')
    .select('id, chat_agent_preferences!inner(max_concurrent_chats)')
    .eq('role', 'agent')

  if (!agents.data) return null

  // Get their current status and load
  const agentStatuses = await Promise.all(
    agents.data.map(async (agent) => {
      const [status, currentLoad] = await Promise.all([
        redis.get<'online' | 'away' | 'offline'>(AGENT_STATUS + agent.id),
        redis.get<number>(AGENT_LOAD + agent.id),
      ])

      return {
        id: agent.id,
        status: status || 'offline',
        currentLoad: currentLoad || 0,
        maxChats: agent.chat_agent_preferences.max_concurrent_chats,
      }
    })
  )

  // Find the best available agent
  const availableAgent = agentStatuses
    .filter((a) => a.status === 'online' && a.currentLoad < a.maxChats)
    .sort((a, b) => {
      // Sort by load ratio (current/max) ascending
      const aRatio = a.currentLoad / a.maxChats
      const bRatio = b.currentLoad / b.maxChats
      return aRatio - bRatio
    })[0]

  return availableAgent?.id || null
}

export async function assignChat(sessionId: string, agentId: string) {
  // Update chat session
  const { error } = await supabase
    .from('chat_sessions')
    .update({
      agent_id: agentId,
      status: 'active',
    })
    .eq('id', sessionId)

  if (error) throw error

  // Increment agent load
  const currentLoad = await redis.get<number>(AGENT_LOAD + agentId) || 0
  await updateAgentLoad(agentId, currentLoad + 1)

  // Remove from queue
  await removeFromQueue(sessionId)
}

async function reassignChats(agentId: string) {
  // Get all active chats for the agent
  const { data: chats } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('agent_id', agentId)
    .eq('status', 'active')

  if (!chats) return

  // Add each chat back to queue
  await Promise.all(
    chats.map((chat) =>
      addToQueue(chat.id, chat.customer_id, 2) // Higher priority for reassignment
    )
  )

  // Update chat sessions to pending
  await supabase
    .from('chat_sessions')
    .update({
      agent_id: null,
      status: 'pending',
    })
    .eq('agent_id', agentId)
    .eq('status', 'active')
}

// Process queue
export async function processQueue() {
  const nextChat = await getNextInQueue()
  if (!nextChat) return

  const availableAgent = await getAvailableAgent()
  if (!availableAgent) return

  await assignChat(nextChat.sessionId, availableAgent)
}

// Auto-process queue every 5 seconds
if (typeof window === 'undefined') { // Only run on server
  setInterval(processQueue, 5000)
} 