"use client"

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getTicketTags } from '@/lib/hooks/tickets/use-ticket-tags'

export interface Tag {
  id: string
  name: string
  color: string
}

interface TicketTagSelectProps {
  selectedTags: Tag[]
  onTagsChange: (tags: Tag[]) => void
  className?: string
}

export function TicketTagSelect({ selectedTags = [], onTagsChange, className }: TicketTagSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')

  const { data: tags = [], isLoading } = useQuery({
    queryKey: ['ticket-tags'],
    queryFn: getTicketTags
  })

  const handleSelect = (tag: Tag) => {
    const isSelected = selectedTags.some((t) => t.id === tag.id)
    if (isSelected) {
      onTagsChange(selectedTags.filter((t) => t.id !== tag.id))
    } else {
      onTagsChange([...selectedTags, tag])
    }
  }

  const handleRemove = (tagId: string) => {
    onTagsChange(selectedTags.filter((t) => t.id !== tagId))
  }

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between"
            disabled={isLoading}
          >
            <span className="truncate">
              {selectedTags.length === 0
                ? 'Select tags...'
                : `${selectedTags.length} tag${selectedTags.length === 1 ? '' : 's'} selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search tags..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandEmpty>No tags found.</CommandEmpty>
            <CommandGroup>
              {tags
                .filter((tag) =>
                  tag.name.toLowerCase().includes(searchValue.toLowerCase())
                )
                .map((tag) => {
                  const isSelected = selectedTags.some((t) => t.id === tag.id)
                  return (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => handleSelect(tag)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <Badge
                        variant="outline"
                        className={cn(
                          'mr-2',
                          tag.color && `border-${tag.color}-500 bg-${tag.color}-50 text-${tag.color}-700`
                        )}
                      >
                        {tag.name}
                      </Badge>
                    </CommandItem>
                  )
                })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className={cn(
                'pr-1.5',
                tag.color && `border-${tag.color}-500 bg-${tag.color}-50 text-${tag.color}-700`
              )}
            >
              {tag.name}
              <Button
                variant="ghost"
                size="icon"
                className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                onClick={() => handleRemove(tag.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
} 