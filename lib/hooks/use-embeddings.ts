import { useState } from 'react'
import { updateTicketEmbedding, updateKBArticleEmbedding } from '@/lib/actions/embeddings'

export function useEmbeddings() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateTicketEmbedding = async (ticketId: string) => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const result = await updateTicketEmbedding(ticketId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate ticket embedding')
      }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setIsGenerating(false)
    }
  }

  const generateKBArticleEmbedding = async (articleId: string) => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const result = await updateKBArticleEmbedding(articleId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate KB article embedding')
      }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    generateTicketEmbedding,
    generateKBArticleEmbedding,
    isGenerating,
    error
  }
}