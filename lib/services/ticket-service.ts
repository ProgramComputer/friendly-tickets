import { supabase } from "@/lib/supabase/client"
import {
  CreateTicketInput,
  CreateTicketMessageInput,
  Ticket,
  TicketMessage,
  TicketTag,
  TicketWithDetails,
  UpdateTicketInput,
} from "@/lib/types/tickets"

export const ticketService = {
  async createTicket(input: CreateTicketInput): Promise<Ticket | null> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return null

    // Start a transaction
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        title: input.title,
        description: input.description,
        priority: input.priority || "medium",
        customer_id: user.user.id,
        due_date: input.due_date,
      })
      .select()
      .single()

    if (ticketError || !ticket) return null

    // Add metadata if provided
    if (input.metadata) {
      const metadataEntries = Object.entries(input.metadata).map(([key, value]) => ({
        ticket_id: ticket.id,
        key,
        value,
      }))

      const { error: metadataError } = await supabase
        .from("ticket_metadata")
        .insert(metadataEntries)

      if (metadataError) {
        console.error("Error adding metadata:", metadataError)
      }
    }

    // Add tags if provided
    if (input.tags && input.tags.length > 0) {
      const { error: tagError } = await supabase.from("ticket_tag_relations").insert(
        input.tags.map((tagId) => ({
          ticket_id: ticket.id,
          tag_id: tagId,
        }))
      )

      if (tagError) {
        console.error("Error adding tags:", tagError)
      }
    }

    return ticket
  },

  async updateTicket(
    ticketId: string,
    input: UpdateTicketInput
  ): Promise<Ticket | null> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return null

    // Verify ticket ownership
    const { data: existingTicket } = await supabase
      .from("tickets")
      .select()
      .eq("id", ticketId)
      .eq("customer_id", user.user.id)
      .single()

    if (!existingTicket) return null

    // Update ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .update({
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        due_date: input.due_date,
        ...(input.status === "resolved" ? { resolved_at: new Date().toISOString() } : {}),
      })
      .eq("id", ticketId)
      .select()
      .single()

    if (ticketError || !ticket) return null

    // Update metadata if provided
    if (input.metadata) {
      // Delete existing metadata
      await supabase.from("ticket_metadata").delete().eq("ticket_id", ticketId)

      // Add new metadata
      const metadataEntries = Object.entries(input.metadata).map(([key, value]) => ({
        ticket_id: ticketId,
        key,
        value,
      }))

      const { error: metadataError } = await supabase
        .from("ticket_metadata")
        .insert(metadataEntries)

      if (metadataError) {
        console.error("Error updating metadata:", metadataError)
      }
    }

    // Update tags if provided
    if (input.tags) {
      // Delete existing tags
      await supabase.from("ticket_tag_relations").delete().eq("ticket_id", ticketId)

      // Add new tags
      if (input.tags.length > 0) {
        const { error: tagError } = await supabase.from("ticket_tag_relations").insert(
          input.tags.map((tagId) => ({
            ticket_id: ticketId,
            tag_id: tagId,
          }))
        )

        if (tagError) {
          console.error("Error updating tags:", tagError)
        }
      }
    }

    return ticket
  },

  async getTicket(ticketId: string): Promise<TicketWithDetails | null> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return null

    // Get ticket with messages, tags, and metadata
    const { data: ticket } = await supabase
      .from("tickets")
      .select()
      .eq("id", ticketId)
      .eq("customer_id", user.user.id)
      .single()

    if (!ticket) return null

    // Get messages
    const { data: messages } = await supabase
      .from("ticket_messages")
      .select()
      .eq("ticket_id", ticketId)
      .eq("is_internal", false)
      .order("created_at", { ascending: true })

    // Get tags
    const { data: tagRelations } = await supabase
      .from("ticket_tag_relations")
      .select("tag_id")
      .eq("ticket_id", ticketId)

    const { data: tags } = await supabase
      .from("ticket_tags")
      .select()
      .in(
        "id",
        tagRelations?.map((tr) => tr.tag_id) || []
      )

    // Get metadata
    const { data: metadata } = await supabase
      .from("ticket_metadata")
      .select()
      .eq("ticket_id", ticketId)

    // Convert metadata array to object
    const metadataObject = metadata?.reduce(
      (acc, { key, value }) => ({ ...acc, [key]: value }),
      {}
    )

    return {
      ...ticket,
      messages: messages || [],
      tags: tags || [],
      metadata: metadataObject || {},
    }
  },

  async getTickets(): Promise<Ticket[]> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return []

    const { data: tickets } = await supabase
      .from("tickets")
      .select()
      .eq("customer_id", user.user.id)
      .order("created_at", { ascending: false })

    return tickets || []
  },

  async addMessage(input: CreateTicketMessageInput): Promise<TicketMessage | null> {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return null

    // Verify ticket ownership
    const { data: ticket } = await supabase
      .from("tickets")
      .select()
      .eq("id", input.ticket_id)
      .eq("customer_id", user.user.id)
      .single()

    if (!ticket) return null

    // Add message
    const { data: message, error } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: input.ticket_id,
        sender_id: user.user.id,
        message: input.message,
        attachments: input.attachments,
      })
      .select()
      .single()

    if (error) return null

    // Update ticket status if it was closed
    if (ticket.status === "closed") {
      await supabase
        .from("tickets")
        .update({ status: "open" })
        .eq("id", input.ticket_id)
    }

    return message
  },

  async getTags(): Promise<TicketTag[]> {
    const { data: tags } = await supabase.from("ticket_tags").select()
    return tags || []
  },
} 