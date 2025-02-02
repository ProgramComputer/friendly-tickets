'use client'

import { useState, useRef, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { useSupabase } from '@/lib/supabase/client'
import { VectorStoreRetriever } from '@langchain/core/vectorstores'
import { useAuth } from '@/lib/hooks/use-auth'
import { Session } from '@supabase/supabase-js'

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  createdAt: Date
  command_data?: {
    result: {
      success: boolean
      message: string
      command_history_id?: number
      ticket_id?: string
      canRollback: boolean
      error?: string
    }
  }
}

interface CommandResult {
  success: boolean
  message: string
  command_history_id?: number
  ticket_id?: string
  canRollback: boolean
  error?: string
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
          userRole: role
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
    console.log('[Debug] Starting rollback for message:', messageId);
    
    const message = messages.find(m => m.id === messageId)
    console.log('[Debug] Found message:', {
      hasMessage: !!message,
      commandData: message?.command_data,
      historyId: message?.command_data?.result.command_history_id
    });
    
    if (!message?.command_data?.result.command_history_id) {
      console.error('No command history ID found for message:', messageId)
      return
    }

    try {
      console.log('[Debug] About to get session');
      // Get current session
      let session: Session | null = null;
      try {
        const sessionResponse = await supabase.auth.getSession()
        console.log('[Debug] Raw session response:', sessionResponse);
        session = sessionResponse.data.session;
        console.log('[Debug] Auth session:', {
          hasSession: !!session,
          user: session?.user?.email,
          accessToken: !!session?.access_token
        });
      } catch (sessionError) {
        console.error('[Debug] Error getting session:', sessionError);
        throw sessionError;
      }

      if (!session?.access_token) {
        throw new Error('No auth session found')
      }

      console.log('[Debug] Calling revert_command with ID:', message.command_data.result.command_history_id);
      
      // Call the revert_command function
      const { data, error } = await supabase.rpc('revert_command', {
        command_id: message.command_data.result.command_history_id
      })

      console.log('[Debug] Revert command response:', { data, error });

      if (error) throw error

      // Wait for the response before updating UI
      const result = data as unknown as CommandResult
      if (result.success) {
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
      } else {
        throw new Error(result.error || 'Failed to rollback command')
      }
    } catch (error) {
      console.error('Error rolling back command:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to rollback command'
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