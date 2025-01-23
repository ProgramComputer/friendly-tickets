import { createClient } from '@supabase/supabase-js'
import { addToQueue } from './chat-routing'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
  try {
    // Create chat session
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions')
      .insert({
        customer_id: customerId,
        status: 'pending',
      })
      .select()
      .single()

    if (sessionError) throw sessionError

    // Add initial message
    const { error: messageError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: session.id,
        sender_type: 'customer',
        sender_id: customerId,
        content: initialMessage,
      })

    if (messageError) throw messageError

    // Add to routing queue
    await addToQueue(session.id, customerId)

    return session
  } catch (error) {
    console.error('Error starting chat session:', error)
    throw error
  }
}

export async function endChatSession(sessionId: string) {
  try {
    const { error } = await supabase
      .from('chat_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (error) throw error
  } catch (error) {
    console.error('Error ending chat session:', error)
    throw error
  }
}

export async function submitChatRating(sessionId: string, rating: number, feedback?: string) {
  try {
    const { error } = await supabase
      .from('chat_sessions')
      .update({
        rating,
        feedback,
      })
      .eq('id', sessionId)

    if (error) throw error
  } catch (error) {
    console.error('Error submitting chat rating:', error)
    throw error
  }
}

export async function getActiveSessions(userId: string, userType: 'customer' | 'agent') {
  try {
    const query = supabase
      .from('chat_sessions')
      .select(`
        *,
        customer:customers(name, email),
        agent:team_members(name, email),
        last_message:chat_messages(
          content,
          created_at,
          sender_type,
          sender_id
        )
      `)
      .in('status', ['pending', 'active'])
      .order('created_at', { ascending: false })

    if (userType === 'customer') {
      query.eq('customer_id', userId)
    } else {
      query.eq('agent_id', userId)
    }

    const { data, error } = await query

    if (error) throw error

    return data?.map(session => ({
      ...session,
      last_message: Array.isArray(session.last_message) 
        ? session.last_message[0] 
        : null
    }))
  } catch (error) {
    console.error('Error getting active sessions:', error)
    throw error
  }
}

export async function getSessionMessages(sessionId: string) {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        customer:customers(name),
        agent:team_members(name)
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return data
  } catch (error) {
    console.error('Error getting session messages:', error)
    throw error
  }
}

export async function markMessagesAsRead(sessionId: string, userId: string) {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .update({
        read_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId)
      .neq('sender_id', userId)
      .is('read_at', null)

    if (error) throw error
  } catch (error) {
    console.error('Error marking messages as read:', error)
    throw error
  }
}

export async function transferChat(sessionId: string, newAgentId: string) {
  try {
    const { error } = await supabase
      .from('chat_sessions')
      .update({
        agent_id: newAgentId,
        status: 'transferred',
      })
      .eq('id', sessionId)

    if (error) throw error

    // Add system message about transfer
    await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        sender_type: 'system',
        sender_id: newAgentId,
        content: 'Chat transferred to another agent',
        is_internal: true,
      })
  } catch (error) {
    console.error('Error transferring chat:', error)
    throw error
  }
} 