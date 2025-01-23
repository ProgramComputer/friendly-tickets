export interface TicketFilters {
  search: string
  status: string
  priority: string
  department: string
  assignee: string
  dateRange?: DateRange
  sort: string
}

const defaultFilters: TicketFilters = {
  search: '',
  status: '',
  priority: '',
  department: '',
  assignee: '',
  dateRange: undefined,
  sort: 'created_desc'
}

export function TicketFilters({ onFiltersChange }: TicketFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [filters, setFilters] = useState<TicketFilters>(defaultFilters)
  const { role } = useAuth()

  const handleFilterChange = (key: keyof TicketFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
  }

  return (
    <Card>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  className="pl-8"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </div>
            </div>
            <Button
              variant={showAdvanced ? "secondary" : "outline"}
              size="icon"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
          
          {showAdvanced && <Separator />}
          
          {showAdvanced && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => handleFilterChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="open">
                      <Badge variant="default">Open</Badge>
                    </SelectItem>
                    <SelectItem value="pending">
                      <Badge variant="warning">Pending</Badge>
                    </SelectItem>
                    <SelectItem value="resolved">
                      <Badge variant="success">Resolved</Badge>
                    </SelectItem>
                    <SelectItem value="closed">
                      <Badge variant="secondary">Closed</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={filters.priority}
                  onValueChange={(value) => handleFilterChange("priority", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All priorities</SelectItem>
                    <SelectItem value="low">
                      <Badge variant="secondary">Low</Badge>
                    </SelectItem>
                    <SelectItem value="medium">
                      <Badge variant="default">Medium</Badge>
                    </SelectItem>
                    <SelectItem value="high">
                      <Badge variant="warning">High</Badge>
                    </SelectItem>
                    <SelectItem value="urgent">
                      <Badge variant="destructive">Urgent</Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {(role === "agent" || role === "admin") && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Department</label>
                  <Select
                    value={filters.department}
                    onValueChange={(value) => handleFilterChange("department", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All departments</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {role === "admin" && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Assignee</label>
                  <Select
                    value={filters.assignee}
                    onValueChange={(value) => handleFilterChange("assignee", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All assignees" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All assignees</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="grid gap-2">
                <label className="text-sm font-medium">Sort by</label>
                <Select
                  value={filters.sort}
                  onValueChange={(value) => handleFilterChange("sort", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Created date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_desc">Newest first</SelectItem>
                    <SelectItem value="created_asc">Oldest first</SelectItem>
                    <SelectItem value="updated_desc">Last updated</SelectItem>
                    <SelectItem value="priority_desc">Priority (High to Low)</SelectItem>
                    <SelectItem value="priority_asc">Priority (Low to High)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 