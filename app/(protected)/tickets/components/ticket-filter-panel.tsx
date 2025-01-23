'use client'

import { useState } from 'react'
import { Calendar, Check, Filter, X } from 'lucide-react'
import { format } from 'date-fns'
import { TicketPriority, TicketStatus } from '@/types/tickets'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

interface TicketFilterPanelProps {
  showAgentFilters?: boolean
  selectedStatus?: TicketStatus[]
  selectedPriority?: TicketPriority[]
  dateRange?: {
    start: Date
    end: Date
  }
  onStatusChange?: (status: TicketStatus[]) => void
  onPriorityChange?: (priority: TicketPriority[]) => void
  onDateRangeChange?: (dateRange: { start: Date; end: Date } | undefined) => void
}

const statusOptions: { value: TicketStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'pending', label: 'Pending' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
]

const priorityOptions: { value: TicketPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
]

export function TicketFilterPanel({
  showAgentFilters = false,
  selectedStatus = [],
  selectedPriority = [],
  dateRange,
  onStatusChange,
  onPriorityChange,
  onDateRangeChange,
}: TicketFilterPanelProps) {
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [isPriorityOpen, setIsPriorityOpen] = useState(false)
  const [isDateOpen, setIsDateOpen] = useState(false)

  const clearFilters = () => {
    onStatusChange?.([])
    onPriorityChange?.([])
    onDateRangeChange?.(undefined)
  }

  const toggleStatus = (status: TicketStatus) => {
    const newStatus = selectedStatus.includes(status)
      ? selectedStatus.filter((s) => s !== status)
      : [...selectedStatus, status]
    onStatusChange?.(newStatus)
  }

  const togglePriority = (priority: TicketPriority) => {
    const newPriority = selectedPriority.includes(priority)
      ? selectedPriority.filter((p) => p !== priority)
      : [...selectedPriority, priority]
    onPriorityChange?.(newPriority)
  }

  const hasActiveFilters =
    selectedStatus.length > 0 ||
    selectedPriority.length > 0 ||
    dateRange !== undefined

  return (
    <div className="flex flex-wrap gap-2">
      {/* Status Filter */}
      <Popover open={isStatusOpen} onOpenChange={setIsStatusOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-8',
              selectedStatus.length > 0 && 'bg-muted text-muted-foreground'
            )}
          >
            <Filter className="mr-2 h-4 w-4" />
            Status
            {selectedStatus.length > 0 && ` (${selectedStatus.length})`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2">
          {statusOptions.map((option) => (
            <Button
              key={option.value}
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => toggleStatus(option.value)}
            >
              <div className="w-4">
                {selectedStatus.includes(option.value) && (
                  <Check className="h-4 w-4" />
                )}
              </div>
              {option.label}
            </Button>
          ))}
        </PopoverContent>
      </Popover>

      {/* Priority Filter */}
      <Popover open={isPriorityOpen} onOpenChange={setIsPriorityOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-8',
              selectedPriority.length > 0 && 'bg-muted text-muted-foreground'
            )}
          >
            <Filter className="mr-2 h-4 w-4" />
            Priority
            {selectedPriority.length > 0 && ` (${selectedPriority.length})`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2">
          {priorityOptions.map((option) => (
            <Button
              key={option.value}
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => togglePriority(option.value)}
            >
              <div className="w-4">
                {selectedPriority.includes(option.value) && (
                  <Check className="h-4 w-4" />
                )}
              </div>
              {option.label}
            </Button>
          ))}
        </PopoverContent>
      </Popover>

      {/* Date Range Filter */}
      <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn('h-8', dateRange && 'bg-muted text-muted-foreground')}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {dateRange ? (
              <>
                {format(dateRange.start, 'MMM d')} -{' '}
                {format(dateRange.end, 'MMM d')}
              </>
            ) : (
              'Date Range'
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            initialFocus
            mode="range"
            defaultMonth={dateRange?.start}
            selected={{
              from: dateRange?.start,
              to: dateRange?.end,
            }}
            onSelect={(range) => {
              if (range?.from && range.to) {
                onDateRangeChange?.({
                  start: range.from,
                  end: range.to,
                })
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {/* Agent-specific Filters */}
      {showAgentFilters && (
        <>
          <Button variant="outline" className="h-8">
            <Filter className="mr-2 h-4 w-4" />
            Department
          </Button>
          <Button variant="outline" className="h-8">
            <Filter className="mr-2 h-4 w-4" />
            Assignee
          </Button>
        </>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8"
          onClick={clearFilters}
        >
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  )
} 