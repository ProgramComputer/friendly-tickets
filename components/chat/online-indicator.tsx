'use client'

import { OnlineIndicatorProps } from '@/types/features/chat/indicators'
import { cn } from '@/lib/utils'

export function OnlineIndicator({ isOnline, className }: OnlineIndicatorProps) {
  return (
    <div
      className={cn(
        'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background',
        {
          'bg-green-500': isOnline,
          'bg-muted': !isOnline,
        },
        className
      )}
    >
      <span className="sr-only">{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  )
} 