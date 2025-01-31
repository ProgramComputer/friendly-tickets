import { LangChainTracer } from 'langchain/callbacks'
import { BaseCallbackHandler } from 'langchain/callbacks'

interface TracerMetrics {
  commandUnderstanding: number
  executionAccuracy: number
  responseTime: number
  contextRelevance: number
}

class CRMTracer extends BaseCallbackHandler {
  private tracer: LangChainTracer
  private metrics: TracerMetrics
  private startTime: number

  constructor() {
    super()
    this.tracer = new LangChainTracer({
      projectName: "autocrm-nl-commands"
    })
    this.metrics = {
      commandUnderstanding: 0,
      executionAccuracy: 0,
      responseTime: 0,
      contextRelevance: 0
    }
    this.startTime = 0
  }

  async handleChainStart(chain: { name: string }, inputs: Record<string, any>) {
    this.startTime = Date.now()
    await this.tracer.handleChainStart(chain, inputs)
    
    // Log chain start with input context
    console.log(`[CRMTracer] Chain ${chain.name} started:`, {
      inputs,
      timestamp: new Date().toISOString()
    })
  }

  async handleChainEnd(outputs: Record<string, any>) {
    const endTime = Date.now()
    this.metrics.responseTime = endTime - this.startTime
    
    await this.tracer.handleChainEnd(outputs)
    
    // Log chain completion with metrics
    console.log('[CRMTracer] Chain completed:', {
      outputs,
      metrics: this.metrics,
      duration: `${this.metrics.responseTime}ms`
    })
  }

  async handleLLMStart(llm: { name: string }, prompts: string[]) {
    await this.tracer.handleLLMStart(llm, prompts)
    
    // Log LLM call start
    console.log(`[CRMTracer] LLM ${llm.name} called:`, {
      prompts,
      timestamp: new Date().toISOString()
    })
  }

  async handleLLMEnd(output: Record<string, any>) {
    await this.tracer.handleLLMEnd(output)
    
    // Log LLM response
    console.log('[CRMTracer] LLM response received:', {
      output,
      timestamp: new Date().toISOString()
    })
  }

  async handleToolStart(tool: { name: string }, input: string) {
    await this.tracer.handleToolStart(tool, input)
    
    // Log tool execution start
    console.log(`[CRMTracer] Tool ${tool.name} started:`, {
      input,
      timestamp: new Date().toISOString()
    })
  }

  async handleToolEnd(output: string) {
    await this.tracer.handleToolEnd(output)
    
    // Log tool completion
    console.log('[CRMTracer] Tool completed:', {
      output,
      timestamp: new Date().toISOString()
    })
  }

  async handleText(text: string) {
    await this.tracer.handleText(text)
    
    // Log intermediate text
    console.log('[CRMTracer] Text generated:', {
      text,
      timestamp: new Date().toISOString()
    })
  }

  updateMetrics(metrics: Partial<TracerMetrics>) {
    this.metrics = {
      ...this.metrics,
      ...metrics
    }
  }

  getMetrics(): TracerMetrics {
    return this.metrics
  }
}

// Create singleton instance
export const crmTracer = new CRMTracer()

// Helper function to wrap chains with tracing
export function withTracing<T extends (...args: any[]) => Promise<any>>(
  chainName: string,
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    try {
      await crmTracer.handleChainStart({ name: chainName }, { args })
      const result = await fn(...args)
      await crmTracer.handleChainEnd({ result })
      return result
    } catch (error) {
      console.error(`[CRMTracer] Error in chain ${chainName}:`, error)
      throw error
    }
  }) as T
}

// Example usage:
/*
const processCommand = withTracing('processNaturalLanguageCommand', async (input: string) => {
  // Command processing logic
})

// In your command handler:
await processCommand('Create a ticket about login issues')
*/ 