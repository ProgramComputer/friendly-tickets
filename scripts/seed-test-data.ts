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
  // Technical Support Team
  seniorTechAgent: {
    email: 'emma.tech@agent.autocrm.com',
    password: 'fakeaccount',
    name: 'Emma Senior Tech'
  },
  techAgent1: {
    email: 'dave.tech@agent.autocrm.com',
    password: 'fakeaccount',
    name: 'Dave Tech Support'
  },
  techAgent2: {
    email: 'alice.tech@agent.autocrm.com',
    password: 'fakeaccount',
    name: 'Alice Tech Support'
  },
  // Billing Team
  seniorBillingAgent: {
    email: 'lisa.billing@agent.autocrm.com',
    password: 'fakeaccount',
    name: 'Lisa Senior Billing'
  },
  billingAgent1: {
    email: 'mark.billing@agent.autocrm.com',
    password: 'fakeaccount',
    name: 'Mark Billing Support'
  },
  billingAgent2: {
    email: 'sarah.billing@agent.autocrm.com',
    password: 'fakeaccount',
    name: 'Sarah Billing Support'
  },
  // Customer Success Team
  customerSuccessLead: {
    email: 'mike.success@agent.autocrm.com',
    password: 'fakeaccount',
    name: 'Mike Success Lead'
  },
  seniorSuccessAgent: {
    email: 'jane.success@agent.autocrm.com',
    password: 'fakeaccount',
    name: 'Jane Senior Success'
  },
  successAgent1: {
    email: 'tom.success@agent.autocrm.com',
    password: 'fakeaccount',
    name: 'Tom Success Agent'
  },
  successAgent2: {
    email: 'amy.success@agent.autocrm.com',
    password: 'fakeaccount',
    name: 'Amy Success Agent'
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
const TICKET_STATUSES = ['open', 'pending', 'resolved', 'closed'] as const

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
    id: 'chat-features',
    title: 'Using the Chat Features',
    content: `
      <h2>Real-time Chat Support</h2>
      <p>Learn how to use AutoCRM's real-time chat features to get instant support from our team.</p>
      
      <h3>Starting a Chat</h3>
      <ol>
        <li>Click the chat icon in the bottom right corner</li>
        <li>Type your message in the chat box</li>
        <li>Press Enter or click Send to start the conversation</li>
      </ol>
      
      <h3>Chat Features</h3>
      <ul>
        <li>Real-time messaging with support agents</li>
        <li>File and image sharing</li>
        <li>Chat history preservation</li>
        <li>Automatic routing to the right department</li>
      </ul>
      
      <h3>Best Practices</h3>
      <ul>
        <li>Be clear and concise in your messages</li>
        <li>Share relevant screenshots when needed</li>
        <li>Stay in the chat until your issue is resolved</li>
        <li>Rate the chat session to help us improve</li>
      </ul>
    `,
    excerpt: 'Get instant support using our real-time chat features.',
    category_id: 'features',
    read_time_minutes: 4
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

// Define department type
type Department = {
  id: string
  name: string
  description: string
}

// Define departments
const DEPARTMENTS: Department[] = [
  {
    id: '8b9c3f5d-5d6e-4a1c-9c7b-8c4f7d9c4b3a', // Tech Support UUID
    name: 'Technical Support',
    description: 'Handle technical issues and product support'
  },
  {
    id: '7a8b9c0d-1e2f-4a1c-9c7b-8c4f7d9c4b3b', // Billing UUID
    name: 'Billing Support',
    description: 'Handle billing inquiries and payment issues'
  },
  {
    id: '2c3d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f', // Customer Success UUID
    name: 'Customer Success',
    description: 'Handle account management and customer satisfaction'
  }
]

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
    department_id: DEPARTMENTS[0].id // Technical Support
  },
  {
    name: 'Performance Problem',
    subject: 'System Performance Issues',
    content: 'User reports performance problems. Investigate:\n- Specific features affected\n- Browser/device details\n- Network conditions\n- Recent changes or updates',
    department_id: DEPARTMENTS[0].id // Technical Support
  },
  {
    name: 'Integration Setup',
    subject: 'API Integration Assistance',
    content: 'Customer needs help with API integration:\n- Integration type\n- Current setup status\n- Error messages\n- API version being used',
    department_id: DEPARTMENTS[0].id // Technical Support
  },
  {
    name: 'Billing Inquiry',
    subject: 'Billing Question',
    content: 'Customer has billing inquiry. Check:\n- Current plan\n- Recent charges\n- Payment method status',
    department_id: DEPARTMENTS[1].id // Billing Support
  },
  {
    name: 'Refund Request',
    subject: 'Process Refund Request',
    content: 'Customer requesting refund. Verify:\n- Purchase date\n- Reason for refund\n- Usage history\n- Refund policy eligibility',
    department_id: DEPARTMENTS[1].id // Billing Support
  },
  {
    name: 'Plan Upgrade',
    subject: 'Plan Upgrade Assistance',
    content: 'Customer interested in plan upgrade:\n- Current plan details\n- Desired features\n- Usage requirements\n- Budget constraints',
    department_id: DEPARTMENTS[1].id // Billing Support
  },
  {
    name: 'Feature Request',
    subject: 'New Feature Suggestion',
    content: 'Customer feature request. Document:\n- Requested functionality\n- Use case\n- Business impact',
    department_id: DEPARTMENTS[2].id // Customer Success
  },
  {
    name: 'Account Review',
    subject: 'Quarterly Account Review',
    content: 'Schedule quarterly account review:\n- Current usage patterns\n- Pain points\n- Growth opportunities\n- Success metrics',
    department_id: DEPARTMENTS[2].id // Customer Success
  },
  {
    name: 'Onboarding Support',
    subject: 'New Customer Onboarding',
    content: 'New customer onboarding checklist:\n- Account setup status\n- Training requirements\n- Integration needs\n- Success criteria\n- Timeline expectations',
    department_id: DEPARTMENTS[2].id // Customer Success
  },
  {
    name: 'Password Reset',
    subject: 'Password Reset Assistance',
    content: 'Customer needs password reset help:\n- Verify identity\n- Check account security status\n- Guide through reset process\n- Confirm access after reset',
    department_id: DEPARTMENTS[0].id // Technical Support
  },
  {
    name: 'Data Export Request',
    subject: 'Data Export Assistance',
    content: 'Customer requesting data export:\n- Export format requirements\n- Data range needed\n- Specific data types\n- Compliance requirements\n- Delivery method',
    department_id: DEPARTMENTS[0].id // Technical Support
  },
  {
    name: 'Security Audit',
    subject: 'Security Audit Request',
    content: 'Security audit request checklist:\n- Scope of audit\n- Compliance requirements\n- Access logs review\n- Security settings check\n- Recent activity analysis',
    department_id: DEPARTMENTS[0].id // Technical Support
  },
  {
    name: 'Invoice Dispute',
    subject: 'Invoice Dispute Resolution',
    content: 'Customer disputing invoice charges:\n- Invoice number\n- Disputed items\n- Reason for dispute\n- Supporting documentation\n- Resolution options',
    department_id: DEPARTMENTS[1].id // Billing Support
  },
  {
    name: 'Payment Method Update',
    subject: 'Update Payment Information',
    content: 'Update payment method request:\n- Current payment method\n- New payment details\n- Billing cycle timing\n- Auto-renewal status\n- Payment verification',
    department_id: DEPARTMENTS[1].id // Billing Support
  },
  {
    name: 'Custom Billing Setup',
    subject: 'Custom Billing Arrangement',
    content: 'Custom billing setup request:\n- Business requirements\n- Payment schedule\n- Invoice format\n- Currency preferences\n- Special instructions',
    department_id: DEPARTMENTS[1].id // Billing Support
  },
  {
    name: 'Training Request',
    subject: 'Product Training Session',
    content: 'Training session request:\n- Training topics\n- Team size and roles\n- Preferred schedule\n- Current knowledge level\n- Specific feature focus',
    department_id: DEPARTMENTS[2].id // Customer Success
  },
  {
    name: 'Integration Review',
    subject: 'Integration Health Check',
    content: 'Integration review checklist:\n- Current integrations\n- Performance metrics\n- Pain points\n- Optimization opportunities\n- New requirements',
    department_id: DEPARTMENTS[2].id // Customer Success
  },
  {
    name: 'Success Planning',
    subject: 'Success Planning Session',
    content: 'Success planning meeting:\n- Business objectives\n- Current challenges\n- Growth targets\n- Resource needs\n- Timeline planning',
    department_id: DEPARTMENTS[2].id // Customer Success
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
    status: 'pending',
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

// Define chat quick response templates
const CHAT_QUICK_RESPONSES = [
  {
    title: 'Greeting',
    content: 'Hello! Thank you for reaching out to our support team. How can I assist you today?',
    category: 'general'
  },
  {
    title: 'Technical Issue',
    content: 'I understand you\'re experiencing a technical issue. Could you please provide more details about what\'s happening? This will help me assist you better.',
    category: 'technical'
  },
  {
    title: 'Billing Question',
    content: 'For billing related questions, I\'ll need to verify some account details. Could you please confirm your account email address?',
    category: 'billing'
  },
  {
    title: 'Feature Request',
    content: 'Thank you for your feature suggestion! I\'ll document this request and forward it to our product team for review.',
    category: 'product'
  },
  {
    title: 'Closing',
    content: 'Is there anything else I can help you with today?',
    category: 'general'
  },
  {
    title: 'Escalation',
    content: 'I\'ll need to escalate this to our specialized team for further assistance. They will contact you shortly.',
    category: 'general'
  },
  {
    title: 'Documentation Link',
    content: 'You can find detailed information about this in our documentation here: [Insert relevant link]',
    category: 'technical'
  },
  {
    title: 'Follow-up',
    content: 'I\'m following up on your previous request. Have you had a chance to try the solution we discussed?',
    category: 'general'
  }
] as const

async function getOrCreateUser(email: string, password: string, name: string) {
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
        data: {
          name: name
        },
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
  // First check if customer exists and log details
  const { data: customers, error: customersError } = await supabase
    .from('customers')
    .select('*')
    .eq('auth_user_id', customerId)

  console.log('Checking customer existence:', { customerId, customers, customersError })

  // First get the customer's actual ID from their auth_user_id
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id')
    .eq('auth_user_id', customerId)
    .single()

  if (customerError || !customer) {
    console.error('Customer not found for auth_user_id:', customerId)
    throw new Error(`Customer with auth_user_id ${customerId} not found`)
  }

  // If assigneeId is provided, verify team member exists
  if (assigneeId) {
    const { data: teamMember, error: teamMemberError } = await supabase
      .from('team_members')
      .select('id')
      .eq('auth_user_id', assigneeId)
      .maybeSingle()

    if (teamMemberError || !teamMember) {
      console.error('Team member not found for auth_user_id:', assigneeId)
      throw new Error(`Team member with auth_user_id ${assigneeId} not found`)
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
    // Technical Support Tickets
    createTicketWithHistory(enterpriseUserId, agentIds.techAgent, {
      title: 'API Integration Issues',
      description: 'Having trouble with the REST API endpoints',
      status: 'pending',
      priority: 'high',
      category: 'technical',
      tags: ['api', 'bug'],
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
    }),
    createTicketWithHistory(enterpriseUserId, agentIds.seniorTechAgent, {
      title: 'Security Vulnerability Report',
      description: 'Identified potential XSS vulnerability in dashboard',
      status: 'open',
      priority: 'urgent',
      category: 'security',
      tags: ['security', 'bug'],
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    }),
    // Billing Support Tickets
    createTicketWithHistory(enterpriseUserId, agentIds.billingAgent, {
      title: 'Bulk License Upgrade',
      description: 'Need to upgrade enterprise license for 500 seats',
      status: 'pending',
      priority: 'urgent',
      category: 'billing',
      tags: ['billing'],
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    }),
    createTicketWithHistory(enterpriseUserId, agentIds.seniorBillingAgent, {
      title: 'Custom Billing Integration',
      description: 'Setting up custom billing integration with SAP',
      status: 'pending',
      priority: 'high',
      category: 'billing',
      tags: ['billing', 'integration'],
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
    }),
    // Customer Success Tickets
    createTicketWithHistory(enterpriseUserId, agentIds.successLead, {
      title: 'Quarterly Business Review',
      description: 'Schedule and prepare for quarterly business review',
      status: 'open',
      priority: 'medium',
      category: 'account',
      tags: ['account', 'review'],
      created_at: new Date().toISOString()
    }),
    createTicketWithHistory(enterpriseUserId, agentIds.seniorSuccessAgent, {
      title: 'Training Session Request',
      description: 'Need advanced training for new team members',
      status: 'pending',
      priority: 'medium',
      category: 'technical',
      tags: ['training'],
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
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
    // Technical Issues
    createTicketWithHistory(vipUserId, agentIds.seniorTechAgent, {
      title: 'Account Security Audit',
      description: 'Request for detailed security audit report',
      status: 'pending',
      priority: 'high',
      category: 'security',
      tags: ['security'],
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    }),
    createTicketWithHistory(vipUserId, agentIds.techAgent, {
      title: 'Performance Optimization',
      description: 'System response times have degraded',
      status: 'open',
      priority: 'urgent',
      category: 'technical',
      tags: ['performance', 'urgent'],
      sla_breach: true,
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
    }),
    // Billing Issues
    createTicketWithHistory(vipUserId, agentIds.seniorBillingAgent, {
      title: 'Custom Payment Terms',
      description: 'Discussion of custom payment terms for expansion',
      status: 'pending',
      priority: 'high',
      category: 'billing',
      tags: ['billing', 'vip'],
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    }),
    // Success Planning
    createTicketWithHistory(vipUserId, agentIds.successLead, {
      title: 'Strategic Partnership Planning',
      description: 'Discuss potential strategic partnership opportunities',
      status: 'open',
      priority: 'medium',
      category: 'account',
      tags: ['partnership', 'planning'],
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
    })
  ])

  return tickets
}

async function clearTestUsers() {
  console.log('Clearing existing test users...')
  
  // Get list of test emails
  const testEmails = new Set<string>([
    ...Object.values(TEST_USERS).map(u => u.email),
    ...Object.values(ADDITIONAL_TEST_USERS).map(u => u.email)
  ])
  
  // Get all users and filter by our test emails
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  
  if (listError) {
    console.error('Error listing users:', listError)
    return
  }

  // Delete matching users
  for (const user of users || []) {
    if (user.email && testEmails.has(user.email as string)) {
      const { error } = await supabase.auth.admin.deleteUser(user.id)
      if (error) {
        console.error(`Error deleting user ${user.email}:`, error)
      } else {
        console.log(`Deleted user: ${user.email}`)
      }
    }
  }
  
  console.log('Cleared test users')
}

async function clearPublicTables() {
  console.log('Clearing public tables...')
  
  // List of tables to clear in order (considering foreign key constraints)
  const tables = [
    'ticket_messages',
    'tickets',
    'team_members',
    'customers',
    'ticket_templates',
    'sla_policies',
    'departments',
    'tags',
    'kb_articles',
    'kb_categories',
    'chat_quick_responses'
  ]

  // Delete from each table in order
  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .gte('created_at', '2000-01-01') // Safe WHERE clause that matches all records
    
    if (error) {
      console.error(`Error clearing table ${table}:`, error)
    } else {
      console.log(`Cleared table: ${table}`)
    }
  }
}

async function seedTestData(options: { role?: UserRole } = {}) {
  try {
    console.log('Starting to seed test data...')

    // Clear existing test users first
    await clearTestUsers()

    // Clear existing data from public tables
    await clearPublicTables()

    // Manually clear team_members and customers since truncate might fail
    console.log('Ensuring team_members and customers are cleared...')
    await supabase.from('team_members').delete()
    await supabase.from('customers').delete()

    // Seed departments
    console.log('Seeding departments...')
    const { data: createdDepartments, error: deptError } = await supabase
      .from('departments')
      .upsert(
        DEPARTMENTS.map(dept => ({
          id: dept.id,
          name: dept.name,
          description: dept.description
        }))
      )
      .select()

    if (deptError) {
      console.error('Error seeding departments:', deptError)
      throw deptError
    }

    console.log('Created departments:', createdDepartments)

    // Create a map of department names to their IDs
    const departmentMap = new Map(
      createdDepartments?.map(dept => [dept.name, dept.id]) || []
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

    // Create all test users
    console.log('Creating test users...')
    const users = await Promise.all(
      Object.entries({ ...TEST_USERS, ...ADDITIONAL_TEST_USERS }).map(
        async ([role, user]) => {
          const dbUser = await getOrCreateUser(user.email, user.password, user.name)
          
          // Create customer or team member record based on email domain
          if (user.email.includes('@agent.autocrm.com') || user.email.includes('@admin.autocrm.com')) {
            // First delete any existing team member with this email
            await supabase
              .from('team_members')
              .delete()
              .eq('email', user.email)
              .or('auth_user_id.is.null,auth_user_id.eq.' + dbUser.id)

            // Create team member
            const { error: teamMemberError } = await supabase
              .from('team_members')
              .insert({
                auth_user_id: dbUser.id,
                email: user.email,
                name: user.name,
                role: user.email.includes('@admin.autocrm.com') ? 'admin' : 'agent'
              })
            if (teamMemberError) {
              console.error(`Error creating team member for ${user.email}:`, teamMemberError)
            }
          } else {
            // First delete any existing customer with this email
            await supabase
              .from('customers')
              .delete()
              .eq('email', user.email)
              .or('auth_user_id.is.null,auth_user_id.eq.' + dbUser.id)

            // Create customer
            const { error: customerError } = await supabase
              .from('customers')
              .insert({
                auth_user_id: dbUser.id,
                email: user.email,
                name: user.name
              })
            if (customerError) {
              console.error(`Error creating customer for ${user.email}:`, customerError)
            }
          }
          
          return { role, ...user, id: dbUser.id }
        }
      )
    )

    // Check if records were created
    console.log('Checking created records...')
    const { data: allCustomers } = await supabase.from('customers').select('*')
    const { data: allTeamMembers } = await supabase.from('team_members').select('*')
    console.log('Current customers:', allCustomers)
    console.log('Current team members:', allTeamMembers)

    // Update team members with departments
    console.log('Updating team members with departments...')
    const teamMembers = users
      .filter(user => user.email.includes('@agent.autocrm.com') || user.email.includes('@admin.autocrm.com'))
      .map(user => {
        // Get department based on email
        let departmentId = departmentMap.get('Technical Support') // Default to tech support

        if (user.email.includes('tech')) {
          departmentId = departmentMap.get('Technical Support')
        } else if (user.email.includes('billing')) {
          departmentId = departmentMap.get('Billing Support')
        } else if (user.email.includes('success') || user.email.includes('lead')) {
          departmentId = departmentMap.get('Customer Success')
        }

        console.log(`Assigning user ${user.email} to department ${departmentId}`)

        return {
          auth_user_id: user.id,
          department_id: departmentId
        }
      })

    // Update each team member with their department
    for (const member of teamMembers) {
      const { error } = await supabase
        .from('team_members')
        .update({ department_id: member.department_id })
        .eq('auth_user_id', member.auth_user_id)

      if (error) {
        console.error(`Error updating department for user ${member.auth_user_id}:`, error)
      }
    }

    // Store agent IDs for reference
    const agentIds = {
      basicAgent: users.find(u => u.email === TEST_USERS.agent.email)?.id,
      techAgent: users.find(u => u.email === ADDITIONAL_TEST_USERS.techAgent1.email)?.id,
      seniorTechAgent: users.find(u => u.email === ADDITIONAL_TEST_USERS.seniorTechAgent.email)?.id,
      billingAgent: users.find(u => u.email === ADDITIONAL_TEST_USERS.billingAgent1.email)?.id,
      seniorBillingAgent: users.find(u => u.email === ADDITIONAL_TEST_USERS.seniorBillingAgent.email)?.id,
      successLead: users.find(u => u.email === ADDITIONAL_TEST_USERS.customerSuccessLead.email)?.id,
      seniorSuccessAgent: users.find(u => u.email === ADDITIONAL_TEST_USERS.seniorSuccessAgent.email)?.id
    }

    // Log agent IDs for debugging
    console.log('Agent IDs:', {
      techAgent: {
        id: agentIds.techAgent,
        email: ADDITIONAL_TEST_USERS.techAgent1.email
      }
    })

    // Seed basic tickets
    console.log('Seeding basic tickets...')
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
          assignee_id: agent.id,
          organization_id: null // Basic tickets have no org
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

    // Seed enterprise tickets
    console.log('Seeding enterprise tickets...')
    const enterpriseUser = users.find(u => u.email === ADDITIONAL_TEST_USERS.enterpriseCustomer.email)!
    if (enterpriseUser) {
      await seedEnterpriseScenario(enterpriseUser.id, agentIds)
    }

    // Seed VIP tickets
    console.log('Seeding VIP tickets...')
    const vipUser = users.find(u => u.email === ADDITIONAL_TEST_USERS.vipCustomer.email)!
    if (vipUser) {
      await seedVIPScenario(vipUser.id, agentIds)
    }

    // Seed knowledge base
    console.log('Seeding knowledge base...')
    await supabase.from('kb_categories').upsert(KB_CATEGORIES)
    await supabase.from('kb_articles').upsert(KB_ARTICLES)

    // Seed tags
    console.log('Seeding tags...')
    await supabase.from('tags').upsert(TICKET_TAGS)

    // Seed chat quick responses
    console.log('Seeding chat quick responses...')
    if (allTeamMembers && allTeamMembers.length > 0) {
      // Create quick responses for each team member
      for (const teamMember of allTeamMembers) {
        await supabase.from('chat_quick_responses').insert(
          CHAT_QUICK_RESPONSES.map(template => ({
            team_member_id: teamMember.id,
            title: template.title,
            content: template.content,
            category: template.category
          }))
        )
      }
      console.log('Created chat quick responses for team members')
    }

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