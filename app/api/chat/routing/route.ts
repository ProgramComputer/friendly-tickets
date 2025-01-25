import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// In-memory store (Note: This will reset on server restart)
const memoryStore = {
  chatQueue: new Map<string, { priority: number; timestamp: number; data: ChatRequest }>(),
  agentStatus: new Map<string, AgentStatus>(),
  agentLoad: new Map<string, number>(),
  agentMaxChats: new Map<string, number>(),
}

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

// Temporarily disabled for build
export async function POST() {
  return NextResponse.json({ message: 'Chat routing temporarily disabled' }, { status: 503 })
} 