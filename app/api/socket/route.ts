import { Server } from 'socket.io'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextApiRequest } from 'next'
import { Redis } from '@upstash/redis'

// Initialize Redis for presence and queue management
const redis = Redis.fromEnv()

// Socket.io event types
interface ServerToClientEvents {
  message: (data: { content: string; senderId: string; timestamp: string }) => void
  typing: (data: { userId: string; isTyping: boolean }) => void
  presence: (data: { userId: string; status: 'online' | 'offline' }) => void
  error: (error: { message: string }) => void
}

interface ClientToServerEvents {
  message: (data: { content: string; recipientId: string }) => void
  typing: (data: { isTyping: boolean; recipientId: string }) => void
  join: (data: { userId: string }) => void
  leave: () => void
}

// Presence management
const PRESENCE_CHANNEL = 'presence'
const PRESENCE_TTL = 60 // seconds

async function updatePresence(userId: string, status: 'online' | 'offline') {
  if (status === 'online') {
    await redis.setex(`presence:${userId}`, PRESENCE_TTL, 'online')
  } else {
    await redis.del(`presence:${userId}`)
  }
}

// Authentication middleware
async function authenticate(req: NextApiRequest) {
  const cookieStore = cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) {
    throw new Error('Unauthorized')
  }

  return session
}

// Socket.io server setup
const io = new Server<ClientToServerEvents, ServerToClientEvents>({
  path: '/api/socket',
  addTrailingSlash: false,
  cors: {
    origin: process.env.NEXT_PUBLIC_BASE_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// Connection handler
io.on('connection', async (socket) => {
  try {
    // Authenticate connection
    const session = await authenticate(socket.request as NextApiRequest)
    const userId = session.user.id

    // Join user's room
    socket.join(userId)
    
    // Update presence
    await updatePresence(userId, 'online')
    io.emit('presence', { userId, status: 'online' })

    // Handle messages
    socket.on('message', async ({ content, recipientId }) => {
      try {
        // Save message to database
        // TODO: Implement message persistence

        // Emit to recipient
        io.to(recipientId).emit('message', {
          content,
          senderId: userId,
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    // Handle typing indicators
    socket.on('typing', ({ isTyping, recipientId }) => {
      io.to(recipientId).emit('typing', { userId, isTyping })
    })

    // Handle disconnection
    socket.on('disconnect', async () => {
      await updatePresence(userId, 'offline')
      io.emit('presence', { userId, status: 'offline' })
      socket.leave(userId)
    })

  } catch (error) {
    socket.emit('error', { message: 'Authentication failed' })
    socket.disconnect()
  }
})

// Export configuration
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET() {
  return new NextResponse('Socket.io server running')
} 