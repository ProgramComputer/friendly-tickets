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

export function RoutingRules() {
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
                <Switch id="smart-routing" defaultChecked />
              </div>
              <div className="grid gap-2">
                <Label>Priority Factors</Label>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm">Agent Expertise</div>
                      <div className="text-xs text-muted-foreground">
                        Weight: 40%
                      </div>
                    </div>
                    <Slider
                      defaultValue={[40]}
                      max={100}
                      step={10}
                      className="w-[60%]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm">Current Workload</div>
                      <div className="text-xs text-muted-foreground">
                        Weight: 30%
                      </div>
                    </div>
                    <Slider
                      defaultValue={[30]}
                      max={100}
                      step={10}
                      className="w-[60%]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm">Response Time</div>
                      <div className="text-xs text-muted-foreground">
                        Weight: 30%
                      </div>
                    </div>
                    <Slider
                      defaultValue={[30]}
                      max={100}
                      step={10}
                      className="w-[60%]"
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
                <Select defaultValue="weighted">
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
                <Switch id="auto-scaling" defaultChecked />
              </div>
              <div className="grid gap-2">
                <Label>Max Tickets Per Agent</Label>
                <Select defaultValue="8">
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