import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SmileIcon, PaperclipIcon, SendIcon } from 'lucide-react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { useUploadThing } from '@/lib/uploadthing'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSendMessage: (content: string) => void
  onTyping: (isTyping: boolean) => void
  disabled?: boolean
  className?: string
}

export function ChatInput({
  onSendMessage,
  onTyping,
  disabled,
  className,
}: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { startUpload } = useUploadThing('messageAttachment')

  // Handle typing indicator
  useEffect(() => {
    if (message) {
      onTyping(true)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false)
      }, 1000)
    } else {
      onTyping(false)
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [message, onTyping])

  // Handle message submission
  const handleSubmit = () => {
    if (!message.trim() || disabled) return

    onSendMessage(message.trim())
    setMessage('')
  }

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploading(true)
      const [res] = await startUpload([file])
      
      if (res?.url) {
        onSendMessage(`[File: ${file.name}](${res.url})`)
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Handle emoji selection
  const handleEmojiSelect = (emoji: any) => {
    setMessage((prev) => prev + emoji.native)
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Message Input */}
      <div className="flex gap-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="Type a message..."
          className="min-h-[80px] flex-1"
          disabled={disabled}
        />
        
        <div className="flex flex-col gap-2">
          {/* Emoji Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                disabled={disabled}
              >
                <SmileIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0"
              align="end"
            >
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="light"
              />
            </PopoverContent>
          </Popover>

          {/* File Upload */}
          <Button
            size="icon"
            variant="outline"
            disabled={disabled || isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <PaperclipIcon className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />

          {/* Send Button */}
          <Button
            size="icon"
            disabled={!message.trim() || disabled}
            onClick={handleSubmit}
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Upload Status */}
      {isUploading && (
        <p className="text-sm text-muted-foreground">
          Uploading file...
        </p>
      )}
    </div>
  )
} 