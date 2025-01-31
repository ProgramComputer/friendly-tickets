import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid text input' },
        { status: 400 }
      )
    }

    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    })

    if (!embeddingResponse.data?.[0]?.embedding) {
      throw new Error('No embedding generated')
    }

    const [{ embedding }] = embeddingResponse.data

    return NextResponse.json({ embedding })

  } catch (error) {
    console.error('Error generating embedding:', error)
    return NextResponse.json(
      { error: 'Failed to generate embedding' },
      { status: 500 }
    )
  }
} 