'use client'

import { useEffect, useRef } from 'react'
import { useSupabase } from '@/lib/supabase/client'

interface UseRealtimeProps {
  channelName: string
  onMessage?: (message: any) => void
  onTyping?: (userId: string, isTyping: boolean) => void
  onPresence?: (presence: { joins: Record<string, any>; leaves: Record<string, any> }) => void
}

export function useRealtime({
  channelName,
  onMessage,
  onTyping,
  onPresence,
}: UseRealtimeProps) {
  const supabase = useSupabase()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!channelName) return

    const setupRealtime = async () => {
      // Create a channel for the chat session
      channelRef.current = supabase.channel(channelName, {
        config: {
          presence: {
            key: 'user',
          },
        },
      })

      // Handle new messages
      if (onMessage) {
        channelRef.current.on('broadcast', { event: 'message' }, ({ payload }) => {
          onMessage(payload)
        })
      }

      // Handle typing indicators
      if (onTyping) {
        channelRef.current.on('broadcast', { event: 'typing' }, ({ payload }) => {
          onTyping(payload.userId, payload.isTyping)
        })
      }

      // Handle presence changes
      if (onPresence) {
        channelRef.current
          .on('presence', { event: 'sync' }, () => {
            const state = channelRef.current?.presenceState() || {}
            onPresence({
              joins: state,
              leaves: {},
            })
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            onPresence({
              joins: { [key]: newPresences[0] },
              leaves: {},
            })
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            onPresence({
              joins: {},
              leaves: { [key]: leftPresences[0] },
            })
          })
      }

      // Subscribe to the channel
      await channelRef.current.subscribe()
    }

    setupRealtime()

    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [channelName, onMessage, onTyping, onPresence, supabase])
} 