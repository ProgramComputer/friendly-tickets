import { useState, useCallback } from 'react'

export function useSearchPalette() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const open = useCallback(() => {
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setSearchTerm('')
  }, [])

  return {
    isOpen,
    searchTerm,
    setSearchTerm,
    open,
    close
  }
} 