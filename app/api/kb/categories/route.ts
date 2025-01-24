import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
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

    const { data: categories, error } = await supabase
      .from('kb_categories')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json(
        { error: 'Failed to fetch categories' }, 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    return NextResponse.json(categories, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error in categories route:', error)
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