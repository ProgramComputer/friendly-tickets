"use client"

import { useEffect, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/hooks/use-auth"
import { supabase } from '@/lib/supabase/client'

interface Template {
  id: string
  name: string
  description: string | null
}

interface TicketTemplateSelectProps {
  value?: string
  onValueChange: (value: string) => void
}

export function TicketTemplateSelect({
  value,
  onValueChange,
}: TicketTemplateSelectProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { role } = useAuth()

  useEffect(() => {
    async function loadTemplates() {
      try {
        const { data, error } = await supabase
          .from("ticket_templates")
          .select("id, name, description")
          .eq("is_public", true)
          .order("name")

        if (error) throw error

        setTemplates(data || [])
      } catch (error) {
        console.error("Error loading templates:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTemplates()
  }, [])

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Loading templates..." />
        </SelectTrigger>
      </Select>
    )
  }

  if (templates.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="No templates available" />
        </SelectTrigger>
      </Select>
    )
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a template" />
      </SelectTrigger>
      <SelectContent>
        {templates.map((template) => (
          <SelectItem key={template.id} value={template.id}>
            {template.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 