'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { TeamMember } from '@/types/tickets'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/database.types'

type TeamMember = Database['public']['Tables']['team_members']['Row']

interface CreateTeamMemberInput {
  name: string
  email: string
  role: 'agent' | 'admin'
  departmentId?: string
  specialties?: string[]
}

async function getTeamMembers(): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select(`
      *,
      department:departments!department_id(
        id,
        name,
        description
      )
    `)
    .order('name')

  if (error) {
    throw error
  }

  return data
}

async function createTeamMember(input: CreateTeamMemberInput): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team_members')
    .insert({
      name: input.name,
      email: input.email,
      role: input.role,
      department_id: input.departmentId,
      specialties: input.specialties,
    })
    .select(`
      *,
      department:departments!department_id(
        id,
        name,
        description
      )
    `)
    .single()

  if (error) {
    throw error
  }

  return data
}

async function updateTeamMember(
  id: string,
  input: Partial<CreateTeamMemberInput>
): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team_members')
    .update({
      name: input.name,
      email: input.email,
      role: input.role,
      department_id: input.departmentId,
      specialties: input.specialties,
    })
    .eq('id', id)
    .select(`
      *,
      department:departments!department_id(
        id,
        name,
        description
      )
    `)
    .single()

  if (error) {
    throw error
  }

  return data
}

async function deleteTeamMember(id: string): Promise<void> {
  const { error } = await supabase.from('team_members').delete().eq('id', id)

  if (error) {
    throw error
  }
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ['team-members'],
    queryFn: getTeamMembers,
  })
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
    },
  })
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<CreateTeamMemberInput>) =>
      updateTeamMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
    },
  })
}

export function useDeleteTeamMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] })
    },
  })
}

export async function getTeamMemberRole(userId: string): Promise<string | null> {
  try {
    // First check if user is a customer (to avoid 406 on team_members query for customers)
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .maybeSingle()

    if (customerError) {
      console.error('Error fetching customer:', customerError)
      return null
    }

    if (customer) {
      return 'customer'
    }

    // If not a customer, then check team_members
    const { data: teamMember, error: teamError } = await supabase
      .from('team_members')
      .select('role', { count: 'exact', head: true })
      .eq('user_id', userId)
      .maybeSingle()

    if (teamError) {
      console.error('Error fetching team member role:', teamError)
      return null
    }

    return teamMember?.role ?? null
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