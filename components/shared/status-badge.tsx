import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { StatusBadgeProps } from '@/types/shared/props'

interface StatusBadgeProps {
  status: 'open' | 'in_progress' | 'waiting_on_customer' | 'resolved' | 'closed'
  className?: string
}

const STATUS_CONFIG = {
  open: {
    label: 'Open',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-100/80',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80',
  },
  waiting_on_customer: {
    label: 'Waiting on Customer',
    className: 'bg-purple-100 text-purple-800 hover:bg-purple-100/80',
  },
  resolved: {
    label: 'Resolved',
    className: 'bg-green-100 text-green-800 hover:bg-green-100/80',
  },
  closed: {
    label: 'Closed',
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-100/80',
  },
} as const

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <Badge
      variant="secondary"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
} 