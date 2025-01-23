"use client"

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
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Clock, Bell, ArrowUpDown } from "lucide-react"
import { getSLAConfig, updateSLAConfig } from "@/lib/supabase/domain/tickets/sla"
import { toast } from "sonner"

export function SLASettings() {
  const queryClient = useQueryClient()

  const { data: config, isLoading } = useQuery({
    queryKey: ['sla-config'],
    queryFn: getSLAConfig
  })

  const updateMutation = useMutation({
    mutationFn: updateSLAConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-config'] })
      toast.success('SLA configuration updated')
    },
    onError: (error) => {
      console.error('Error updating SLA config:', error)
      toast.error('Failed to update SLA configuration')
    }
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-[600px] animate-pulse rounded-lg border bg-muted" />
      </div>
    )
  }

  const handleResponseTimeChange = (value: string) => {
    updateMutation.mutate({ firstResponseTime: parseInt(value) })
  }

  const handleResolutionTimeChange = (value: string) => {
    updateMutation.mutate({ resolutionTime: parseInt(value) })
  }

  const handleBusinessHoursChange = (field: keyof typeof config.businessHours, value: any) => {
    updateMutation.mutate({
      businessHours: {
        ...config.businessHours,
        [field]: value
      }
    })
  }

  const handlePriorityMultiplierChange = (priority: keyof typeof config.priorityMultipliers, value: number) => {
    updateMutation.mutate({
      priorityMultipliers: {
        ...config.priorityMultipliers,
        [priority]: value
      }
    })
  }

  const handleNotificationSettingChange = (field: keyof typeof config.notificationSettings, value: any) => {
    updateMutation.mutate({
      notificationSettings: {
        ...config.notificationSettings,
        [field]: value
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">SLA Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure Service Level Agreement parameters and notifications
        </p>
      </div>
      <Separator />
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Response Times
            </CardTitle>
            <CardDescription>
              Set target response and resolution times for tickets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>First Response Time (minutes)</Label>
                <Select
                  value={config.firstResponseTime.toString()}
                  onValueChange={handleResponseTimeChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Resolution Time (minutes)</Label>
                <Select
                  value={config.resolutionTime.toString()}
                  onValueChange={handleResolutionTimeChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="240">4 hours</SelectItem>
                    <SelectItem value="480">8 hours</SelectItem>
                    <SelectItem value="1440">24 hours</SelectItem>
                    <SelectItem value="2880">48 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Priority Multipliers
            </CardTitle>
            <CardDescription>
              Adjust SLA times based on ticket priority
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm">Low Priority</div>
                  <div className="text-xs text-muted-foreground">
                    Multiplier: {config.priorityMultipliers.low}x
                  </div>
                </div>
                <Slider
                  value={[config.priorityMultipliers.low]}
                  min={1}
                  max={3}
                  step={0.5}
                  className="w-[60%]"
                  onValueChange={([value]) => handlePriorityMultiplierChange('low', value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm">Medium Priority</div>
                  <div className="text-xs text-muted-foreground">
                    Multiplier: {config.priorityMultipliers.medium}x
                  </div>
                </div>
                <Slider
                  value={[config.priorityMultipliers.medium]}
                  min={0.5}
                  max={2}
                  step={0.25}
                  className="w-[60%]"
                  onValueChange={([value]) => handlePriorityMultiplierChange('medium', value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm">High Priority</div>
                  <div className="text-xs text-muted-foreground">
                    Multiplier: {config.priorityMultipliers.high}x
                  </div>
                </div>
                <Slider
                  value={[config.priorityMultipliers.high]}
                  min={0.25}
                  max={1}
                  step={0.25}
                  className="w-[60%]"
                  onValueChange={([value]) => handlePriorityMultiplierChange('high', value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm">Urgent Priority</div>
                  <div className="text-xs text-muted-foreground">
                    Multiplier: {config.priorityMultipliers.urgent}x
                  </div>
                </div>
                <Slider
                  value={[config.priorityMultipliers.urgent]}
                  min={0.1}
                  max={0.5}
                  step={0.1}
                  className="w-[60%]"
                  onValueChange={([value]) => handlePriorityMultiplierChange('urgent', value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure SLA breach notifications and warnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>Warning Threshold</Label>
                <Select
                  value={config.notificationSettings.warning.toString()}
                  onValueChange={(value) => handleNotificationSettingChange('warning', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50% of SLA time</SelectItem>
                    <SelectItem value="75">75% of SLA time</SelectItem>
                    <SelectItem value="90">90% of SLA time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="breach-notifications">SLA Breach Notifications</Label>
                <Switch
                  id="breach-notifications"
                  checked={config.notificationSettings.breach}
                  onCheckedChange={(checked) => handleNotificationSettingChange('breach', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="update-notifications">SLA Update Notifications</Label>
                <Switch
                  id="update-notifications"
                  checked={config.notificationSettings.updates}
                  onCheckedChange={(checked) => handleNotificationSettingChange('updates', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 