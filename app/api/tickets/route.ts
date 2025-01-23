import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createTicketRequest } from "@/lib/schemas/api-schemas"
import { getTeamMemberRole } from "@/lib/auth/roles"

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  try {
    const json = await request.json()
    const validatedData = createTicketRequest.parse(json)
    const { role, data } = validatedData

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Verify team member role matches claimed role
    if (role !== "customer") {
      const teamRole = await getTeamMemberRole(user.id)
      if (role !== teamRole) {
        return new NextResponse("Invalid role for this operation", { status: 403 })
      }
    }

    // Create the ticket with role-specific data
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        ...data,
        customer_id: role === "customer" ? user.id : data.customer_id,
        created_by: user.id,
      })
      .select()
      .single()

    if (ticketError) {
      console.error("Error creating ticket:", ticketError)
      return new NextResponse("Error creating ticket", { status: 500 })
    }

    // Handle additional data based on role
    if (role !== "customer") {
      // Handle custom fields
      if (data.customFields?.length) {
        const { error: customFieldError } = await supabase
          .from("ticket_custom_fields")
          .insert(
            data.customFields.map((field) => ({
              ticket_id: ticket.id,
              ...field,
            }))
          )
        if (customFieldError) throw customFieldError
      }

      // Handle tags
      if (data.tags?.length) {
        const { error: tagError } = await supabase
          .from("ticket_tags")
          .insert(
            data.tags.map((tagId) => ({
              ticket_id: ticket.id,
              tag_id: tagId,
            }))
          )
        if (tagError) throw tagError
      }
    }

    // Handle watchers (CC/BCC)
    if (data.cc?.length || data.bcc?.length) {
      const watchers = [
        ...(data.cc?.map((email) => ({ 
          ticket_id: ticket.id, 
          email, 
          type: 'cc' 
        })) || []),
        ...(data.bcc?.map((email) => ({ 
          ticket_id: ticket.id, 
          email, 
          type: 'bcc' 
        })) || []),
      ]

      if (watchers.length) {
        const { error: watcherError } = await supabase
          .from("ticket_watchers")
          .insert(watchers)
        if (watcherError) throw watcherError
      }
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error("Error processing request:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function GET(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  try {
    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get user's role
    const { data: teamMember } = await supabase
      .from("team_members")
      .select("role")
      .eq("id", user.id)
      .single()

    let query = supabase.from("tickets").select(`
      *,
      customer:customers(*),
      assignee:team_members(*),
      department:departments(*),
      messages:ticket_messages(count)
    `)

    // Filter tickets based on user role
    if (!teamMember) {
      // Customer: only show their own tickets
      query = query.eq("customer_id", user.id)
    } else if (teamMember.role === "agent") {
      // Agent: show assigned tickets and unassigned tickets in their department
      query = query.or(
        `assignee_id.eq.${user.id},and(assignee_id.is.null)`
      )
    }
    // Admin: show all tickets

    const { data: tickets, error: ticketsError } = await query

    if (ticketsError) {
      console.error("Error fetching tickets:", ticketsError)
      return new NextResponse("Error fetching tickets", { status: 500 })
    }

    return NextResponse.json(tickets)
  } catch (error) {
    console.error("Error processing request:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 