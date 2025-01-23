import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

// Define test users
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
    name: 'Admin User'
  }
} as const

// Additional test users
const ADDITIONAL_TEST_USERS = {
  enterpriseCustomer: {
    email: 'sarah@enterprise.com',
    password: 'fakeaccount',
    name: 'Sarah Enterprise'
  },
  vipCustomer: {
    email: 'alex@vip.com',
    password: 'fakeaccount',
    name: 'Alex VIP'
  },
  seniorAgent: {
    email: 'emma@agent.autocrm.com',
    password: 'fakeaccount',
    name: 'Emma Senior Agent'
  },
  teamLead: {
    email: 'mike@agent.autocrm.com',
    password: 'fakeaccount',
    name: 'Mike Team Lead'
  },
  techAgent: {
    email: 'dave@agent.autocrm.com',
    password: 'fakeaccount',
    name: 'Dave Tech Agent'
  },
  billingAgent: {
    email: 'lisa@agent.autocrm.com',
    password: 'fakeaccount',
    name: 'Lisa Billing Agent'
  }
} as const

type UserRole = keyof typeof TEST_USERS
type TestUser = typeof TEST_USERS[UserRole]

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-supabase-auth-token': `Bearer ${supabaseKey}`
    }
  }
})

// Define ticket categories and tags
const TICKET_CATEGORIES = ['technical', 'billing', 'feature_request', 'bug', 'account', 'security'] as const
const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
const TICKET_STATUSES = ['open', 'in_progress', 'pending', 'resolved', 'closed'] as const

const TICKET_TAGS = [
  { name: 'bug', color: '#EF4444' },
  { name: 'feature', color: '#3B82F6' },
  { name: 'security', color: '#DC2626' },
  { name: 'billing', color: '#10B981' },
  { name: 'urgent', color: '#7C3AED' },
  { name: 'documentation', color: '#F59E0B' },
  { name: 'enhancement', color: '#6366F1' },
  { name: 'performance', color: '#EC4899' },
  { name: 'ui/ux', color: '#8B5CF6' },
  { name: 'api', color: '#14B8A6' }
]

async function getOrCreateUser(email: string, password: string) {
  try {
    // First try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (!signInError && signInData?.user) {
      console.log('Using existing user:', email)
      return signInData.user
    }

    console.log('Sign in failed, attempting to create user:', email)

    // If sign in fails, create new user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/callback`
      }
    })

    if (signUpError) {
      console.error('Sign up error:', signUpError)
      throw signUpError
    }

    if (!signUpData?.user) {
      throw new Error('No user data returned from sign up')
    }

    console.log('Created new user:', email)
    return signUpData.user
  } catch (error) {
    console.error(`Error with user ${email}:`, error)
    throw error
  }
}

async function upsertCustomer(userId: string, email: string, name: string) {
  console.log('Attempting to upsert customer with user_id:', userId)
  const { data, error } = await supabase
    .from('customers')
    .upsert(
      {
        user_id: userId,
        email,
        name
      },
      {
        onConflict: 'user_id',
        ignoreDuplicates: false
      }
    )
    .select('*')
    .single()
  
  if (error) {
    console.error('Error upserting customer:', error)
    throw error
  }
  
  if (!data) {
    throw new Error(`No customer data returned for email: ${email}`)
  }
  
  console.log('Successfully upserted customer:', { id: data.id, email: data.email })
  return data
}

async function upsertTeamMember(userId: string, email: string, name: string, role: 'admin' | 'agent') {
  const { data, error } = await supabase
    .from('team_members')
    .upsert(
      {
        user_id: userId,
        email,
        name,
        role
      },
      {
        onConflict: 'user_id',
        ignoreDuplicates: false
      }
    )
    .select('id')
    .single()
  
  if (error) {
    console.error('Error upserting team member:', error)
    throw error
  }
  console.log('Upserted team member:', email)
  return data
}

