import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json()

    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    // Prepare system message with context
    const systemMessage = {
      role: 'system',
      content: `You are a helpful customer support AI assistant. Use the following knowledge base articles as context for your responses. Only use this information if it's relevant to the user's question. If you're not sure about something, say so.

Context from knowledge base:
${context}

Remember to:
1. Be concise and direct
2. Only use the context if relevant
3. Admit when you're not sure
4. Stick to facts from the provided context`
    }

    // Create chat completion
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [systemMessage, ...messages],
      temperature: 0.7,
      max_tokens: 500
    })

    return NextResponse.json({ content: response.choices[0].message.content })

  } catch (error) {
    console.error('Error in AI response:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 