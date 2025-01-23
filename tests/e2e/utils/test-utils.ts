import { Page } from '@playwright/test'
import { TEST_USERS } from '../../../scripts/seed-test-data'

type UserRole = keyof typeof TEST_USERS

export async function loginAs(page: Page, role: UserRole) {
  const user = TEST_USERS[role]
  await page.goto('/auth/login')
  await page.fill('[data-test="email-input"]', user.email)
  await page.fill('[data-test="password-input"]', user.password)
  await page.click('[data-test="login-button"]')
  
  // Wait for appropriate dashboard based on role
  if (role === 'customer') {
    await page.waitForSelector('[data-test="customer-dashboard"]')
  } else if (role === 'agent' || role === 'admin') {
    await page.waitForSelector('[data-test="agent-dashboard"]')
  }
}

export async function createTicket(page: Page, {
  title = 'Test Ticket',
  description = 'This is a test ticket',
  category = 'technical',
  priority = 'medium'
} = {}) {
  await page.click('[data-test="create-ticket-button"]')
  await page.fill('[data-test="ticket-title"]', title)
  await page.fill('[data-test="ticket-description"]', description)
  await page.selectOption('[data-test="ticket-category"]', category)
  await page.selectOption('[data-test="ticket-priority"]', priority)
  await page.click('[data-test="submit-ticket-button"]')
  await page.waitForSelector('[data-test="ticket-success-message"]')
  return page.getAttribute('[data-test="new-ticket-id"]', 'data-ticket-id')
}

export async function assignTicketToSelf(page: Page) {
  await page.click('[data-test="assign-to-me-button"]')
  await page.waitForSelector('[data-test="assignment-success-message"]')
}

export async function addTicketResponse(page: Page, response: string) {
  await page.fill('[data-test="response-input"]', response)
  await page.click('[data-test="send-response-button"]')
  await page.waitForSelector('[data-test="response-success-message"]')
}

export async function changeTicketStatus(page: Page, status: string) {
  await page.click('[data-test="status-dropdown"]')
  await page.click(`[data-test="status-${status}"]`)
  await page.waitForSelector(`[data-test="status-badge-${status}"]`)
}

export async function addInternalNote(page: Page, note: string) {
  await page.click('[data-test="add-internal-note"]')
  await page.fill('[data-test="note-input"]', note)
  await page.click('[data-test="save-note-button"]')
  await page.waitForSelector('[data-test="note-success-message"]')
}

export async function submitTicketFeedback(page: Page, {
  rating = 4,
  comment = 'Great service!'
} = {}) {
  await page.click('[data-test="feedback-button"]')
  await page.click(`[data-test="rating-${rating}"]`)
  await page.fill('[data-test="feedback-comment"]', comment)
  await page.click('[data-test="submit-feedback-button"]')
  await page.waitForSelector('[data-test="feedback-success-message"]')
}

export async function createKnowledgeBaseArticle(page: Page, {
  title = 'Test Article',
  content = '# Test Content\n\nThis is a test article.',
  category = 'general'
} = {}) {
  await page.click('[data-test="create-article-button"]')
  await page.fill('[data-test="article-title"]', title)
  await page.fill('[data-test="article-content"]', content)
  await page.selectOption('[data-test="article-category"]', category)
  await page.click('[data-test="save-draft-button"]')
  await page.waitForSelector('[data-test="draft-success-message"]')
} 