async function upsertTickets(customerId: string, agentId: string) {
  console.log('Starting ticket creation with:', { customerId, agentId })
  
  try {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .upsert(
        [
          {
            title: 'Cannot access dashboard',
            description: 'I am unable to access my dashboard since this morning. Getting a 404 error.',
            status: 'open',
            priority: 'high',
            customer_id: customerId,
            assignee_id: agentId,
            category: 'technical'
          },
          {
            title: 'Need help with billing',
            description: 'My last invoice seems incorrect. Can someone review it?',
            status: 'pending',
            priority: 'medium',
            customer_id: customerId,
            assignee_id: agentId,
            category: 'billing'
          },
          {
            title: 'Feature request: Dark mode',
            description: 'Would love to have a dark mode option for the dashboard.',
            status: 'open',
            priority: 'low',
            customer_id: customerId,
            assignee_id: null,
            category: 'feature_request'
          }
        ],
        {
          onConflict: 'title,customer_id',
          ignoreDuplicates: false
        }
      )
      .select()
    
    if (error) {
      console.error('Error upserting tickets:', error)
      throw error
    }

    if (!tickets || tickets.length === 0) {
      throw new Error('No tickets returned after upsert')
    }

    console.log('Successfully created tickets:', tickets.length)
    return tickets
  } catch (error) {
    console.error('Error in upsertTickets:', error)
    throw error
  }
}

async function upsertMessages(
  tickets: any[],
  customerUserId: string,
  agentUserId: string
) {
  const dashboardTicket = tickets.find(t => t.title === 'Cannot access dashboard')
  const billingTicket = tickets.find(t => t.title === 'Need help with billing')
  const featureTicket = tickets.find(t => t.title === 'Feature request: Dark mode')

  if (!dashboardTicket || !billingTicket || !featureTicket) {
    throw new Error('Could not find all required tickets')
  }

  const { error } = await supabase
    .from('ticket_messages')
    .upsert(
      [
        {
          ticket_id: dashboardTicket.id,
          sender_id: customerUserId,
          sender_type: 'customer',
          content: 'I keep getting a 404 error when trying to access my dashboard. Can someone help?',
          is_internal: false
        },
        {
          ticket_id: dashboardTicket.id,
          sender_id: agentUserId,
          sender_type: 'team_member',
          content: 'Hi Jack, I will look into this right away. Can you please clear your browser cache and try again?',
          is_internal: false
        },
        {
          ticket_id: dashboardTicket.id,
          sender_id: agentUserId,
          sender_type: 'team_member',
          content: 'Checking server logs for any issues.',
          is_internal: true
        },
        {
          ticket_id: billingTicket.id,
          sender_id: customerUserId,
          sender_type: 'customer',
          content: 'My invoice for January shows charges I do not recognize.',
          is_internal: false
        },
        {
          ticket_id: featureTicket.id,
          sender_id: customerUserId,
          sender_type: 'customer',
          content: 'Dark mode would be really helpful for late night work.',
          is_internal: false
        }
      ],
      {
        onConflict: 'ticket_id,sender_id,content',
        ignoreDuplicates: true
      }
    )

  if (error) {
    console.error('Error upserting messages:', error)
    throw error
  }
  console.log('Upserted messages')
}

async function seedTags() {
  const { error } = await supabase
    .from('tags')
    .upsert(
      TICKET_TAGS,
      { onConflict: 'name', ignoreDuplicates: false }
    )
  
  if (error) {
    console.error('Error seeding tags:', error)
    throw error
  }
  console.log('Seeded tags')
}

