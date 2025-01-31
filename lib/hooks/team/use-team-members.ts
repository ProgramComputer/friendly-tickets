'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { TeamMember } from '@/types'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types'


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
    .limit(1)
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
    .limit(1)
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

export function useTeamMember(userId: string) {
  return useQuery({
    queryKey: ['team-member', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('auth_user_id', userId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!userId
  })
}

export function useTeamMemberRole(userId: string) {
  return useQuery({
    queryKey: ['team-member-role', userId],
    queryFn: async () => {
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
    },
    enabled: !!userId
  })
} 