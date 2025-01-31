import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
  currentLoad: number
  maxChats: number
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient(undefined, true)
    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'update_agent_status': {
        const { agentId, status } = data
        const { error } = await supabase
          .from('agent_status')
          .upsert({
            agent_id: agentId,
            status,
            last_seen: new Date().toISOString(),
          })

        if (error) throw error
        return NextResponse.json({ success: true })
      }

      case 'update_agent_load': {
        const { agentId, currentLoad } = data
        const { error } = await supabase
          .from('agent_status')
          .update({ current_load: currentLoad })
          .eq('agent_id', agentId)

        if (error) throw error
        return NextResponse.json({ success: true })
      }

      case 'get_available_agent': {
        const { data: agents, error } = await supabase
          .from('agent_status')
          .select('*')
          .eq('status', 'online')
          .lt('current_load', 3) // Default max chats is 3
          .order('current_load')
          .limit(1)

        if (error) throw error
        return NextResponse.json(agents?.[0]?.agent_id || null)
      }

      case 'assign_chat': {
        const { sessionId, agentId } = data
        const { error } = await supabase
          .from('chat_sessions')
          .update({ 
            agent_id: agentId,
            status: 'active'
          })
          .eq('id', sessionId)

        if (error) throw error

        // Increment agent load
        const { error: loadError } = await supabase.rpc('increment_agent_load', { agent_id: agentId })
        if (loadError) throw loadError

        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Chat routing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 