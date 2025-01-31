"use client"

import { useQuery } from '@tanstack/react-query'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types'

export interface Tag {
  id: string
  name: string
  color: string
}

export async function getTicketTags(): Promise<Tag[]> {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching tags:', error)
    throw error
  }

  return data || []
}

export function useTicketTags() {
  return useQuery({
    queryKey: ['ticket-tags'],
    queryFn: getTicketTags
  })
} 