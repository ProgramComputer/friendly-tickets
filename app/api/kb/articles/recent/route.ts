import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const { data: articles, error } = await supabase
      .from('kb_articles')
      .select(`
        *,
        category:kb_categories(*)
      `)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      console.error('Error fetching recent articles:', error)
      return NextResponse.json(
        { error: 'Failed to fetch recent articles' }, 
        { status: 500 }
      )
    }
    
    return NextResponse.json(articles)
  } catch (error) {
    console.error('Error in recent articles route:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
} 
