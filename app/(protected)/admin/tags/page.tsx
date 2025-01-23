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
import { useToast } from "@/components/ui/use-toast"
import { Plus, Trash2, Edit2 } from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"

interface Tag {
  id: string
  name: string
  description: string
  color: string
}

// Mock API functions - replace with actual Supabase queries
async function getTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name")

  if (error) throw error
  return data
}

async function createTag(tag: Omit<Tag, "id">): Promise<Tag> {
  const { data, error } = await supabase
    .from("tags")
    .insert(tag)
    .select()
    .single()

  if (error) throw error
  return data
}

async function updateTag(id: string, tag: Partial<Tag>): Promise<Tag> {
  const { data, error } = await supabase
    .from("tags")
    .update(tag)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

async function deleteTag(id: string): Promise<void> {
  const { error } = await supabase
    .from("tags")
    .delete()
    .eq("id", id)

  if (error) throw error
}

export default function TagsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: tags, isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: getTags,
  })

  const createMutation = useMutation({
    mutationFn: createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
      setIsCreateDialogOpen(false)
      toast({
        title: "Tag created",
        description: "The tag has been created successfully.",
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: Tag) => updateTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
      setEditingTag(null)
      toast({
        title: "Tag updated",
        description: "The tag has been updated successfully.",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
      toast({
        title: "Tag deleted",
        description: "The tag has been deleted successfully.",
      })
    },
  })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const tagData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      color: formData.get("color") as string,
    }

    if (editingTag) {
      updateMutation.mutate({ ...tagData, id: editingTag.id })
    } else {
      createMutation.mutate(tagData)
    }
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
          <h1 className="text-2xl font-semibold tracking-tight">Tags</h1>
          <p className="text-sm text-muted-foreground">
            Manage tags for categorizing tickets
          </p>
        </div>
        <Dialog
          open={isCreateDialogOpen || !!editingTag}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open)
            if (!open) setEditingTag(null)
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingTag ? "Edit Tag" : "Create Tag"}
                </DialogTitle>
                <DialogDescription>
                  {editingTag
                    ? "Edit an existing tag"
                    : "Create a new tag for categorizing tickets"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Bug"
                    defaultValue={editingTag?.name}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Describe the tag..."
                    defaultValue={editingTag?.description}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="color"
                      name="color"
                      type="color"
                      className="w-24 h-10 p-1"
                      defaultValue={editingTag?.color || "#000000"}
                      required
                    />
                    <div className="flex-1">
                      <Badge
                        style={{
                          backgroundColor: editingTag?.color || "#000000",
                          color: "#ffffff",
                        }}
                      >
                        Preview
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false)
                    setEditingTag(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingTag
                    ? "Save Changes"
                    : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {tags?.map((tag) => (
          <Card key={tag.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    style={{
                      backgroundColor: tag.color,
                      color: "#ffffff",
                    }}
                  >
                    {tag.name}
                  </Badge>
                  <CardDescription>{tag.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditingTag(tag)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this tag?")) {
                        deleteMutation.mutate(tag.id)
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
} 