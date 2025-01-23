import { useEffect, useRef } from 'react'
import { useChat } from '@/lib/hooks/use-chat'
import { MessageThread } from './message-thread'
import { ChatInput } from './chat-input'
import { OnlineIndicator } from './online-indicator'
import { TypingIndicator } from './typing-indicator'
import { cn } from '@/lib/utils'

interface ChatContainerProps {
  recipientId: string
  recipientName: string
  className?: string
}

export function ChatContainer({
  recipientId,
  recipientName,
  className,
}: ChatContainerProps) {
  const {
    messages,
    onlineUsers,
    typingUsers,
    sendMessage,
    sendTyping,
    isConnected,
    error,
  } = useChat()

  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages])

  const isRecipientOnline = onlineUsers.has(recipientId)
  const isRecipientTyping = typingUsers.has(recipientId)

  return (
    <div
      className={cn(
        'flex h-[600px] w-full flex-col rounded-lg border bg-background shadow-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{recipientName}</h3>
          <OnlineIndicator isOnline={isRecipientOnline} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* Message Thread */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4"
      >
        <MessageThread
          messages={messages.filter(
            (msg) =>
              (msg.senderId === recipientId) ||
              (msg.recipientId === recipientId)
          )}
        />
        {isRecipientTyping && <TypingIndicator />}
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <ChatInput
          onSendMessage={(content) => sendMessage(content, recipientId)}
          onTyping={(isTyping) => sendTyping(isTyping, recipientId)}
          disabled={!isConnected}
        />
      </div>
    </div>
  )
} 