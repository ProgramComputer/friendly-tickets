import { cn } from '@/lib/utils'

interface TypingIndicatorProps {
  className?: string
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 text-muted-foreground',
        className
      )}
    >
      <div className="flex gap-1">
        <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-current" />
      </div>
      <span className="text-xs">typing</span>
    </div>
  )
} 