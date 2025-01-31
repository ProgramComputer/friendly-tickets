import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  try {
    const { data: categories, error } = await supabase
      .from('kb_categories')
      .select(`
        *,
        articles:kb_articles(count)
      `)
      .order('name')
    
    if (error) {
      console.error('Error fetching KB categories:', error)
      return NextResponse.json(
        { error: 'Failed to fetch KB categories' }, 
        { status: 500 }
      )
    }
    
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error in KB categories route:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
} 