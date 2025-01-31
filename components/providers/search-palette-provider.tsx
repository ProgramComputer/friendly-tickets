import { createContext, useContext, PropsWithChildren } from 'react'
import { useSearchPalette } from '@/lib/hooks/use-search-palette'
import { SearchPalette } from '@/components/search/search-palette'
import { useAuth } from '@/lib/hooks/use-auth'

interface SearchPaletteContextType {
  open: () => void
  close: () => void
  isOpen: boolean
}

const SearchPaletteContext = createContext<SearchPaletteContextType | undefined>(undefined)

export function useSearchPaletteContext() {
  const context = useContext(SearchPaletteContext)
  if (!context) {
    throw new Error('useSearchPaletteContext must be used within SearchPaletteProvider')
  }
  return context
}

export function SearchPaletteProvider({ children }: PropsWithChildren) {
  const { isOpen, searchTerm, setSearchTerm, open, close } = useSearchPalette()
  const { role } = useAuth()

  const handleSelect = (object: { id: string; name: string }) => {
    // Insert the object reference into the input
    const atIndex = searchTerm.lastIndexOf('@')
    if (atIndex !== -1) {
      const newInput = searchTerm.slice(0, atIndex) + 
        `@${object.id}[${object.name}] `
      setSearchTerm(newInput)
    }
  }

  return (
    <SearchPaletteContext.Provider value={{ open, close, isOpen }}>
      {children}
      <SearchPalette
        isOpen={isOpen}
        onClose={close}
        onSelect={handleSelect}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        role={role}
      />
    </SearchPaletteContext.Provider>
  )
} 