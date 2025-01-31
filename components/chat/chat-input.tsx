import { useState, useRef } from 'react'
import { Paperclip, Send, Smile } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { uploadFile } from '@/lib/services/file-upload'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSendMessage: (content: string, attachments?: { url: string; name: string; type: string }[]) => Promise<void>
  disabled?: boolean
  placeholder?: string
  sessionId: string
}

export function ChatInput({ onSendMessage, disabled, placeholder = 'Type a message...', sessionId }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState<{ url: string; name: string; type: string }[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return
    
    try {
      await onSendMessage(message, attachments)
      setMessage('')
      setAttachments([])
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files?.length) return

    setIsUploading(true)
    try {
      const uploadPromises = Array.from(files).map(file => uploadFile(file, sessionId))
      const results = await Promise.all(uploadPromises)
      setAttachments(prev => [...prev, ...results])
    } catch (error) {
      console.error('Error uploading files:', error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="space-y-2">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div key={index} className="flex items-center gap-1 text-sm text-muted-foreground">
              <Paperclip className="h-4 w-4" />
              <span>{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="min-h-[80px] pr-20 bg-transparent text-transparent caret-foreground"
            disabled={disabled || isUploading}
            style={{ caretColor: 'currentColor' }}
          />
          <div 
            className="absolute inset-0 pointer-events-none p-3 whitespace-pre-wrap break-words text-foreground"
            aria-hidden="true"
          >
            {message ? message : <span className="text-muted-foreground">{placeholder}</span>}
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                disabled={disabled || isUploading}
              >
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-auto p-0">
              <Picker
                data={data}
                onEmojiSelect={(emoji: any) => setMessage(prev => prev + emoji.native)}
              />
            </PopoverContent>
          </Popover>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileUpload}
            multiple
            accept="image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />
          
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            disabled={disabled || isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          <Button
            size="icon"
            className={cn("h-10 w-10", isUploading && "opacity-50 cursor-not-allowed")}
            disabled={disabled || isUploading || (!message.trim() && attachments.length === 0)}
            onClick={handleSend}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
} 