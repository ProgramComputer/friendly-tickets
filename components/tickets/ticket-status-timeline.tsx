import { cn } from '@/lib/utils'
import { baseStyles } from '@/lib/constants/ui'
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react'

interface TimelineEvent {
  id: string
  status: 'open' | 'pending' | 'resolved' | 'closed'
  timestamp: Date
  actor: {
    id: string
    name: string
    avatar?: string
  }
  note?: string
}

interface TicketStatusTimelineProps {
  events: TimelineEvent[]
  className?: string
}

const statusConfig = {
  open: {
    icon: AlertCircle,
    color: 'text-status-info',
    bgColor: 'bg-status-info',
  },
  pending: {
    icon: Clock,
    color: 'text-status-warning',
    bgColor: 'bg-status-warning',
  },
  resolved: {
    icon: CheckCircle2,
    color: 'text-status-success',
    bgColor: 'bg-status-success',
  },
  closed: {
    icon: XCircle,
    color: 'text-secondary',
    bgColor: 'bg-secondary',
  },
}

export function TicketStatusTimeline({
  events,
  className,
}: TicketStatusTimelineProps) {
  return (
    <div className={cn('space-y-8', className)}>
      {events.map((event, index) => {
        const StatusIcon = statusConfig[event.status].icon
        const isLast = index === events.length - 1

        return (
          <div key={event.id} className="relative">
            {/* Connector Line */}
            {!isLast && (
              <div
                className="absolute left-6 top-10 h-full w-px -translate-x-1/2 bg-border"
                aria-hidden="true"
              />
            )}

            <div className="relative flex gap-x-4">
              {/* Status Icon */}
              <div
                className={cn(
                  'relative flex h-12 w-12 flex-none items-center justify-center rounded-full',
                  'ring-1 ring-border bg-background-primary'
                )}
              >
                <StatusIcon
                  className={cn('h-6 w-6', statusConfig[event.status].color)}
                  aria-hidden="true"
                />
              </div>

              <div className="flex-auto">
                <div className="flex items-baseline justify-between gap-x-4">
                  {/* Status Text */}
                  <div
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                      statusConfig[event.status].bgColor,
                      'text-white'
                    )}
                  >
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </div>

                  {/* Timestamp */}
                  <time
                    dateTime={event.timestamp.toISOString()}
                    className="flex-none text-xs text-secondary"
                  >
                    {event.timestamp.toLocaleString()}
                  </time>
                </div>

                {/* Actor Info */}
                <div className="mt-2 text-sm">
                  <span className="font-medium text-secondary">
                    {event.actor.name}
                  </span>
                  {event.note && (
                    <>
                      <span className="text-secondary-light mx-1">•</span>
                      <span className="text-secondary-light">{event.note}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
} 