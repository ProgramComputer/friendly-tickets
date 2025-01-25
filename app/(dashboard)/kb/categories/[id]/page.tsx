'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getCategory } from '@/lib/services/knowledge-base'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Clock, ChevronRight } from 'lucide-react'

export default function CategoryPage() {
  const params = useParams()
  const id = params.id as string

  const { data: category, isLoading, error } = useQuery({
    queryKey: ['kb-category', id],
    queryFn: () => getCategory(id)
  })

  if (isLoading) {
    return (
      <main 
        id="main-content"
        role="main"
        aria-label="Loading Category"
        className="flex-1"
      >
        <div className="container mx-auto py-8">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 w-3/4 bg-muted rounded mb-4"></div>
              <div className="h-4 w-1/2 bg-muted rounded mb-8"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (error || !category) {
    return (
      <main 
        id="main-content"
        role="main"
        aria-label="Category Not Found"
        className="flex-1"
      >
        <div className="container mx-auto py-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
            <p className="text-muted-foreground">
              The category you're looking for doesn't exist or has been moved.
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
      aria-label={category.name}
      className="flex-1"
    >
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
            {category.description && (
              <p className="text-muted-foreground">{category.description}</p>
            )}
          </header>

          <section aria-label="Articles in this category">
            {category.articles.length > 0 ? (
              <div className="space-y-4">
                {category.articles.map((article) => (
                  <Link 
                    key={article.id} 
                    href={`/kb/articles/${article.id}`}
                    className="block"
                  >
                    <Card className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h2 className="text-xl font-semibold mb-2">
                            {article.title}
                          </h2>
                          {article.excerpt && (
                            <p className="text-muted-foreground mb-2">
                              {article.excerpt}
                            </p>
                          )}
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" aria-hidden="true" />
                            <span>{article.read_time_minutes} min read</span>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">
                No articles in this category yet.
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  )
} 