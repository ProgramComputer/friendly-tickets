import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    // Create chat completion
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 500
    })

    // Create a ReadableStream from the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              // Encode the content as a Uint8Array
              const encoded = new TextEncoder().encode(content)
              controller.enqueue(encoded)
            }
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      }
    })

    // Return the stream response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Error in AI stream:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 