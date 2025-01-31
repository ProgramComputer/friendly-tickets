import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function generateEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  })
  
  return response.data[0].embedding
}

export async function generateTicketEmbedding(ticket: {
  title: string
  description: string
  status: string
  priority: string
  category: string
  tags: string[]
  department: string
  created_at: string
  updated_at: string
}) {
  const textToEmbed = `
    Title: ${ticket.title}
    Description: ${ticket.description}
    Status: ${ticket.status}
    Priority: ${ticket.priority}
    Category: ${ticket.category}
    Tags: ${ticket.tags.join(', ')}
    Department: ${ticket.department}
    Created: ${ticket.created_at}
    Updated: ${ticket.updated_at}
  `.trim()

  return generateEmbedding(textToEmbed)
}

export async function generateKBArticleEmbedding(article: {
  title: string
  content: string
}) {
  const textToEmbed = `
    Title: ${article.title}
    Content: ${article.content}
  `.trim()

  return generateEmbedding(textToEmbed)
}