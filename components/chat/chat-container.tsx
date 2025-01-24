'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Paperclip, Smile, FileIcon, ImageIcon, XIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { useChat } from '@/lib/hooks/use-chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { QuickResponses } from './quick-responses'
import { useSupabase } from '@/lib/supabase/client'
import { TypingIndicator } from './typing-indicator'
import { OnlineIndicator } from './online-indicator'
import { useToast } from '@/hooks/use-toast'

interface ChatContainerProps {
  sessionId: string
  recipientId: string
  recipientName: string
  className?: string
}

export function ChatContainer({
  sessionId,
  recipientId,
  recipientName,
  className,
}: ChatContainerProps) {
  const [input, setInput] = useState('')
  const [uploadingFile, setUploadingFile] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const { session } = useSupabase()
  const { toast } = useToast()
  const {
    messages,
    isLoading,
    error,
    onlineUsers,
    typingUsers,
    sendMessage,
    sendFile,
    sendTypingIndicator,
    deleteMessage,
    editMessage,
  } = useChat(sessionId)

  // Handle typing indicator
  const handleTyping = () => {
    sendTypingIndicator(true)
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      sendTypingIndicator(false)
    }, 1000)
  }

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        sendTypingIndicator(false)
      }
    }
  }, [sendTypingIndicator])

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-destructive">Error loading messages. Please try again.</p>
      </div>
    )
  }

  // Auto scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Handle message submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    if (!input.trim() || isLoading) return

    try {
      await sendMessage(input, recipientId)
      setInput('')
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      })
    }
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFile(true)
    try {
      await sendFile(file, recipientId)
      e.target.value = '' // Reset input
    } catch (error) {
      console.error('Error uploading file:', error)
    } finally {
      setUploadingFile(false)
    }
  }

  // Handle emoji selection
  const handleEmojiSelect = (emoji: any) => {
    setInput((prev) => prev + emoji.native)
  }

  // Render attachment preview
  const renderAttachment = (url: string, type: string, name: string) => {
    if (type.startsWith('image/')) {
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block max-w-xs hover:opacity-90 transition-opacity"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={name}
            className="rounded-lg max-h-48 object-cover"
          />
          <span className="text-xs text-muted-foreground mt-1 block">
            {name}
          </span>
        </a>
      )
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 hover:opacity-90 transition-opacity"
      >
        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
          <FileIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        <span className="text-sm text-muted-foreground">{name}</span>
      </a>
    )
  }

  const isRecipientOnline = Boolean(onlineUsers[recipientId])
  const isRecipientTyping = Boolean(typingUsers[recipientId])

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b p-4">
        <div className="relative">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium">
              {recipientName[0].toUpperCase()}
            </span>
          </div>
          <OnlineIndicator isOnline={isRecipientOnline} />
        </div>
        <div>
          <h3 className="font-medium">{recipientName}</h3>
          {isRecipientTyping && <TypingIndicator />}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message, i) => {
              const isUser = message.sender_id === session?.user?.id
              const showAvatar = i === 0 || messages[i - 1]?.sender_id !== message.sender_id

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn('flex items-end gap-2', {
                    'justify-end': isUser,
                    'justify-start': !isUser,
                  })}
                >
                  {!isUser && showAvatar && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {recipientName[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div
                    className={cn(
                      'rounded-lg px-4 py-2 max-w-[75%] break-words',
                      {
                        'bg-primary text-primary-foreground': isUser,
                        'bg-muted': !isUser,
                      }
                    )}
                  >
                    {message.content}
                    {message.attachment_url && message.attachment_type && message.attachment_name && (
                      <div className="mt-2">
                        {renderAttachment(
                          message.attachment_url,
                          message.attachment_type,
                          message.attachment_name
                        )}
                      </div>
                    )}
                  </div>
                  {isUser && showAvatar && (
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-xs font-medium text-primary-foreground">
                        {session.user.email?.[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Quick Responses (Agents Only) */}
      {session?.user?.role === 'agent' && (
        <div className="px-4 py-2 border-t">
          <QuickResponses onSelect={(response) => setInput(response)} />
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              handleTyping()
            }}
            placeholder="Type a message..."
            className="flex-1"
            disabled={isLoading || uploadingFile}
          />
          
          {/* Emoji Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-10 w-10"
                disabled={uploadingFile}
              >
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              className="w-auto p-0 bg-transparent border-none"
            >
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="light"
                set="apple"
              />
            </PopoverContent>
          </Popover>

          {/* File Upload */}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-10 w-10 relative"
            disabled={uploadingFile}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            {uploadingFile ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx"
              disabled={uploadingFile}
            />
          </Button>

          {/* Send Button */}
          <Button
            type="submit"
            size="icon"
            disabled={(!input.trim() && !uploadingFile) || isLoading}
            className="h-10 w-10"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </div>
  )
} 