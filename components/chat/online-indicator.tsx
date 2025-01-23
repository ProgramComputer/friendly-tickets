import { cn } from '@/lib/utils'

interface OnlineIndicatorProps {
  isOnline: boolean
  className?: string
}

export function OnlineIndicator({
  isOnline,
  className,
}: OnlineIndicatorProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5',
        className
      )}
    >
      <div
        className={cn(
          'h-2 w-2 rounded-full',
          {
            'bg-green-500': isOnline,
            'bg-gray-300': !isOnline,
          }
        )}
      />
      <span
        className={cn(
          'text-xs',
          {
            'text-green-600': isOnline,
            'text-muted-foreground': !isOnline,
          }
        )}
      >
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  )
} 