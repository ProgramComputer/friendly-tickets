import { test, expect } from '@playwright/test'
import { TEST_USERS } from '../../../scripts/seed-test-data'

test.describe('Agent Portal Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('ticket assignment and response flow', async ({ page }) => {
    // Login as agent
    await page.goto('/auth/login')
    await page.fill('[data-test="email-input"]', TEST_USERS.agent.email)
    await page.fill('[data-test="password-input"]', TEST_USERS.agent.password)
    await page.click('[data-test="login-button"]')
    
    // Wait for agent dashboard
    await page.waitForSelector('[data-test="agent-dashboard"]')
    
    // Find unassigned ticket
    await page.click('[data-test="unassigned-queue"]')
    await page.click('[data-test="ticket-list-item"]')
    
    // Assign ticket to self
    await page.click('[data-test="assign-to-me-button"]')
    
    // Add response
    await page.fill('[data-test="response-input"]', 'I will help you with this issue.')
    await page.click('[data-test="send-response-button"]')
    
    // Verify response posted
    await page.waitForSelector('[data-test="agent-response"]')
  })

  test('ticket status management', async ({ page }) => {
    // Login as agent
    await page.goto('/auth/login')
    await page.fill('[data-test="email-input"]', TEST_USERS.agent.email)
    await page.fill('[data-test="password-input"]', TEST_USERS.agent.password)
    await page.click('[data-test="login-button"]')
    
    // Navigate to assigned ticket
    await page.click('[data-test="my-tickets"]')
    await page.click('[data-test="ticket-list-item"]')
    
    // Change status
    await page.click('[data-test="status-dropdown"]')
    await page.click('[data-test="status-in-progress"]')
    
    // Add internal note
    await page.click('[data-test="add-internal-note"]')
    await page.fill('[data-test="note-input"]', 'Working on this issue')
    await page.click('[data-test="save-note-button"]')
    
    // Verify status change
    await page.waitForSelector('[data-test="status-badge-in-progress"]')
  })

  test('knowledge base article management', async ({ page }) => {
    // Login as agent
    await page.goto('/auth/login')
    await page.fill('[data-test="email-input"]', TEST_USERS.agent.email)
    await page.fill('[data-test="password-input"]', TEST_USERS.agent.password)
    await page.click('[data-test="login-button"]')
    
    // Navigate to knowledge base management
    await page.click('[data-test="kb-management"]')
    
    // Create new article
    await page.click('[data-test="create-article-button"]')
    await page.fill('[data-test="article-title"]', 'How to Reset Your Password')
    await page.fill('[data-test="article-content"]', '# Password Reset Guide\n\nFollow these steps...')
    await page.selectOption('[data-test="article-category"]', 'account')
    
    // Save draft
    await page.click('[data-test="save-draft-button"]')
    
    // Verify draft saved
    await page.waitForSelector('[data-test="draft-success-message"]')
  })

  test('performance metrics dashboard', async ({ page }) => {
    // Login as agent
    await page.goto('/auth/login')
    await page.fill('[data-test="email-input"]', TEST_USERS.agent.email)
    await page.fill('[data-test="password-input"]', TEST_USERS.agent.password)
    await page.click('[data-test="login-button"]')
    
    // Navigate to metrics
    await page.click('[data-test="metrics-dashboard"]')
    
    // Check various metrics
    await page.waitForSelector('[data-test="response-time-chart"]')
    await page.waitForSelector('[data-test="resolution-rate-chart"]')
    await page.waitForSelector('[data-test="customer-satisfaction-score"]')
    
    // Filter metrics
    await page.click('[data-test="date-range-picker"]')
    await page.click('[data-test="last-7-days"]')
    
    // Verify charts update
    await page.waitForSelector('[data-test="chart-loading"]', { state: 'hidden' })
  })
}) 