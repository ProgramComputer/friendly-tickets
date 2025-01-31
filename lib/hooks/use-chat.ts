'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from './use-realtime'
import { uploadFile } from '@/lib/services/file-upload'
import type { ChatMessage } from '@/types/chat'
import { PostgrestError } from '@supabase/supabase-js'

interface Message {
  id: string
  session_id: string
  sender_id: string
  sender_type: 'customer' | 'agent' | 'system'
  content: string
  created_at: string
  attachment_url?: string
  attachment_type?: string
  attachment_name?: string
  is_internal: boolean
}

interface ChatSession {
  id: string
  customer_id: string
  agent_id?: string
  status: 'pending' | 'active' | 'ended' | 'transferred'
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidUUID(uuid: string): boolean {
  return UUID_REGEX.test(uuid)
}

export function useChat(sessionId: string) {
  const supabase = useSupabase()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [chatSession, setChatSession] = useState<ChatSession | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({})
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  // Fetch chat session details
  useEffect(() => {
    async function fetchChatSession() {
      try {
        const { data: session, error } = await supabase
          .from('chat_sessions')
          .select(`
            *,
            customer:customers!customer_id(*),
            agent:team_members!agent_id(*)
          `)
          .eq('id', sessionId)
          .single()

        if (error) {
          console.error('Error fetching chat session:', error)
          return
        }

        console.log('Chat session details:', {
          sessionId,
          customerId: session?.customer_id,
          agentId: session?.agent_id,
          status: session?.status
        })

        setChatSession(session)
      } catch (err) {
        console.error('Error in fetchChatSession:', err)
      }
    }

    fetchChatSession()
  }, [sessionId, supabase])

  useEffect(() => {
    let mounted = true

    async function fetchMessages() {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })

        if (error) {
          console.error('Supabase error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          })
          throw error
        }

        if (mounted) {
          setMessages(data || [])
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Error fetching messages:', err)
        if (mounted) {
          setError(err as Error)
          setIsLoading(false)
        }
      }
    }

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        const newMessage = payload.new as ChatMessage
        setMessages(current => [...current, newMessage])
      })
      .subscribe()

    // Initial fetch
    fetchMessages()

    return () => {
      mounted = false
      channel.unsubscribe()
    }
  }, [sessionId, supabase])

  // Handle typing indicators
  const handleTyping = (userId: string, isTyping: boolean) => {
    setTypingUsers((prev) => ({
      ...prev,
      [userId]: isTyping,
    }))
  }

  // Handle presence changes
  const handlePresence = ({ joins, leaves }: { joins: Record<string, any>; leaves: Record<string, any> }) => {
    setOnlineUsers((prev) => {
      const next = { ...prev }
      
      // Add new users
      Object.keys(joins).forEach((key) => {
        next[key] = joins[key]
      })
      
      // Remove left users
      Object.keys(leaves).forEach((key) => {
        delete next[key]
      })
      
      return next
    })
  }

  // Set up realtime subscriptions
  useRealtime({
    channelName: sessionId,
    onMessage: (message: Message) => {
      setMessages((prev) => [...prev, message as ChatMessage])
    },
    onTyping: handleTyping,
    onPresence: handlePresence,
  })

  const sendMessage = async (content: string, recipientId?: string) => {
    console.log('[Chat Hook] Preparing to send message:', {
      sessionId,
      recipientId,
      contentLength: content.length,
      hasReferences: content.includes('@')
    })

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      console.log('[Chat Hook] Authenticated user:', {
        id: user.id,
        email: user.email
      })

      // Try to get team member first
      const { data: teamMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      // If not a team member, try to get customer
      if (!teamMember) {
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()

        if (!customer) {
          throw new Error('User not found as team member or customer')
        }

        console.log('Customer lookup result:', { 
          userId: user.id, 
          customerId: customer?.id,
          found: !!customer 
        })
      } else {
        console.log('Team member lookup result:', {
          userId: user.id,
          teamMemberId: teamMember?.id,
          found: !!teamMember
        })
      }

      // Create message
      const { data: message, error } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          sender_id: user.id,
          recipient_id: recipientId,
          content,
          status: 'sent',
          sender_type: teamMember ? 'agent' : 'customer'
        })
        .select()
        .single()

      console.log('[Chat Hook] Message created:', {
        success: !!message,
        error: error?.message,
        messageId: message?.id
      })

      if (error) throw error

      // Update local state
      setMessages(prev => [...prev, message])

      return message
    } catch (error) {
      console.error('[Chat Hook] Error sending message:', error)
      throw error
    }
  }

  // Upload and send file
  const sendFile = async (
    file: File,
    recipientId: string,
    message?: string
  ) => {
    if (!sessionId) return

    setIsLoading(true)
    try {
      // Upload file
      const attachment = await uploadFile(file, sessionId)

      // Send message with attachment
      await sendMessage(
        message || `Sent ${file.name}`,
        recipientId,
        attachment
      )
    } catch (error) {
      console.error('Error sending file:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send file',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Send typing indicator
  const sendTypingIndicator = async (isTyping: boolean) => {
    if (!sessionId || !supabase.session?.user?.id) return

    const channel = supabase.channel(sessionId)
    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        userId: supabase.session.user.id,
        isTyping,
      },
    })
  }

  // Delete message
  const deleteMessage = async (messageId: string) => {
    if (!supabase.session?.user?.id) return

    try {
      setIsLoading(true)

      // Get message details first to check for attachments
      const { data: message, error: fetchError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('id', messageId)
        .eq('sender_id', supabase.session.user.id)
        .single()

      if (fetchError) throw fetchError

      // If message has an attachment, delete it from storage
      if (message?.attachment_url) {
        const url = new URL(message.attachment_url)
        const filePath = url.pathname.split('/').slice(-2).join('/')
        
        const { error: storageError } = await supabase.storage
          .from('chat-attachments')
          .remove([filePath])

        if (storageError) {
          console.error('Error deleting file:', storageError)
          // Continue with message deletion even if file deletion fails
        }
      }

      // Delete the message
      const { error: deleteError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', supabase.session.user.id)

      if (deleteError) throw deleteError

      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
    } catch (error) {
      console.error('Error deleting message:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete message',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Edit message
  const editMessage = async (messageId: string, content: string) => {
    if (!supabase.session?.user?.id) return

    try {
      setIsLoading(true)

      const { error } = await supabase
        .from('chat_messages')
        .update({ content })
        .eq('id', messageId)
        .eq('sender_id', supabase.session.user.id)

      if (error) throw error

      setMessages((prev) => prev.map((msg) =>
        msg.id === messageId ? { ...msg, content } : msg
      ))
    } catch (error) {
      console.error('Error editing message:', error)
      setIsLoading(false)
      toast({
        title: 'Error',
        description: 'Failed to edit message. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return {
    messages,
    isLoading,
    error,
    chatSession,
    onlineUsers,
    typingUsers,
    sendMessage,
    sendFile,
    sendTypingIndicator,
    deleteMessage,
    editMessage,
  }
} 