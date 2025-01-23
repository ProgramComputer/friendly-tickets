import { UserRole } from '@/types/auth'

export const ROUTES = {
  auth: {
    login: '/auth/login',
    signup: '/auth/signup',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  role: {
    admin: '/admin/dashboard',
    agent: '/tickets',
    customer: '/tickets',
  } as Record<UserRole, string>,
  tickets: {
    list: '/tickets',
    new: '/tickets/new',
    view: (id: string) => `/tickets/${id}`,
  },
  team: {
    list: "/employee/team",
    create: "/employee/team/create",
    view: (id: string) => `/employee/team/${id}`,
  },
  reports: {
    dashboard: "/employee/reports",
    tickets: "/employee/reports/tickets",
    performance: "/employee/reports/performance",
  },
  settings: {
    employee: {
      general: "/employee/settings",
      profile: "/employee/settings/profile",
      notifications: "/employee/settings/notifications",
      security: "/employee/settings/security",
    },
    customer: {
      profile: "/customer/settings/profile",
      notifications: "/customer/settings/notifications",
      security: "/customer/settings/security",
    },
  },
} as const

export type AppRoutes = typeof ROUTES 