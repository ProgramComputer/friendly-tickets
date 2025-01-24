'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Database } from '@/lib/supabase.types'

export type Article = Database['public']['Tables']['kb_articles']['Row']
export type Category = Database['public']['Tables']['kb_categories']['Row']

export async function getCategories() {
  const supabase = createServerSupabaseClient()
  
  const { data: categories, error } = await supabase
    .from('kb_categories')
    .select('*')
    .order('name')
  
  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }
  
  return categories
}

export async function getCategory(id: string) {
  const supabase = createServerSupabaseClient()
  
  const { data: category, error: categoryError } = await supabase
    .from('kb_categories')
    .select('*')
    .eq('id', id)
    .single()
  
  if (categoryError) {
    console.error('Error fetching category:', categoryError)
    return null
  }
  
  const { data: articles, error: articlesError } = await supabase
    .from('kb_articles')
    .select('*')
    .eq('category_id', id)
    .order('created_at')
  
  if (articlesError) {
    console.error('Error fetching category articles:', articlesError)
    return null
  }
  
  return {
    ...category,
    articles: articles || []
  }
}

export async function getArticle(id: string) {
  const supabase = createServerSupabaseClient()
  
  const { data: article, error } = await supabase
    .from('kb_articles')
    .select(`
      *,
      category:kb_categories(*)
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching article:', error)
    return null
  }
  
  return article
}

export async function searchArticles(query: string) {
  const supabase = createServerSupabaseClient()
  
  const { data: articles, error } = await supabase
    .from('kb_articles')
    .select(`
      *,
      category:kb_categories(*)
    `)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('helpful_count', { ascending: false })
    .limit(10)
  
  if (error) {
    console.error('Error searching articles:', error)
    return []
  }
  
  return articles
}

export async function submitArticleFeedback(articleId: string, isHelpful: boolean) {
  const supabase = createServerSupabaseClient()
  
  const { data: user } = await supabase.auth.getUser()
  
  const { error } = await supabase
    .from('kb_article_feedback')
    .insert({
      article_id: articleId,
      user_id: user.user?.id,
      is_helpful: isHelpful
    })
  
  if (error) {
    console.error('Error submitting feedback:', error)
    return false
  }
  
  return true
} 