import { NextResponse } from 'next/server'
import { Message as VercelChatMessage } from 'ai'
import { ChatOpenAI } from '@langchain/openai'
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase'
import { OpenAIEmbeddings } from '@langchain/openai'
import { createClient } from '@supabase/supabase-js'
import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { Document } from '@langchain/core/documents'
import { PromptTemplate } from '@langchain/core/prompts'
import { formatDocumentsAsString } from 'langchain/util/document'

export const runtime = 'edge'

// Initialize clients
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const vectorStore = new SupabaseVectorStore(
  new OpenAIEmbeddings(),
  {
    client: supabaseClient,
    tableName: 'kb_articles',
    filter: {},
    queryName: 'match_documents'
  }
)

// Define prompts
const condenseQuestionPrompt = PromptTemplate.fromTemplate(
  `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question that captures all relevant context.

Chat History:
{chat_history}

Follow Up Input: {question}
Standalone question:`
)

const answerPrompt = PromptTemplate.fromTemplate(
  `You are a helpful and friendly customer support AI assistant. Your role is to assist users with their questions and provide accurate information.

If the provided context contains relevant information to answer the user's question, use it in your response. If the context doesn't contain relevant information or if you're unsure about something, acknowledge this clearly and suggest that the user might want to speak with a human support agent for more detailed assistance.

Context from knowledge base (use only if relevant):
{context}

Question: {question}
Helpful answer (be friendly and direct):`
)

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Validate messages array
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and cannot be empty' },
        { status: 400 }
      )
    }

    const currentMessageContent = messages[messages.length - 1].content
    const previousMessages = messages.slice(0, -1)

    // Initialize chat model
    const model = new ChatOpenAI({
      modelName: 'gpt-4-turbo-preview',
      temperature: 0.7,
      streaming: true
    })

    // Format chat history
    const chatHistory = previousMessages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n')

    // Create the RAG chain
    const standaloneQuestionChain = RunnableSequence.from([
      condenseQuestionPrompt,
      model,
      new StringOutputParser()
    ])

    const retrievalChain = RunnableSequence.from([
      standaloneQuestion => vectorStore.similaritySearch(standaloneQuestion, 3),
      formatDocumentsAsString
    ])

    const answerChain = RunnableSequence.from([
      answerPrompt,
      model,
      new StringOutputParser()
    ])

    const chain = RunnableSequence.from([
      {
        question: new RunnablePassthrough(),
        chat_history: () => chatHistory
      },
      {
        standalone_question: standaloneQuestionChain,
        chat_history: ({ chat_history }) => chat_history
      },
      {
        context: ({ standalone_question }) => retrievalChain.invoke(standalone_question),
        question: ({ standalone_question }) => standalone_question
      },
      answerChain
    ])

    const stream = await chain.stream(currentMessageContent)

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    })

  } catch (error) {
    console.error('Error in RAG stream:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
