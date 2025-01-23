import { useSupabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Avatar } from '@/components/ui/avatar'
import { AvatarFallback, AvatarImage } from '@radix-ui/react-avatar'
import { Linkify } from 'linkify-react'

interface Message {
  id: string
  content: string
  senderId: string
  timestamp: string
}

interface MessageThreadProps {
  messages: Message[]
  className?: string
}

export function MessageThread({ messages, className }: MessageThreadProps) {
  const { session } = useSupabase()
  const currentUserId = session?.user?.id

  return (
    <div className={cn('space-y-4', className)}>
      {messages.map((message) => {
        const isSender = message.senderId === currentUserId
        
        return (
          <div
            key={message.id}
            className={cn('flex items-start gap-2', {
              'flex-row-reverse': isSender,
            })}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={`/api/avatar/${message.senderId}`} />
              <AvatarFallback>
                {message.senderId.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div
              className={cn(
                'rounded-lg px-4 py-2 max-w-[70%]',
                {
                  'bg-primary text-primary-foreground': isSender,
                  'bg-muted': !isSender,
                }
              )}
            >
              <div className="break-words">
                <Linkify options={{ target: '_blank' }}>
                  {message.content}
                </Linkify>
              </div>
              <div
                className={cn('text-xs mt-1', {
                  'text-primary-foreground/70': isSender,
                  'text-muted-foreground': !isSender,
                })}
              >
                {format(new Date(message.timestamp), 'HH:mm')}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
} 