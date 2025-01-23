import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/lib/supabase/database.types'

interface RoutingConfig {
  smartRouting: boolean
  expertiseWeight: number
  workloadWeight: number
  responseTimeWeight: number
  maxTicketsPerAgent: number
  distributionMethod: 'weighted' | 'least-loaded' | 'performance'
  autoScaling: boolean
}

interface AgentScore {
  id: string
  name: string
  score: number
  currentWorkload: number
}

export async function getRoutingConfig(): Promise<RoutingConfig> {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('routing_config')
    .select('*')
    .single()

  if (error) throw error

  return data as RoutingConfig
}

export async function updateRoutingConfig(config: Partial<RoutingConfig>): Promise<void> {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await supabase
    .from('routing_config')
    .update(config)
    .eq('id', 1)

  if (error) throw error
}

export async function findBestAgent(ticketId: string): Promise<string | null> {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Get routing config
  const config = await getRoutingConfig()
  if (!config.smartRouting) return null

  // Get ticket details
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('category, priority')
    .eq('id', ticketId)
    .single()

  if (ticketError) throw ticketError

  // Get all active agents
  const { data: agents, error: agentsError } = await supabase
    .from('team_members')
    .select(`
      id,
      name,
      expertise,
      tickets!assigned_tickets (
        id,
        status,
        resolved_at,
        created_at
      )
    `)
    .eq('status', 'active')

  if (agentsError) throw agentsError

  const agentScores: AgentScore[] = await Promise.all(
    agents.map(async (agent) => {
      // Calculate expertise score (0-100)
      const expertiseScore = agent.expertise?.includes(ticket.category) ? 100 : 0

      // Calculate workload score (0-100)
      const openTickets = agent.tickets?.filter(t => t.status !== 'resolved').length || 0
      const workloadScore = Math.max(0, 100 - (openTickets / config.maxTicketsPerAgent) * 100)

      // Calculate response time score (0-100)
      const resolvedTickets = agent.tickets?.filter(t => t.status === 'resolved') || []
      const avgResponseTime = resolvedTickets.length ?
        resolvedTickets.reduce((sum, t) => {
          const responseTime = new Date(t.resolved_at!).getTime() - new Date(t.created_at).getTime()
          return sum + responseTime
        }, 0) / resolvedTickets.length : 0
      const responseTimeScore = avgResponseTime ? Math.min(100, (24 * 60 * 60 * 1000) / avgResponseTime * 100) : 50

      // Calculate weighted score
      const totalScore = (
        expertiseScore * (config.expertiseWeight / 100) +
        workloadScore * (config.workloadWeight / 100) +
        responseTimeScore * (config.responseTimeWeight / 100)
      )

      return {
        id: agent.id,
        name: agent.name,
        score: totalScore,
        currentWorkload: openTickets
      }
    })
  )

  // Sort agents based on distribution method
  let sortedAgents: AgentScore[]
  switch (config.distributionMethod) {
    case 'weighted':
      sortedAgents = agentScores.sort((a, b) => b.score - a.score)
      break
    case 'least-loaded':
      sortedAgents = agentScores.sort((a, b) => a.currentWorkload - b.currentWorkload)
      break
    case 'performance':
      sortedAgents = agentScores.sort((a, b) => b.score - a.score)
      break
    default:
      sortedAgents = agentScores.sort((a, b) => b.score - a.score)
  }

  // Return the best agent's ID, or null if no suitable agent is found
  return sortedAgents[0]?.id || null
}

export async function assignTicket(ticketId: string, agentId: string): Promise<void> {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { error } = await supabase
    .from('tickets')
    .update({
      assignee_id: agentId,
      assigned_at: new Date().toISOString()
    })
    .eq('id', ticketId)

  if (error) throw error
} 