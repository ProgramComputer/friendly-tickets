"use client"

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { useTicketTags } from '@/lib/hooks/tickets/use-ticket-tags'

interface TicketTagSelectProps {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
}

export function TicketTagSelect({ selectedTags = [], onTagsChange }: TicketTagSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const { data: tags = [], isLoading } = useTicketTags()

  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchValue.toLowerCase())
  )

  const handleSelect = (tagId: string) => {
    const newTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId]
    onTagsChange(newTags)
  }

  const handleRemove = (tagId: string) => {
    onTagsChange(selectedTags.filter(id => id !== tagId))
  }

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between"
          >
            Select tags
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0">
          <Command>
            <CommandInput
              placeholder="Search tags..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandEmpty>No tags found.</CommandEmpty>
            <CommandGroup>
              {filteredTags.map(tag => (
                <CommandItem
                  key={tag.id}
                  value={tag.id}
                  onSelect={() => handleSelect(tag.id)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedTags.includes(tag.id) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <Badge
                    variant="outline"
                    style={{ backgroundColor: tag.color + '20', borderColor: tag.color }}
                  >
                    {tag.name}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      <div className="flex flex-wrap gap-2">
        {selectedTags.map(tagId => {
          const tag = tags.find(t => t.id === tagId)
          if (!tag) return null
          return (
            <Badge
              key={tag.id}
              variant="outline"
              style={{ backgroundColor: tag.color + '20', borderColor: tag.color }}
            >
              {tag.name}
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-4 w-4 p-0"
                onClick={() => handleRemove(tag.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )
        })}
      </div>
    </div>
  )
} 