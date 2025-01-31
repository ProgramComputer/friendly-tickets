import { NextResponse } from 'next/server'
import { HybridChain } from '@/lib/commands/hybrid-chain'
import { cookies } from 'next/headers'
import { OpenAIEmbeddings } from '@langchain/openai'
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase'
import { createClient } from '@supabase/supabase-js'
import { CommandRole } from '@/lib/commands/types'

export async function POST(request: Request) {
  try {
    const { input, userRole } = await request.json()
    
    console.log('[AI API] Request received:', { input, userRole })
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const cookieStore = cookies()
    const authToken = request.headers.get('authorization')?.split('Bearer ')[1]
    
    if (!authToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${authToken}`
          }
        }
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[AI API] User authenticated:', { 
      userId: user.id, 
      email: user.email,
      role: userRole 
    })

    // Initialize embeddings and vector store on the server
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY
    })

    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: 'documents',
      queryName: 'match_documents'
    })

    const retriever = vectorStore.asRetriever()

    const hybridChain = new HybridChain(
      supabase,
      userRole || 'customer',
      retriever,
      { openAIApiKey: process.env.OPENAI_API_KEY }
    )

    console.log('[AI API] Processing with role:', userRole)
    const result = await hybridChain.process(input)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('AI processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}