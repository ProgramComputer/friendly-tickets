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

// Knowledge Base Categories
const KB_CATEGORIES = [
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Learn the basics of using AutoCRM and get up to speed quickly.'
  },
  {
    id: 'account',
    name: 'Account & Billing',
    description: 'Manage your account settings and billing information.'
  },
  {
    id: 'features',
    name: 'Features & Usage',
    description: 'Detailed guides on using AutoCRM features effectively.'
  },
  {
    id: 'troubleshooting',
    name: 'Troubleshooting',
    description: 'Common issues and their solutions.'
  },
  {
    id: 'integrations',
    name: 'Integrations',
    description: 'Connect AutoCRM with other tools and services.'
  }
] as const

// Knowledge Base Articles
const KB_ARTICLES = [
  {
    id: 'getting-started',
    title: 'Getting Started with AutoCRM',
    content: `
      <h2>Welcome to AutoCRM</h2>
      <p>This guide will help you get started with AutoCRM's customer support system. Follow these steps to begin:</p>
      
      <h3>1. Creating Your Account</h3>
      <p>To get started, you'll need to create an account. Click the "Sign Up" button in the top right corner and follow the prompts.</p>
      
      <h3>2. Creating Your First Ticket</h3>
      <p>Once you're logged in, you can create a support ticket by clicking the "New Ticket" button in your dashboard.</p>
      
      <h3>3. Using the Chat Feature</h3>
      <p>Our real-time chat feature allows you to communicate directly with support agents. Look for the chat icon in the bottom right corner.</p>
      
      <h3>4. Checking Ticket Status</h3>
      <p>You can check the status of your tickets at any time by visiting the "My Tickets" section in your dashboard.</p>
    `,
    excerpt: 'A complete guide to getting started with AutoCRM\'s customer support system.',
    category_id: 'getting-started',
    read_time_minutes: 5
  },
  {
    id: 'create-ticket',
    title: 'How to Create Your First Ticket',
    content: `
      <h2>Creating Support Tickets</h2>
      <p>Learn how to create and manage support tickets effectively with this step-by-step guide.</p>
      
      <h3>Steps to Create a Ticket</h3>
      <ol>
        <li>Navigate to your dashboard</li>
        <li>Click the "New Ticket" button</li>
        <li>Fill in the ticket details</li>
        <li>Add any relevant attachments</li>
        <li>Submit your ticket</li>
      </ol>
      
      <h3>Best Practices</h3>
      <ul>
        <li>Be specific about your issue</li>
        <li>Include relevant screenshots</li>
        <li>Provide steps to reproduce the problem</li>
        <li>List any troubleshooting steps already taken</li>
      </ul>
    `,
    excerpt: 'Learn how to create and manage support tickets effectively.',
    category_id: 'getting-started',
    read_time_minutes: 3
  },
  {
    id: 'billing-faq',
    title: 'Billing Frequently Asked Questions',
    content: `
      <h2>Billing FAQ</h2>
      <p>Find answers to common billing questions and learn how to manage your subscription.</p>
      
      <h3>Payment Methods</h3>
      <p>We accept all major credit cards and PayPal. Enterprise customers can also pay via invoice.</p>
      
      <h3>Billing Cycles</h3>
      <p>Subscriptions are billed monthly or annually. Annual subscriptions receive a 20% discount.</p>
      
      <h3>Refunds</h3>
      <p>We offer prorated refunds for annual subscriptions. Monthly subscriptions can be cancelled anytime.</p>
    `,
    excerpt: 'Common questions about billing, payments, and subscriptions.',
    category_id: 'account',
    read_time_minutes: 4
  },
  {
    id: 'api-integration',
    title: 'API Integration Guide',
    content: `
      <h2>API Integration</h2>
      <p>Learn how to integrate AutoCRM with your existing systems using our REST API.</p>
      
      <h3>Authentication</h3>
      <p>All API requests require an API key. You can generate one in your account settings.</p>
      
      <h3>Rate Limits</h3>
      <p>API requests are limited to 1000 per minute for standard accounts.</p>
      
      <h3>Endpoints</h3>
      <ul>
        <li>/api/tickets - Manage support tickets</li>
        <li>/api/users - User management</li>
        <li>/api/chat - Real-time chat integration</li>
      </ul>
    `,
    excerpt: 'Comprehensive guide to integrating with AutoCRM\'s API.',
    category_id: 'integrations',
    read_time_minutes: 8
  }
] as const

