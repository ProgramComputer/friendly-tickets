"use client"

import { useEffect } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  Ticket,
  TicketListParams,
  CreateTicketInput,
  UpdateTicketInput,
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
  const queryClient = useQueryClient()

  const query = useInfiniteQuery({
    queryKey: ticketKeys.list(params),
    queryFn: ({ pageParam }) =>
      getTickets({ ...params, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToTicketUpdates(({ ticket }) => {
      queryClient.setQueryData<Ticket[]>(
        ticketKeys.list(params),
        (oldData) => {
          if (!oldData) return [ticket]
          return oldData.map((t) => (t.id === ticket.id ? ticket : t))
        }
      )
    })

    return () => {
      unsubscribe()
    }
  }, [params, queryClient])

  return query
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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateTicketInput & { id: string }) =>
      updateTicket(id, data),
    onSuccess: (ticket) => {
      // Invalidate ticket lists
      queryClient.invalidateQueries({
        queryKey: ticketKeys.lists(),
      })

      // Update ticket in cache
      queryClient.setQueryData(ticketKeys.detail(ticket.id), ticket)
    },
  })
}

// Utility hook for infinite scroll
export function useInfiniteScroll(
  callback: () => void,
  options: {
    threshold?: number
    root?: Element | null
    rootMargin?: string
  } = {}
) {
  const { threshold = 1, root = null, rootMargin = '0px' } = options

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            callback()
          }
        })
      },
      {
        threshold,
        root,
        rootMargin,
      }
    )

    const target = document.querySelector('#infinite-scroll-trigger')
    if (target) {
      observer.observe(target)
    }

    return () => {
      if (target) {
        observer.unobserve(target)
      }
    }
  }, [callback, threshold, root, rootMargin])
} 