"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Trash2 } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getSLAPolicies,
  createSLAPolicy,
  updateSLAPolicy,
  deleteSLAPolicy,
} from "@/lib/supabase/domain/tickets/queries"

export default function SLAPoliciesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: policies, isLoading } = useQuery({
    queryKey: ["sla-policies"],
    queryFn: getSLAPolicies,
  })

  const createMutation = useMutation({
    mutationFn: createSLAPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sla-policies"] })
      setIsCreateDialogOpen(false)
      toast({
        title: "SLA Policy created",
        description: "The SLA policy has been created successfully.",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSLAPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sla-policies"] })
      toast({
        title: "SLA Policy deleted",
        description: "The SLA policy has been deleted successfully.",
      })
    },
  })

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    createMutation.mutate({
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      priority: parseInt(formData.get("priority") as string),
      response_time_minutes: parseInt(formData.get("response_time") as string),
      resolution_time_minutes: parseInt(formData.get("resolution_time") as string),
    })
  }

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-1/4 bg-muted rounded" />
                <div className="h-4 w-1/2 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-1/2 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">SLA Policies</h1>
          <p className="text-sm text-muted-foreground">
            Manage service level agreement policies for tickets
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Policy
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Create SLA Policy</DialogTitle>
                <DialogDescription>
                  Create a new service level agreement policy
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Premium Support"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Describe the policy..."
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select name="priority" defaultValue="1">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Low</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">High</SelectItem>
                      <SelectItem value="4">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="response_time">Response Time (minutes)</Label>
                  <Input
                    id="response_time"
                    name="response_time"
                    type="number"
                    min="1"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="resolution_time">Resolution Time (minutes)</Label>
                  <Input
                    id="resolution_time"
                    name="resolution_time"
                    type="number"
                    min="1"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {policies?.map((policy) => (
          <Card key={policy.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{policy.name}</CardTitle>
                  <CardDescription>{policy.description}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this policy?")) {
                      deleteMutation.mutate(policy.id)
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Response Time</p>
                    <p className="text-sm text-muted-foreground">
                      {policy.response_time_minutes} minutes
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Resolution Time</p>
                    <p className="text-sm text-muted-foreground">
                      {policy.resolution_time_minutes} minutes
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 