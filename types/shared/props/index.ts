export interface StatusBadgeProps {
  status: string
  className?: string
}

export interface PriorityIndicatorProps {
  priority: 'low' | 'medium' | 'high' | 'urgent'
  className?: string
}

export interface EditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  readOnly?: boolean
}

export interface WatchersInputProps {
  ticketId: string
  currentWatchers?: string[]
  onWatchersChange?: (watchers: string[]) => void
} 