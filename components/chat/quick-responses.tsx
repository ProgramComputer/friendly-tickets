import { useState } from 'react'
import { Plus, Search, Command } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  CommandShortcut,
} from '@/components/ui/command'

interface QuickResponse {
  id: string
  title: string
  content: string
  shortcut?: string
  category: string
}

interface QuickResponsesProps {
  onSelect: (content: string) => void
}

// Mock data - replace with actual data from database
const mockResponses: QuickResponse[] = [
  {
    id: '1',
    title: 'Greeting',
    content: 'Hi there! How can I help you today?',
    shortcut: '/hi',
    category: 'general',
  },
  {
    id: '2',
    title: 'Thank You',
    content: 'Thank you for contacting us. Have a great day!',
    shortcut: '/ty',
    category: 'general',
  },
]

export function QuickResponses({ onSelect }: QuickResponsesProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [newResponse, setNewResponse] = useState({
    title: '',
    content: '',
    shortcut: '',
    category: 'general',
  })

  // Filter responses based on search
  const filteredResponses = mockResponses.filter(
    (response) =>
      response.title.toLowerCase().includes(search.toLowerCase()) ||
      response.content.toLowerCase().includes(search.toLowerCase()) ||
      response.shortcut?.toLowerCase().includes(search.toLowerCase())
  )

  // Group responses by category
  const groupedResponses = filteredResponses.reduce(
    (acc, response) => {
      if (!acc[response.category]) {
        acc[response.category] = []
      }
      acc[response.category].push(response)
      return acc
    },
    {} as Record<string, QuickResponse[]>
  )

  const handleCreate = () => {
    // TODO: Save to database
    console.log('Creating quick response:', newResponse)
    setIsCreating(false)
    setNewResponse({
      title: '',
      content: '',
      shortcut: '',
      category: 'general',
    })
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start gap-2"
        onClick={() => setSearch('')}
      >
        <Command className="h-4 w-4" />
        <span>Quick Responses</span>
      </Button>

      <CommandDialog>
        <CommandInput
          placeholder="Search quick responses..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No quick responses found.</CommandEmpty>
          {Object.entries(groupedResponses).map(([category, responses]) => (
            <CommandGroup key={category} heading={category}>
              {responses.map((response) => (
                <CommandItem
                  key={response.id}
                  onSelect={() => {
                    onSelect(response.content)
                    setSearch('')
                  }}
                >
                  <span>{response.title}</span>
                  {response.shortcut && (
                    <CommandShortcut>{response.shortcut}</CommandShortcut>
                  )}
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
                htmlFor="content"
                className="text-sm font-medium text-foreground"
              >
                Response Content
              </label>
              <Input
                id="content"
                value={newResponse.content}
                onChange={(e) =>
                  setNewResponse((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="e.g., Hi there! How can I help you today?"
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
            <div className="space-y-2">
              <label
                htmlFor="category"
                className="text-sm font-medium text-foreground"
              >
                Category
              </label>
              <Input
                id="category"
                value={newResponse.category}
                onChange={(e) =>
                  setNewResponse((prev) => ({ ...prev, category: e.target.value }))
                }
                placeholder="e.g., general"
              />
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