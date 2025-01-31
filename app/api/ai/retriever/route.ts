import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { OpenAIEmbeddings } from '@langchain/openai'
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
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

    // Initialize embeddings and vector store
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY
    })

    const vectorStore = new SupabaseVectorStore(embeddings, {
      client: supabase,
      tableName: 'documents',
      queryName: 'match_documents'
    })

    const retriever = vectorStore.asRetriever()
    
    return NextResponse.json({ retriever })
  } catch (error) {
    console.error('Retriever initialization error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize retriever' },
      { status: 500 }
    )
  }
} 