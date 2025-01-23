import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { create } from 'zustand'
import { useSupabase } from '@/lib/supabase/client'

// Chat store types
interface Message {
  id: string
  content: string
  senderId: string
  recipientId: string
  timestamp: string
}

interface ChatState {
  messages: Message[]
  onlineUsers: Set<string>
  typingUsers: Set<string>
  addMessage: (message: Message) => void
  setOnlineStatus: (userId: string, isOnline: boolean) => void
  setTypingStatus: (userId: string, isTyping: boolean) => void
}

// Create chat store
const useChatStore = create<ChatState>((set) => ({
  messages: [],
  onlineUsers: new Set(),
  typingUsers: new Set(),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setOnlineStatus: (userId, isOnline) =>
    set((state) => {
      const newOnlineUsers = new Set(state.onlineUsers)
      if (isOnline) {
        newOnlineUsers.add(userId)
      } else {
        newOnlineUsers.delete(userId)
      }
      return { onlineUsers: newOnlineUsers }
    }),
  setTypingStatus: (userId, isTyping) =>
    set((state) => {
      const newTypingUsers = new Set(state.typingUsers)
      if (isTyping) {
        newTypingUsers.add(userId)
      } else {
        newTypingUsers.delete(userId)
      }
      return { typingUsers: newTypingUsers }
    }),
}))

// Chat hook
export function useChat() {
  const socketRef = useRef<Socket>()
  const { session } = useSupabase()
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const {
    messages,
    onlineUsers,
    typingUsers,
    addMessage,
    setOnlineStatus,
    setTypingStatus,
  } = useChatStore()

  // Initialize socket connection
  useEffect(() => {
    if (!session?.user) return

    const socket = io(process.env.NEXT_PUBLIC_BASE_URL!, {
      path: '/api/socket',
      auth: {
        token: session.access_token,
      },
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      setError(null)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('error', ({ message }) => {
      setError(message)
    })

    socket.on('message', (data) => {
      addMessage({
        id: crypto.randomUUID(),
        ...data,
        recipientId: session.user.id,
      })
    })

    socket.on('presence', ({ userId, status }) => {
      setOnlineStatus(userId, status === 'online')
    })

    socket.on('typing', ({ userId, isTyping }) => {
      setTypingStatus(userId, isTyping)
    })

    return () => {
      socket.disconnect()
    }
  }, [session])

  // Send message
  const sendMessage = useCallback(
    (content: string, recipientId: string) => {
      if (!socketRef.current || !session?.user) return

      const message: Message = {
        id: crypto.randomUUID(),
        content,
        senderId: session.user.id,
        recipientId,
        timestamp: new Date().toISOString(),
      }

      socketRef.current.emit('message', {
        content,
        recipientId,
      })

      addMessage(message)
    },
    [session]
  )

  // Send typing indicator
  const sendTyping = useCallback(
    (isTyping: boolean, recipientId: string) => {
      if (!socketRef.current) return

      socketRef.current.emit('typing', {
        isTyping,
        recipientId,
      })
    },
    []
  )

  return {
    isConnected,
    error,
    messages,
    onlineUsers,
    typingUsers,
    sendMessage,
    sendTyping,
  }
} 