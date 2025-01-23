'use client'

import { ArrowDownWideNarrow, ArrowUpWideNarrow } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TicketSortControlsProps {
  sort: {
    field: 'created_at' | 'updated_at' | 'priority' | 'status'
    direction: 'asc' | 'desc'
  }
  onSortChange: (sort: {
    field: 'created_at' | 'updated_at' | 'priority' | 'status'
    direction: 'asc' | 'desc'
  }) => void
  className?: string
}

const sortOptions = [
  { value: 'created_at', label: 'Created Date' },
  { value: 'updated_at', label: 'Updated Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
] as const

export function TicketSortControls({
  sort,
  onSortChange,
  className,
}: TicketSortControlsProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            Sort by: {sortOptions.find((o) => o.value === sort.field)?.label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup
            value={sort.field}
            onValueChange={(value) =>
              onSortChange({
                field: value as typeof sort.field,
                direction: sort.direction,
              })
            }
          >
            {sortOptions.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                className="cursor-pointer"
              >
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2"
        onClick={() =>
          onSortChange({
            field: sort.field,
            direction: sort.direction === 'asc' ? 'desc' : 'asc',
          })
        }
      >
        {sort.direction === 'asc' ? (
          <ArrowUpWideNarrow className="h-4 w-4" />
        ) : (
          <ArrowDownWideNarrow className="h-4 w-4" />
        )}
        <span className="sr-only">
          Sort {sort.direction === 'asc' ? 'ascending' : 'descending'}
        </span>
      </Button>
    </div>
  )
} 