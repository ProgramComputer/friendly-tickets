import { createClient } from '@supabase/supabase-js'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'

// Constants
const CHAT_QUEUE = 'chat:queue'
const AGENT_LOAD = 'agent:load:'
const AGENT_MAX_CHATS = 'agent:max_chats:'
const AGENT_STATUS = 'agent:status:'

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Types
interface ChatRequest {
  sessionId: string
  customerId: string
  priority: number
  timestamp: number
}

interface AgentStatus {
  id: string
  status: 'online' | 'away' | 'offline'
  lastSeen: number
}

export async function POST(req: Request) {
  try {
    const { action, ...data } = await req.json()

    switch (action) {
      case 'add_to_queue': {
        const score = data.priority * 1000 + (Date.now() - data.timestamp)
        await redis.zadd(CHAT_QUEUE, { score, member: JSON.stringify(data) })
        return NextResponse.json({ success: true })
      }

      case 'remove_from_queue': {
        const members = await redis.zrange(CHAT_QUEUE, 0, -1)
        const target = members.find((m) => {
          const request = JSON.parse(m as string) as ChatRequest
          return request.sessionId === data.sessionId
        })
        if (target) {
          await redis.zrem(CHAT_QUEUE, target)
        }
        return NextResponse.json({ success: true })
      }

      case 'get_next_in_queue': {
        const [request] = await redis.zrange(CHAT_QUEUE, 0, 0)
        return NextResponse.json(request ? JSON.parse(request as string) : null)
      }

      case 'update_agent_status': {
        const key = `${AGENT_STATUS}${data.agentId}`
        const agentStatus: AgentStatus = {
          id: data.agentId,
          status: data.status,
          lastSeen: Date.now(),
        }
        
        await redis.set(key, JSON.stringify(agentStatus))
        
        // If agent goes offline, reassign their chats
        if (data.status === 'offline') {
          // Get all active chats for the agent
          const { data: sessions } = await supabase
            .from('chat_sessions')
            .select('id, customer_id')
            .eq('agent_id', data.agentId)
            .eq('status', 'active')

          if (sessions?.length) {
            // Add chats back to queue
            await Promise.all(
              sessions.map((session) =>
                redis.zadd(CHAT_QUEUE, {
                  score: 2000 + Date.now(), // Higher priority for reassignment
                  member: JSON.stringify({
                    sessionId: session.id,
                    customerId: session.customer_id,
                    priority: 2,
                    timestamp: Date.now(),
                  })
                })
              )
            )

            // Update sessions to waiting status
            await supabase
              .from('chat_sessions')
              .update({
                agent_id: null,
                status: 'waiting',
              })
              .eq('agent_id', data.agentId)
              .eq('status', 'active')
          }
        }
        
        return NextResponse.json({ success: true })
      }

      case 'update_agent_load': {
        await redis.set(`${AGENT_LOAD}${data.agentId}`, data.currentLoad)
        return NextResponse.json({ success: true })
      }

      case 'set_agent_max_chats': {
        await redis.set(`${AGENT_MAX_CHATS}${data.agentId}`, data.maxChats)
        return NextResponse.json({ success: true })
      }

      case 'get_available_agent': {
        // Get all online agents
        const agentKeys = await redis.keys(`${AGENT_STATUS}*`)
        const agents = await Promise.all(
          agentKeys.map(async (key) => {
            const status = await redis.get<AgentStatus>(key)
            if (!status || status.status === 'offline') return null
            
            const agentId = key.replace(AGENT_STATUS, '')
            const load = parseInt(await redis.get(`${AGENT_LOAD}${agentId}`) || '0')
            const maxChats = parseInt(await redis.get(`${AGENT_MAX_CHATS}${agentId}`) || '3')
            
            return {
              id: agentId,
              status,
              load,
              maxChats,
            }
          })
        )

        // Filter out offline agents and sort by load
        const availableAgents = agents
          .filter((a): a is NonNullable<typeof a> => a !== null && a.load < a.maxChats)
          .sort((a, b) => a.load - b.load)

        return NextResponse.json(availableAgents[0]?.id || null)
      }

      case 'assign_chat': {
        // Update chat session
        const { error } = await supabase
          .from('chat_sessions')
          .update({
            agent_id: data.agentId,
            status: 'active',
          })
          .eq('id', data.sessionId)

        if (error) throw error

        // Update agent load
        const currentLoad = parseInt(await redis.get(`${AGENT_LOAD}${data.agentId}`) || '0')
        await redis.set(`${AGENT_LOAD}${data.agentId}`, currentLoad + 1)

        // Remove from queue
        const members = await redis.zrange(CHAT_QUEUE, 0, -1)
        const target = members.find((m) => {
          const request = JSON.parse(m as string) as ChatRequest
          return request.sessionId === data.sessionId
        })
        if (target) {
          await redis.zrem(CHAT_QUEUE, target)
        }

        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in chat routing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 