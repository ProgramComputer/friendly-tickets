import { useState } from 'react'
import { Plus, Search, Command, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

interface QuickResponse {
  id: string
  title: string
  content: string
  shortcut?: string
  category: string
  team_member_id: string
  is_shared: boolean
}

interface QuickResponsesProps {
  onSelect: (content: string) => void
}

const RESPONSE_CATEGORIES = [
  'General',
  'Technical',
  'Billing',
  'Product',
  'Closing',
  'Escalation',
] as const

export function QuickResponses({ onSelect }: QuickResponsesProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { user } = useAuth()
  const [newResponse, setNewResponse] = useState({
    title: '',
    content: '',
    shortcut: '',
    category: 'General',
    is_shared: false,
  })

  const { data: responses, isLoading } = useQuery({
    queryKey: ['quickResponses'],
    queryFn: async () => {
      // Fetch both personal and shared responses
      const { data, error } = await supabase
        .from('chat_quick_responses')
        .select('*')
        .or(`team_member_id.eq.${user?.id},is_shared.eq.true`)
        .order('category')

      if (error) throw error
      return data as QuickResponse[]
    },
  })

  // Group responses by category
  const groupedResponses = responses?.reduce((acc, response) => {
    if (!acc[response.category]) {
      acc[response.category] = []
    }
    acc[response.category].push(response)
    return acc
  }, {} as Record<string, QuickResponse[]>)

  // Filter responses based on search
  const filteredCategories = Object.entries(groupedResponses || {}).filter(
    ([category, responses]) =>
      responses.some(
        (response) =>
          response.title.toLowerCase().includes(search.toLowerCase()) ||
          response.content.toLowerCase().includes(search.toLowerCase()) ||
          response.shortcut?.toLowerCase().includes(search.toLowerCase())
      )
  )

  const handleCreate = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_quick_responses')
        .insert({
          ...newResponse,
          team_member_id: user?.id,
        })
        .select()
        .single()

      if (error) throw error

      setIsCreating(false)
      setNewResponse({
        title: '',
        content: '',
        shortcut: '',
        category: 'General',
        is_shared: false,
      })
    } catch (error) {
      console.error('Error creating quick response:', error)
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2"
        onClick={() => setIsOpen(true)}
      >
        <Command className="h-4 w-4" />
        <span>Quick Responses</span>
      </Button>

      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput
          placeholder="Search quick responses..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No quick responses found.</CommandEmpty>
          {!isLoading &&
            filteredCategories.map(([category, responses]) => (
              <CommandGroup key={category} heading={category}>
                {responses
                  .filter(
                    (response) =>
                      response.title.toLowerCase().includes(search.toLowerCase()) ||
                      response.content.toLowerCase().includes(search.toLowerCase()) ||
                      response.shortcut?.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((response) => (
                    <CommandItem
                      key={response.id}
                      onSelect={() => {
                        onSelect(response.content)
                        setIsOpen(false)
                        setSearch('')
                      }}
                    >
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{response.title}</span>
                          {response.is_shared && (
                            <Badge variant="secondary" className="ml-2">
                              Shared
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground line-clamp-1">
                          {response.content}
                        </span>
                        {response.shortcut && (
                          <span className="text-xs text-muted-foreground">
                            Shortcut: {response.shortcut}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            ))}
          <CommandSeparator />
          <CommandGroup>
            <CommandItem onSelect={() => setIsCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create new quick response
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Quick Response</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="text-sm font-medium text-foreground"
              >
                Title
              </label>
              <Input
                id="title"
                value={newResponse.title}
                onChange={(e) =>
                  setNewResponse((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g., Greeting"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="category"
                className="text-sm font-medium text-foreground"
              >
                Category
              </label>
              <Select
                value={newResponse.category}
                onValueChange={(value) =>
                  setNewResponse((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {RESPONSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label
                htmlFor="content"
                className="text-sm font-medium text-foreground"
              >
                Response Content
              </label>
              <Textarea
                id="content"
                value={newResponse.content}
                onChange={(e) =>
                  setNewResponse((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="e.g., Hi there! How can I help you today?"
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="shortcut"
                className="text-sm font-medium text-foreground"
              >
                Shortcut (Optional)
              </label>
              <Input
                id="shortcut"
                value={newResponse.shortcut}
                onChange={(e) =>
                  setNewResponse((prev) => ({ ...prev, shortcut: e.target.value }))
                }
                placeholder="e.g., /greeting"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_shared"
                checked={newResponse.is_shared}
                onChange={(e) =>
                  setNewResponse((prev) => ({ ...prev, is_shared: e.target.checked }))
                }
              />
              <label
                htmlFor="is_shared"
                className="text-sm font-medium text-foreground"
              >
                Share with team
              </label>
            </div>
            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={!newResponse.title || !newResponse.content}
            >
              Create Quick Response
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 