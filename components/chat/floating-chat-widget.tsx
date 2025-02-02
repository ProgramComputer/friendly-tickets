'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  MessageCircle, 
  X, 
  Send, 
  ChevronLeft, 
  Hash,
  User,
  Users,
  FileText,
  Building2,
  MessagesSquare,
  RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion, AnimatePresence } from 'framer-motion'
import { useAIChat } from '@/lib/hooks/use-ai-chat'
import { cn } from '@/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useAuth } from '@/lib/hooks/use-auth'
import { useSupabase } from '@/lib/hooks/use-supabase'
import { SearchPalette } from '@/components/search/search-palette'
import { useSearchPalette } from '@/lib/hooks/use-search-palette'
import { ChatObjectType, ChatObjectReference } from '@/types/features/chat/widgets'
import { useVectorStore } from '@/lib/hooks/use-vector-store'

const objectTypes: ChatObjectType[] = [
  { 
    id: 'ticket', 
    name: 'Ticket', 
    icon: '🎫',
    roles: ['customer', 'agent', 'admin']
  },
  { 
    id: 'agent', 
    name: 'Agent', 
    icon: '👨‍💼',
    roles: ['agent', 'admin']
  },
  { 
    id: 'message', 
    name: 'Message', 
    icon: '💬',
    roles: ['agent', 'admin']
  },
  { 
    id: 'customer', 
    name: 'Customer', 
    icon: '👤',
    roles: ['agent', 'admin']
  },
  { 
    id: 'employee', 
    name: 'Employee', 
    icon: '👔',
    roles: ['admin']
  },
  { 
    id: 'template', 
    name: 'Template', 
    icon: '📄',
    roles: ['agent', 'admin']
  },
  { 
    id: 'team', 
    name: 'Team', 
    icon: '👥',
    roles: ['admin']
  },
]

