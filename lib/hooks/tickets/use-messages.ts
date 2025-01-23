'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

interface Message {
  id: string
  ticket_id: string
  content: string
  sender: {
    id: string
    name: string
    email: string
    avatarUrl?: string
  }
  created_at: string
}

interface CreateMessageInput {
  ticket_id: string
  content: string
}

async function getMessages(ticketId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!sender_id(*)')
    .eq('ticket_id', ticketId)
    .order('created_at')

  if (error) {
    throw error
  }

  return data
}

async function addMessage(input: CreateMessageInput): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      ticket_id: input.ticket_id,
      content: input.content,
    })
    .select('*, sender:profiles!sender_id(*)')
    .single()

  if (error) {
    throw error
  }

  return data
}

export function useMessages(ticketId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['messages', ticketId],
    queryFn: () => getMessages(ticketId),
  })

  const addMutation = useMutation({
    mutationFn: addMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', ticketId] })
    },
  })

  return {
    ...query,
    addMessage: addMutation.mutateAsync,
  }
} 