// Define departments
const DEPARTMENTS = [
  {
    id: 'tech-support',
    name: 'Technical Support',
    description: 'Handle technical issues and product support'
  },
  {
    id: 'billing',
    name: 'Billing Support',
    description: 'Handle billing and subscription inquiries'
  },
  {
    id: 'customer-success',
    name: 'Customer Success',
    description: 'Handle account management and customer satisfaction'
  }
] as const

// Define SLA policies
const SLA_POLICIES = [
  {
    name: 'Enterprise',
    description: 'Premium support for enterprise customers',
    response_time_minutes: 30,
    resolution_time_minutes: 240,
    priority: 'high'
  },
  {
    name: 'Standard',
    description: 'Standard support for regular customers',
    response_time_minutes: 120,
    resolution_time_minutes: 480,
    priority: 'medium'
  },
  {
    name: 'Basic',
    description: 'Basic support for free tier',
    response_time_minutes: 240,
    resolution_time_minutes: 960,
    priority: 'low'
  }
] as const

// Sample ticket templates
const TICKET_TEMPLATES = [
  {
    name: 'Login Issue',
    subject: 'Unable to login',
    content: 'User is experiencing login issues. Please verify:\n- Account status\n- Recent password changes\n- 2FA status',
    department_id: 'tech-support'
  },
  {
    name: 'Billing Inquiry',
    subject: 'Billing Question',
    content: 'Customer has billing inquiry. Check:\n- Current plan\n- Recent charges\n- Payment method status',
    department_id: 'billing'
  },
  {
    name: 'Feature Request',
    subject: 'New Feature Suggestion',
    content: 'Customer feature request. Document:\n- Requested functionality\n- Use case\n- Business impact',
    department_id: 'customer-success'
  }
] as const

// Sample ticket data
const SAMPLE_TICKETS = [
  {
    title: 'Cannot access dashboard',
    description: 'Getting 403 error when trying to access the main dashboard',
    priority: 'high',
    status: 'open',
    department: 'tech-support',
    messages: [
      {
        content: 'I keep getting an error when trying to access the dashboard. Can someone help?',
        is_internal: false
      },
      {
        content: 'I\'ve checked your account and noticed some permission issues. Working on fixing this now.',
        is_internal: false
      },
      {
        content: 'Note: User\'s role permissions were misconfigured during last update',
        is_internal: true
      }
    ]
  },
  {
    title: 'Billing cycle question',
    description: 'Need clarification on billing cycle and upcoming charges',
    priority: 'medium',
    status: 'in_progress',
    department: 'billing',
    messages: [
      {
        content: 'Can someone explain why I was charged twice this month?',
        is_internal: false
      },
      {
        content: 'I\'ll look into your billing history and get back to you shortly.',
        is_internal: false
      },
      {
        content: 'Customer was charged for both monthly and annual plan - needs refund',
        is_internal: true
      }
    ]
  },
  {
    title: 'Feature suggestion: Dark mode',
    description: 'Would love to see a dark mode option added',
    priority: 'low',
    status: 'pending',
    department: 'customer-success',
    messages: [
      {
        content: 'Dark mode would be really helpful for night time use. Any plans to add this?',
        is_internal: false
      },
      {
        content: 'Thanks for the suggestion! We\'re actually working on this feature now.',
        is_internal: false
      },
      {
        content: 'Dark mode is planned for next sprint - keep customer updated',
        is_internal: true
      }
    ]
  }
] as const

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

