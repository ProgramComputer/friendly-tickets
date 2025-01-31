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
    console.log('[Tickets Subscription] Setting up with params:', {
      params,
      timestamp: new Date().toISOString()
    })
    
    const channel = supabase
      .channel(`tickets-changes-${params.status?.join('-')}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        (payload: RealtimePostgresChangesPayload<Database['public']['Tables']['tickets']['Row']>) => {
          console.log('[Tickets Subscription] Update received:', {
            eventType: payload.eventType,
            table: 'tickets',
            oldRecord: payload.old,
            newRecord: payload.new,
            timestamp: new Date().toISOString()
          })
          
          // If this is an update and status changed
          if (payload.eventType === 'UPDATE' && payload.old?.status !== payload.new?.status) {
            console.log('[Tickets Subscription] Status changed, invalidating all lists')
            // Invalidate all ticket lists when status changes
            queryClient.invalidateQueries({ 
              queryKey: ticketKeys.lists(),
              exact: false 
            })
          } else {
            // For other changes, only invalidate the current list if the ticket belongs in it
            const ticketStatus = payload.new?.status
            if (ticketStatus && (!params.status || params.status.includes(ticketStatus))) {
              console.log('[Tickets Subscription] Invalidating current list:', params.status)
              queryClient.invalidateQueries({ 
                queryKey: ticketKeys.list(params),
                exact: true 
              })
            }
          }
          
          // Also invalidate the specific ticket if it exists in the cache
          if (payload.new?.id) {
            console.log('[Tickets Subscription] Invalidating specific ticket:', {
              ticketId: payload.new.id,
              timestamp: new Date().toISOString()
            })
            queryClient.invalidateQueries({ 
              queryKey: ticketKeys.detail(payload.new.id),
              exact: true 
            })
          }
        }
      )
      .subscribe((status) => {
        console.log('[Tickets Subscription] Status update:', {
          status,
          timestamp: new Date().toISOString()
        })
        
        if (status === 'SUBSCRIBED') {
          console.log('[Tickets Subscription] Successfully subscribed to changes')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Tickets Subscription] Channel error occurred')
        }
      })

    return () => {
      console.log('[Tickets Subscription] Cleaning up subscription')
      channel.unsubscribe()
    }
  }, [supabase, queryClient, params.status?.join('-')])

  return useQuery({
    queryKey: ticketKeys.list(params),
    queryFn: async () => {
      console.log('[Tickets Query] Fetching tickets:', {
        params,
        timestamp: new Date().toISOString()
      })
      const response = await getTickets(params)
      console.log('[Tickets Query] Response received:', {
        ticketCount: response.tickets.length,
        timestamp: new Date().toISOString()
      })
      return response.tickets
    },
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