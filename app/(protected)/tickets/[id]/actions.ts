"use server"

import { revalidatePath } from "next/cache"
import { 
  updateTicketStatus,
  updateTicketPriority,
  updateTicketAssignee,
  addTicketReply
} from "@/lib/supabase/domain/tickets/server-queries"

export async function handleStatusChange(ticketId: string, status: string) {
  await updateTicketStatus(ticketId, status)
  revalidatePath(`/tickets/${ticketId}`)
}

export async function handlePriorityChange(ticketId: string, priority: string) {
  await updateTicketPriority(ticketId, priority)
  revalidatePath(`/tickets/${ticketId}`)
}

export async function handleAssigneeChange(ticketId: string, assigneeId: string | null) {
  await updateTicketAssignee(ticketId, assigneeId)
  revalidatePath(`/tickets/${ticketId}`)
}

export async function handleReply(
  ticketId: string,
  content: string,
  attachments: { name: string; url: string; size: number }[] = []
) {
  await addTicketReply(ticketId, content, attachments)
  revalidatePath(`/tickets/${ticketId}`)
} 