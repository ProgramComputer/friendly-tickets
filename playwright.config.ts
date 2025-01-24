import { defineConfig, devices } from '@playwright/test'
import path from 'path'

// Read from environment variables
const PORT = process.env.PORT || 3001
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/setup/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './tests/auth/customer.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'agent',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './tests/auth/agent.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'admin',
      use: { 
        ...devices['Desktop Chrome'],
        storageState: './tests/auth/admin.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 13'],
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
}) 