import { chromium, Page } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'
import { ROUTES } from '@/lib/constants/routes'

type UserRole = 'customer' | 'agent' | 'admin'

// Define role-specific pages
const ROLE_ROUTES = {
  customer: {
    'tickets': ROUTES.dashboard.tickets,
    'settings': ROUTES.dashboard.settings,
    'kb': ROUTES.kb.home,
    'kb-articles': ROUTES.kb.articles,
    'kb-categories': ROUTES.kb.categories,
  },
  agent: {
    'queue': ROUTES.agent.queue,
    'templates': ROUTES.agent.templates,
    'workspace': ROUTES.agent.workspace,
    'kb': ROUTES.kb.home,
    'kb-articles': ROUTES.kb.articles,
    'kb-categories': ROUTES.kb.categories,
  },
  admin: {
    'departments': ROUTES.admin.departments,
    'reports': ROUTES.admin.reports,
    'team': ROUTES.admin.team,
    'settings': ROUTES.admin.settings,
    'kb': ROUTES.kb.home,
    'kb-articles': ROUTES.kb.articles,
    'kb-categories': ROUTES.kb.categories,
  }
} as const

type RoleSpecificPages<R extends UserRole> = keyof typeof ROLE_ROUTES[R]

// Function to get the full path for a page based on role
function getPagePath<R extends UserRole>(role: R, page: RoleSpecificPages<R>): string {
  return ROLE_ROUTES[role][page] as string
}

const ROLE_ALLOWED_PAGES = {
  customer: ['tickets',  'settings', 'kb', 'kb-articles', 'kb-categories'] as const,
  agent: ['queue', 'templates', 'workspace', 'kb', 'kb-articles', 'kb-categories'] as const,
  admin: ['departments', 'reports', 'team', 'settings', 'kb', 'kb-articles', 'kb-categories'] as const
} satisfies { [K in UserRole]: ReadonlyArray<RoleSpecificPages<K>> }

const TEST_USERS = {
  customer: {
    email: 'jack@gmail.com',
    password: 'fakeaccount',
    name: 'Jack Customer'
  },
  agent: {
    email: 'jack@agent.autocrm.com',
    password: 'fakeaccount',
    name: 'Jack Agent'
  },
  admin: {
    email: 'jack@admin.autocrm.com',
    password: 'fakeaccount',
    name: 'Jack Admin'
  }
} as const

interface ScreenshotOptions {
  role?: UserRole
  pages?: RoleSpecificPages<UserRole>[]
  viewports?: ('mobile' | 'tablet' | 'desktop')[]
}

interface ScreenshotAnalysis {
  name: string
  viewport: string
  dimensions: { width: number; height: number }
  hasContent: boolean
  elementCounts: {
    buttons: number
    inputs: number
    images: number
    links: number
  }
  accessibility: {
    missingAltTexts: number
    missingLabels: number
    missingAriaLabels: number
  }
  performance: {
    totalElements: number
    imageSize: number
  }
  consoleLogs: string[]
  failedRequests: {
    url: string
    status: number
    statusText: string
    error?: string
  }[]
  roleSpecificElements: {
    hasInternalNotes: boolean
    hasAdminControls: boolean
    hasAssignmentOptions: boolean
  }
  htmlDom: string
}

async function cleanupScreenshots() {
  const screenshotsDir = path.join(process.cwd(), '.screenshots-tmp')
  if (fs.existsSync(screenshotsDir)) {
    const oldDirs = fs.readdirSync(screenshotsDir)
    for (const dir of oldDirs) {
      const dirPath = path.join(screenshotsDir, dir)
      console.log(`Removed old screenshot directory: ${dirPath}`)
      fs.rmSync(dirPath, { recursive: true, force: true })
    }
  }
}

