'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export interface TicketDetail {
  id: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'waiting_on_customer' | 'resolved'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  customer: {
    id: string
    name: string
    email: string
    avatarUrl?: string
  }
  assignee?: {
    id: string
    name: string
    email: string
    avatarUrl?: string
  }
  department?: {
    id: string
    name: string
  }
  created_at: string
  updated_at: string
  due_date?: string
  tags?: string[]
}

interface UpdateTicketInput {
  status?: string
  priority?: string
  assignee_id?: string
  department_id?: string
  due_date?: string
  tags?: string[]
}

async function getTicketDetail(id: string): Promise<TicketDetail> {
  const { data, error } = await supabase
    .from('tickets')
    .select(
      `
      *,
      customer:profiles!customer_id(*),
      assignee:team_members(*),
      department:departments(*)
      `
    )
    .eq('id', id)
    .single()

  if (error) {
    throw error
  }

  return data
}

async function updateTicket(
  id: string,
  input: UpdateTicketInput
): Promise<TicketDetail> {
  const { data, error } = await supabase
    .from('tickets')
    .update({
      status: input.status,
      priority: input.priority,
      assignee_id: input.assignee_id,
      department_id: input.department_id,
      due_date: input.due_date,
      tags: input.tags,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(
      `
      *,
      customer:profiles!customer_id(*),
      assignee:team_members(*),
      department:departments(*)
      `
    )
    .single()

  if (error) {
    throw error
  }

  return data
}

export function useTicketDetail(id: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['tickets', id],
    queryFn: () => getTicketDetail(id),
  })

  const updateMutation = useMutation({
    mutationFn: (input: UpdateTicketInput) => updateTicket(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', id] })
    },
  })

  return {
    ...query,
    updateTicket: updateMutation.mutateAsync,
  }
} 