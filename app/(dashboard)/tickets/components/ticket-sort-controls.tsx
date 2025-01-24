'use client'

import { ArrowDownWideNarrow, ArrowUpWideNarrow } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface TicketSortControlsProps {
  sort?: {
    field: 'created_at' | 'updated_at' | 'priority' | 'status'
    direction: 'asc' | 'desc'
  }
  onSortChange?: (sort: {
    field: 'created_at' | 'updated_at' | 'priority' | 'status'
    direction: 'asc' | 'desc'
  }) => void
}

const sortOptions = [
  { value: 'created_at', label: 'Created Date' },
  { value: 'updated_at', label: 'Last Updated' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
] as const

export function TicketSortControls({
  sort = { field: 'created_at', direction: 'desc' },
  onSortChange,
}: TicketSortControlsProps) {
  const toggleDirection = () => {
    onSortChange?.({
      ...sort,
      direction: sort.direction === 'asc' ? 'desc' : 'asc',
    })
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-8">
            Sort by: {sortOptions.find((option) => option.value === sort.field)?.label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {sortOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              className={cn(sort.field === option.value && 'bg-muted')}
              onClick={() =>
                onSortChange?.({
                  field: option.value,
                  direction: sort.direction,
                })
              }
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={toggleDirection}
      >
        {sort.direction === 'asc' ? (
          <ArrowUpWideNarrow className="h-4 w-4" />
        ) : (
          <ArrowDownWideNarrow className="h-4 w-4" />
        )}
        <span className="sr-only">
          Toggle sort direction ({sort.direction === 'asc' ? 'ascending' : 'descending'})
        </span>
      </Button>
    </div>
  )
} 