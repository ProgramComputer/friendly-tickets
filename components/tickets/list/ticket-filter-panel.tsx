'use client'

import { useState } from 'react'
import { Calendar, Check, Filter, X } from 'lucide-react'
import { format } from 'date-fns'
import type { TicketStatus, TicketPriority } from '@/types/tickets'
import { cn } from '@/lib/utils'
import { baseStyles } from '@/lib/constants/ui'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'

interface TicketFilterPanelProps {
  selectedStatus: TicketStatus[]
  selectedPriority: TicketPriority[]
  dateRange: {
    start: Date | undefined
    end: Date | undefined
  }
  onStatusChange: (status: TicketStatus[]) => void
  onPriorityChange: (priority: TicketPriority[]) => void
  onDateRangeChange: (range: { start: Date | undefined; end: Date | undefined }) => void
  className?: string
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
  selectedStatus,
  selectedPriority,
  dateRange,
  onStatusChange,
  onPriorityChange,
  onDateRangeChange,
  className,
}: TicketFilterPanelProps) {
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [isPriorityOpen, setIsPriorityOpen] = useState(false)
  const [isDateOpen, setIsDateOpen] = useState(false)

  const hasFilters =
    selectedStatus.length > 0 ||
    selectedPriority.length > 0 ||
    dateRange.start ||
    dateRange.end

  const clearFilters = () => {
    onStatusChange([])
    onPriorityChange([])
    onDateRangeChange({ start: undefined, end: undefined })
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Status Filter */}
      <Popover open={isStatusOpen} onOpenChange={setIsStatusOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Filter className="mr-2 h-4 w-4" />
            Status
            {selectedStatus.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedStatus.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search status..." />
            <CommandEmpty>No status found.</CommandEmpty>
            <CommandGroup>
              {statusOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    const isSelected = selectedStatus.includes(option.value)
                    if (isSelected) {
                      onStatusChange(
                        selectedStatus.filter((s) => s !== option.value)
                      )
                    } else {
                      onStatusChange([...selectedStatus, option.value])
                    }
                  }}
                >
                  <div
                    className={cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                      selectedStatus.includes(option.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'opacity-50 [&_svg]:invisible'
                    )}
                  >
                    <Check className={cn('h-4 w-4')} />
                  </div>
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Priority Filter */}
      <Popover open={isPriorityOpen} onOpenChange={setIsPriorityOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Filter className="mr-2 h-4 w-4" />
            Priority
            {selectedPriority.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedPriority.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search priority..." />
            <CommandEmpty>No priority found.</CommandEmpty>
            <CommandGroup>
              {priorityOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => {
                    const isSelected = selectedPriority.includes(option.value)
                    if (isSelected) {
                      onPriorityChange(
                        selectedPriority.filter((p) => p !== option.value)
                      )
                    } else {
                      onPriorityChange([...selectedPriority, option.value])
                    }
                  }}
                >
                  <div
                    className={cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                      selectedPriority.includes(option.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'opacity-50 [&_svg]:invisible'
                    )}
                  >
                    <Check className={cn('h-4 w-4')} />
                  </div>
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Date Range Filter */}
      <Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <Calendar className="mr-2 h-4 w-4" />
            {dateRange.start ? (
              dateRange.end ? (
                <>
                  {format(dateRange.start, 'LLL dd, y')} -{' '}
                  {format(dateRange.end, 'LLL dd, y')}
                </>
              ) : (
                format(dateRange.start, 'LLL dd, y')
              )
            ) : (
              'Date Range'
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            initialFocus
            mode="range"
            defaultMonth={dateRange.start}
            selected={{
              from: dateRange.start,
              to: dateRange.end,
            }}
            onSelect={(range) =>
              onDateRangeChange({
                start: range?.from,
                end: range?.to,
              })
            }
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {/* Clear Filters */}
      {hasFilters && (
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