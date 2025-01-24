import { OpenAIStream } from 'ai'
import { Configuration, OpenAIApi } from 'openai-edge'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(config)

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const { message, context, sessionId } = await req.json()

    // Get chat history for context
    const { data: chatHistory } = await supabase
      .from('chat_messages')
      .select('content, sender_type')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(10)

    // Format chat history
    const conversationHistory = chatHistory?.map(msg => ({
      role: msg.sender_type === 'customer' ? 'user' : 'assistant',
      content: msg.content
    })) || []

    // Create system message with KB context
    const systemMessage = {
      role: 'system',
      content: `You are a helpful customer support AI assistant. Use the following knowledge base articles as context for your responses. If you're unsure about something, acknowledge that and offer to connect the user with a human agent.

Knowledge Base Context:
${context}

Remember to:
1. Be polite and professional
2. Use information from the knowledge base when relevant
3. Keep responses concise and clear
4. Offer to connect with a human agent for complex issues
5. Focus on solving the customer's immediate problem`
    }

    // Generate response
    const completion = await openai.createChatCompletion({
      model: 'gpt-4-turbo-preview',
      messages: [
        systemMessage,
        ...conversationHistory,
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
      stream: false
    })

    const response = await completion.json()
    const content = response.choices[0].message.content

    return new Response(JSON.stringify({ content }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in AI response generation:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate AI response' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
} 