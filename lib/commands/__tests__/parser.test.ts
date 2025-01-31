import { CommandParser } from '../parser'
import { createClient } from '@supabase/supabase-js'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn()
  }
} as unknown as ReturnType<typeof createClient>

describe('CommandParser', () => {
  let parser: CommandParser

  beforeEach(() => {
    jest.clearAllMocks()
    // Setup parser with agent role
    parser = new CommandParser(mockSupabase, 'agent')
  })

  describe('extractMentions', () => {
    it('should extract single @mention', async () => {
      // Mock successful ticket lookup
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: '123', title: 'Test Ticket' }
            })
          })
        })
      })
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'test-user' } } })

      const result = await parser.parseCommand('show @ticket/123')
      
      expect(result).toEqual({
        action: 'view',
        targets: [{
          type: 'ticket',
          id: '123',
          reference: '@ticket/123',
          displayName: 'Test Ticket'
        }],
        parameters: {},
        rawText: 'show @ticket/123'
      })
    })

    it('should extract multiple @mentions', async () => {
      // Mock successful lookups
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
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'test-user' } } })

      const result = await parser.parseCommand('reassign @ticket/123 to @agent/john')
      
      expect(result).toEqual({
        action: 'reassign',
        targets: [
          {
            type: 'ticket',
            id: '123',
            reference: '@ticket/123',
            displayName: 'Test Ticket'
          },
          {
            type: 'agent',
            id: 'john',
            reference: '@agent/john',
            displayName: 'John Smith'
          }
        ],
        parameters: {},
        rawText: 'reassign @ticket/123 to @agent/john'
      })
    })
  })

  describe('parameter extraction', () => {
    it('should extract priority parameter', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: '123', title: 'Test Ticket' }
            })
          })
        })
      })
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'test-user' } } })

      const result = await parser.parseCommand('set priority high for @ticket/123')
      
      expect(result?.parameters).toEqual({
        priority: 'high'
      })
    })

    it('should extract note parameter', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: '123', title: 'Test Ticket' }
            })
          })
        })
      })
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'test-user' } } })

      const result = await parser.parseCommand('add note "This is urgent" to @ticket/123')
      
      expect(result?.parameters).toEqual({
        note: 'This is urgent'
      })
    })
  })

  describe('role-based access', () => {
    it('should reject customer accessing agent objects', async () => {
      const customerParser = new CommandParser(mockSupabase, 'customer')
      
      const result = await customerParser.parseCommand('show @agent/john')
      
      expect(result).toBeNull()
    })

    it('should allow admin accessing any object', async () => {
      const adminParser = new CommandParser(mockSupabase, 'admin')
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'team1', name: 'Support Team' }
            })
          })
        })
      })
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'test-user' } } })

      const result = await adminParser.parseCommand('configure @team/team1')
      
      expect(result).not.toBeNull()
      expect(result?.targets[0].type).toBe('team')
    })
  })

  describe('error handling', () => {
    it('should handle non-existent objects', async () => {
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

      const result = await parser.parseCommand('show @ticket/999')
      
      expect(result).toBeNull()
    })

    it('should handle invalid command format', async () => {
      const result = await parser.parseCommand('just some regular text')
      
      expect(result).toBeNull()
    })
  })
}) 