async function seedKnowledgeBase() {
  console.log('Seeding knowledge base categories...')
  const { error: categoriesError } = await supabase
    .from('kb_categories')
    .upsert(
      KB_CATEGORIES,
      { onConflict: 'id', ignoreDuplicates: false }
    )
  
  if (categoriesError) {
    console.error('Error seeding KB categories:', categoriesError)
    throw categoriesError
  }
  console.log('KB categories seeded successfully')

  console.log('Seeding knowledge base articles...')
  const { error: articlesError } = await supabase
    .from('kb_articles')
    .upsert(
      KB_ARTICLES,
      { onConflict: 'id', ignoreDuplicates: false }
    )
  
  if (articlesError) {
    console.error('Error seeding KB articles:', articlesError)
    throw articlesError
  }
  console.log('KB articles seeded successfully')
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
    console.log('Starting to seed test data...')

    // Seed departments
    console.log('Seeding departments...')
    await supabase.from('departments').upsert(
      DEPARTMENTS.map(dept => ({
        id: dept.id,
        name: dept.name,
        description: dept.description
      }))
    )

    // Seed SLA policies
    console.log('Seeding SLA policies...')
    await supabase.from('sla_policies').upsert(
      SLA_POLICIES.map(policy => ({
        name: policy.name,
        description: policy.description,
        response_time_minutes: policy.response_time_minutes,
        resolution_time_minutes: policy.resolution_time_minutes,
        priority: policy.priority
      }))
    )

    // Seed ticket templates
    console.log('Seeding ticket templates...')
    await supabase.from('ticket_templates').upsert(
      TICKET_TEMPLATES.map(template => ({
        name: template.name,
        subject: template.subject,
        content: template.content,
        department_id: template.department_id
      }))
    )

    // Create test users
    console.log('Creating test users...')
    const users = await Promise.all(
      Object.entries({ ...TEST_USERS, ...ADDITIONAL_TEST_USERS }).map(
        async ([role, user]) => {
          const dbUser = await getOrCreateUser(user.email, user.password)
          return { role, ...user, id: dbUser.id }
        }
      )
    )

    // Create team members for agents and admin
    console.log('Creating team members...')
    const teamMembers = users
      .filter(user => user.role !== 'customer')
      .map(user => ({
        user_id: user.id,
        name: user.name,
        role: user.role,
        department_id: DEPARTMENTS[0].id // Assign to first department by default
      }))

    await supabase.from('team_members').upsert(teamMembers)

    // Seed tickets with messages
    console.log('Seeding tickets and messages...')
    for (const ticket of SAMPLE_TICKETS) {
      const customer = users.find(u => u.role === 'customer')!
      const agent = users.find(u => u.role === 'agent')!

      const { data: newTicket } = await supabase
        .from('tickets')
        .insert({
          title: ticket.title,
          description: ticket.description,
          priority: ticket.priority,
          status: ticket.status,
          department: ticket.department,
          customer_id: customer.id,
          assignee_id: agent.id
        })
        .select()
        .single()
      
      if (newTicket) {
        await supabase.from('ticket_messages').insert(
          ticket.messages.map(msg => ({
            ticket_id: newTicket.id,
            content: msg.content,
            is_internal: msg.is_internal,
            sender_id: msg.is_internal ? agent.id : customer.id
          }))
        )
      }
    }

    // Seed knowledge base
    console.log('Seeding knowledge base...')
    await supabase.from('kb_categories').upsert(KB_CATEGORIES)
    await supabase.from('kb_articles').upsert(KB_ARTICLES)

      // Seed tags
    console.log('Seeding tags...')
    await supabase.from('tags').upsert(TICKET_TAGS)

    console.log('Seeding completed successfully!')
  } catch (error) {
    console.error('Error seeding test data:', error)
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