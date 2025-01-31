import { useEffect, useState } from 'react'
import { VectorStoreRetriever } from '@langchain/core/vectorstores'
import { useSupabase } from '@/lib/hooks/use-supabase'
import { useToast } from '@/hooks/use-toast'
import { OpenAIEmbeddings } from '@langchain/openai'
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase'

const MAX_RETRIES = 3
const RETRY_DELAY = 2000 // 2 seconds

interface RetrieverConfig {
  type: 'supabase'
  tableName: string
  queryName: string
  searchK: number
  searchThreshold: number
  filter: any | null
  metadata: any | null
}

export function useVectorStore() {
  const [retriever, setRetriever] = useState<VectorStoreRetriever | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = useSupabase()
  const { toast } = useToast()

  useEffect(() => {
    let retryCount = 0
    let mounted = true

    const initRetriever = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          throw new Error('No auth session found')
        }

        console.log('Initializing vector store retriever...')

        // Get retriever config from server with timeout
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        const response = await fetch('/api/ai/retriever', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          signal: controller.signal
        })

        clearTimeout(timeout)

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to initialize retriever')
        }

        const { success, retrieverConfig, _debug } = await response.json()
        
        if (!success || !retrieverConfig) {
          throw new Error('Invalid retriever configuration received')
        }

        console.log('Received retriever config:', {
          config: retrieverConfig,
          debug: _debug
        })

        // Initialize embeddings
        const embeddings = new OpenAIEmbeddings()

        // Create vector store
        const vectorStore = new SupabaseVectorStore(embeddings, {
          client: supabase,
          tableName: retrieverConfig.tableName,
          queryName: retrieverConfig.queryName
        })

        // Create retriever with the received configuration
        const newRetriever = vectorStore.asRetriever({
          k: retrieverConfig.searchK,
          filter: retrieverConfig.filter,
          metadata: retrieverConfig.metadata,
          searchKwargs: {
            score_threshold: retrieverConfig.searchThreshold
          }
        })
        
        if (mounted) {
          console.log('Vector store retriever initialized successfully')
          setRetriever(newRetriever)
          setIsLoading(false)
          setError(null)
        }
      } catch (error) {
        console.error('Error initializing vector store:', error)
        
        if (mounted) {
          setError(error instanceof Error ? error : new Error('Failed to initialize vector store'))
          
          // Retry logic
          if (retryCount < MAX_RETRIES) {
            retryCount++
            console.log(`Retrying vector store initialization (${retryCount}/${MAX_RETRIES})...`)
            setTimeout(initRetriever, RETRY_DELAY)
          } else {
            setIsLoading(false)
            toast({
              title: 'Error',
              description: 'Failed to initialize AI assistant. Please try refreshing the page.',
              variant: 'destructive'
            })
          }
        }
      }
    }

    initRetriever()

    return () => {
      mounted = false
    }
  }, [supabase, toast])

  return { retriever, isLoading, error }
}