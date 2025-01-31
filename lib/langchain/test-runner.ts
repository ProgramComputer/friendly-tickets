import { crmTracer, withTracing } from './tracer'
import { TEST_USERS, ADDITIONAL_TEST_USERS } from '@/scripts/seed-test-data'
import { createClient } from '@supabase/supabase-js'

interface TestCase {
  id: string
  input: string
  expectedOutput: Record<string, any>
  context: {
    user: {
      email: string
      role: string
    }
    additionalData?: Record<string, any>
  }
  successCriteria: string[]
}

interface TestResult {
  testId: string
  success: boolean
  metrics: {
    commandUnderstanding: number
    executionAccuracy: number
    responseTime: number
    contextRelevance: number
  }
  errors?: string[]
}

class NLCommandTestRunner {
  private supabase
  private testCases: TestCase[]
  private results: TestResult[]

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    this.testCases = []
    this.results = []
  }

  addTestCase(testCase: TestCase) {
    this.testCases.push(testCase)
  }

  private async validateDatabaseState(
    expectedChanges: Record<string, any>
  ): Promise<boolean> {
    // Implement database state validation logic
    // This should check if the expected changes were made correctly
    return true
  }

  private async runSingleTest(testCase: TestCase): Promise<TestResult> {
    const processCommand = withTracing(
      `test-${testCase.id}`,
      async (input: string, context: any) => {
        // Here you would call your actual command processing logic
        // For now, we'll just simulate it
        return {
          success: true,
          changes: testCase.expectedOutput
        }
      }
    )

    try {
      // Execute the command
      const result = await processCommand(testCase.input, testCase.context)

      // Validate database state
      const isValid = await this.validateDatabaseState(testCase.expectedOutput)

      // Get metrics from tracer
      const metrics = crmTracer.getMetrics()

      return {
        testId: testCase.id,
        success: isValid,
        metrics
      }
    } catch (error) {
      return {
        testId: testCase.id,
        success: false,
        metrics: crmTracer.getMetrics(),
        errors: [(error as Error).message]
      }
    }
  }

  async runAllTests(): Promise<TestResult[]> {
    this.results = []

    for (const testCase of this.testCases) {
      console.log(`Running test ${testCase.id}...`)
      const result = await this.runSingleTest(testCase)
      this.results.push(result)
      console.log(`Test ${testCase.id} completed:`, result)
    }

    return this.results
  }

  getTestSummary() {
    const total = this.results.length
    const successful = this.results.filter(r => r.success).length
    const failed = total - successful

    const averageMetrics = this.results.reduce(
      (acc, curr) => ({
        commandUnderstanding: acc.commandUnderstanding + curr.metrics.commandUnderstanding,
        executionAccuracy: acc.executionAccuracy + curr.metrics.executionAccuracy,
        responseTime: acc.responseTime + curr.metrics.responseTime,
        contextRelevance: acc.contextRelevance + curr.metrics.contextRelevance
      }),
      {
        commandUnderstanding: 0,
        executionAccuracy: 0,
        responseTime: 0,
        contextRelevance: 0
      }
    )

    Object.keys(averageMetrics).forEach(key => {
      averageMetrics[key as keyof typeof averageMetrics] /= total
    })

    return {
      totalTests: total,
      successful,
      failed,
      successRate: (successful / total) * 100,
      averageMetrics
    }
  }
}

// Example test cases
const testCases: TestCase[] = [
  {
    id: 'TC-101',
    input: 'Create a ticket about login issues',
    expectedOutput: {
      table: 'tickets',
      operation: 'insert',
      fields: {
        title: expect.stringContaining('login issues'),
        status: 'open',
        priority: 'medium',
        category: 'technical'
      }
    },
    context: {
      user: {
        email: TEST_USERS.customer.email,
        role: 'customer'
      }
    },
    successCriteria: [
      'Ticket created in database',
      'Correct default fields set',
      'Customer notified'
    ]
  },
  {
    id: 'TC-102',
    input: 'Assign ticket #123 to Emma from tech support',
    expectedOutput: {
      table: 'tickets',
      operation: 'update',
      fields: {
        assignee_id: expect.any(String),
        status: 'pending'
      }
    },
    context: {
      user: {
        email: TEST_USERS.agent.email,
        role: 'agent'
      }
    },
    successCriteria: [
      'Assignee updated',
      'Status changed to pending',
      'History recorded'
    ]
  }
]

// Example usage:
/*
async function runTests() {
  const runner = new NLCommandTestRunner()
  
  // Add test cases
  testCases.forEach(testCase => runner.addTestCase(testCase))
  
  // Run tests
  const results = await runner.runAllTests()
  
  // Get summary
  const summary = runner.getTestSummary()
  console.log('Test Summary:', summary)
}

runTests().catch(console.error)
*/

export { NLCommandTestRunner, type TestCase, type TestResult } 