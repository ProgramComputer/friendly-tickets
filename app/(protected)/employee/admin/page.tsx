'use client'

import { useQuery } from '@tanstack/react-query'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Overview } from "@/components/employee/admin/overview"
import { TeamManagement } from "@/components/employee/admin/team-management"
import { RoutingRules } from "@/components/employee/admin/routing-rules"
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/lib/supabase/database.types'

interface AdminMetrics {
  totalTeams: number
  activeAgents: number
  avgResponseTime: number
  resolutionRate: number
  teamGrowth: number
  agentGrowth: number
  responseTimeChange: number
  resolutionRateChange: number
}

async function getAdminMetrics(): Promise<AdminMetrics> {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Get current metrics
  const { data: teams } = await supabase.from('teams').select('id')
  const { data: agents } = await supabase.from('team_members').select('id, status').eq('status', 'active')
  const { data: tickets } = await supabase.from('tickets').select('created_at, resolved_at, status')

  // Calculate metrics
  const totalTeams = teams?.length || 0
  const activeAgents = agents?.length || 0
  
  const resolvedTickets = tickets?.filter(t => t.status === 'resolved') || []
  const resolutionRate = tickets?.length ? (resolvedTickets.length / tickets.length) * 100 : 0
  
  const responseTimes = resolvedTickets
    .map(t => new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime())
  const avgResponseTime = responseTimes.length ? 
    responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length / (1000 * 60 * 60) : 0 // Convert to hours

  // Get last month's metrics for comparison
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  
  const { data: lastMonthTeams } = await supabase
    .from('teams')
    .select('id')
    .lt('created_at', lastMonth.toISOString())
  
  const { data: lastMonthAgents } = await supabase
    .from('team_members')
    .select('id')
    .eq('status', 'active')
    .lt('created_at', lastMonth.toISOString())

  const { data: lastMonthTickets } = await supabase
    .from('tickets')
    .select('created_at, resolved_at, status')
    .lt('created_at', lastMonth.toISOString())

  const lastMonthResolved = lastMonthTickets?.filter(t => t.status === 'resolved') || []
  const lastMonthResolutionRate = lastMonthTickets?.length ? 
    (lastMonthResolved.length / lastMonthTickets.length) * 100 : 0

  const lastMonthResponseTimes = lastMonthResolved
    .map(t => new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime())
  const lastMonthAvgResponse = lastMonthResponseTimes.length ?
    lastMonthResponseTimes.reduce((a, b) => a + b, 0) / lastMonthResponseTimes.length / (1000 * 60 * 60) : 0

  return {
    totalTeams,
    activeAgents,
    avgResponseTime,
    resolutionRate,
    teamGrowth: totalTeams - (lastMonthTeams?.length || 0),
    agentGrowth: activeAgents - (lastMonthAgents?.length || 0),
    responseTimeChange: lastMonthAvgResponse ? (avgResponseTime - lastMonthAvgResponse) : 0,
    resolutionRateChange: lastMonthResolutionRate ? (resolutionRate - lastMonthResolutionRate) : 0
  }
}

export default function AdminDashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: getAdminMetrics,
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Administrative Control</h2>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Team Management</TabsTrigger>
          <TabsTrigger value="routing">Routing Intelligence</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.totalTeams || '-'}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.teamGrowth > 0 ? '+' : ''}{metrics?.teamGrowth || 0} from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.activeAgents || '-'}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.agentGrowth > 0 ? '+' : ''}{metrics?.agentGrowth || 0} from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.avgResponseTime.toFixed(1)}h</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.responseTimeChange > 0 ? '+' : ''}{metrics?.responseTimeChange.toFixed(1)}h from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.resolutionRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.resolutionRateChange > 0 ? '+' : ''}{metrics?.resolutionRateChange.toFixed(1)}% from last month
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Team Performance Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
                <CardDescription>
                  Latest team and routing changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Support Team Restructured
                      </p>
                      <p className="text-sm text-muted-foreground">
                        2 new members added to Mobile Support
                      </p>
                    </div>
                    <div className="ml-auto font-medium">Today</div>
                  </div>
                  <div className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Routing Rule Updated
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Priority tickets now route to senior agents first
                      </p>
                    </div>
                    <div className="ml-auto font-medium">Yesterday</div>
                  </div>
                  <div className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        New Team Created
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Enterprise Support team established
                      </p>
                    </div>
                    <div className="ml-auto font-medium">2 days ago</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="teams" className="space-y-4">
          <TeamManagement />
        </TabsContent>
        <TabsContent value="routing" className="space-y-4">
          <RoutingRules />
        </TabsContent>
      </Tabs>
    </div>
  )
} 