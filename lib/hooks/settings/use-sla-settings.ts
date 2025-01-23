'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export interface SLAConfig {
  id: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  first_response_time: number // in minutes
  resolution_time: number // in minutes
  escalation_time: number // in minutes
  created_at: string
  updated_at: string
}

interface UpdateSLAConfigInput {
  first_response_time: number
  resolution_time: number
  escalation_time: number
}

async function getSLAConfigs(): Promise<SLAConfig[]> {
  const { data, error } = await supabase
    .from('sla_configs')
    .select('*')
    .order('priority')

  if (error) {
    throw error
  }

  return data
}

async function updateSLAConfig(
  priority: string,
  input: UpdateSLAConfigInput
): Promise<SLAConfig> {
  const { data, error } = await supabase
    .from('sla_configs')
    .update({
      first_response_time: input.first_response_time,
      resolution_time: input.resolution_time,
      escalation_time: input.escalation_time,
      updated_at: new Date().toISOString(),
    })
    .eq('priority', priority)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export function useSLASettings() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['sla-configs'],
    queryFn: getSLAConfigs,
  })

  const updateMutation = useMutation({
    mutationFn: ({ priority, ...data }: { priority: string } & UpdateSLAConfigInput) =>
      updateSLAConfig(priority, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-configs'] })
    },
  })

  return {
    ...query,
    updateSLAConfig: updateMutation.mutateAsync,
  }
} 