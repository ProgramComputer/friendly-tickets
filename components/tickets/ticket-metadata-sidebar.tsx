import { Clock, Flag, Hash, User, Tag, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { baseStyles } from '@/lib/constants/ui'

interface TicketMetadata {
  id: string
  status: 'open' | 'pending' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee?: {
    id: string
    name: string
    avatar?: string
  }
  createdAt: Date
  updatedAt: Date
  tags: string[]
}

interface TicketMetadataSidebarProps {
  metadata: TicketMetadata
  className?: string
}

const statusColors = {
  open: 'bg-status-info text-white',
  pending: 'bg-status-warning text-white',
  resolved: 'bg-status-success text-white',
  closed: 'bg-secondary text-white',
}

const priorityColors = {
  low: 'bg-background-tertiary text-secondary',
  medium: 'bg-status-info text-white',
  high: 'bg-status-warning text-white',
  urgent: 'bg-status-error text-white',
}

export function TicketMetadataSidebar({
  metadata,
  className,
}: TicketMetadataSidebarProps) {
  return (
    <div className={cn('h-full p-4', className)}>
      <div className="space-y-6">
        {/* Status and Priority */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              statusColors[metadata.status]
            )}>
              {metadata.status.charAt(0).toUpperCase() + metadata.status.slice(1)}
            </span>
            <span className={cn(
              'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
              priorityColors[metadata.priority]
            )}>
              {metadata.priority.charAt(0).toUpperCase() + metadata.priority.slice(1)}
            </span>
          </div>
        </div>

        {/* Metadata Fields */}
        <div className="space-y-4">
          <MetadataField
            icon={<Hash className="h-4 w-4" />}
            label="Ticket ID"
            value={metadata.id}
          />
          
          <MetadataField
            icon={<User className="h-4 w-4" />}
            label="Assignee"
            value={metadata.assignee?.name || 'Unassigned'}
          />

          <MetadataField
            icon={<Calendar className="h-4 w-4" />}
            label="Created"
            value={metadata.createdAt.toLocaleDateString()}
          />

          <MetadataField
            icon={<Clock className="h-4 w-4" />}
            label="Last Updated"
            value={metadata.updatedAt.toLocaleDateString()}
          />

          {metadata.tags.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center text-sm text-secondary">
                <Tag className="mr-2 h-4 w-4" />
                <span>Tags</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {metadata.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-background-secondary px-2 py-0.5 text-xs font-medium text-secondary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface MetadataFieldProps {
  icon: React.ReactNode
  label: string
  value: string
}

function MetadataField({ icon, label, value }: MetadataFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center text-sm text-secondary">
        {icon && <span className="mr-2">{icon}</span>}
        <span>{label}</span>
      </div>
      <div className="text-sm">{value}</div>
    </div>
  )
} 