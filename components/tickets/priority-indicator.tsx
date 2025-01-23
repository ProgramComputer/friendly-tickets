import { Flag } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PriorityIndicatorProps {
  priority: 'low' | 'medium' | 'high' | 'urgent'
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const priorityConfig = {
  low: {
    color: 'text-secondary-light',
    bgColor: 'bg-background-tertiary',
    label: 'Low Priority',
  },
  medium: {
    color: 'text-status-info',
    bgColor: 'bg-status-info',
    label: 'Medium Priority',
  },
  high: {
    color: 'text-status-warning',
    bgColor: 'bg-status-warning',
    label: 'High Priority',
  },
  urgent: {
    color: 'text-status-error',
    bgColor: 'bg-status-error',
    label: 'Urgent Priority',
  },
}

const sizeConfig = {
  sm: {
    icon: 'h-3 w-3',
    badge: 'h-5 px-1.5 text-xs',
  },
  md: {
    icon: 'h-4 w-4',
    badge: 'h-6 px-2 text-sm',
  },
  lg: {
    icon: 'h-5 w-5',
    badge: 'h-7 px-2.5 text-base',
  },
}

export function PriorityIndicator({
  priority,
  showLabel = false,
  size = 'md',
  className,
}: PriorityIndicatorProps) {
  const config = priorityConfig[priority]
  const sizeClass = sizeConfig[size]

  if (showLabel) {
    return (
      <div
        className={cn(
          'inline-flex items-center rounded-full',
          config.bgColor,
          'text-white',
          sizeClass.badge,
          className
        )}
      >
        <Flag className={cn('mr-1', sizeClass.icon)} />
        <span>{config.label}</span>
      </div>
    )
  }

  return (
    <Flag
      className={cn(config.color, sizeClass.icon, className)}
      aria-label={config.label}
    />
  )
} 