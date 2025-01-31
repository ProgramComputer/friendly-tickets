import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types'

export interface SLAConfig {
  id?: string
  firstResponseTime: number // minutes
  resolutionTime: number // minutes
  businessHours: {
    start: string // HH:mm format
    end: string // HH:mm format
    timezone: string
    workDays: number[] // 0-6, where 0 is Sunday
  }
  priorityMultipliers: {
    low: number
    medium: number
    high: number
    urgent: number
  }
  escalationRules: {
    level: number
    threshold: number // percentage of SLA time
    actions: ('notify_manager' | 'reassign' | 'notify_team')[]
  }[]
  notificationSettings: {
    warning: number // percentage of SLA time
    breach: boolean
    updates: boolean
  }
}

export async function getSLAConfig() {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    const { data, error } = await supabase
      .from('sla_config')
      .select('*')
      .single()

    if (error) throw error

    return data as SLAConfig
  } catch (error) {
    console.error('Error fetching SLA config:', error)
    throw error
  }
}

export async function updateSLAConfig(config: Partial<SLAConfig>) {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  try {
    const { data, error } = await supabase
      .from('sla_config')
      .update(config)
      .eq('id', config.id)
      .select()
      .single()

    if (error) throw error

    return data as SLAConfig
  } catch (error) {
    console.error('Error updating SLA config:', error)
    throw error
  }
}

export function calculateSLADeadline(
  createdAt: Date,
  priority: 'low' | 'medium' | 'high' | 'urgent',
  type: 'response' | 'resolution',
  slaConfig: SLAConfig
): Date {
  const baseTime = type === 'response' ? slaConfig.firstResponseTime : slaConfig.resolutionTime
  const multiplier = slaConfig.priorityMultipliers[priority]
  const totalMinutes = baseTime * multiplier

  const deadline = new Date(createdAt)
  let remainingMinutes = totalMinutes

  while (remainingMinutes > 0) {
    deadline.setMinutes(deadline.getMinutes() + 1)
    
    // Skip non-working hours and days
    if (isWithinBusinessHours(deadline, slaConfig.businessHours)) {
      remainingMinutes--
    }
  }

  return deadline
}

export function isWithinBusinessHours(
  date: Date,
  businessHours: SLAConfig['businessHours']
): boolean {
  const day = date.getDay()
  if (!businessHours.workDays.includes(day)) return false

  const [startHour, startMinute] = businessHours.start.split(':').map(Number)
  const [endHour, endMinute] = businessHours.end.split(':').map(Number)
  
  const hour = date.getHours()
  const minute = date.getMinutes()

  if (hour < startHour || (hour === startHour && minute < startMinute)) return false
  if (hour > endHour || (hour === endHour && minute > endMinute)) return false

  return true
}

export function checkSLABreaches(
  ticket: {
    created_at: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    first_response_at?: string | null
    resolved_at?: string | null
  },
  slaConfig: SLAConfig
) {
  const createdAt = new Date(ticket.created_at)
  const now = new Date()

  // Check first response breach
  const responseDeadline = calculateSLADeadline(createdAt, ticket.priority, 'response', slaConfig)
  const responseBreached = !ticket.first_response_at && now > responseDeadline

  // Check resolution breach
  const resolutionDeadline = calculateSLADeadline(createdAt, ticket.priority, 'resolution', slaConfig)
  const resolutionBreached = !ticket.resolved_at && now > resolutionDeadline

  // Calculate warning thresholds
  const warningThreshold = slaConfig.notificationSettings.warning / 100
  const responseWarning = !ticket.first_response_at && 
    now > new Date(responseDeadline.getTime() - (responseDeadline.getTime() - createdAt.getTime()) * warningThreshold)
  const resolutionWarning = !ticket.resolved_at && 
    now > new Date(resolutionDeadline.getTime() - (resolutionDeadline.getTime() - createdAt.getTime()) * warningThreshold)

  return {
    responseBreached,
    resolutionBreached,
    responseWarning,
    resolutionWarning,
    responseDeadline,
    resolutionDeadline
  }
}

export function getEscalationLevel(
  ticket: {
    created_at: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    first_response_at?: string | null
    resolved_at?: string | null
  },
  slaConfig: SLAConfig
): { level: number; actions: ('notify_manager' | 'reassign' | 'notify_team')[] } | null {
  const createdAt = new Date(ticket.created_at)
  const now = new Date()

  // Get the relevant deadline based on ticket status
  const deadline = !ticket.first_response_at
    ? calculateSLADeadline(createdAt, ticket.priority, 'response', slaConfig)
    : calculateSLADeadline(createdAt, ticket.priority, 'resolution', slaConfig)

  // Calculate percentage of SLA time elapsed
  const totalTime = deadline.getTime() - createdAt.getTime()
  const elapsedTime = now.getTime() - createdAt.getTime()
  const percentageElapsed = (elapsedTime / totalTime) * 100

  // Find the highest applicable escalation level
  const escalation = [...slaConfig.escalationRules]
    .sort((a, b) => b.threshold - a.threshold)
    .find(rule => percentageElapsed >= rule.threshold)

  return escalation ? {
    level: escalation.level,
    actions: escalation.actions
  } : null
} 