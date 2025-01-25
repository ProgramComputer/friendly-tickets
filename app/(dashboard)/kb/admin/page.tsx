'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Search, Plus, FileText, Settings, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { getCategories, searchArticles } from '@/lib/services/knowledge-base'
import { useDebounce } from '@/lib/hooks/use-debounce'

export default function KBAdminPage() {
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
      aria-label="Knowledge Base Administration"
      className="flex-1"
    >
      <div className="container mx-auto py-8">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Knowledge Base Administration</h1>
              <p className="text-muted-foreground">
                Manage articles, categories, and monitor knowledge base performance.
              </p>
            </div>
            <div className="flex gap-4">
              <Button asChild>
                <Link href="/kb/admin/articles/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Article
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/kb/admin/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </div>
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
                    href={`/kb/admin/articles/${article.id}/edit`}
                    aria-label={`Edit article: ${article.title}`}
                  >
                    <Card className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-4">
                          <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-1" aria-hidden="true" />
                          <div>
                            <h3 className="font-medium mb-1">{article.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {article.excerpt}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>Status: {article.status}</span>
                              <span>•</span>
                              <span>Category: {article.category.name}</span>
                              <span>•</span>
                              <span>{article.read_time_minutes} min read</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
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
              <section aria-label="Knowledge Base Categories" className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Categories</h2>
                  <Button variant="outline" asChild>
                    <Link href="/kb/admin/categories">
                      Manage Categories
                    </Link>
                  </Button>
                </div>
                <div className="grid gap-4">
                  {categories.map((category) => (
                    <Link 
                      key={category.id} 
                      href={`/kb/admin/categories/${category.id}`}
                      aria-label={`Manage ${category.name} category`}
                    >
                      <Card className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
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
                  ))}
                </div>
              </section>

              {/* Recent Articles */}
              <section aria-label="Recent Articles">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Recent Articles</h2>
                  <Button variant="outline" asChild>
                    <Link href="/kb/admin/articles">
                      View All Articles
                    </Link>
                  </Button>
                </div>
                <div className="grid gap-4">
                  {searchResults.slice(0, 5).map((article) => (
                    <Link 
                      key={article.id} 
                      href={`/kb/admin/articles/${article.id}/edit`}
                      aria-label={`Edit article: ${article.title}`}
                    >
                      <Card className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-4">
                            <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-1" aria-hidden="true" />
                            <div>
                              <h3 className="font-medium mb-1">{article.title}</h3>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>Status: {article.status}</span>
                                <span>•</span>
                                <span>Category: {article.category.name}</span>
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  )
} 