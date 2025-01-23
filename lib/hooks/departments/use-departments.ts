'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

interface Department {
  id: string
  name: string
  description?: string
  tags?: string[]
  member_count?: number
  created_at: string
  updated_at: string
}

interface CreateDepartmentInput {
  name: string
  description?: string
  tags?: string[]
}

async function getDepartments(): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('*, team_members(count)')
    .order('name')

  if (error) {
    throw error
  }

  return data.map(dept => ({
    ...dept,
    member_count: dept.team_members?.[0]?.count || 0,
  }))
}

async function createDepartment(input: CreateDepartmentInput): Promise<Department> {
  const { data, error } = await supabase
    .from('departments')
    .insert({
      name: input.name,
      description: input.description,
      tags: input.tags,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

async function updateDepartment(
  id: string,
  input: Partial<CreateDepartmentInput>
): Promise<Department> {
  const { data, error } = await supabase
    .from('departments')
    .update({
      name: input.name,
      description: input.description,
      tags: input.tags,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

async function deleteDepartment(id: string): Promise<void> {
  const { error } = await supabase.from('departments').delete().eq('id', id)

  if (error) {
    throw error
  }
}

export function useDepartments() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['departments'],
    queryFn: getDepartments,
  })

  const createMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<CreateDepartmentInput>) =>
      updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
    },
  })

  return {
    ...query,
    createDepartment: createMutation.mutateAsync,
    updateDepartment: updateMutation.mutateAsync,
    deleteDepartment: deleteMutation.mutateAsync,
  }
} 