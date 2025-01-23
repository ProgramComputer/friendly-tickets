'use client'

import { Flag } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TicketPriority } from '@/types/tickets'

interface PriorityIndicatorProps {
  priority: TicketPriority
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const priorityConfig = {
  low: {
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    label: 'Low Priority',
  },
  medium: {
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    label: 'Medium Priority',
  },
  high: {
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    label: 'High Priority',
  },
  urgent: {
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    label: 'Urgent Priority',
  },
} as const

const sizeConfig = {
  sm: {
    icon: 'h-3 w-3',
    badge: 'h-6 text-xs px-2',
  },
  md: {
    icon: 'h-4 w-4',
    badge: 'h-7 text-sm px-2.5',
  },
  lg: {
    icon: 'h-5 w-5',
    badge: 'h-8 text-sm px-3',
  },
} as const

export function PriorityIndicator({
  priority,
  showLabel = false,
  size = 'md',
  className,
}: PriorityIndicatorProps) {
  const config = priorityConfig[priority]
  const sizeClasses = sizeConfig[size]

  if (showLabel) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full',
          sizeClasses.badge,
          config.bgColor,
          config.color,
          className
        )}
      >
        <Flag className={sizeClasses.icon} />
        <span>{config.label}</span>
      </div>
    )
  }

  return (
    <Flag
      className={cn(sizeClasses.icon, config.color, 'shrink-0', className)}
      aria-label={config.label}
    />
  )
} 