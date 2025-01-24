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

export function useChat(sessionId: string) {
  const supabase = useSupabase()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [chatSession, setChatSession] = useState<ChatSession | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<Record<string, any>>({})
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  // Function to get relevant KB articles based on message
  async function getRelevantKBArticles(message: string) {
    try {
      const { data: articles, error } = await supabase.rpc('match_kb_articles', {
        query_embedding: message,
        match_threshold: 0.7,
        match_count: 3
      })

      if (error) throw error
      return articles
    } catch (err) {
      console.error('Error getting relevant articles:', err)
      return []
    }
  }

  // Function to generate AI response
  async function generateAIResponse(message: string) {
    try {
      // Get relevant KB articles for context
      const relevantArticles = await getRelevantKBArticles(message)
      const context = relevantArticles
        .map(article => `${article.title}\n${article.content}`)
        .join('\n\n')

      // Call OpenAI endpoint
      const response = await fetch('/api/chat/ai-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context,
          sessionId
        })
      })

      if (!response.ok) throw new Error('Failed to generate AI response')
      const { content } = await response.json()

      // Send AI response as a message
      const { error: msgError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          content,
          sender_type: 'ai',
          sender_id: 'ai-assistant'
        })

      if (msgError) throw msgError

    } catch (err) {
      console.error('Error generating AI response:', err)
      toast({
        title: 'Error',
        description: 'Failed to generate AI response. A human agent will assist you shortly.',
        variant: 'destructive'
      })
    }
  }

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
        
        // Generate AI response for user messages
        if (newMessage.sender_type === 'customer') {
          generateAIResponse(newMessage.content)
        }
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

  const sendMessage = async (content: string) => {
    try {
      // Validate sessionId
      if (!sessionId || typeof sessionId !== 'string' || sessionId.trim() === '') {
        throw new Error('Invalid session ID')
      }

      setIsLoading(true)
      setError(null)

      // Log the full response for debugging
      const response = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId.trim(), // Ensure trimmed
          content: content.trim(), // Trim content as well
          sender_type: 'customer',
          sender_id: supabase.session?.user?.id || '',
          created_at: new Date().toISOString(),
          is_internal: false
        })
        .select()
        .single()

      const { data, error: supabaseError } = response

      // If we have data, update messages immediately
      if (data) {
        setMessages(prev => [...prev, data as ChatMessage])
        return // Exit early on success
      }

      // Handle error cases
      if (supabaseError) {
        // Handle UUID validation error specifically
        if (supabaseError.code === '22P02') {
          throw new Error('Invalid session format. Please check your session ID.')
        }

        // Handle other errors
        if (Object.keys(supabaseError).length > 0 && supabaseError.code !== 'PGRST116') {
          throw supabaseError
        }
      }

    } catch (err) {
      const error = err as Error
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      })
      
      setError(error)
      toast({
        title: 'Error sending message',
        description: error.message || 'Failed to send message. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
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

      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', supabase.session.user.id)

      if (error) throw error

      setMessages((prev) => prev.filter((msg) => msg.id !== messageId))
    } catch (error) {
      console.error('Error deleting message:', error)
      setIsLoading(false)
      toast({
        title: 'Error',
        description: 'Failed to delete message. Please try again.',
        variant: 'destructive',
      })
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