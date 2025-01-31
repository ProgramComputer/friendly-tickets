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
    const channel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets'
        },
        () => {
          console.log('[Tickets] Real-time update received, invalidating query')
          queryClient.invalidateQueries({ queryKey: ['tickets', params] })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [supabase, queryClient, params])

  return useInfiniteQuery({
    queryKey: ['tickets', params],
    queryFn: async ({ pageParam }) => {
      console.log('[Tickets] Starting ticket fetch with params:', { pageParam, params })
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      console.log('[Tickets] Current user:', { id: user?.id, email: user?.email })
      if (!user) throw new Error('Not authenticated')

      // Check if user is a team member (agent/admin)
      const { data: teamMember, error: teamMemberError } = await supabase
        .from('team_members')
        .select('id, role, department_id')
        .eq('auth_user_id', user.id)
        .maybeSingle()
        
      console.log('[Tickets] Team member lookup:', { 
        found: !!teamMember,
        role: teamMember?.role,
        departmentId: teamMember?.department_id,
        error: teamMemberError?.message 
      })

      let query = supabase
        .from('tickets')
        .select(`
          *,
          customer:customers!customer_id(*),
          assignee:team_members!assignee_id(*),
          department:departments!department_id(*),
          messages:ticket_messages(count)
        `)

      // Apply role-based filters
      if (teamMember) {
        console.log('[Tickets] Applying team member filters:', { role: teamMember.role })
        if (teamMember.role === 'admin') {
          console.log('[Tickets] Admin role - no filters applied')
        } else if (teamMember.role === 'agent') {
          console.log('[Tickets] Agent role - filtering by assignment and department:', {
            agentId: teamMember.id,
            departmentId: teamMember.department_id
          })
          query = query.or(`assignee_id.eq.${teamMember.id},and(department_id.eq.${teamMember.department_id},assignee_id.is.null)`)
        }
      } else {
        // Get customer ID for customer role
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()

        console.log('[Tickets] Customer lookup:', { 
          userId: user.id, 
          customerId: customer?.id,
          found: !!customer,
          error: customerError?.message 
        })

        if (!customer) throw new Error('User has no valid role')
        
        console.log('[Tickets] Customer role - filtering by customer_id:', customer.id)
        query = query.eq('customer_id', customer.id)
      }

      // Apply sorting
      query = query.order(params.sort?.field || 'created_at', { 
        ascending: params.sort?.direction === 'asc' 
      })
      .range(pageParam || 0, (pageParam || 0) + 9)

      const { data, error } = await query

      console.log('[Tickets] Query results:', { 
        ticketsFound: data?.length ?? 0,
        role: teamMember?.role || 'customer',
        error: error?.message,
        filters: params,
        pageParam
      })

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