async function analyzeScreenshot(
  page: Page,
  pageName: string,
  viewport: string,
  role: UserRole
): Promise<ScreenshotAnalysis> {
  const dimensions = page.viewportSize()!
  const consoleLogs: string[] = []
  const failedRequests: ScreenshotAnalysis['failedRequests'] = []

  page.on('requestfailed', async request => {
    const response = await request.response()
    failedRequests.push({
      url: request.url(),
      status: response?.status() ?? 0,
      statusText: response?.statusText() ?? 'Unknown',
      error: request.failure()?.errorText
    })
  })

  page.on('console', msg => {
    consoleLogs.push(`${msg.type()}: ${msg.text()}`)
  })

  const analysis = await page.evaluate(() => {
    return {
      hasContent: document.body.textContent!.trim().length > 0,
      elementCounts: {
        buttons: document.querySelectorAll('button').length,
        inputs: document.querySelectorAll('input').length,
        images: document.querySelectorAll('img').length,
        links: document.querySelectorAll('a').length
      },
      accessibility: {
        missingAltTexts: Array.from(document.querySelectorAll('img:not([alt])')).length,
        missingLabels: Array.from(document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])')).length,
        missingAriaLabels: Array.from(document.querySelectorAll('[role]:not([aria-label]):not([aria-labelledby])')).length
      },
      performance: {
        totalElements: document.getElementsByTagName('*').length,
        imageSize: Array.from(document.querySelectorAll('img')).reduce((size, img) => size + ((img as HTMLImageElement).naturalWidth * (img as HTMLImageElement).naturalHeight), 0)
      },
      roleSpecificElements: {
        hasInternalNotes: !!document.querySelector('[data-testid="internal-notes"]'),
        hasAdminControls: !!document.querySelector('[data-testid="admin-controls"]'),
        hasAssignmentOptions: !!document.querySelector('[data-testid="assignment-options"]')
      },
      htmlDom: document.documentElement.outerHTML
    }
  })

  return {
    name: pageName,
    viewport,
    dimensions,
    ...analysis,
    consoleLogs,
    failedRequests
  }
}

async function signIn(page: Page, role: UserRole = 'customer') {
  const user = TEST_USERS[role]
  process.stdout.write('Stage: Authenticating... ')
  
  const maxRetries = 3
  let retryCount = 0

  while (retryCount < maxRetries) {
    try {
      // Navigate to login page and wait for it to be ready
      await page.goto('http://localhost:3000/login', {
        waitUntil: 'networkidle',
        timeout: 30000
      })

      // Wait for and fill email field
      await page.waitForSelector('input[name="email"]', { timeout: 30000 })
      await page.fill('input[name="email"]', user.email)
      await page.waitForTimeout(500) // Small delay between fields

      // Wait for and fill password field
      await page.waitForSelector('input[name="password"]', { timeout: 30000 })
      await page.fill('input[name="password"]', user.password)
      await page.waitForTimeout(500) // Small delay before submit

      // Submit and wait for navigation
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForResponse(
          response => response.url().includes('supabase.co/auth/v1/token'),
          { timeout: 30000 }
        ),
        page.waitForSelector('[role="status"]', { timeout: 30000 }),
        page.waitForNavigation({ 
          waitUntil: 'networkidle',
          timeout: 30000 
        })
      ])

      process.stdout.write('✓\n')
      return
    } catch (error) {
      retryCount++
      if (retryCount === maxRetries) {
        process.stdout.write('✗\n')
        throw new Error(`Failed to sign in after ${maxRetries} attempts: ${error}`)
      }
      process.stdout.write('retrying... ')
      await page.waitForTimeout(2000) // Wait before retry
    }
  }
}

async function waitForContent(page: Page) {
  try {
    await Promise.race([
      page.waitForSelector('main', { timeout: 5000 }),
      page.waitForSelector('.container', { timeout: 5000 }),
      page.waitForSelector('[role="main"]', { timeout: 5000 })
    ]).catch(() => {
      console.log('No main content container found, continuing anyway...')
    })

    await page.waitForSelector('[role="progressbar"]', { state: 'detached', timeout: 5000 }).catch(() => {
      // Ignore if no loading spinner found
    })

    await page.waitForTimeout(1000)
  } catch (error) {
    console.log('Error waiting for content:', error)
  }
}

async function logout(page: Page) {
  process.stdout.write('Stage: Logging out... ')
  try {
    // Clear cookies and storage
    const context = page.context()
    await context.clearCookies()
    await page.evaluate(() => {
      localStorage.clear()
      sessionStorage.clear()
    })
    
    // Navigate to home and verify logged out state
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle',
      timeout: 30000
    })
    
    process.stdout.write('✓\n')
  } catch (error) {
    process.stdout.write('✗\n')
    console.error('Error during logout:', error)
  }
}

