import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
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

    const { data: article, error } = await supabase
      .from('kb_articles')
      .select(`
        *,
        kb_categories (
          id,
          name
        )
      `)
      .eq('id', params.slug)
      .single()

    if (error) {
      console.error('Error fetching article:', error)
      return NextResponse.json(
        { error: 'Failed to fetch article' },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    return NextResponse.json(article, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error in article route:', error)
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

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { isHelpful } = await request.json()

    const { data: article, error: articleError } = await supabase
      .from('kb_articles')
      .select('id')
      .eq('id', params.slug)
      .single()

    if (articleError) {
      if (articleError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 })
      }
      console.error('Error fetching article:', articleError)
      return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 })
    }

    const { error: feedbackError } = await supabase
      .from('kb_article_feedback')
      .insert({
        article_id: article.id,
        is_helpful: isHelpful
      })

    if (feedbackError) {
      console.error('Error submitting feedback:', feedbackError)
      return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in feedback route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 