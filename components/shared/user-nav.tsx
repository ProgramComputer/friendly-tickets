'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ROUTES } from '@/lib/constants/routes'
import { authClient } from '@/lib/auth/auth-client'
import { toast } from 'sonner'

interface User {
  email: string
  name?: string
}

export function UserNav() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    async function loadUser() {
      const currentUser = await authClient.getCurrentUser()
      if (currentUser?.email) {
        setUser({
          email: currentUser.email,
          name: currentUser.name,
        })
      }
    }
    loadUser()
  }, [])

  const handleSignOut = async () => {
    if (isSigningOut) return // Prevent multiple clicks
    
    setIsSigningOut(true)
    console.log('[UserNav] User initiated sign out')
    
    try {
      const { success, error, localDataCleared, isTimeout } = await authClient.signOut()
      
      if (success) {
        if (isTimeout) {
          console.log('[UserNav] Sign out timed out but local data was cleared')
          toast.success('Signed out locally. Some remote data may persist.')
        } else {
          console.log('[UserNav] Sign out successful')
          toast.success('Signed out successfully')
        }
        
        // If we cleared local data, always redirect to login
        if (localDataCleared) {
          router.push(ROUTES.auth.login)
        }
      } else {
        console.error('[UserNav] Sign out failed:', error)
        toast.error(error || 'Failed to sign out. Please try again.')
        
        // If error but local data was cleared, still redirect
        if (localDataCleared) {
          toast.message('Session data was cleared locally')
          router.push(ROUTES.auth.login)
        }
      }
    } catch (error) {
      console.error('[UserNav] Sign out error:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsSigningOut(false)
    }
  }

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {user.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                : user.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={ROUTES.dashboard.settings}>Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={ROUTES.dashboard.settings}>Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? 'Signing out...' : 'Log out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 