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
import { useSupabase } from '@/lib/hooks/use-supabase'
import { TypingIndicator } from './typing-indicator'
import { OnlineIndicator } from './online-indicator'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/lib/hooks/use-auth'
import { ChatMessage } from './chat-message'
import { HybridChain } from '@/lib/commands/hybrid-chain'
import { VectorStoreRetriever } from '@langchain/core/vectorstores'

interface ChatContainerProps {
  sessionId: string
  recipientId: string
  recipientName: string
  className?: string
  retriever: VectorStoreRetriever
}

interface Message {
  id: string
  content: string
  sender_id: string
  sender_name: string
  sender_role: 'customer' | 'agent' | 'admin'
  created_at: string
  command_data?: {
    result: any
  }
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
  const supabase = useSupabase()
  const { toast } = useToast()
  const {
    messages,
    isLoading,
    error: chatError,
    onlineUsers,
    typingUsers,
    sendMessage,
    sendFile,
    sendTypingIndicator,
    deleteMessage,
    editMessage,
  } = useChat(sessionId)
  const { user } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  if (chatError) {
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (content: string) => {
    if (!user) return

    try {
      await sendMessage(content, recipientId)
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      })
    }
  }

  // Handle message submission
  const handleSubmit = async (e?: React.FormEvent) => {
    console.log('[ChatContainer] handleSubmit called:', { input, isLoading })
    if (e) {
      e.preventDefault()
    }
    if (!input.trim() || isLoading) return

    try {
      await handleSendMessage(input)
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
    <div className={cn('flex h-full flex-col bg-background', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-6 py-4 bg-card">
        <div className="relative">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-background">
            <span className="text-sm font-medium">
              {recipientName[0].toUpperCase()}
            </span>
          </div>
          <OnlineIndicator isOnline={isRecipientOnline} className="ring-2 ring-background" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-base">{recipientName}</h3>
          {isRecipientTyping ? (
            <TypingIndicator />
          ) : (
            <span className="text-sm text-muted-foreground">
              {isRecipientOnline ? 'Online' : 'Offline'}
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 px-6 py-4">
        <div className="space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((message, i) => {
              const isUser = message.sender_id === supabase?.user?.id
              const showAvatar = i === 0 || messages[i - 1]?.sender_id !== message.sender_id
              const showTimestamp = i === messages.length - 1 || 
                messages[i + 1]?.sender_id !== message.sender_id

              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn('group flex items-end gap-3', {
                    'justify-end': isUser,
                    'justify-start': !isUser,
                  })}
                >
                  {!isUser && showAvatar && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-background flex-shrink-0">
                      <span className="text-xs font-medium">
                        {recipientName[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <div
                      className={cn(
                        'rounded-2xl px-4 py-2.5 max-w-[85%] break-words shadow-sm',
                        {
                          'bg-primary text-primary-foreground rounded-br-sm': isUser,
                          'bg-muted rounded-bl-sm': !isUser,
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
                    {showTimestamp && (
                      <span className="text-[11px] text-muted-foreground px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {new Date(message.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                  </div>
                  {isUser && showAvatar && (
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center ring-2 ring-background flex-shrink-0">
                      <span className="text-xs font-medium text-primary-foreground">
                        {supabase?.user.email?.[0].toUpperCase()}
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
      {supabase?.user?.role === 'agent' && (
        <div className="px-6 py-3 border-t bg-card/50">
          <QuickResponses onSelect={(response) => setInput(response)} />
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 px-6 border-t bg-card">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              handleTyping()
            }}
            placeholder="Type a message..."
            className="flex-1 bg-background"
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
                <Smile className="h-5 w-5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="end"
              className="w-auto p-0 bg-transparent border-none shadow-lg"
            >
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
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
              <Paperclip className="h-5 w-5 text-muted-foreground" />
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