async function captureRoleScreenshots(
  role: UserRole,
  tmpDir: string,
  viewports: ('mobile' | 'tablet' | 'desktop')[]
) {
  const browser = await chromium.launch({
    headless: true,
  })

  const viewportSizes = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1280, height: 800 }
  }

  try {
    const context = await browser.newContext({
      viewport: viewportSizes[viewports[0]]
    })
    const page = await context.newPage()

    await signIn(page, role)

    const analysis: { [key: string]: ScreenshotAnalysis } = {}
    const pages = ROLE_ALLOWED_PAGES[role]

    for (const pageName of pages) {
      process.stdout.write(`Stage: Processing ${pageName}... `)

      try {
        await page.goto(`http://localhost:3000${getPagePath(role, pageName as RoleSpecificPages<UserRole>)}`, { waitUntil: 'networkidle' })
        await waitForContent(page)

        for (const viewport of viewports) {
          await page.setViewportSize(viewportSizes[viewport])
          await page.waitForTimeout(1000)

          const screenshotPath = path.join(tmpDir, `${role}-${pageName}-${viewport}.png`)
          await page.screenshot({ 
            path: screenshotPath,
            fullPage: true 
          })

          const state = await page.evaluate(() => ({
            url: window.location.href,
            title: document.title,
            meta: {
              description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
              viewport: document.querySelector('meta[name="viewport"]')?.getAttribute('content'),
            },
            timing: {
              navigationStart: performance.timing.navigationStart,
              loadEventEnd: performance.timing.loadEventEnd,
            },
            stats: {
              totalElements: document.getElementsByTagName('*').length,
              scripts: document.getElementsByTagName('script').length,
              styles: document.getElementsByTagName('link').length,
              images: document.getElementsByTagName('img').length,
            },
            accessibility: {
              landmarks: Array.from(document.querySelectorAll('[role]')).map(el => ({
                role: el.getAttribute('role'),
                label: el.getAttribute('aria-label') || el.getAttribute('aria-labelledby'),
              })),
              headings: Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(el => ({
                level: el.tagName.toLowerCase(),
                text: el.textContent?.trim(),
              })),
            },
            forms: Array.from(document.forms).map(form => ({
              id: form.id,
              name: form.name,
              elements: Array.from(form.elements).map((el: HTMLFormElement) => ({
                type: el.type,
                name: el.name,
                required: el.required,
                value: el.type === 'password' ? '[REDACTED]' : el.value,
              })),
            })),
          }))

          fs.writeFileSync(
            path.join(tmpDir, `${role}-${pageName}-${viewport}-state.json`),
            JSON.stringify(state, null, 2)
          )

          analysis[`${role}-${pageName}-${viewport}`] = await analyzeScreenshot(page, pageName, viewport, role)
        }
        process.stdout.write('✓\n')
      } catch (error) {
        process.stdout.write('✗\n')
        console.error(`Error processing ${pageName}:`, error)
      }
    }

    fs.writeFileSync(
      path.join(tmpDir, `${role}-analysis.json`),
      JSON.stringify(analysis, null, 2)
    )

    await logout(page)
  } finally {
    await browser.close()
  }
}

async function captureAndAnalyzeScreenshots(options: ScreenshotOptions = {}) {
  const {
    viewports = ['desktop']
  } = options

  await cleanupScreenshots()
  
  const tmpDir = path.join(process.cwd(), '.screenshots-tmp', Date.now().toString())
  fs.mkdirSync(tmpDir, { recursive: true })
  
  console.log(`\nScreenshots will be saved to: ${tmpDir}\n`)

  // Process each role sequentially
  const roles: UserRole[] = ['customer', 'agent', 'admin']
  
  for (const role of roles) {
    console.log(`\nProcessing role: ${role}`)
    await captureRoleScreenshots(role, tmpDir, viewports)
    // Add delay between roles to ensure clean state
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  process.stdout.write('Stage: Complete ✓\n')
}

// Parse command line arguments
const args = process.argv.slice(2)
const options: ScreenshotOptions = {}

// Parse role
const roleArg = args.find(arg => arg.startsWith('--role='))
if (roleArg) {
  const role = roleArg.split('=')?.[1] as UserRole
  if (TEST_USERS[role]) {
    options.role = role
  } else {
    console.error(`Invalid role. Available roles: ${Object.keys(TEST_USERS).join(', ')}`)
    process.exit(1)
  }
}

// Parse pages
const pagesArg = args.find(arg => arg.startsWith('--pages='))
if (pagesArg) {
  const pages = pagesArg.split('=')?.[1]?.split(',') as RoleSpecificPages<UserRole>[]
  if (pages.every(page => page in ROLE_ROUTES[options.role!])) {
    options.pages = pages
  } else {
    console.error(`Invalid pages. Available pages: ${Object.keys(ROLE_ROUTES[options.role!]).join(', ')}`)
    process.exit(1)
  }
}

// Parse viewports
const viewportsArg = args.find(arg => arg.startsWith('--viewports='))
if (viewportsArg) {
  const viewports = viewportsArg.split('=')?.[1]?.split(',') as ('mobile' | 'tablet' | 'desktop')[]
  if (viewports.every(viewport => ['mobile', 'tablet', 'desktop'].includes(viewport))) {
    options.viewports = viewports
  } else {
    console.error('Invalid viewports. Available viewports: mobile, tablet, desktop')
    process.exit(1)
  }
}

captureAndAnalyzeScreenshots(options)