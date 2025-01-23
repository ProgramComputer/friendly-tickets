"use client"

import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/lib/supabase/database.types'

interface TeamPerformance {
  name: string
  total: number
  resolved: number
}

async function getTeamPerformance(): Promise<TeamPerformance[]> {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('name')

  if (teamsError) throw teamsError

  const performance: TeamPerformance[] = []

  for (const team of teams) {
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('status')
      .eq('team_id', team.id)

    if (ticketsError) throw ticketsError

    performance.push({
      name: team.name,
      total: tickets.length,
      resolved: tickets.filter(t => t.status === 'resolved').length
    })
  }

  return performance
}

export function Overview() {
  const { data: performance, isLoading } = useQuery({
    queryKey: ['team-performance'],
    queryFn: getTeamPerformance,
    refetchInterval: 30000 // Refresh every 30 seconds
  })

  if (isLoading) {
    return (
      <div className="flex h-[350px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={performance}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip />
        <Bar
          dataKey="total"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary"
        />
        <Bar
          dataKey="resolved"
          fill="currentColor"
          radius={[4, 4, 0, 0]}
          className="fill-primary/30"
        />
      </BarChart>
    </ResponsiveContainer>
  )
} 