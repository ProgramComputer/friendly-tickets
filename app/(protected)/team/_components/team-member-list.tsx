'use client'

import { useState } from 'react'
import { useTeamMembers } from '@/lib/hooks/team/use-team-members'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MoreVertical, Pencil, Trash2, Building2 } from 'lucide-react'
import { toast } from 'sonner'

export function TeamMemberList() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: teamMembers, isLoading, deleteTeamMember } = useTeamMembers()

  const filteredMembers = teamMembers?.filter(
    member =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    try {
      await deleteTeamMember(id)
      toast.success('Team member removed successfully')
    } catch (error) {
      console.error('Error removing team member:', error)
      toast.error('Failed to remove team member')
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-[200px] animate-pulse rounded-lg border bg-muted"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search team members..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredMembers?.map(member => (
          <Card key={member.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatarUrl || "/avatars/default.svg"} />
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <CardTitle>{member.name}</CardTitle>
                  <CardDescription>{member.email}</CardDescription>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a href={`/team/${member.id}/edit`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDelete(member.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {member.department?.name || 'No department assigned'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{member.role}</Badge>
                {member.specialties?.map(specialty => (
                  <Badge key={specialty} variant="outline">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers?.length === 0 && (
        <div className="flex h-[200px] items-center justify-center rounded-lg border">
          <p className="text-muted-foreground">No team members found</p>
        </div>
      )}
    </div>
  )
} 