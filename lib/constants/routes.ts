import { UserRole } from '@/types/auth'

export const ROUTES = {
  auth: {
    login: '/login',
    signup: '/signup',
    forgotPassword: '/forgot-password',
    resetPassword: '/reset-password',
    callback: '/callback'
  },
  admin: {
    overview: '/overview',
    departments: '/departments',
    reports: '/reports',
    team: '/team',
    settings: '/settings'
  },
  agent: {
    workspace: '/workspace',
    queue: '/queue',
    templates: '/templates'
  },
  dashboard: {
    home: '/dashboard',
    tickets: '/tickets',
    settings: '/settings'
  },
  kb: {
    home: '/kb',
    articles: '/kb/articles',
    categories: '/kb/categories'
  },
  public: {
    home: '/'
  },
} as const

export type AppRoutes = typeof ROUTES 