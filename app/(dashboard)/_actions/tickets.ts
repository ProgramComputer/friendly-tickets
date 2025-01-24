'use server'

import { revalidatePath } from 'next/cache'
import { getServerClient } from '@/app/_lib/db/supabase'
import type { CreateTicketInput, UpdateTicketInput } from '@/lib/shared/types/tickets'

export async function createTicket(input: CreateTicketInput) {
  const supabase = await getServerClient()
  
  const { data, error } = await supabase
    .from('tickets')
    .insert(input)
    .select()
    .single()

  if (error) throw new Error('Failed to create ticket')

  revalidatePath('/tickets')
  return data
}

export async function updateTicket(id: string, input: UpdateTicketInput) {
  const supabase = await getServerClient()
  
  const { data, error } = await supabase
    .from('tickets')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error('Failed to update ticket')

  revalidatePath(`/tickets/${id}`)
  return data
}

export async function getTickets() {
  const supabase = await getServerClient()
  
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      customer:customers(*),
      assignee:team_members(*),
      department:departments(*)
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error('Failed to fetch tickets')

  return data
} 