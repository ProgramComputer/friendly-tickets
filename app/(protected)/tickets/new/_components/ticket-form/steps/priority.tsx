'use client'

import { useState } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { type CreateTicketInput } from '@/lib/schemas/ticket'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { PriorityIndicator } from '@/components/tickets/priority-indicator'

interface PriorityStepProps {
  form: UseFormReturn<CreateTicketInput>
}

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const

export function PriorityStep({ form }: PriorityStepProps) {
  const {
    setValue,
    watch,
    formState: { errors },
  } = form

  const priority = watch('priority')
  const dueDate = watch('dueDate')
  const tags = watch('tags') || []

  const [newTag, setNewTag] = useState('')

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault()
      if (!tags.includes(newTag.trim())) {
        setValue('tags', [...tags, newTag.trim()], { shouldValidate: true })
      }
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setValue(
      'tags',
      tags.filter((tag) => tag !== tagToRemove),
      { shouldValidate: true }
    )
  }

  return (
    <div className="space-y-6">
      {/* Priority Selection */}
      <div className="space-y-2">
        <Label>Priority Level</Label>
        <div className="grid gap-4 sm:grid-cols-4">
          {priorityOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={priority === option.value ? 'default' : 'outline'}
              className="justify-start gap-2"
              onClick={() => setValue('priority', option.value)}
            >
              <PriorityIndicator priority={option.value} />
              {option.label}
            </Button>
          ))}
        </div>
        {errors.priority && (
          <p className="text-sm text-destructive">{errors.priority.message}</p>
        )}
      </div>

      {/* Due Date */}
      <div className="space-y-2">
        <Label>Due Date (Optional)</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !dueDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? format(dueDate, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={(date) => setValue('dueDate', date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags (Optional)</Label>
        <div className="space-y-4">
          <Input
            placeholder="Add tags... (press Enter)"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleAddTag}
          />
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="gap-1"
                >
                  {tag}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove {tag} tag</span>
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 