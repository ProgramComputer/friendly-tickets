import { useState, useRef, useEffect, KeyboardEvent, useCallback } from 'react'
import { Hash, User, FileText, Building2, MessagesSquare, Users } from 'lucide-react'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from '@/lib/utils'
import { useSupabase } from '@/lib/hooks/use-supabase'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchObjectType, SearchResult, SearchPaletteProps } from '@/types/shared/search'

const objectTypes: SearchObjectType[] = [
  { 
    id: 'ticket', 
    name: 'Ticket', 
    icon: <Hash className="h-4 w-4" />,
    roles: ['customer', 'agent', 'admin'],
    table: 'tickets',
    displayField: 'title'
  },
  { 
    id: 'agent', 
    name: 'Agent', 
    icon: <User className="h-4 w-4" />,
    roles: ['agent', 'admin'],
    table: 'team_members',
    displayField: 'name'
  },
  { 
    id: 'message', 
    name: 'Message', 
    icon: <MessagesSquare className="h-4 w-4" />,
    roles: ['agent', 'admin'],
    table: 'chat_messages',
    displayField: 'content'
  },
  { 
    id: 'customer', 
    name: 'Customer', 
    icon: <User className="h-4 w-4" />,
    roles: ['agent', 'admin'],
    table: 'customers',
    displayField: 'name'
  },
  { 
    id: 'employee', 
    name: 'Employee', 
    icon: <Building2 className="h-4 w-4" />,
    roles: ['admin'],
    table: 'employees',
    displayField: 'name'
  },
  { 
    id: 'template', 
    name: 'Template', 
    icon: <FileText className="h-4 w-4" />,
    roles: ['agent', 'admin'],
    table: 'chat_quick_responses',
    displayField: 'title'
  },
  { 
    id: 'team', 
    name: 'Team', 
    icon: <Users className="h-4 w-4" />,
    roles: ['admin'],
    table: 'teams',
    displayField: 'name'
  }
]

interface SearchResult {
  id: string
  display: string
}

interface SearchPaletteProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (type: SearchObjectType, instance?: { id: string, display: string }) => void
  searchTerm: string
  onSearchChange: (value: string) => void
  role?: 'customer' | 'agent' | 'admin'
}

