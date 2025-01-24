import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function insertTestArticle() {
  const { data, error } = await supabase
    .from('kb_articles')
    .insert({
      title: 'Test Article',
      content: 'This is a test article to verify the embedding trigger works.'
    })
    .select()

  if (error) {
    console.error('Error inserting article:', error)
    return
  }

  console.log('Article inserted:', data)

  // Wait a moment for the trigger to execute
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Check if the embedding was generated
  const { data: article, error: fetchError } = await supabase
    .from('kb_articles')
    .select('content_embedding')
    .eq('title', 'Test Article')
    .single()

  if (fetchError) {
    console.error('Error fetching article:', fetchError)
    return
  }

  console.log('Article embedding:', article.content_embedding ? 'Generated' : 'Not generated')
}

insertTestArticle().catch(console.error) 