function TaggedInput({ 
  value, 
  onChange, 
  onKeyDown, 
  placeholder,
  disabled
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const displayRef = useRef<HTMLDivElement>(null)

  // Keep focus on input when value changes
  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.focus()
    }
  }, [value])

  // Handle backspace to delete entire tags
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Backspace' && inputRef.current) {
      const cursorPosition = inputRef.current.selectionStart
      const textBeforeCursor = value.slice(0, cursorPosition)
      
      // Check if we're right after a completed tag
      const tagMatch = textBeforeCursor.match(/@\w+:[^\[\]]+\[[^\]]+\](?:\s+)?$/)
      
      if (tagMatch && cursorPosition === textBeforeCursor.length) {
        e.preventDefault()
        const newValue = value.slice(0, cursorPosition - tagMatch[0].length) + value.slice(cursorPosition)
        const syntheticEvent = {
          target: { value: newValue }
        } as React.ChangeEvent<HTMLTextAreaElement>
        onChange(syntheticEvent)
      }
    }
    
    onKeyDown(e)
  }

  // Update display div with formatted content
  useEffect(() => {
    if (displayRef.current) {
      let formattedContent = value
      // Format @type:id[display] tags
      formattedContent = formattedContent.replace(
        /@(\w+):([^[\]]+)\[([^\]]+)\]/g,
        (match, type, id, display) => {
          const objectType = objectTypes.find(obj => obj.id === type)
          if (!objectType) return match
          return `<span class="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
            ${objectType.icon} ${display}
          </span>`
        }
      )
      // Format incomplete @type tags
      formattedContent = formattedContent.replace(
        /@(\w+)(?!:)/g,
        (match, type) => {
          const objectType = objectTypes.find(obj => obj.id === type)
          if (!objectType) return match
          return `<span class="text-primary">${objectType.icon} ${objectType.name}</span>`
        }
      )
      displayRef.current.innerHTML = formattedContent || placeholder || ''
    }
  }, [value, placeholder])

  return (
    <div className="relative min-h-[40px]" onClick={() => inputRef.current?.focus()}>
      <textarea
        ref={inputRef}
        className={cn(
          "absolute inset-0 w-full resize-none bg-transparent px-3 py-2 pr-12",
          "text-sm text-transparent caret-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        style={{ caretColor: 'currentColor' }}
        disabled={disabled}
      />
      <div
        ref={displayRef}
        className={cn(
          "pointer-events-none min-h-[40px] w-full rounded-md border bg-background px-3 py-2 pr-12",
          "text-sm text-foreground",
          disabled && "opacity-50",
          !value && "text-muted-foreground"
        )}
      />
    </div>
  )
}

export function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [objectReferences, setObjectReferences] = useState<ChatObjectReference[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const retriever = useVectorStore()
  const { messages, isLoading, sendMessage, rollbackCommand } = useAIChat({ retriever })
  const { role } = useAuth()
  const supabase = useSupabase()
  const { 
    isOpen: isSearchOpen, 
    searchTerm,
    setSearchTerm: setSearchPaletteTerm,
    open: openSearch, 
    close: closeSearch 
  } = useSearchPalette()

  // Filter objects based on user role
  const availableObjects = objectTypes.filter(
    object => role && object.roles.includes(role)
  )

  // Handle @ annotations
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Handle @ annotations
    const value = e.target.value
    // Check for @ symbol
    const atIndex = value.lastIndexOf('@')
    if (atIndex !== -1) {
      const afterAt = value.slice(atIndex + 1)
      const colonIndex = afterAt.indexOf(':')
      
      if (colonIndex === -1) {
        // Still in type selection phase
        openSearch()
        setSearchPaletteTerm(afterAt)
      } else {
        // In instance selection phase
        const type = afterAt.slice(0, colonIndex)
        const searchTerm = afterAt.slice(colonIndex + 1)
        if (searchTerm.indexOf(']') === -1) { // Only search if we haven't completed the tag
          openSearch()
          setSearchPaletteTerm(searchTerm)
        }
      }
    }
  }

  // Handle selecting an object
  const handleObjectSelect = (object: ChatObjectType, instance?: { id: string; display: string }) => {
    const atIndex = input.lastIndexOf('@')
    if (atIndex !== -1) {
      let newInput
      if (instance) {
        // If we have a specific instance, use its details
        const beforeAt = input.slice(0, atIndex)
        const afterAt = input.slice(atIndex + object.id.length + 1)
        const tagText = `@${object.id}:${instance.id}[${instance.display}]`
        
        // Find where the current input ends (either at next space or end of string)
        const nextSpaceIndex = afterAt.indexOf(' ')
        const endIndex = nextSpaceIndex !== -1 ? nextSpaceIndex : afterAt.length
        
        // Combine the parts with a space after the tag
        newInput = beforeAt + tagText + ' ' + afterAt.slice(endIndex)
        
        // Set input and update references
        setInput(newInput)
        setObjectReferences([...objectReferences, {
          type: object.id,
          id: instance.id,
          display: instance.display
        }])
        closeSearch()

        // Set focus back to input after a short delay
        setTimeout(() => {
          const inputElement = document.querySelector('textarea')
          if (inputElement) {
            inputElement.focus()
            const cursorPosition = beforeAt.length + tagText.length + 1
            inputElement.setSelectionRange(cursorPosition, cursorPosition)
          }
        }, 0)
      } else {
        // If we're just selecting the type, keep the @ to continue searching
        newInput = input.slice(0, atIndex) + `@${object.id}:`
        setInput(newInput)
      }
    }
  }

  // Role-specific UI text
  const getRoleSpecificUI = () => {
    switch (role) {
      case 'customer':
        return {
          title: 'Support Assistant',
          placeholder: "How can I help you today?",
          buttonTooltip: 'Get Support',
        }
      case 'agent':
        return {
          title: 'Agent Assistant',
          placeholder: "What would you like me to help with?",
          buttonTooltip: 'Open Assistant',
        }
      case 'admin':
        return {
          title: 'Admin Assistant',
          placeholder: "What would you like to manage?",
          buttonTooltip: 'System Management',
        }
      default:
        return {
          title: 'AutoCRM Assistant',
          placeholder: "Type a command...",
          buttonTooltip: 'Open Assistant',
        }
    }
  }

  const ui = getRoleSpecificUI()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading || !role || isSearchOpen) return // Don't submit if search is open

    try {
      // Build input with proper object references
      let contextualInput = input

      // Add references from @ mentions
      if (objectReferences.length > 0) {
        contextualInput = input.replace(/@(\w+):([^[\]]+)\[([^\]]+)\]/g, (match) => {
          // Keep the original reference format as it will be parsed by extractReferences
          return match
        })
      }

      console.log('[AI Chat Widget] Sending message:', {
        originalInput: input,
        contextualInput,
        objectReferences,
        role
      })

      await sendMessage(contextualInput)
      
      // Reset all states after successful send
      setInput('')
      setObjectReferences([])
      closeSearch() // Close and reset search palette
      
      if (scrollRef.current) {
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
          }
        })
      }
    } catch (error) {
      console.error('[AI Chat Widget] Error sending message:', error)
    }
  }

  const renderContentWithTags = (content: string, isAssistant: boolean) => {
    return content.replace(/@(\w+):([^[\]]+)\[([^\]]+)\]/g, (match, type, id, display) => {
      const objectType = objectTypes.find(obj => obj.id === type)
      if (!objectType) return match
      
      return `<span class="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
        ${objectType.icon} ${display}
      </span>`
    })
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // If no role is set, don't show the widget
  if (!role) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute bottom-16 right-0 w-80 h-[500px] rounded-lg shadow-lg border overflow-hidden flex flex-col",
              {
                'bg-background': role !== 'admin',
                'bg-background/95': role === 'admin'
              }
            )}
          >
            <div className={cn(
              "h-14 border-b px-4 flex items-center justify-between",
              {
                'bg-primary/5': role === 'customer',
                'bg-secondary/5': role === 'agent',
                'bg-accent/5': role === 'admin'
              }
            )}>
              <h2 className="font-semibold">{ui.title}</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-auto">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex flex-col space-y-2 text-sm",
                        message.role === 'user' ? "items-end" : "items-start"
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-lg px-4 py-2 max-w-[85%]",
                          message.role === 'user'
                            ? "bg-primary/10 text-foreground"
                            : "bg-accent/10 text-foreground"
                        )}
                      >
                        {message.content && (
                          <div dangerouslySetInnerHTML={{ 
                            __html: renderContentWithTags(message.content, message.role === 'assistant')
                          }} />
                        )}
                        {message.command_data?.result && (
                          <div className="mt-2 pt-2 border-t border-border/50">
                            <div className="text-xs text-muted-foreground">
                              Command Result:
                            </div>
                            {console.log('[Debug] Command Data:', {
                              messageId: message.id,
                              canRollback: message.command_data.result.canRollback,
                              commandData: message.command_data
                            })}
                            <div className="mt-1">
                              {typeof message.command_data.result === 'string' 
                                ? message.command_data.result
                                : message.command_data.result.message
                              }
                            </div>
                            {message.command_data?.result?.canRollback && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2"
                                onClick={() => {
                                  console.log('[Debug] Rollback clicked for message:', message.id);
                                  rollbackCommand(message.id);
                                }}
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Undo Command
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <div className="animate-pulse">●</div>
                      <div className="animate-pulse animation-delay-200">●</div>
                      <div className="animate-pulse animation-delay-400">●</div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            <div className="p-4 border-t">
              <form 
                onSubmit={(e: React.FormEvent<HTMLFormElement>) => void handleSubmit(e)}
                onKeyDown={(e) => {
                  if (isSearchOpen && e.key === 'Enter') {
                    e.preventDefault()
                    e.stopPropagation()
                  }
                }}
                className="relative"
              >
                <div className="relative">
                  <TaggedInput
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !isSearchOpen) {
                        e.preventDefault()
                        void handleSubmit(e)
                      }
                    }}
                    placeholder={ui.placeholder}
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    className="absolute right-1 top-1"
                    disabled={isLoading || !input.trim() || isSearchOpen}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {isSearchOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-2">
                    <SearchPalette
                      isOpen={isSearchOpen}
                      onClose={closeSearch}
                      onSelect={handleObjectSelect}
                      searchTerm={searchTerm}
                      onSearchChange={setSearchPaletteTerm}
                      role={role}
                    />
                  </div>
                )}
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="lg"
        className={cn(
          "fixed z-50 flex items-center gap-2 rounded-full shadow-lg",
          {
            'bottom-6 right-6': true,
          }
        )}
        onClick={() => setIsOpen(prev => !prev)}
      >
        <MessageCircle className="h-5 w-5" />
        <span>{ui.buttonTooltip}</span>
      </Button>
    </div>
  )
} 