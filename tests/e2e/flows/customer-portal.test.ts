import { test, expect } from '@playwright/test'
import { TEST_USERS } from '../../../scripts/seed-test-data'

test.describe('Customer Portal Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('complete ticket creation flow', async ({ page }) => {
    // Login
    await page.goto('/auth/login')
    await page.fill('[data-test="email-input"]', TEST_USERS.customer.email)
    await page.fill('[data-test="password-input"]', TEST_USERS.customer.password)
    await page.click('[data-test="login-button"]')
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-test="customer-dashboard"]')
    
    // Create new ticket
    await page.click('[data-test="create-ticket-button"]')
    
    // Fill ticket form
    await page.fill('[data-test="ticket-title"]', 'Test Ticket')
    await page.fill('[data-test="ticket-description"]', 'This is a test ticket description')
    await page.selectOption('[data-test="ticket-category"]', 'technical')
    await page.selectOption('[data-test="ticket-priority"]', 'medium')
    
    // Submit ticket
    await page.click('[data-test="submit-ticket-button"]')
    
    // Verify ticket creation
    await page.waitForSelector('[data-test="ticket-success-message"]')
    const ticketId = await page.getAttribute('[data-test="new-ticket-id"]', 'data-ticket-id')
    expect(ticketId).toBeTruthy()
  })

  test('ticket list and filtering', async ({ page }) => {
    // Login
    await page.goto('/auth/login')
    await page.fill('[data-test="email-input"]', TEST_USERS.customer.email)
    await page.fill('[data-test="password-input"]', TEST_USERS.customer.password)
    await page.click('[data-test="login-button"]')
    
    // Wait for ticket list to load
    await page.waitForSelector('[data-test="ticket-list"]')
    
    // Test sorting
    await page.click('[data-test="sort-by-date"]')
    await page.waitForSelector('[data-test="ticket-list-item"]')
    
    // Test filtering
    await page.selectOption('[data-test="status-filter"]', 'open')
    await page.waitForSelector('[data-test="ticket-list-item"]')
    
    // Verify filtered results
    const openTickets = await page.$$('[data-test="ticket-status-open"]')
    expect(openTickets.length).toBeGreaterThan(0)
  })

  test('ticket feedback flow', async ({ page }) => {
    // Login
    await page.goto('/auth/login')
    await page.fill('[data-test="email-input"]', TEST_USERS.customer.email)
    await page.fill('[data-test="password-input"]', TEST_USERS.customer.password)
    await page.click('[data-test="login-button"]')
    
    // Navigate to resolved ticket
    await page.goto('/tickets?status=resolved')
    await page.click('[data-test="ticket-list-item"]')
    
    // Submit feedback
    await page.click('[data-test="feedback-button"]')
    await page.click('[data-test="rating-4"]') // 4 stars
    await page.fill('[data-test="feedback-comment"]', 'Great service!')
    await page.click('[data-test="submit-feedback-button"]')
    
    // Verify feedback submission
    await page.waitForSelector('[data-test="feedback-success-message"]')
  })

  test('knowledge base search', async ({ page }) => {
    // Login
    await page.goto('/auth/login')
    await page.fill('[data-test="email-input"]', TEST_USERS.customer.email)
    await page.fill('[data-test="password-input"]', TEST_USERS.customer.password)
    await page.click('[data-test="login-button"]')
    
    // Navigate to knowledge base
    await page.click('[data-test="knowledge-base-link"]')
    
    // Search for article
    await page.fill('[data-test="kb-search"]', 'password reset')
    await page.press('[data-test="kb-search"]', 'Enter')
    
    // Verify search results
    await page.waitForSelector('[data-test="search-results"]')
    const articles = await page.$$('[data-test="article-item"]')
    expect(articles.length).toBeGreaterThan(0)
  })
}) 