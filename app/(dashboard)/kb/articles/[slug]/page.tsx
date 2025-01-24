'use client'

import { useParams } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getArticle, submitArticleFeedback } from '@/lib/services/knowledge-base'
import { Button } from '@/components/ui/button'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { toast } from 'sonner'

export default function ArticlePage() {
  const params = useParams()
  const slug = params.slug as string

  const { data: article, isLoading, error } = useQuery({
    queryKey: ['kb-article', slug],
    queryFn: () => getArticle(slug)
  })

  const { mutate: submitFeedback } = useMutation({
    mutationFn: (isHelpful: boolean) => submitArticleFeedback(slug, isHelpful),
    onSuccess: () => {
      toast.success('Thank you for your feedback!')
    },
    onError: () => {
      toast.error('Failed to submit feedback. Please try again.')
    }
  })

  if (isLoading) {
    return (
      <main 
        id="main-content"
        role="main"
        aria-label="Loading Article"
        className="flex-1"
      >
        <div className="container mx-auto py-8">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 w-3/4 bg-muted rounded mb-4"></div>
              <div className="h-4 w-1/4 bg-muted rounded mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 w-5/6 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (error || !article) {
    return (
      <main 
        id="main-content"
        role="main"
        aria-label="Article Not Found"
        className="flex-1"
      >
        <div className="container mx-auto py-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
            <p className="text-muted-foreground">
              The article you're looking for doesn't exist or has been moved.
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main 
      id="main-content"
      role="main"
      aria-label={article.title}
      className="flex-1"
    >
      <article className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{article.read_time_minutes} min read</span>
              <span>•</span>
              <span>Category: {article.kb_categories.name}</span>
            </div>
          </header>

          <div 
            className="prose prose-gray dark:prose-invert max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          <footer className="border-t pt-8">
            <div className="text-center">
              <h2 className="text-lg font-medium mb-4">Was this article helpful?</h2>
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => submitFeedback(true)}
                  aria-label="Yes, this article was helpful"
                >
                  <ThumbsUp className="h-4 w-4 mr-2" aria-hidden="true" />
                  Yes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => submitFeedback(false)}
                  aria-label="No, this article was not helpful"
                >
                  <ThumbsDown className="h-4 w-4 mr-2" aria-hidden="true" />
                  No
                </Button>
              </div>
            </div>
          </footer>
        </div>
      </article>
    </main>
  )
} 