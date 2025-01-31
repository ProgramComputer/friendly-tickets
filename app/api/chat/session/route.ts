import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// TODO Temporarily disabled for build
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient(undefined, true)
    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'start_session': {
        const { customerId, name, email, initialMessage } = data
        
        // Create chat session
        const { data: session, error: sessionError } = await supabase
          .from('chat_sessions')
          .insert({
            customer_id: customerId,
            status: 'pending'
          })
          .select()
          .single()

        if (sessionError) throw sessionError

        // Add initial message
        if (initialMessage) {
          const { error: messageError } = await supabase
            .from('chat_messages')
            .insert({
              session_id: session.id,
              sender_id: customerId,
              sender_type: 'customer',
              content: initialMessage
            })

          if (messageError) throw messageError
        }

        return NextResponse.json(session)
      }

      case 'end_session': {
        const { sessionId } = data
        const { error } = await supabase
          .from('chat_sessions')
          .update({ 
            status: 'ended',
            ended_at: new Date().toISOString()
          })
          .eq('id', sessionId)

        if (error) throw error
        return NextResponse.json({ success: true })
      }

      case 'submit_rating': {
        const { sessionId, rating, feedback } = data
        const { error } = await supabase
          .from('chat_sessions')
          .update({ rating, feedback })
          .eq('id', sessionId)

        if (error) throw error
        return NextResponse.json({ success: true })
      }

      case 'get_active_sessions': {
        const { userId, role } = data
        const query = supabase
          .from('chat_sessions')
          .select('*, chat_messages(*)')
          .in('status', ['pending', 'active'])
          .order('created_at', { ascending: false })

        if (role === 'customer') {
          query.eq('customer_id', userId)
        } else if (role === 'agent') {
          query.eq('agent_id', userId)
        }

        const { data: sessions, error } = await query

        if (error) throw error
        return NextResponse.json(sessions)
      }

      case 'get_session_messages': {
        const { sessionId, limit = 50 } = data
        const { data: messages, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })
          .limit(limit)

        if (error) throw error
        return NextResponse.json(messages)
      }

      case 'mark_messages_read': {
        const { sessionId } = data
        const { error } = await supabase
          .from('chat_messages')
          .update({ read_at: new Date().toISOString() })
          .eq('session_id', sessionId)
          .is('read_at', null)

        if (error) throw error
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Chat session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 