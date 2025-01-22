"use client"

import {
  Bug,
  HelpCircle,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  Smartphone,
  Zap,
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const categories = [
  {
    value: "general",
    label: "General Inquiry",
    icon: HelpCircle,
    description: "General questions and support requests",
  },
  {
    value: "technical",
    label: "Technical Issue",
    icon: Settings,
    description: "Problems with system functionality",
  },
  {
    value: "bug",
    label: "Bug Report",
    icon: Bug,
    description: "Report a software bug or defect",
  },
  {
    value: "feature",
    label: "Feature Request",
    icon: Zap,
    description: "Suggest new features or improvements",
  },
  {
    value: "security",
    label: "Security Issue",
    icon: ShieldAlert,
    description: "Security-related concerns or vulnerabilities",
  },
  {
    value: "mobile",
    label: "Mobile App",
    icon: Smartphone,
    description: "Issues specific to the mobile application",
  },
  {
    value: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Problems with dashboard functionality",
  },
] as const

interface TicketCategorySelectProps {
  value: string
  onValueChange: (value: string) => void
}

export function TicketCategorySelect({
  value,
  onValueChange,
}: TicketCategorySelectProps) {
  const selectedCategory = categories.find((c) => c.value === value)

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a category">
          {selectedCategory && (
            <div className="flex items-center gap-2">
              <selectedCategory.icon className="h-4 w-4" />
              <span>{selectedCategory.label}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem
            key={category.value}
            value={category.value}
            className="py-3"
          >
            <div className="flex items-center gap-2">
              <category.icon className="h-4 w-4" />
              <div className="flex flex-col gap-1">
                <span className="font-medium">{category.label}</span>
                <span className="text-xs text-muted-foreground">
                  {category.description}
                </span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}