"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { authService } from "@/lib/auth/auth-service"
import { supabase } from "@/lib/supabase/client"
import { ROUTES } from "@/lib/constants/routes"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface User {
  email: string
  name?: string
}

export function CustomerUserNav() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    async function loadUser() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: customer } = await supabase
          .from("customers")
          .select("name, email")
          .eq("user_id", authUser.id)
          .single()

        if (customer) {
          setUser({
            email: customer.email,
            name: customer.name,
          })
        }
      }
    }
    loadUser()
  }, [])

  const handleSignOut = async () => {
    const { success, redirectTo } = await authService.signOut()
    if (success && redirectTo) {
      router.push(redirectTo)
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
            <p className="text-sm font-medium leading-none">{user.name || "Customer"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push(ROUTES.settings.customer.profile)}>
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(ROUTES.settings.customer.notifications)}>
            Notifications
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(ROUTES.settings.customer.security)}>
            Security
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 