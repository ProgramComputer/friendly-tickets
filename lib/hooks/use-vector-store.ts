import { useEffect, useState } from 'react'
import { VectorStoreRetriever } from '@langchain/core/vectorstores'
import { useSupabase } from '@/lib/hooks/use-supabase'

export function useVectorStore() {
  const [retriever, setRetriever] = useState<VectorStoreRetriever | null>(null)
  const supabase = useSupabase()

  useEffect(() => {
    const initRetriever = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          console.error('No auth session found')
          return
        }

        // Get retriever from server
        const response = await fetch('/api/ai/retriever', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to initialize retriever')
        }

        const { retriever: newRetriever } = await response.json()
        setRetriever(newRetriever)
      } catch (error) {
        console.error('Error initializing vector store:', error)
      }
    }

    initRetriever()
  }, [supabase])

  return retriever
}