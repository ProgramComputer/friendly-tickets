"use client"

import { AlertCircle, AlertTriangle, ArrowDown, ArrowUp } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const priorities = [
  {
    value: "low",
    label: "Low",
    icon: ArrowDown,
    description: "Non-urgent issues that can be addressed later",
    color: "text-blue-500",
  },
  {
    value: "medium",
    label: "Medium",
    icon: ArrowUp,
    description: "Issues that need attention but aren't critical",
    color: "text-yellow-500",
  },
  {
    value: "high",
    label: "High",
    icon: AlertTriangle,
    description: "Important issues that need prompt attention",
    color: "text-orange-500",
  },
  {
    value: "urgent",
    label: "Urgent",
    icon: AlertCircle,
    description: "Critical issues requiring immediate attention",
    color: "text-red-500",
  },
] as const

interface TicketPrioritySelectProps {
  value: string
  onValueChange: (value: string) => void
}

export function TicketPrioritySelect({
  value,
  onValueChange,
}: TicketPrioritySelectProps) {
  const selectedPriority = priorities.find((p) => p.value === value)

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue>
          {selectedPriority && (
            <div className="flex items-center gap-2">
              <selectedPriority.icon
                className={`h-4 w-4 ${selectedPriority.color}`}
              />
              <span>{selectedPriority.label}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {priorities.map((priority) => (
          <SelectItem
            key={priority.value}
            value={priority.value}
            className="py-3"
          >
            <div className="flex items-center gap-2">
              <priority.icon className={`h-4 w-4 ${priority.color}`} />
              <div className="flex flex-col gap-1">
                <span className="font-medium">{priority.label}</span>
                <span className="text-xs text-muted-foreground">
                  {priority.description}
                </span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}