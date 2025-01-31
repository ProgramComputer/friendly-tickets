import { format } from 'date-fns'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CommandRollback } from './command-rollback'
import { CommandResult } from '@/lib/commands/types'
import { renderContentWithTags } from '@/lib/utils/object-tags'

interface ChatMessageProps {
  id: string
  content: string
  sender: {
    id: string
    name: string
    role: 'customer' | 'agent' | 'admin' | 'assistant'
  }
  timestamp: string
  isCurrentUser: boolean
  commandData?: {
    result: CommandResult
  }
  onRollbackComplete?: () => void
}

export function ChatMessage({
  content,
  sender,
  timestamp,
  isCurrentUser,
  commandData,
  onRollbackComplete
}: ChatMessageProps) {
  const isAIAssistant = sender.role === 'assistant'

  return (
    <div className={cn(
      "flex w-full gap-2 py-2",
      isCurrentUser ? "flex-row-reverse" : "flex-row"
    )}>
      <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full bg-muted">
        <User className="h-4 w-4" />
      </div>
      <div className={cn(
        "flex flex-col gap-1",
        isCurrentUser && "items-end"
      )}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {sender.name}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(timestamp), 'p')}
          </span>
        </div>
        <div className={cn(
          "rounded-lg px-3 py-2 text-sm",
          isCurrentUser 
            ? "bg-primary text-primary-foreground" 
            : isAIAssistant
              ? "bg-secondary/10"
              : "bg-muted"
        )}>
          {renderContentWithTags(content, !isCurrentUser)}
        </div>
        {isAIAssistant && commandData?.result && (
          <div className="max-w-md">
            <CommandRollback 
              command={commandData.result}
              onRollbackComplete={onRollbackComplete}
            />
          </div>
        )}
      </div>
    </div>
  )
} 