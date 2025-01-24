async function runTests() {
  console.log(chalk.blue('Starting Supabase API tests...\n'))

  // First authenticate
  const token = await getAuthToken()
  if (!token) {
    console.error(chalk.red('Failed to authenticate test user'))
    process.exit(1)
  }

  // Get test customer ID
  const customerId = await getTestCustomerId()
  if (!customerId) {
    console.error(chalk.red('Failed to get test customer ID'))
    process.exit(1)
  }

  // Test user IDs for different roles
  const TEST_ADMIN_ID = 'edfea6d0-b4fd-4f46-9ec6-c6a4602be7c0' // Jack Admin
  const TEST_AGENT_ID = '9a831cf4-6187-4438-beb4-b5d8f6915f63' // Lisa Agent
  const TEST_CUSTOMER_ID = '613bd5ac-bb49-45af-a1ef-8ab287eda8a1' // Jack Customer

  const tests: { operation: string; testFn: () => Promise<any> }[] = [
    // Role checking operations
    {
      operation: 'Check Admin Role',
      testFn: async () => {
        // First check if user is a customer
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', TEST_ADMIN_ID)
          .maybeSingle()
        
        if (customerError && customerError.code !== 'PGRST116') {
          throw customerError
        }

        // If user is a customer, return 'customer' role
        if (customer) {
          return 'customer'
        }

        // If not a customer, check team_members
        const { data: teamMember, error: teamError } = await supabase
          .from('team_members')
          .select('role')
          .eq('user_id', TEST_ADMIN_ID)
          .maybeSingle()
        
        if (teamError && teamError.code !== 'PGRST116') {
          throw teamError
        }

        return teamMember?.role || null
      }
    },
    {
      operation: 'Check Agent Role',
      testFn: async () => {
        // First check if user is a customer
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', TEST_AGENT_ID)
          .maybeSingle()
        
        if (customerError && customerError.code !== 'PGRST116') {
          throw customerError
        }

        // If user is a customer, return 'customer' role
        if (customer) {
          return 'customer'
        }

        // If not a customer, check team_members
        const { data: teamMember, error: teamError } = await supabase
          .from('team_members')
          .select('role')
          .eq('user_id', TEST_AGENT_ID)
          .maybeSingle()
        
        if (teamError && teamError.code !== 'PGRST116') {
          throw teamError
        }

        return teamMember?.role || null
      }
    },
    {
      operation: 'Check Customer Role',
      testFn: async () => {
        // First check if user is a customer
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', TEST_CUSTOMER_ID)
          .maybeSingle()
        
        if (customerError && customerError.code !== 'PGRST116') {
          throw customerError
        }

        // If user is a customer, return 'customer' role
        if (customer) {
          return 'customer'
        }

        // If not a customer, check team_members
        const { data: teamMember, error: teamError } = await supabase
          .from('team_members')
          .select('role')
          .eq('user_id', TEST_CUSTOMER_ID)
          .maybeSingle()
        
        if (teamError && teamError.code !== 'PGRST116') {
          throw teamError
        }

        return teamMember?.role || null
      }
    },
  ] 
} 