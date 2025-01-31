export interface KBCategory {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  articles?: KBArticle[]
}

export interface KBArticle {
  id: string
  title: string
  content: string
  excerpt: string | null
  category_id: string
  category: {
    id: string
    name: string
  }
  read_time_minutes: number
  helpful_count: number
  not_helpful_count: number
  created_at: string
  updated_at: string
}

/**
 * Get all knowledge base categories
 */
export async function getCategories(): Promise<KBCategory[]> {
  const response = await fetch('/api/kb/categories', {
    headers: {
      'Accept': 'application/json'
    }
  })
  if (!response.ok) {
    throw new Error('Failed to fetch categories')
  }
  return response.json()
}

/**
 * Search knowledge base articles
 */
export async function searchArticles(query: string): Promise<KBArticle[]> {
  if (!query) return []
  
  const response = await fetch(`/api/kb/search?q=${encodeURIComponent(query)}`, {
    headers: {
      'Accept': 'application/json'
    }
  })
  if (!response.ok) {
    throw new Error('Failed to search articles')
  }
  return response.json()
}

export async function getArticle(slug: string): Promise<KBArticle | null> {
  const response = await fetch(`/api/kb/articles/${encodeURIComponent(slug)}`, {
    headers: {
      'Accept': 'application/json'
    }
  })
  if (response.status === 404) {
    return null
  }
  if (!response.ok) {
    throw new Error('Failed to fetch article')
  }
  return response.json()
}

export async function submitArticleFeedback(articleId: string, isHelpful: boolean): Promise<boolean> {
  const response = await fetch(`/api/kb/articles/${encodeURIComponent(articleId)}/feedback`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isHelpful })
  })
  
  if (!response.ok) {
    throw new Error('Failed to submit feedback')
  }
  
  const { success } = await response.json()
  return success
}

export async function getCategory(id: string): Promise<(KBCategory & { articles: KBArticle[] }) | null> {
  const response = await fetch(`/api/kb/categories/${encodeURIComponent(id)}`, {
    headers: {
      'Accept': 'application/json'
    }
  })
  if (response.status === 404) {
    return null
  }
  if (!response.ok) {
    throw new Error('Failed to fetch category')
  }
  return response.json()
}

export async function getRecentArticles(): Promise<KBArticle[]> {
  const response = await fetch('/api/kb/articles/recent', {
    headers: {
      'Accept': 'application/json'
    }
  })
  if (!response.ok) {
    throw new Error('Failed to fetch recent articles')
  }
  return response.json()
} 