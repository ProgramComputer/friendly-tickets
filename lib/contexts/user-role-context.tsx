'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useUserRole } from '@/lib/hooks/use-user-role'

type UserRoleContextType = ReturnType<typeof useUserRole>

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined)

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const userRole = useUserRole()
  return (
    <UserRoleContext.Provider value={userRole}>
      {children}
    </UserRoleContext.Provider>
  )
}

export function useUserRoleContext() {
  const context = useContext(UserRoleContext)
  if (context === undefined) {
    throw new Error('useUserRoleContext must be used within a UserRoleProvider')
  }
  return context
} 