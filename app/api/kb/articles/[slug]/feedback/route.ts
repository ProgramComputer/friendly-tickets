import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    // Get request headers
    const headersList = headers()
    const acceptHeader = headersList.get('accept') || 'application/json'
    const contentType = headersList.get('content-type') || ''

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

    // Check content type
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { 
          status: 415,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const { isHelpful } = await request.json()

    if (typeof isHelpful !== 'boolean') {
      return NextResponse.json(
        { error: 'isHelpful must be a boolean' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const { data: user, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error('Error getting user:', userError)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const { error: feedbackError } = await supabase
      .from('kb_article_feedback')
      .upsert({
        article_id: params.slug,
        auth_user_id: user.user.id,
        is_helpful: isHelpful
      })

    if (feedbackError) {
      console.error('Error submitting feedback:', feedbackError)
      return NextResponse.json(
        { error: 'Failed to submit feedback' },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    return NextResponse.json(
      { success: true },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Error in feedback route:', error)
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