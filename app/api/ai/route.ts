import { NextResponse } from 'next/server'
import { HybridChain } from '@/lib/commands/hybrid-chain'
import { cookies } from 'next/headers'
import { OpenAIEmbeddings } from '@langchain/openai'
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase'
import { createClient } from '@supabase/supabase-js'
import { CommandRole, CommandResult } from '@/lib/commands/types'

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7)
  const startTime = Date.now()

  try {
    const { input, userRole } = await request.json()
    
    console.log(`[AI API ${requestId}] Request received:`, { 
      input: input.slice(0, 100) + (input.length > 100 ? '...' : ''),
      inputLength: input.length,
      userRole,
      timestamp: new Date().toISOString()
    })
    
    if (!process.env.OPENAI_API_KEY) {
      console.error(`[AI API ${requestId}] OpenAI API key not configured`)
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const cookieStore = cookies()
    const authToken = request.headers.get('authorization')?.split('Bearer ')[1]
    
    if (!authToken) {
      console.warn(`[AI API ${requestId}] Missing auth token`)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`[AI API ${requestId}] Auth token received, initializing Supabase client`)

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

    console.log(`[AI API ${requestId}] Authenticating user`)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error(`[AI API ${requestId}] Auth error:`, authError)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }
    
    if (!user) {
      console.warn(`[AI API ${requestId}] No user found`)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`[AI API ${requestId}] User authenticated:`, { 
      userId: user.id, 
      email: user.email,
      role: userRole,
      authTime: `${Date.now() - startTime}ms`
    })

    console.log(`[AI API ${requestId}] Initializing OpenAI embeddings`)
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY
    })

    console.log(`[AI API ${requestId}] Initializing vector store`)
    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: 'documents',
      queryName: 'match_documents'
    })

    const retriever = vectorStore.asRetriever()
    console.log(`[AI API ${requestId}] Vector store initialized:`, {
      tableName: 'documents',
      setupTime: `${Date.now() - startTime}ms`
    })

    console.log(`[AI API ${requestId}] Initializing HybridChain`)
    const hybridChain = new HybridChain(
      supabase,
      userRole || 'customer',
      retriever,
      { openAIApiKey: process.env.OPENAI_API_KEY }
    )

    console.log(`[AI API ${requestId}] Processing message with HybridChain:`, {
      role: userRole,
      processingStartTime: `${Date.now() - startTime}ms`
    })
    
    const result = await hybridChain.process(input)
    
    const processingTime = Date.now() - startTime
    console.log(`[AI API ${requestId}] Processing complete:`, {
      type: result.type,
      success: result.type === 'command' ? (result.result as CommandResult).success : 'N/A',
      totalTime: `${processingTime}ms`
    })
    
    return NextResponse.json({
      ...result,
      _debug: {
        requestId,
        processingTime
      }
    })
  } catch (error) {
    const errorTime = Date.now() - startTime
    console.error(`[AI API ${requestId}] Processing error:`, {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      totalTime: `${errorTime}ms`
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        _debug: {
          requestId,
          processingTime: errorTime
        }
      },
      { status: 500 }
    )
  }
}