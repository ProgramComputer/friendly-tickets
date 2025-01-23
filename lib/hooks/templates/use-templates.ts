'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

interface Template {
  id: string
  name: string
  content: string
  category?: string
  tags?: string[]
  created_at: string
  updated_at: string
  created_by: string
}

interface CreateTemplateInput {
  name: string
  content: string
  category?: string
  tags?: string[]
}

async function getTemplates(): Promise<Template[]> {
  const { data, error } = await supabase
    .from('response_templates')
    .select('*')
    .order('name')

  if (error) {
    throw error
  }

  return data
}

async function createTemplate(input: CreateTemplateInput): Promise<Template> {
  const { data, error } = await supabase
    .from('response_templates')
    .insert({
      name: input.name,
      content: input.content,
      category: input.category,
      tags: input.tags,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

async function updateTemplate(
  id: string,
  input: Partial<CreateTemplateInput>
): Promise<Template> {
  const { data, error } = await supabase
    .from('response_templates')
    .update({
      name: input.name,
      content: input.content,
      category: input.category,
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

async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('response_templates')
    .delete()
    .eq('id', id)

  if (error) {
    throw error
  }
}

export function useTemplates() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['templates'],
    queryFn: getTemplates,
  })

  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<CreateTemplateInput>) =>
      updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  return {
    ...query,
    createTemplate: createMutation.mutateAsync,
    updateTemplate: updateMutation.mutateAsync,
    deleteTemplate: deleteMutation.mutateAsync,
  }
} 