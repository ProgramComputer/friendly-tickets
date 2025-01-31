"use client"

import { useEffect, useRef, useCallback } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  Ticket,
  TicketListParams,
  CreateTicketInput,
  UpdateTicketInput,
  TicketListResponse,
} from '@/types/features/tickets'
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  subscribeToTicketUpdates,
} from '@/lib/supabase/domain/tickets/queries'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types'
import { useSupabase } from '@/lib/supabase/client'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

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
      .eq('auth_user_id', userId)
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
  const queryClient = useQueryClient()
  
  // Set up real-time subscription
  useEffect(() => {
    console.log('[Tickets] Setting up real-time subscription')
    
    const channel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        (payload: RealtimePostgresChangesPayload<{
          [key: string]: any
        }>) => {
          console.log('[Tickets] Real-time update received:', {
            eventType: payload.eventType,
            oldRecord: payload.old,
            newRecord: payload.new,
            timestamp: new Date().toISOString()
          })
          
          // Invalidate all ticket-related queries to ensure UI updates
          queryClient.invalidateQueries({ 
            queryKey: ['tickets']
          })
          
          // Also invalidate the specific ticket if it exists in the cache
          const newRecord = payload.new as Ticket | undefined
          if (newRecord?.id) {
            queryClient.invalidateQueries({ 
              queryKey: ['ticket', newRecord.id]
            })
          }
        }
      )
      .subscribe((status) => {
        console.log('[Tickets] Subscription status:', status)
      })

    return () => {
      console.log('[Tickets] Cleaning up subscription')
      channel.unsubscribe()
    }
  }, [supabase, queryClient, params])

  return useInfiniteQuery({
    queryKey: ['tickets', params],
    queryFn: async ({ pageParam }) => {
      const response = await getTickets({
        ...params,
        cursor: pageParam,
      })
      return response
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
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
    mutationFn: async (updates: UpdateTicketInput & { id: string }) => {
      const { data, error } = await supabase
        .from('tickets')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as Database['public']['Tables']['tickets']['Update'])
        .eq('id', updates.id)
        .select()
        .single()

      if (error) throw error
      return data as Ticket
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