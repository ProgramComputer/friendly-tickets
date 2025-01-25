import { createServerSupabaseClient } from '@/lib/supabase/server'
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
  try {
    // Use service role for admin operations
    const supabase = await createServerSupabaseClient(undefined, true)
    return NextResponse.json({ message: 'Chat routing temporarily disabled' }, { status: 503 })
  } catch (error) {
    console.error('Supabase client initialization error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 