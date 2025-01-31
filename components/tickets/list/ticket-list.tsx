'use client'

import { Fragment } from 'react'
import { useTickets, useInfiniteScroll } from '@/lib/hooks/tickets/use-tickets'
import type { TicketListParams } from '@/types/features/tickets'
import { cn } from '@/lib/utils'
import { baseStyles } from '@/lib/constants/ui'
import { Skeleton } from '@/components/ui/skeleton'
import { TicketListItem } from './ticket-list-item'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'

type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed'

interface TicketListProps {
  params: {
    status: TicketStatus[]
    sort: {
      field: string
      direction: 'asc' | 'desc'
    }
  }
  onTicketSelect?: (ticketId: string) => void
  selectedTicketId?: string | null
  view?: 'default' | 'compact'
}

export function TicketList({ params, onTicketSelect, selectedTicketId, view = 'default' }: TicketListProps) {
  const { data: tickets, isLoading, error } = useQuery({
    queryKey: ['tickets', params],
    queryFn: async () => {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('[TicketList] No authenticated user found')
        throw new Error('Not authenticated')
      }
      console.log('[TicketList] Authenticated user:', user.id)

      // Try to get team member first
      const { data: teamMember, error: teamError } = await supabase
        .from('team_members')
        .select('id, role')
        .eq('auth_user_id', user.id)
        .single()

      // If not a team member, try to get customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      console.log('[TicketList] User role check:', {
        isTeamMember: !!teamMember,
        teamMemberError: teamError?.message,
        isCustomer: !!customer,
        customerError: customerError?.message,
        role: teamMember?.role || 'customer'
      })

      // Build query based on user role
      let query = supabase
        .from('tickets')
        .select(`
          id,
          title,
          status,
          priority,
          created_at,
          customer:customer_id(name, email),
          assignee:assignee_id(name, email)
        `)

      // Apply role-based filters
      if (teamMember) {
        console.log('[TicketList] Applying team member filter:', {
          role: teamMember.role,
          id: teamMember.id
        })
        // Team members can see assigned tickets or all tickets if admin
        if (teamMember.role === 'admin') {
          // Admins see all tickets
          console.log('[TicketList] Admin user - showing all tickets')
        } else {
          // Agents see assigned tickets
          console.log('[TicketList] Agent user - showing assigned tickets')
          query = query.eq('assignee_id', teamMember.id)
        }
      } else if (customer) {
        console.log('[TicketList] Applying customer filter:', {
          id: customer.id,
          auth_user_id: user.id
        })
        // Customers only see their own tickets
        query = query.eq('customer_id', customer.id)
      } else {
        console.log('[TicketList] No valid role found for user:', user.id)
        throw new Error('User not found in system')
      }

      // Apply filters
      if (params.status?.length > 0) {
        console.log('[TicketList] Applying status filter:', params.status)
        query = query.in('status', params.status)
      }

      // Apply sorting
      console.log('[TicketList] Applying sort:', {
        field: params.sort?.field || 'created_at',
        direction: params.sort?.direction || 'desc'
      })
      
      // Default to sorting by created_at desc if no valid sort field is provided
      const sortField = params.sort?.field || 'created_at'
      const sortDirection = params.sort?.direction || 'desc'
      
      // Validate sort field against allowed columns
      const allowedSortFields = ['created_at', 'title', 'status', 'priority']
      const validSortField = allowedSortFields.includes(sortField) ? sortField : 'created_at'
      
      query = query.order(validSortField, { ascending: sortDirection === 'asc' })

      const { data, error } = await query
      if (error) {
        console.error('[TicketList] Query error:', {
          error,
          code: error.code,
          details: error.details,
          hint: error.hint,
          message: error.message,
          status: teamMember ? 'team_member' : customer ? 'customer' : 'unknown',
          filters: {
            status: params.status,
            sort: params.sort
          }
        })
        throw error
      }

      console.log('[TicketList] Query success:', {
        count: data?.length || 0,
        status: teamMember ? 'team_member' : customer ? 'customer' : 'unknown',
        firstTicket: data?.[0] ? {
          id: data[0].id,
          title: data[0].title,
          customer: data[0].customer?.name,
          assignee: data[0].assignee?.name
        } : null
      })

      return data
    }
  })

  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        <TicketListItemSkeleton />
        <TicketListItemSkeleton />
      </div>
    )
  }

  if (error) {
    console.error('[TicketList] Error state:', error)
    return (
      <div className="p-4 text-sm text-destructive text-center">
        Error loading tickets: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    )
  }

  if (!tickets?.length) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        No tickets found in this category
      </div>
    )
  }


  return (
    <div className="space-y-1">
      {tickets.map(ticket => (
        <Button
          key={ticket.id}
          variant="ghost"
          className={cn(
            "w-full justify-start p-2 h-auto",
            view === 'compact' ? 'text-sm' : 'text-base',
            selectedTicketId === ticket.id && "bg-accent",
            view === 'default' ? 'space-y-2' : 'space-y-1'
          )}
          onClick={() => onTicketSelect?.(ticket.id)}
        >
          <div className="w-full">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium truncate">{ticket.title}</span>
              <div className="flex items-center gap-2 shrink-0">
                {view === 'default' && (
                  <Badge variant="outline">{ticket.status}</Badge>
                )}
                <Badge 
                  variant="outline" 
                  className={cn(
                    ticket.priority === 'urgent' && 'border-red-500 text-red-500',
                    ticket.priority === 'high' && 'border-orange-500 text-orange-500',
                    ticket.priority === 'medium' && 'border-yellow-500 text-yellow-500',
                    ticket.priority === 'low' && 'border-green-500 text-green-500'
                  )}
                >
                  {ticket.priority}
                </Badge>
              </div>
            </div>
            <div className={cn(
              "flex items-center gap-4 text-muted-foreground",
              view === 'compact' ? 'text-xs' : 'text-sm'
            )}>
              <span>{ticket.customer?.name}</span>
              <span>·</span>
              <span>{formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
              {ticket.assignee && (
                <>
                  <span>·</span>
                  <span>Assigned to {ticket.assignee.name}</span>
                </>
              )}
            </div>
          </div>
        </Button>
      ))}
    </div>
  )
}

function TicketListItemSkeleton() {
  return (
    <div
      className={cn(
        baseStyles.card.base,
        baseStyles.card.bordered,
        'p-4 space-y-4'
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
} 