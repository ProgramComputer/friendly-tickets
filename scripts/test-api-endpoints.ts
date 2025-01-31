import chalk from 'chalk'
import { supabase } from '@/lib/supabase/client'

async function getFirstUserIdByRole(role: 'admin' | 'agent' | 'customer') {
  const table = role === 'customer' ? 'customers' : 'team_members'
  const { data, error } = await supabase
    .from(table)
    .select('auth_user_id')
    .eq('role', role)
    .limit(1)
    .single()

  if (error) throw error
  return data.auth_user_id
}

async function runTests() {
  console.log(chalk.blue('Starting Supabase API tests...\n'))

  // Get first user of each role
  const TEST_ADMIN_ID = await getFirstUserIdByRole('admin')
  const TEST_AGENT_ID = await getFirstUserIdByRole('agent')
  const TEST_CUSTOMER_ID = await getFirstUserIdByRole('customer')

  const tests = [
    {
      operation: 'Check Admin Role',
      testFn: async () => {
        const { data: teamMember } = await supabase
          .from('team_members')
          .select('role')
          .eq('auth_user_id', TEST_ADMIN_ID)
          .single()
        
        return teamMember?.role
      }
    },
    {
      operation: 'Check Agent Role', 
      testFn: async () => {
        const { data: teamMember } = await supabase
          .from('team_members')
          .select('role')
          .eq('auth_user_id', TEST_AGENT_ID)
          .single()

        return teamMember?.role
      }
    },
    {
      operation: 'Check Customer Role',
      testFn: async () => {
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('auth_user_id', TEST_CUSTOMER_ID)
          .single()

        return customer ? 'customer' : null
      }
    }
  ]
} 