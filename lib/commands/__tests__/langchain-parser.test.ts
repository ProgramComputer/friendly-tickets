import { LangChainCommandParser } from '../langchain-parser'
import { createClient } from '@supabase/supabase-js'
import { ChatOpenAI } from '@langchain/openai'

// Mock the OpenAI and Supabase clients
jest.mock('@langchain/openai')
const mockSupabase = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn()
  }
} as unknown as ReturnType<typeof createClient>

describe('LangChainCommandParser', () => {
  let parser: LangChainCommandParser

  beforeEach(() => {
    jest.clearAllMocks()
    // Setup parser with agent role
    parser = new LangChainCommandParser(mockSupabase, 'agent')
  })

  describe('natural language parsing', () => {
    it('should parse simple view commands', async () => {
      // Mock LangChain response
      const mockLangChainResponse = {
        action: 'view',
        targets: [{ type: 'ticket', identifier: '123' }],
        parameters: {}
      }
      
      // Mock the chain invoke
      jest.spyOn(parser['chain'], 'invoke').mockResolvedValue(mockLangChainResponse)
      
      // Mock Supabase response for ticket lookup
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: '123', title: 'Test Ticket' }
            })
          })
        })
      })

      const result = await parser.parseCommand('show me ticket 123')
      
      expect(result).toEqual({
        action: 'view',
        targets: [{
          type: 'ticket',
          id: '123',
          reference: '@ticket/123',
          displayName: 'Test Ticket'
        }],
        parameters: {},
        rawText: 'show me ticket 123'
      })
    })

    it('should parse complex commands with parameters', async () => {
      const mockLangChainResponse = {
        action: 'update_priority',
        targets: [{ type: 'ticket', identifier: '456' }],
        parameters: { priority: 'high' },
        sql: "UPDATE tickets SET priority = 'high' WHERE id = '456'"
      }
      
      jest.spyOn(parser['chain'], 'invoke').mockResolvedValue(mockLangChainResponse)
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: '456', title: 'Another Ticket' }
            })
          })
        })
      })

      const result = await parser.parseCommand('change ticket 456 priority to high')
      
      expect(result).toEqual({
        action: 'update_priority',
        targets: [{
          type: 'ticket',
          id: '456',
          reference: '@ticket/456',
          displayName: 'Another Ticket'
        }],
        parameters: { priority: 'high' },
        rawText: 'change ticket 456 priority to high',
        generatedSql: "UPDATE tickets SET priority = 'high' WHERE id = '456'"
      })
    })
  })

  describe('structured command parsing', () => {
    it('should parse @mention commands', async () => {
      mockSupabase.from.mockImplementation((table) => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: table === 'tickets' 
                ? { id: '123', title: 'Test Ticket' }
                : { id: 'john', name: 'John Smith' }
            })
          })
        })
      }))

      const result = await parser.parseCommand('reassign @ticket/123 to @agent/john')
      
      expect(result?.action).toBe('reassign')
      expect(result?.targets).toHaveLength(2)
      expect(result?.targets[0].type).toBe('ticket')
      expect(result?.targets[1].type).toBe('agent')
    })
  })

  describe('SQL generation', () => {
    it('should generate SQL for data modification commands', async () => {
      const command = {
        action: 'update_priority',
        targets: [{
          type: 'ticket',
          id: '123',
          reference: '@ticket/123',
          displayName: 'Test Ticket'
        }],
        parameters: { priority: 'high' },
        rawText: 'set priority high for ticket 123'
      }

      // Mock the ChatOpenAI response
      const mockChatResponse = { content: "UPDATE tickets SET priority = $1 WHERE id = $2" }
      jest.spyOn(ChatOpenAI.prototype, 'invoke').mockResolvedValue(mockChatResponse)

      const sql = await parser.generateSql(command)
      
      expect(sql).toBe("UPDATE tickets SET priority = $1 WHERE id = $2")
    })
  })

  describe('error handling', () => {
    it('should handle invalid natural language input', async () => {
      jest.spyOn(parser['chain'], 'invoke').mockRejectedValue(new Error('Invalid command'))
      
      const result = await parser.parseCommand('this is not a valid command')
      
      expect(result).toBeNull()
    })

    it('should handle non-existent objects', async () => {
      const mockLangChainResponse = {
        action: 'view',
        targets: [{ type: 'ticket', identifier: '999' }],
        parameters: {}
      }
      
      jest.spyOn(parser['chain'], 'invoke').mockResolvedValue(mockLangChainResponse)
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' }
            })
          })
        })
      })

      const result = await parser.parseCommand('show ticket 999')
      
      expect(result).toBeNull()
    })
  })
}) 