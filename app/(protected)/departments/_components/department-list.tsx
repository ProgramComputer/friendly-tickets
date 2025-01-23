'use client'

import { useState } from 'react'
import { useDepartments } from '@/lib/hooks/departments/use-departments'
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
import { MoreVertical, Pencil, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'

export function DepartmentList() {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: departments, isLoading, deleteDepartment } = useDepartments()

  const filteredDepartments = departments?.filter(department =>
    department.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    try {
      await deleteDepartment(id)
      toast.success('Department deleted successfully')
    } catch (error) {
      console.error('Error deleting department:', error)
      toast.error('Failed to delete department')
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
          placeholder="Search departments..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredDepartments?.map(department => (
          <Card key={department.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle>{department.name}</CardTitle>
                <CardDescription>
                  {department.description || 'No description'}
                </CardDescription>
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
                    <a href={`/departments/${department.id}/edit`}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={`/departments/${department.id}/members`}>
                      <Users className="mr-2 h-4 w-4" />
                      Manage Members
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => handleDelete(department.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {department.member_count || 0} members
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {department.tags?.map(tag => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDepartments?.length === 0 && (
        <div className="flex h-[200px] items-center justify-center rounded-lg border">
          <p className="text-muted-foreground">No departments found</p>
        </div>
      )}
    </div>
  )
} 