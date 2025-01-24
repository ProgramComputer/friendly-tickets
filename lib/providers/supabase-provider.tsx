'use client'

import { createClient, Context } from '@/lib/supabase/client'
import { type PropsWithChildren, useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

export default function SupabaseProvider({ children }: PropsWithChildren) {
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token !== undefined) {
        // Handle auth state change if needed
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <Context.Provider value={{ supabase }}>
      {children}
    </Context.Provider>
  )
} 