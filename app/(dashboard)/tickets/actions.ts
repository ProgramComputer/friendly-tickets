"use server"

import { revalidatePath } from "next/cache"
import { getAllTickets, getTicketWithRelations, getUserRole } from "@/lib/supabase/domain/tickets/server-queries"
import type { TicketWithRelations } from "@/types/features/tickets"

export async function getTickets() {
  return getAllTickets()
}

export async function getTicketById(id: string) {
  return getTicketWithRelations(id)
}

export async function getRole() {
  return getUserRole()
} 