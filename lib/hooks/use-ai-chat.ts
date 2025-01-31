'use client'

import { useState, useRef, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useSupabase } from '@/lib/supabase/client'
import { VectorStoreRetriever } from '@langchain/core/vectorstores'
import { useAuth } from '@/lib/hooks/use-auth'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  createdAt: Date
  command_data?: {
    result: any
    canRollback?: boolean
  }
}

interface CommandResult {
  type: 'command' | 'rag'
  result: string | {
    message: string
    success: boolean
    canRollback?: boolean
  }
}

interface UseAIChatProps {
  retriever: VectorStoreRetriever | null
}

export function useAIChat({ retriever }: UseAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { toast } = useToast()
  const supabase = useSupabase()
  const { role } = useAuth()

  // Add debug logging for auth state
  useEffect(() => {
    console.log('[AI Chat] Current auth role:', role)
    
    // Check session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AI Chat] Auth session:', {
        hasSession: !!session,
        user: session?.user?.email,
        accessToken: !!session?.access_token
      })
    })

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AI Chat] Auth state changed:', {
        event,
        user: session?.user?.email,
        hasSession: !!session
      })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [role, supabase.auth])

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const sendMessage = async (content: string) => {
    try {
      if (!retriever) {
        throw new Error('AI system is still initializing')
      }

      console.log('[AI Chat] Sending message with role:', role)

      setIsLoading(true)
      
      // Add user message immediately
      const userMessage: Message = {
        id: crypto.randomUUID(),
        content,
        role: 'user',
        createdAt: new Date()
      }
      setMessages(prev => [...prev, userMessage])

      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No auth session found')
      }

      console.log('[AI Chat] Preparing request:', {
        userRole: role,
        hasSession: !!session,
        hasAccessToken: !!session.access_token
      })

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController()

      // Send request to API endpoint
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          input: content,
          retriever,
          userRole: role // Add user role to the request
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const result = await response.json()

      // Add AI response
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        content: typeof result.result === 'string' ? result.result : result.result.message,
        role: 'assistant',
        createdAt: new Date(),
        command_data: result.type === 'command' ? {
          result: result.result
        } : undefined
      }
      setMessages(prev => [...prev, aiMessage])

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request aborted')
        return
      }
      console.error('Error sending message:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const rollbackCommand = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId)
    if (!message?.command_data?.result.transactionId) return

    try {
      const { error } = await supabase.rpc('rollback_command_transaction', {
        transaction_id: message.command_data.result.transactionId
      })

      if (error) throw error

      // Update message to show rollback status
      setMessages(prev => prev.map(m => 
        m.id === messageId
          ? {
              ...m,
              command_data: {
                ...m.command_data!,
                result: {
                  ...m.command_data!.result,
                  canRollback: false,
                  message: 'Command has been rolled back'
                }
              }
            }
          : m
      ))

      toast({
        title: 'Success',
        description: 'Command has been rolled back'
      })
    } catch (error) {
      console.error('Error rolling back command:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to rollback command'
      })
    }
  }

  return {
    messages,
    isLoading,
    sendMessage,
    rollbackCommand
  }
}