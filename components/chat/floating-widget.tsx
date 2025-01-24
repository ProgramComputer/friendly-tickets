import { useState, useEffect } from 'react'
import { MessageCircle, X, Minus, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChat } from '@/lib/hooks/use-chat'
import { ChatContainer } from './chat-container'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useSupabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { startChatSession } from '@/lib/services/chat-session'
import { useToast } from '@/hooks/use-toast'

interface FloatingWidgetProps {
  position?: 'bottom-right' | 'bottom-left'
  className?: string
}

export function FloatingWidget({
  position = 'bottom-right',
  className,
}: FloatingWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPreChatFormComplete, setIsPreChatFormComplete] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { session } = useSupabase()
  const { messages, sendMessage } = useChat()
  const { toast } = useToast()

  // Handle new messages when minimized
  const [unreadCount, setUnreadCount] = useState(0)
  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      setUnreadCount((prev) => prev + 1)
    }
  }, [messages, isOpen])

  // Reset unread count when opening
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0)
    }
  }, [isOpen])

  // Handle pre-chat form submission
  const handleStartChat = async () => {
    if (!name || !email || !message || isLoading) return

    try {
      setIsLoading(true)

      // Get or create customer profile
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .upsert({
          user_id: session?.user?.id,
          name,
          email,
        })
        .select()
        .single()

      if (customerError) throw customerError

      // Start chat session
      const chatSession = await startChatSession({
        customerId: customer.id,
        name,
        email,
        initialMessage: message,
      })

      setIsPreChatFormComplete(true)
      toast({
        title: 'Chat started',
        description: 'An agent will be with you shortly.',
      })
    } catch (error) {
      console.error('Error starting chat:', error)
      toast({
        title: 'Error starting chat',
        description: 'Please try again later.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <Button
        size="lg"
        className={cn(
          'fixed z-50 flex items-center gap-2 rounded-full shadow-lg',
          {
            'bottom-6 right-6': position === 'bottom-right',
            'bottom-6 left-6': position === 'bottom-left',
          },
          className
        )}
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="h-5 w-5" />
        <span>Chat with us</span>
        {unreadCount > 0 && (
          <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-semibold text-destructive-foreground">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn(
              'fixed z-50 flex h-[600px] w-[380px] flex-col rounded-lg bg-background shadow-xl',
              {
                'bottom-24 right-6': position === 'bottom-right',
                'bottom-24 left-6': position === 'bottom-left',
              }
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-lg font-semibold">Chat with us</h3>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden p-4">
              {session?.user || isPreChatFormComplete ? (
                <ChatContainer
                  recipientId="agent-queue" // Replace with actual agent ID
                  recipientName="Support Team"
                />
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Please fill out the form below to start chatting with our team.
                  </p>
                  
                  <div className="space-y-3">
                    <Input
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoading}
                    />
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                    <Textarea
                      placeholder="How can we help?"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="min-h-[100px]"
                      disabled={isLoading}
                    />
                    <Button
                      className="w-full"
                      onClick={handleStartChat}
                      disabled={!name || !email || !message || isLoading}
                    >
                      {isLoading ? 'Starting chat...' : 'Start Chat'}
                    </Button>
                  </div>

                  <div className="mt-6 text-center text-sm text-muted-foreground">
                    <p>By starting a chat, you agree to our</p>
                    <div className="flex items-center justify-center gap-2">
                      <a
                        href="/terms"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        Terms of Service
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <span>&</span>
                      <a
                        href="/privacy"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        Privacy Policy
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
} 