import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { generateTicketEmbedding, generateKBArticleEmbedding } from '@/lib/utils/embeddings'

export async function updateTicketEmbedding(ticketId: string) {
  const cookieStore = cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: any) {
          cookieStore.delete(name, options)
        },
      },
    }
  )
  
  try {
    // Fetch the ticket data
    const { data: ticket, error: fetchError } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single()
    
    if (fetchError) throw fetchError
    if (!ticket) throw new Error('Ticket not found')

    // Generate embedding
    const embedding = await generateTicketEmbedding(ticket)

    // Update the ticket with the new embedding
    const { error: updateError } = await supabase
      .from('tickets')
      .update({ embedding })
      .eq('id', ticketId)

    if (updateError) throw updateError

    return { success: true }
  } catch (error) {
    console.error('Error updating ticket embedding:', error)
    return { success: false, error: error.message }
  }
}

export async function updateKBArticleEmbedding(articleId: string) {
  const cookieStore = cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: any) {
          cookieStore.delete(name, options)
        },
      },
    }
  )
  
  try {
    // Fetch the article data
    const { data: article, error: fetchError } = await supabase
      .from('kb_articles')
      .select('*')
      .eq('id', articleId)
      .single()
    
    if (fetchError) throw fetchError
    if (!article) throw new Error('Article not found')

    // Generate embedding
    const embedding = await generateKBArticleEmbedding(article)

    // Update the article with the new embedding
    const { error: updateError } = await supabase
      .from('kb_articles')
      .update({ content_embedding: embedding })
      .eq('id', articleId)

    if (updateError) throw updateError

    return { success: true }
  } catch (error) {
    console.error('Error updating KB article embedding:', error)
    return { success: false, error: error.message }
  }
}