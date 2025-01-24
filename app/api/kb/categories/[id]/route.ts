import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const [categoryResult, articlesResult] = await Promise.all([
      supabase
        .from('kb_categories')
        .select('*')
        .eq('id', params.id)
        .single(),
      supabase
        .from('kb_articles')
        .select('*')
        .eq('category_id', params.id)
        .order('created_at', { ascending: false })
    ])

    if (categoryResult.error) {
      if (categoryResult.error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }
      console.error('Error fetching category:', categoryResult.error)
      return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 })
    }

    if (articlesResult.error) {
      console.error('Error fetching articles:', articlesResult.error)
      return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 })
    }

    return NextResponse.json({
      ...categoryResult.data,
      articles: articlesResult.data
    })
  } catch (error) {
    console.error('Error in category route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 