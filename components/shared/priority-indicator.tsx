import { AlertCircle, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PriorityIndicatorProps } from '@/types/shared/props'

interface PriorityIndicatorProps {
  priority: 'low' | 'medium' | 'high' | 'urgent'
  showLabel?: boolean
  className?: string
}

const PRIORITY_CONFIG = {
  low: {
    icon: ArrowDown,
    label: 'Low Priority',
    className: 'text-green-500',
  },
  medium: {
    icon: AlertCircle,
    label: 'Medium Priority',
    className: 'text-yellow-500',
  },
  high: {
    icon: AlertTriangle,
    label: 'High Priority',
    className: 'text-orange-500',
  },
  urgent: {
    icon: ArrowUp,
    label: 'Urgent',
    className: 'text-red-500',
  },
} as const

export function PriorityIndicator({
  priority,
  showLabel = false,
  className,
}: PriorityIndicatorProps) {
  const config = PRIORITY_CONFIG[priority]
  const Icon = config.icon

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Icon className={cn('h-4 w-4', config.className)} />
      {showLabel && <span>{config.label}</span>}
    </div>
  )
} 