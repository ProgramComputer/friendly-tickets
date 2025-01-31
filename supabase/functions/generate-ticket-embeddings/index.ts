// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import OpenAI from 'jsr:@openai/openai'

console.log("Ticket Embeddings Edge Function Started!")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Ticket {
  id: string
  title: string
  description: string
  status: string
  priority: string
  category: string
  tags: string[]
  customer_id: string
  assigned_agent_id: string
  department: string
  created_at: string
  updated_at: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log("Received webhook payload:", JSON.stringify(payload, null, 2))

    let ticketIds: string[]

    // Handle database change events
    if (payload.type === 'INSERT' || payload.type === 'UPDATE') {
      if (!payload.record?.id) {
        throw new Error('Missing ticket ID in database trigger payload')
      }
      ticketIds = [payload.record.id]
    } else if (payload.ids && Array.isArray(payload.ids)) {
      ticketIds = payload.ids
    } else {
      throw new Error('Invalid request format. Expected either a database trigger payload or an array of ticket IDs')
    }

    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')
    })

    // Fetch tickets
    const { data: tickets, error: fetchError } = await supabaseClient
      .from('tickets')
      .select('*')
      .in('id', ticketIds)

    if (fetchError) throw fetchError
    if (!tickets || tickets.length === 0) {
      throw new Error('No tickets found')
    }

    // Process tickets
    const results = await Promise.all(
      tickets.map(async (ticket: Ticket) => {
        const textToEmbed = `
          Title: ${ticket.title}
          Description: ${ticket.description}
          Status: ${ticket.status}
          Priority: ${ticket.priority}
          Category: ${ticket.category}
          Tags: ${ticket.tags.join(', ')}
          Department: ${ticket.department}
          Created: ${ticket.created_at}
          Updated: ${ticket.updated_at}
        `.trim()

        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: textToEmbed,
        })

        const embedding = embeddingResponse.data[0].embedding

        const { error } = await supabaseClient
          .from('tickets')
          .update({ embedding })
          .eq('id', ticket.id)

        if (error) throw error
        return { id: ticket.id, status: 'processed' }
      })
    )

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${results.length} tickets`,
        results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-ticket-embeddings' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"type":"INSERT","record":{"id":"123"}}'

*/ 