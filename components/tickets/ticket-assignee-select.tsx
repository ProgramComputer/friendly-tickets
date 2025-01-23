"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useQuery } from "@tanstack/react-query"
import { createClient } from "@supabase/supabase-js"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2 } from "lucide-react"

interface TeamMember {
  user_id: string
  name: string | null
  email: string
  role: string
  department: string | null
}

interface TicketAssigneeSelectProps {
  value?: string
  onValueChange: (value: string) => void
}

export function TicketAssigneeSelect({
  value,
  onValueChange,
}: TicketAssigneeSelectProps) {
  const [agents, setAgents] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const { data: teamMembers, isLoading: queryLoading } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("user_id, name, email, role, department")
        .in("role", ["admin", "agent"])
        .order("name")

      if (error) throw error
      return data as TeamMember[]
    },
  })

  const selectedMember = teamMembers?.find((m) => m.user_id === value)

  if (queryLoading) {
    return (
      <div className="flex h-10 items-center gap-2 rounded-md border px-3 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading team members...</span>
      </div>
    )
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Assign to team member">
          {selectedMember && (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback>
                  {selectedMember.name
                    ? selectedMember.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                    : selectedMember.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm">
                  {selectedMember.name || selectedMember.email}
                </span>
                <span className="text-xs text-muted-foreground">
                  {selectedMember.department || selectedMember.role}
                </span>
              </div>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {teamMembers?.map((member) => (
          <SelectItem key={member.user_id} value={member.user_id} className="py-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {member.name
                    ? member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                    : member.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">
                  {member.name || member.email}
                </span>
                <span className="text-xs text-muted-foreground">
                  {member.department || member.role}
                </span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}