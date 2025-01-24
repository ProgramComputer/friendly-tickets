'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Search, Book, FileText, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { getCategories, searchArticles } from '@/lib/services/knowledge-base'
import { useQuery } from '@tanstack/react-query'
import { useDebounce } from '@/lib/hooks/use-debounce'

export default function KnowledgeBasePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 300)

  const { data: categories = [] } = useQuery({
    queryKey: ['kb-categories'],
    queryFn: getCategories
  })

  const { data: searchResults = [] } = useQuery({
    queryKey: ['kb-search', debouncedQuery],
    queryFn: () => searchArticles(debouncedQuery),
    enabled: debouncedQuery.length > 0
  })

  return (
    <main 
      id="main-content"
      role="main"
      aria-label="Knowledge Base"
      className="flex-1"
    >
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Knowledge Base</h1>
            <p className="text-muted-foreground">
              Find answers to common questions and learn how to use AutoCRM effectively.
            </p>
          </header>

          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label="Search knowledge base articles"
            />
          </div>

          {searchQuery ? (
            /* Search Results */
            <section aria-label="Search Results">
              <div className="grid gap-4">
                {searchResults.map((article) => (
                  <Link 
                    key={article.id} 
                    href={`/kb/articles/${article.id}`}
                    aria-label={`Read article: ${article.title}`}
                  >
                    <Card className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex gap-4">
                        <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-1" aria-hidden="true" />
                        <div>
                          <h3 className="font-medium mb-1">{article.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {article.excerpt}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {article.read_time_minutes} min read
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
                {searchResults.length === 0 && (
                  <p className="text-center text-muted-foreground py-8" role="status">
                    No articles found matching your search.
                  </p>
                )}
              </div>
            </section>
          ) : (
            <>
              {/* Categories */}
              <section aria-label="Knowledge Base Categories">
                <div className="grid gap-4">
                  {categories.map((category) => {
                    const Icon = category.id === 'getting-started' ? Book : FileText
                    return (
                      <Link 
                        key={category.id} 
                        href={`/kb/categories/${category.id}`}
                        aria-label={`Browse ${category.name} category`}
                      >
                        <Card className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                              <div>
                                <h3 className="font-medium">{category.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {category.description}
                                </p>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                          </div>
                        </Card>
                      </Link>
                    )
                  })}
                </div>
              </section>

              {/* Popular Articles */}
              <section aria-label="Popular Articles" className="mt-12">
                <h2 className="text-xl font-semibold mb-4">Popular Articles</h2>
                <div className="grid gap-3">
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link href="/kb/articles/getting-started">
                      <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                      Getting Started with AutoCRM
                    </Link>
                  </Button>
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link href="/kb/articles/create-ticket">
                      <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                      How to Create Your First Ticket
                    </Link>
                  </Button>
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link href="/kb/articles/chat-features">
                      <FileText className="h-4 w-4 mr-2" aria-hidden="true" />
                      Using the Chat Features
                    </Link>
                  </Button>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  )
} 