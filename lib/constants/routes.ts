export const ROUTES = {
  auth: {
    login: "/auth/login",
    signup: "/auth/signup",
  },
  role: {
    admin: "/employee/admin",
    agent: "/employee/agent",
    customer: "/customer/tickets",
  },
  tickets: {
    employee: {
      list: "/employee/tickets",
      view: (id: string) => `/employee/tickets/${id}`,
    },
    customer: {
      list: "/customer/tickets",
      create: "/customer/tickets/create",
      view: (id: string) => `/customer/tickets/${id}`,
    },
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