async function createTicketWithHistory(
  customerId: string,
  assigneeId: string | null,
  data: {
    title: string
    description: string
    status: typeof TICKET_STATUSES[number]
    priority: typeof TICKET_PRIORITIES[number]
    category: typeof TICKET_CATEGORIES[number]
    created_at?: string
    sla_breach?: boolean
    tags?: string[]
  }
) {
  // First get the customer's actual ID from their user_id
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('user_id', customerId)
    .single()

  if (customerError || !customer) {
    console.error('Customer not found for user_id:', customerId)
    throw new Error(`Customer with user_id ${customerId} not found`)
  }

  // If assigneeId is provided, verify team member exists
  if (assigneeId) {
    const { data: teamMember, error: teamMemberError } = await supabase
      .from('team_members')
      .select('id')
      .eq('user_id', assigneeId)
      .single()

    if (teamMemberError || !teamMember) {
      console.error('Team member not found for user_id:', assigneeId)
      throw new Error(`Team member with user_id ${assigneeId} not found`)
    }
    assigneeId = teamMember.id // Use the actual team member ID
  }

  // First check if ticket already exists
  const { data: existingTicket } = await supabase
    .from('tickets')
    .select('*')
    .eq('customer_id', customer.id)
    .eq('title', data.title)
    .single()

  if (existingTicket) {
    console.log('Ticket already exists:', data.title)
    return existingTicket
  }

  // Create ticket using the actual customer ID
  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert({
      customer_id: customer.id,
      assignee_id: assigneeId,
      ...data
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating ticket:', error)
    throw error
  }

  console.log('Created new ticket:', data.title)
  return ticket
}

async function seedEnterpriseScenario(
  enterpriseUserId: string,
  agentIds: { [key: string]: string }
) {
  // Create multiple tickets with various states and histories
  const tickets = await Promise.all([
    createTicketWithHistory(enterpriseUserId, agentIds.techAgent, {
      title: 'API Integration Issues',
      description: 'Having trouble with the REST API endpoints',
      status: 'in_progress',
      priority: 'high',
      category: 'technical',
      tags: ['api', 'bug'],
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
    }),
    createTicketWithHistory(enterpriseUserId, agentIds.billingAgent, {
      title: 'Bulk License Upgrade',
      description: 'Need to upgrade enterprise license for 500 seats',
      status: 'pending',
      priority: 'urgent',
      category: 'billing',
      tags: ['billing'],
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    }),
    createTicketWithHistory(enterpriseUserId, null, {
      title: 'Custom Dashboard Requirements',
      description: 'Specifications for custom dashboard features',
      status: 'open',
      priority: 'medium',
      category: 'feature_request',
      tags: ['feature', 'enhancement'],
      created_at: new Date().toISOString()
    })
  ])

  return tickets
}

async function seedVIPScenario(
  vipUserId: string,
  agentIds: { [key: string]: string }
) {
  // Create VIP tickets with high priority and quick responses
  const tickets = await Promise.all([
    createTicketWithHistory(vipUserId, agentIds.seniorAgent, {
      title: 'Account Security Audit',
      description: 'Request for detailed security audit report',
      status: 'in_progress',
      priority: 'high',
      category: 'security',
      tags: ['security'],
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    }),
    createTicketWithHistory(vipUserId, agentIds.teamLead, {
      title: 'Performance Optimization',
      description: 'System response times have degraded',
      status: 'open',
      priority: 'urgent',
      category: 'technical',
      tags: ['performance', 'urgent'],
      sla_breach: true,
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
    })
  ])

  return tickets
}

async function seedTestData(options: { role?: UserRole } = {}) {
  try {
    console.log('Starting seed process...')

    // Get or create users
    const customerUser = await getOrCreateUser(TEST_USERS.customer.email, TEST_USERS.customer.password)
    const agentUser = await getOrCreateUser(TEST_USERS.agent.email, TEST_USERS.agent.password)
    const adminUser = await getOrCreateUser(TEST_USERS.admin.email, TEST_USERS.admin.password)

    if (!customerUser?.id || !agentUser?.id || !adminUser?.id) {
      throw new Error('Failed to get or create users')
    }

    console.log('Users created/retrieved:', {
      customer: customerUser.id,
      agent: agentUser.id,
      admin: adminUser.id
    })

    console.log('Waiting for auth system to settle...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    try {
      // Upsert profiles and get their IDs
      console.log('Creating customer profile...')
      const customer = await upsertCustomer(customerUser.id, TEST_USERS.customer.email, TEST_USERS.customer.name)
      
      console.log('Creating agent profile...')
      const agent = await upsertTeamMember(agentUser.id, TEST_USERS.agent.email, TEST_USERS.agent.name, 'agent')
      
      console.log('Creating admin profile...')
      await upsertTeamMember(adminUser.id, TEST_USERS.admin.email, TEST_USERS.admin.name, 'admin')

      if (!customer?.id || !agent?.id) {
        throw new Error('Failed to get profile IDs')
      }

      console.log('Profiles created successfully:', {
        customerId: customer.id,
        agentId: agent.id
      })

      // Verify customer exists before creating tickets
      const { data: verifyCustomer, error: verifyError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customer.id)
        .single()
      
      if (verifyError) {
        console.error('Error verifying customer:', verifyError)
        throw new Error(`Failed to verify customer: ${verifyError.message}`)
      }
      
      if (!verifyCustomer) {
        console.error('No customer found with ID:', customer.id)
        throw new Error('Customer verification failed: No customer found')
      }

      console.log('Verified customer exists:', verifyCustomer)

      try {
        console.log('Creating tickets with customer ID:', customer.id)
        const tickets = await upsertTickets(customer.id, agent.id)
        console.log('Tickets created successfully')
        
        console.log('Creating messages...')
        await upsertMessages(tickets, customerUser.id, agentUser.id)
        console.log('Messages created successfully')
      } catch (ticketError) {
        console.error('Error creating tickets or messages:', ticketError)
        throw ticketError
      }

    } catch (profileError) {
      console.error('Error in profile creation/verification:', profileError)
      throw profileError
    }

    // Return login credentials based on requested role
    if (options.role) {
      const user = TEST_USERS[options.role]
      console.log(`\nTest data seeded successfully! Use these credentials for ${options.role}:`)
      console.log(`Email: ${user.email}`)
      console.log(`Password: ${user.password}`)
    } else {
      console.log('\nTest data seeded successfully! Available test users:')
      Object.entries(TEST_USERS).forEach(([role, user]) => {
        console.log(`\n${role.toUpperCase()}:`)
        console.log(`Email: ${user.email}`)
        console.log(`Password: ${user.password}`)
      })
    }

    // Seed additional users
    console.log('\nSeeding additional users...')
    try {
      const enterpriseUser = await getOrCreateUser(ADDITIONAL_TEST_USERS.enterpriseCustomer.email, ADDITIONAL_TEST_USERS.enterpriseCustomer.password)
      const vipUser = await getOrCreateUser(ADDITIONAL_TEST_USERS.vipCustomer.email, ADDITIONAL_TEST_USERS.vipCustomer.password)
      const seniorAgent = await getOrCreateUser(ADDITIONAL_TEST_USERS.seniorAgent.email, ADDITIONAL_TEST_USERS.seniorAgent.password)
      const teamLead = await getOrCreateUser(ADDITIONAL_TEST_USERS.teamLead.email, ADDITIONAL_TEST_USERS.teamLead.password)
      const techAgent = await getOrCreateUser(ADDITIONAL_TEST_USERS.techAgent.email, ADDITIONAL_TEST_USERS.techAgent.password)
      const billingAgent = await getOrCreateUser(ADDITIONAL_TEST_USERS.billingAgent.email, ADDITIONAL_TEST_USERS.billingAgent.password)

      // Create customer profiles
      await upsertCustomer(enterpriseUser.id, ADDITIONAL_TEST_USERS.enterpriseCustomer.email, ADDITIONAL_TEST_USERS.enterpriseCustomer.name)
      await upsertCustomer(vipUser.id, ADDITIONAL_TEST_USERS.vipCustomer.email, ADDITIONAL_TEST_USERS.vipCustomer.name)

      // Create team member profiles
      await upsertTeamMember(seniorAgent.id, ADDITIONAL_TEST_USERS.seniorAgent.email, ADDITIONAL_TEST_USERS.seniorAgent.name, 'agent')
      await upsertTeamMember(teamLead.id, ADDITIONAL_TEST_USERS.teamLead.email, ADDITIONAL_TEST_USERS.teamLead.name, 'agent')
      await upsertTeamMember(techAgent.id, ADDITIONAL_TEST_USERS.techAgent.email, ADDITIONAL_TEST_USERS.techAgent.name, 'agent')
      await upsertTeamMember(billingAgent.id, ADDITIONAL_TEST_USERS.billingAgent.email, ADDITIONAL_TEST_USERS.billingAgent.name, 'agent')

      // Seed tags
      await seedTags()

      // Create agent IDs map
      const agentIds = {
        seniorAgent: seniorAgent.id,
        teamLead: teamLead.id,
        techAgent: techAgent.id,
        billingAgent: billingAgent.id
      }

      // Seed enterprise and VIP scenarios
      await seedEnterpriseScenario(enterpriseUser.id, agentIds)
      await seedVIPScenario(vipUser.id, agentIds)

    } catch (additionalUsersError) {
      console.error('Error seeding additional users:', additionalUsersError)
      // Don't throw here, as main seeding is complete
    }

    console.log('Seeding completed successfully')
  } catch (error) {
    console.error('Error in seed process:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      })
    }
    throw error
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const roleArg = args.find(arg => arg.startsWith('--role='))
const role = roleArg?.split('=')?.[1] as UserRole | undefined

if (role && !TEST_USERS[role]) {
  console.error(`Invalid role. Available roles: ${Object.keys(TEST_USERS).join(', ')}`)
  process.exit(1)
}

seedTestData({ role }) 