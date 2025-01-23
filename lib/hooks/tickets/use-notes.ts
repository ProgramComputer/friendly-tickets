'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

interface Note {
  id: string
  ticket_id: string
  content: string
  author: {
    id: string
    name: string
    email: string
    avatarUrl?: string
  }
  created_at: string
}

interface CreateNoteInput {
  ticket_id: string
  content: string
}

async function getNotes(ticketId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*, author:team_members!author_id(*)')
    .eq('ticket_id', ticketId)
    .order('created_at')

  if (error) {
    throw error
  }

  return data
}

async function addNote(input: CreateNoteInput): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .insert({
      ticket_id: input.ticket_id,
      content: input.content,
    })
    .select('*, author:team_members!author_id(*)')
    .single()

  if (error) {
    throw error
  }

  return data
}

export function useNotes(ticketId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['notes', ticketId],
    queryFn: () => getNotes(ticketId),
  })

  const addMutation = useMutation({
    mutationFn: addNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', ticketId] })
    },
  })

  return {
    ...query,
    addNote: addMutation.mutateAsync,
  }
} 