import { Suspense } from 'react'
import { getTicketById } from '@/lib/supabase/domain/tickets/queries'
import { TicketDetail } from './_components/ticket-detail'
import { TicketDetailSkeleton } from './_components/ticket-detail-skeleton'
import { notFound } from 'next/navigation'

interface Props {
  params: { id: string }
}

export default async function TicketPage({ params }: Props) {
  const id = await Promise.resolve(params.id)
  const ticket = await getTicketById(id)

  if (!ticket) {
    notFound()
  }

  return (
    <Suspense fallback={<TicketDetailSkeleton />}>
      <TicketDetail ticket={ticket} />
    </Suspense>
  )
} 