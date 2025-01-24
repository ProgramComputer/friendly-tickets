"use client"

import { useEffect, useRef, useCallback } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  Ticket,
  TicketListParams,
  CreateTicketInput,
  UpdateTicketInput,
  TicketListResponse,
} from '@/types/tickets'
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  subscribeToTicketUpdates,
} from '@/lib/supabase/domain/tickets/queries'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/lib/supabase/database.types'
import { useSupabase } from '@/lib/supabase/client'

// Query keys
export const ticketKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketKeys.all, 'list'] as const,
  list: (params: TicketListParams) => [...ticketKeys.lists(), params] as const,
  details: () => [...ticketKeys.all, 'detail'] as const,
  detail: (id: string) => [...ticketKeys.details(), id] as const,
}

// Team member role query
export async function getTeamMemberRole(userId: string) {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    const { data, error } = await supabase
      .from('team_members')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching role:', error)
      return null
    }

    return data?.role || null
  } catch (error) {
    console.error('Error in getTeamMemberRole:', error)
    return null
  }
}

export function useTeamMemberRole(userId: string | undefined) {
  return useQuery({
    queryKey: ['team-member-role', userId],
    queryFn: () => getTeamMemberRole(userId!),
    enabled: !!userId
  })
}

// Hooks
export function useTickets(params: TicketListParams) {
  const supabase = useSupabase()
  
  return useInfiniteQuery({
    queryKey: ['tickets', params],
    queryFn: async ({ pageParam }) => {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          customer:customers!customer_id(*),
          assignee:team_members!assignee_id(*),
          department:departments!department_id(*),
          messages:ticket_messages(count)
        `)
        .order(params.sort?.field || 'created_at', { 
          ascending: params.sort?.direction === 'asc' 
        })
        .range(pageParam || 0, (pageParam || 0) + 9)

      if (error) throw error
      
      return {
        tickets: data as Ticket[],
        nextCursor: data.length === 10 ? pageParam + 10 : undefined
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0
  })
}

export function useTicket(id: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => getTicketById(id),
  })

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToTicketUpdates(({ ticket }) => {
      if (ticket.id === id) {
        queryClient.setQueryData(ticketKeys.detail(id), ticket)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [id, queryClient])

  return query
}

// Ticket creation
export async function createTicket(data: Partial<Ticket>) {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return ticket
}

export function useCreateTicket() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    }
  })
}

export function useUpdateTicket() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Partial<Ticket> & { id: string }) => {
      const { data, error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', updates.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

// Utility hook for infinite scroll
export function useInfiniteScroll(
  onIntersect: () => void,
  options: {
    threshold?: number
    rootMargin?: string
  } = {}
) {
  const observer = useRef<IntersectionObserver>()
  
  const triggerRef = useCallback(
    (node: HTMLElement | null) => {
      if (observer.current) observer.current.disconnect()
      
      observer.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            onIntersect()
          }
        },
        {
          threshold: options.threshold || 0,
          rootMargin: options.rootMargin || '0px',
        }
      )

      if (node) observer.current.observe(node)
    },
    [onIntersect, options.threshold, options.rootMargin]
  )

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect()
      }
    }
  }, [])

  return triggerRef
} 