import { NextResponse } from 'next/server'
import { generateEmbedding } from '@/lib/utils/embeddings'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { text } = await request.json()
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      )
    }

    const embedding = await generateEmbedding(text)
    
    return NextResponse.json({ embedding })
  } catch (error) {
    console.error('Error generating embedding:', error)
    return NextResponse.json(
      { error: 'Failed to generate embedding' },
      { status: 500 }
    )
  }
}

// Add OPTIONS handler for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}