"use client"

import { useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { ArrowDownUp, BarChart3, Brain, Scale } from "lucide-react"
import { getRoutingConfig, updateRoutingConfig } from "@/lib/supabase/domain/tickets/routing"
import { toast } from "sonner"

export function RoutingRules() {
  const queryClient = useQueryClient()

  const { data: config, isLoading } = useQuery({
    queryKey: ['routing-config'],
    queryFn: getRoutingConfig
  })

  const updateMutation = useMutation({
    mutationFn: updateRoutingConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routing-config'] })
      toast.success('Routing configuration updated')
    },
    onError: (error) => {
      console.error('Error updating routing config:', error)
      toast.error('Failed to update routing configuration')
    }
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-[600px] animate-pulse rounded-lg border bg-muted" />
      </div>
    )
  }

  const handleSmartRoutingChange = (enabled: boolean) => {
    updateMutation.mutate({ smartRouting: enabled })
  }

  const handleWeightChange = (type: 'expertise' | 'workload' | 'response', value: number) => {
    const update: Record<string, number> = {}
    switch (type) {
      case 'expertise':
        update.expertiseWeight = value
        break
      case 'workload':
        update.workloadWeight = value
        break
      case 'response':
        update.responseTimeWeight = value
        break
    }
    updateMutation.mutate(update)
  }

  const handleDistributionMethodChange = (value: string) => {
    updateMutation.mutate({
      distributionMethod: value as 'weighted' | 'least-loaded' | 'performance'
    })
  }

  const handleAutoScalingChange = (enabled: boolean) => {
    updateMutation.mutate({ autoScaling: enabled })
  }

  const handleMaxTicketsChange = (value: string) => {
    updateMutation.mutate({ maxTicketsPerAgent: parseInt(value) })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Routing Intelligence</h3>
        <p className="text-sm text-muted-foreground">
          Configure ticket routing and load balancing settings
        </p>
      </div>
      <Separator />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="mr-2 h-4 w-4" />
              Smart Routing
            </CardTitle>
            <CardDescription>
              Automatically route tickets based on agent expertise and availability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="smart-routing">Enable Smart Routing</Label>
                <Switch
                  id="smart-routing"
                  checked={config?.smartRouting}
                  onCheckedChange={handleSmartRoutingChange}
                />
              </div>
              <div className="grid gap-2">
                <Label>Priority Factors</Label>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm">Agent Expertise</div>
                      <div className="text-xs text-muted-foreground">
                        Weight: {config?.expertiseWeight}%
                      </div>
                    </div>
                    <Slider
                      value={[config?.expertiseWeight || 0]}
                      max={100}
                      step={10}
                      className="w-[60%]"
                      onValueChange={([value]) => handleWeightChange('expertise', value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm">Current Workload</div>
                      <div className="text-xs text-muted-foreground">
                        Weight: {config?.workloadWeight}%
                      </div>
                    </div>
                    <Slider
                      value={[config?.workloadWeight || 0]}
                      max={100}
                      step={10}
                      className="w-[60%]"
                      onValueChange={([value]) => handleWeightChange('workload', value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm">Response Time</div>
                      <div className="text-xs text-muted-foreground">
                        Weight: {config?.responseTimeWeight}%
                      </div>
                    </div>
                    <Slider
                      value={[config?.responseTimeWeight || 0]}
                      max={100}
                      step={10}
                      className="w-[60%]"
                      onValueChange={([value]) => handleWeightChange('response', value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Scale className="mr-2 h-4 w-4" />
              Load Balancing
            </CardTitle>
            <CardDescription>
              Configure workload distribution across teams and agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Distribution Method</Label>
                <Select
                  value={config?.distributionMethod}
                  onValueChange={handleDistributionMethodChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weighted">Weighted Round Robin</SelectItem>
                    <SelectItem value="least-loaded">Least Loaded</SelectItem>
                    <SelectItem value="performance">Performance Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-scaling">Auto-scaling</Label>
                <Switch
                  id="auto-scaling"
                  checked={config?.autoScaling}
                  onCheckedChange={handleAutoScalingChange}
                />
              </div>
              <div className="grid gap-2">
                <Label>Max Tickets Per Agent</Label>
                <Select
                  value={config?.maxTicketsPerAgent?.toString()}
                  onValueChange={handleMaxTicketsChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 tickets</SelectItem>
                    <SelectItem value="8">8 tickets</SelectItem>
                    <SelectItem value="10">10 tickets</SelectItem>
                    <SelectItem value="12">12 tickets</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowDownUp className="mr-2 h-4 w-4" />
              Escalation Rules
            </CardTitle>
            <CardDescription>
              Define when and how tickets should be escalated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Auto-escalation Trigger</Label>
                <Select defaultValue="time">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">Response Time</SelectItem>
                    <SelectItem value="priority">Priority Level</SelectItem>
                    <SelectItem value="sla">SLA Breach Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Escalation Path</Label>
                <Select defaultValue="team-lead">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="team-lead">Team Lead</SelectItem>
                    <SelectItem value="senior">Senior Agents</SelectItem>
                    <SelectItem value="manager">Support Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications">Escalation Notifications</Label>
                <Switch id="notifications" defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              Performance Metrics
            </CardTitle>
            <CardDescription>
              Set thresholds for routing performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Target Response Time</Label>
                <Select defaultValue="2">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="4">4 hours</SelectItem>
                    <SelectItem value="8">8 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Target Resolution Time</Label>
                <Select defaultValue="24">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="48">48 hours</SelectItem>
                    <SelectItem value="72">72 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="alerts">Performance Alerts</Label>
                <Switch id="alerts" defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 