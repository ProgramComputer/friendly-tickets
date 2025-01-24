import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  try {
    // Get request headers
    const headersList = headers()
    const acceptHeader = headersList.get('accept') || 'application/json'

    // Check if client accepts JSON
    if (!acceptHeader.includes('application/json')) {
      return NextResponse.json(
        { error: 'Only JSON responses are supported' },
        { 
          status: 406,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      )
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const { data: articles, error } = await supabase
      .from('kb_articles')
      .select(`
        *,
        kb_categories (
          id,
          name
        )
      `)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error searching articles:', error)
      return NextResponse.json(
        { error: 'Failed to search articles' },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    return NextResponse.json(articles, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error in search route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
} 