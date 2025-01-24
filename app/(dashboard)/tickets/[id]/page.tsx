import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { TicketDetail } from './_components/ticket-detail'
import { TicketSidebar } from './_components/ticket-sidebar'

interface TicketPageProps {
  params: {
    id: string
  }
}

async function getTicket(id: string) {
  const supabase = createServerSupabaseClient()
  
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
      *,
      customer:customers!customer_id(*),
      assignee:team_members!assignee_id(*),
      department:departments!department_id(*),
      messages:ticket_messages(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching ticket:', error)
    return null
  }

  return ticket
}

export default async function TicketPage({ params }: TicketPageProps) {
  const ticket = await getTicket(params.id)

  if (!ticket) {
    return notFound()
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <TicketDetail ticket={ticket} />
          </div>
          <div>
            <TicketSidebar ticket={ticket} />
          </div>
        </div>
      </div>
    </Suspense>
  )
} 