export function SearchPalette({ 
  isOpen, 
  onClose, 
  onSelect, 
  searchTerm = '', 
  onSearchChange,
  role
}: SearchPaletteProps) {
  const commandRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [selectedType, setSelectedType] = useState<SearchObjectType | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const supabase = useSupabase()

  // Filter objects based on user role
  const availableObjects = objectTypes.filter(
    object => role && object.roles.includes(role)
  )

  console.log('[Search Palette] Initialized with:', {
    isOpen,
    searchTerm,
    role,
    availableObjectTypes: availableObjects.map(obj => obj.id)
  })

  // Effect for handling search term changes
  useEffect(() => {
    console.log('[Search Palette] Search term changed:', {
      term: searchTerm,
      hasSelectedType: !!selectedType,
      selectedType: selectedType?.id,
      displayField: selectedType?.displayField,
      currentResults: searchResults
    })

    if (!selectedType) {
      setSearchResults([])
      return
    }

    const delayedSearch = setTimeout(async () => {
      setIsLoading(true)
      console.log('[Search Palette] Executing search for:', {
        type: selectedType.id,
        term: searchTerm,
        field: selectedType.displayField,
        table: selectedType.table
      })

      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          console.error('[Search Palette] No authenticated user')
          return
        }

        // Try to get team member first
        const { data: teamMember } = await supabase
          .from('team_members')
          .select('id, role')
          .eq('auth_user_id', user.id)
          .single()

        // If not a team member, try to get customer
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()

        if (!teamMember && !customer) {
          console.error('[Search Palette] User not found in system')
          return
        }

        console.log('[Search Palette] User role check:', {
          isTeamMember: !!teamMember,
          isCustomer: !!customer,
          role: teamMember?.role || 'customer'
        })

        // Build the query based on the object type
        let query = supabase
          .from(selectedType.table)
          .select('*')
          .limit(10)

        // Add type-specific filters and search conditions
        switch (selectedType.id) {
          case 'ticket':
            // Apply role-based filters
            query = query.select('id, title, status, priority')
            
            if (teamMember) {
              if (teamMember.role !== 'admin') {
                // Non-admin team members only see assigned tickets
                query = query.eq('assignee_id', teamMember.id)
              }
              // Admins can see all tickets
            } else if (customer) {
              // Customers only see their own tickets
              query = query.eq('customer_id', customer.id)
            }
            
            // Add search term filter
            if (searchTerm) {
              query = query.ilike('title', `%${searchTerm}%`)
            }
            break

          case 'agent':
            query = query
              .select('id, name, email')
            if (searchTerm) {
              query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
            }
            break

          case 'customer':
            query = query
              .select('id, name, email')
            if (searchTerm) {
              query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
            }
            break

          case 'message':
            query = query
              .select('id, content')
            if (searchTerm) {
              query = query.ilike('content', `%${searchTerm}%`)
            }
            break

          case 'template':
            query = query
              .select('id, title, content')
            if (searchTerm) {
              query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
            }
            break

          case 'team':
            query = query
              .select('id, name')
            if (searchTerm) {
              query = query.ilike('name', `%${searchTerm}%`)
            }
            break

          case 'employee':
            query = query
              .select('id, name, email')
            if (searchTerm) {
              query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
            }
            break
        }

        const { data, error } = await query

        console.log('[Search Palette] Raw search results:', {
          success: !!data,
          count: data?.length,
          error: error?.message,
          data
        })

        if (error) {
          console.error('[Search Palette] Search error:', error)
          setSearchResults([])
          return
        }

        if (!data || data.length === 0) {
          console.log('[Search Palette] No results found')
          setSearchResults([])
          return
        }

        // Format results based on object type
        const formattedResults = data.map(item => {
          switch (selectedType.id) {
            case 'customer':
            case 'employee':
            case 'agent':
              return {
                id: item.id,
                display: `${item.name} (${item.email})`
              }
            case 'message':
              return {
                id: item.id,
                display: item.content.substring(0, 50) + (item.content.length > 50 ? '...' : '')
              }
            case 'template':
              return {
                id: item.id,
                display: item.title
              }
            default:
              return {
                id: item.id,
                display: item[selectedType.displayField]
              }
          }
        })

        console.log('[Search Palette] Setting formatted results:', formattedResults)
        setSearchResults(formattedResults)
      } catch (error) {
        console.error('[Search Palette] Search error:', error)
        setSearchResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm, selectedType, supabase])

  // Reset active index when search results change
  useEffect(() => {
    setActiveIndex(0)
  }, [searchTerm, selectedType])

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    const items = selectedType ? searchResults : availableObjects
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(prev => 
          prev < items.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(prev => prev > 0 ? prev - 1 : prev)
        break
      case 'Enter':
        e.preventDefault()
        if (items.length === 0) return

        console.log('[Search Palette] Enter pressed:', {
          phase: selectedType ? 'instance' : 'type',
          activeIndex,
          hasSelection: !!items[activeIndex]
        })

        if (selectedType) {
          // Second phase - selecting an instance
          const selectedInstance = searchResults[activeIndex]
          if (selectedInstance) {
            console.log('[Search Palette] Selecting instance:', selectedInstance)
            handleSelect(selectedType, selectedInstance)
          }
        } else {
          // First phase - selecting an object type
          const selectedObject = availableObjects[activeIndex]
          if (selectedObject) {
            console.log('[Search Palette] Selecting type:', selectedObject)
            setSelectedType(selectedObject)
            onSearchChange('')
          }
        }
        break
      case 'Escape':
        e.preventDefault()
        if (selectedType) {
          console.log('[Search Palette] Escape pressed: clearing selected type')
          setSelectedType(null)
          onSearchChange('')
        } else {
          console.log('[Search Palette] Escape pressed: closing palette')
          onClose()
        }
        break
      case 'Tab':
        e.preventDefault()
        if (e.shiftKey) {
          setActiveIndex(prev => 
            prev > 0 ? prev - 1 : items.length - 1
          )
        } else {
          setActiveIndex(prev => 
            prev < items.length - 1 ? prev + 1 : 0
          )
        }
        break
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (commandRef.current && !commandRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Debug render
  console.log('[Search Palette] Rendering with:', {
    selectedType: selectedType?.id,
    searchResultsCount: searchResults.length,
    isLoading,
    activeIndex
  })

  if (!isOpen) return null

  const getRoleSpecificUI = () => {
    if (selectedType) {
      return {
        title: `Search ${selectedType.name}s`,
        placeholder: `Search ${selectedType.name.toLowerCase()}s... (↑↓ to navigate)`,
        emptyText: isLoading 
          ? 'Loading...' 
          : `No ${selectedType.name.toLowerCase()}s found. Try different keywords.`,
      }
    }

    switch (role) {
      case 'customer':
        return {
          title: 'What do you need help with?',
          placeholder: 'Search options... (↑↓ to navigate)',
          emptyText: 'No matching options found. Try different keywords.',
        }
      case 'agent':
        return {
          title: 'Select Object to Update',
          placeholder: 'Search objects... (↑↓ to navigate)',
          emptyText: 'No matching objects found. Try different keywords.',
        }
      case 'admin':
        return {
          title: 'Select System Object',
          placeholder: 'Search system objects... (↑↓ to navigate)',
          emptyText: 'No matching system objects found.',
        }
      default:
        return {
          title: 'Select Object Type',
          placeholder: 'Search... (↑↓ to navigate)',
          emptyText: 'No objects found.',
        }
    }
  }

  const ui = getRoleSpecificUI()

  const handleSelect = (object: SearchObjectType, instance?: SearchResult) => {
    console.log('[Search Palette] Selection made:', {
      type: object.id,
      instance
    })
    
    if (!instance) {
      // First phase - selecting object type
      console.log('[Search Palette] Setting selected type:', object)
      setSelectedType(object)
      onSearchChange('') // Clear search term for second phase
      return // Don't close palette yet
    }
    
    // Second phase - selecting specific instance
    onSelect(object, {
      id: instance.id,
      display: instance.display
    })
    onClose()
  }

  return (
    <div 
      ref={commandRef} 
      onKeyDown={(e) => {
        // Prevent form submission while palette is open
        if (e.key === 'Enter') {
          e.preventDefault()
          e.stopPropagation()
        }
        handleKeyDown(e)
      }}
    >
      <Command className="rounded-lg border shadow-md">
        <div className="flex items-center border-b px-3">
          {selectedType && (
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 h-8 w-8"
              onClick={() => {
                console.log('[Search Palette] Clearing selected type')
                setSelectedType(null)
                onSearchChange('')
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <CommandInput 
            placeholder={ui.placeholder}
            value={searchTerm}
            onValueChange={onSearchChange}
            // Prevent form submission on Enter
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                e.stopPropagation()
              }
            }}
          />
        </div>
        <CommandList>
          {(!selectedType || (selectedType && searchResults.length === 0 && !isLoading)) && (
            <CommandEmpty>
              {isLoading 
                ? 'Loading...'
                : selectedType
                  ? `No ${selectedType.name.toLowerCase()}s found`
                  : 'No results found'
              }
            </CommandEmpty>
          )}
          <CommandGroup heading={ui.title}>
            {selectedType 
              ? searchResults.map((result, index) => (
                  <CommandItem
                    key={result.id}
                    onSelect={() => handleSelect(selectedType, result)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 cursor-pointer",
                      {
                        'hover:bg-primary/5': role === 'customer',
                        'hover:bg-secondary/5': role === 'agent',
                        'hover:bg-accent/5': role === 'admin',
                        'bg-primary/10': role === 'customer' && index === activeIndex,
                        'bg-secondary/10': role === 'agent' && index === activeIndex,
                        'bg-accent/10': role === 'admin' && index === activeIndex
                      }
                    )}
                  >
                    {selectedType.icon}
                    <span>{result.display}</span>
                  </CommandItem>
                ))
              : availableObjects.map((object, index) => (
                  <CommandItem
                    key={object.id}
                    onSelect={() => handleSelect(object)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 cursor-pointer",
                      {
                        'hover:bg-primary/5': role === 'customer',
                        'hover:bg-secondary/5': role === 'agent',
                        'hover:bg-accent/5': role === 'admin',
                        'bg-primary/10': role === 'customer' && index === activeIndex,
                        'bg-secondary/10': role === 'agent' && index === activeIndex,
                        'bg-accent/10': role === 'admin' && index === activeIndex
                      }
                    )}
                  >
                    {object.icon}
                    <span>{object.name}</span>
                  </CommandItem>
                ))
            }
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  )
} 