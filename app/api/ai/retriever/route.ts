import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { OpenAIEmbeddings } from '@langchain/openai'
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7)
  const startTime = Date.now()

  try {
    console.log(`[Retriever API ${requestId}] Initializing retriever`)
    
    if (!process.env.OPENAI_API_KEY) {
      console.error(`[Retriever API ${requestId}] OpenAI API key not configured`)
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const cookieStore = cookies()
    const authToken = request.headers.get('authorization')?.split('Bearer ')[1]
    
    if (!authToken) {
      console.warn(`[Retriever API ${requestId}] Missing auth token`)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`[Retriever API ${requestId}] Auth token received, initializing Supabase client`)

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

    console.log(`[Retriever API ${requestId}] Authenticating user`)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error(`[Retriever API ${requestId}] Auth error:`, authError)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }
    
    if (!user) {
      console.warn(`[Retriever API ${requestId}] No user found`)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`[Retriever API ${requestId}] User authenticated:`, {
      userId: user.id,
      email: user.email,
      authTime: `${Date.now() - startTime}ms`
    })

    // Initialize embeddings with timeout and error handling
    console.log(`[Retriever API ${requestId}] Initializing OpenAI embeddings`)
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      timeout: 30000, // 30 second timeout
      maxRetries: 3
    })

    console.log(`[Retriever API ${requestId}] Initializing vector store`)
    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: 'documents',
      queryName: 'match_documents'
    })

    // Test the retriever with a simple query to ensure it's working
    console.log(`[Retriever API ${requestId}] Testing vector store retriever`)
    const retriever = vectorStore.asRetriever()
    
    try {
      const testResult = await retriever.getRelevantDocuments('test query')
      console.log(`[Retriever API ${requestId}] Retriever test successful:`, {
        documentsFound: testResult.length,
        setupTime: `${Date.now() - startTime}ms`
      })

      // Get the retriever configuration
      const retrieverConfig = {
        type: 'supabase',
        tableName: 'documents',
        queryName: 'match_documents',
        searchK: retriever.k || 4,
        searchThreshold: 0.7,
        filter: retriever.filter || null,
        metadata: retriever.metadata || null
      }

      // Return a success response with the retriever configuration
      const processingTime = Date.now() - startTime
      console.log(`[Retriever API ${requestId}] Retriever initialization complete:`, {
        totalTime: `${processingTime}ms`,
        config: retrieverConfig
      })
      
      return NextResponse.json({ 
        success: true,
        retrieverConfig,
        _debug: {
          requestId,
          processingTime
        }
      })
    } catch (testError) {
      console.error(`[Retriever API ${requestId}] Retriever test failed:`, testError)
      throw new Error('Failed to verify retriever functionality')
    }
  } catch (error) {
    const errorTime = Date.now() - startTime
    console.error(`[Retriever API ${requestId}] Retriever initialization error:`, {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      totalTime: `${errorTime}ms`
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to initialize retriever',
        _debug: {
          requestId,
          processingTime: errorTime
        }
      },
      { status: 500 }
    )
  }
} 