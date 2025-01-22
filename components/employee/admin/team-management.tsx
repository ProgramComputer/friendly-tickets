"use client"

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
import { Separator } from "@/components/ui/separator"
import { PlusCircle, Users } from "lucide-react"

export function TeamManagement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Team Management</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage support teams
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Create a new support team and assign its focus area
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Team Name</Label>
                <Input id="name" placeholder="e.g., Mobile Support" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="area">Focus Area</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select focus area" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mobile">Mobile Apps</SelectItem>
                    <SelectItem value="web">Web Platform</SelectItem>
                    <SelectItem value="api">API Integration</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lead">Team Lead</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team lead" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="john">John Smith</SelectItem>
                    <SelectItem value="sarah">Sarah Johnson</SelectItem>
                    <SelectItem value="michael">Michael Brown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Create Team</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Separator />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Mobile Support Team
            </CardTitle>
            <CardDescription>
              Handles all mobile application related support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Team Lead</Label>
                <div className="text-sm">Sarah Johnson</div>
              </div>
              <div className="grid gap-2">
                <Label>Members (8)</Label>
                <div className="text-sm text-muted-foreground">
                  Sarah Johnson, John Smith, Emma Davis, Michael Brown...
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Manage Members
                </Button>
                <Button variant="outline" size="sm">
                  Edit Team
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Web Platform Team
            </CardTitle>
            <CardDescription>
              Handles web platform and dashboard support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Team Lead</Label>
                <div className="text-sm">John Smith</div>
              </div>
              <div className="grid gap-2">
                <Label>Members (6)</Label>
                <div className="text-sm text-muted-foreground">
                  John Smith, Lisa Chen, David Wilson, Anna Lee...
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Manage Members
                </Button>
                <Button variant="outline" size="sm">
                  Edit Team
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 