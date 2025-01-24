// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.1.0'

console.log("Edge Function Started!")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface KBArticle {
  id: string
  title: string
  content: string
  excerpt: string | null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("Received request")
    
    // Log request headers
    console.log("Request headers:", Object.fromEntries(req.headers.entries()))
    
    // Get article data from request
    const body = await req.json()
    console.log("Request body type:", typeof body)
    console.log("Request body keys:", Object.keys(body))
    console.log("Full request body:", JSON.stringify(body, null, 2))
    
    // Extract article data from database trigger payload
    const article = body.type === 'UPDATE' || body.type === 'INSERT' 
      ? body.record 
      : body.new || body
    console.log("Extracted article data:", JSON.stringify(article, null, 2))
    
    // Validate article data
    if (!article?.id || !article?.title || !article?.content) {
      console.error("Invalid article data:", article)
      throw new Error(`Invalid article data. Required fields missing. Received: ${JSON.stringify(body)}`)
    }
    
    console.log("Article validation passed. Title:", article.title)

    // Initialize OpenAI
    const openai = new OpenAIApi(
      new Configuration({
        apiKey: Deno.env.get('OPENAI_API_KEY'),
      })
    )
    console.log("OpenAI initialized")

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials")
    }
    
    const supabaseClient = createClient(supabaseUrl, supabaseKey)
    console.log("Supabase client initialized")

    // Generate embedding for article content
    const input = `${article.title}\n\n${article.content}`
    console.log("Generating embedding for text:", input)
    
    const embeddingResponse = await openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input,
    })
    console.log("Embedding generated")

    if (!embeddingResponse.data.data?.[0]?.embedding) {
      throw new Error("No embedding generated by OpenAI")
    }

    const [{ embedding }] = embeddingResponse.data.data
    console.log("Embedding length:", embedding.length)

    // Update article with embedding
    const { error: updateError } = await supabaseClient
      .from('kb_articles')
      .update({ content_embedding: embedding })
      .eq('id', article.id)

    if (updateError) {
      console.error("Error updating article:", updateError)
      throw updateError
    }

    console.log("Article updated successfully")

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Error in Edge Function:", error)
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/generate-kb-embeddings' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
