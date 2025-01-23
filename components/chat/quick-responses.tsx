import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Lightning, Plus, Search } from 'lucide-react'
import { useSupabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface QuickResponse {
  id: string
  title: string
  content: string
  shortcut?: string
}

interface QuickResponsesProps {
  onSelect: (content: string) => void
  className?: string
}

export function QuickResponses({ onSelect, className }: QuickResponsesProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [shortcut, setShortcut] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { supabase } = useSupabase()

  // Mock data - replace with real data from Supabase
  const responses: QuickResponse[] = [
    {
      id: '1',
      title: 'Greeting',
      content: 'Hi there! How can I help you today?',
      shortcut: '/hi',
    },
    {
      id: '2',
      title: 'Thank You',
      content: 'Thank you for contacting us. Is there anything else I can help you with?',
      shortcut: '/ty',
    },
  ]

  const handleCreate = async () => {
    if (!title || !content) return

    try {
      const { data, error } = await supabase
        .from('chat_quick_responses')
        .insert({
          title,
          content,
          shortcut: shortcut || null,
        })
        .select()
        .single()

      if (error) throw error

      // Reset form
      setTitle('')
      setContent('')
      setShortcut('')
      setIsCreating(false)
    } catch (error) {
      console.error('Error creating quick response:', error)
    }
  }

  const handleSelect = (response: QuickResponse) => {
    onSelect(response.content)
    setIsSearchOpen(false)
  }

  return (
    <div className={className}>
      {/* Quick Access Button */}
      <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Lightning className="h-4 w-4" />
            <span className="hidden sm:inline">Quick Responses</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[300px] p-0"
          align="end"
        >
          <Command>
            <CommandInput placeholder="Search responses..." />
            <CommandList>
              <CommandEmpty>No responses found.</CommandEmpty>
              <CommandGroup>
                {responses.map((response) => (
                  <CommandItem
                    key={response.id}
                    onSelect={() => handleSelect(response)}
                    className="flex flex-col items-start gap-1"
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="font-medium">{response.title}</span>
                      {response.shortcut && (
                        <span className="text-xs text-muted-foreground">
                          {response.shortcut}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground line-clamp-1">
                      {response.content}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Create Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Response</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Quick Response</DialogTitle>
            <DialogDescription>
              Add a new quick response to use in your chats.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="text-sm font-medium"
              >
                Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Greeting"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="content"
                className="text-sm font-medium"
              >
                Response Content
              </label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your response..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="shortcut"
                className="text-sm font-medium"
              >
                Shortcut (optional)
              </label>
              <Input
                id="shortcut"
                value={shortcut}
                onChange={(e) => setShortcut(e.target.value)}
                placeholder="e.g., /greeting"
              />
              <p className="text-xs text-muted-foreground">
                Start with / to create a shortcut command
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreating(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!title || !content}
            >
              Create Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 