# Route Restructuring Plan - Phase 1

## Task Objective
Restructure the application routes to follow Next.js best practices and improve organization.

## Current State Assessment
Current structure has:
- Mixed authenticated/public routes
- Duplicate route locations
- Inconsistent organization
- Multiple parallel routing conflicts
- Pages resolving to same paths
- Route groups without proper nesting

## Future State Goal
Create a clear, organized route structure that:
- Properly separates public and authenticated routes
- Groups related features logically
- Follows Next.js best practices and limitations
- Makes navigation and maintenance easier
- Ensures unique paths for all pages
- Prevents any parallel routing conflicts

## Implementation Plan

### 1. Create New Route Structure
```
app/
├── (marketing)/       # Marketing route group
│   ├── layout.tsx    # Minimal layout with theme toggle
│   └── page.tsx      # Landing page (URL: /)
├── (public)/         # Public route group (non-marketing pages)
│   ├── layout.tsx    # Layout with navigation for about/contact
│   ├── about/         
│   │   └── page.tsx   # URL: /about
│   └── contact/       
│       └── page.tsx   # URL: /contact
├── (auth)/            # Auth route group
│   ├── login/         
│   │   ├── actions.ts
│   │   └── page.tsx   # URL: /login
│   ├── signup/        
│   │   └── page.tsx   # URL: /signup
│   ├── forgot-password/
│   │   └── page.tsx   # URL: /forgot-password
│   └── reset-password/
│       └── page.tsx   # URL: /reset-password
├── (dashboard)/       # Customer route group
│   ├── dashboard/     
│   │   └── page.tsx   # URL: /dashboard
│   ├── tickets/       
│   │   ├── page.tsx   # URL: /tickets
│   │   ├── new/       
│   │   │   └── page.tsx   # URL: /tickets/new
│   │   └── [id]/     
│   │       └── page.tsx   # URL: /tickets/[id]
│   ├── profile/       
│   │   └── page.tsx   # URL: /profile
│   └── settings/      
│       └── page.tsx   # URL: /settings
├── (agent)/          # Agent route group
│   ├── workspace/    
│   │   └── page.tsx  # URL: /workspace
│   ├── queue/        
│   │   └── page.tsx  # URL: /queue
│   └── templates/    
│       └── page.tsx  # URL: /templates
├── (admin)/         # Admin route group
│   ├── overview/    
│   │   └── page.tsx # URL: /overview
│   ├── settings/    
│   │   └── page.tsx # URL: /settings
│   ├── team/        
│   │   └── page.tsx # URL: /team
│   ├── reports/     
│   │   └── page.tsx # URL: /reports
│   └── departments/ 
│       └── page.tsx # URL: /departments
├── api/            # API routes (not affected by route groups)
└── layout.tsx      # Root layout

Note: Route Group Organization
- (marketing): Contains landing page with minimal layout
- (public): Contains informational pages (about, contact)
- (auth): Contains authentication-related pages
- (dashboard): Contains customer-specific pages
- (agent): Contains agent workspace pages
- (admin): Contains admin control pages

URL Path Examples:
Public:
  - Landing page: /
  - About page: /about
  - Contact page: /contact

Auth:
  - Login: /login
  - Signup: /signup
  - Password reset: /reset-password

Customer:
  - Dashboard: /dashboard
  - Tickets list: /tickets
  - New ticket: /tickets/new
  - View ticket: /tickets/123

Agent:
  - Workspace: /workspace
  - Queue: /queue
  - Templates: /templates

Admin:
  - Overview: /overview
  - Team: /team
  - Reports: /reports
```

### 2. Migration Steps

1. **Setup New Structure**
   - Create all route groups with proper nesting
   - Add redirect pages at group roots
   - Setup layouts for each group
   - Verify no parallel routing conflicts

2. **Auth Routes Migration**
   - Move login/signup to (auth)
   - Remove auth from public routes
   - Update authentication flows
   - Test auth redirects

3. **Dashboard Routes Migration**
   - Create nested dashboard structure
   - Move customer pages to proper locations
   - Update ticket-related components
   - Test CRUD operations

4. **Agent Routes Migration**
   - Create nested workspace structure
   - Move agent features to workspace
   - Ensure proper routing hierarchy
   - Test agent features

5. **Admin Routes Migration**
   - Create nested overview structure
   - Move admin features to overview
   - Ensure proper routing hierarchy
   - Test admin features

6. **Public Routes Setup**
   - Keep landing page at root only
   - Move about/contact pages
   - Setup public layouts
   - Test public navigation

7. **Cleanup**
   - Remove old routes
   - Update navigation components
   - Fix broken links
   - Final parallel routing check

### 3. Required Updates

1. **Route Constants**
   ```typescript
   // lib/constants/routes.ts
   export const ROUTES = {
     auth: {
       login: '/login',
       signup: '/signup',
       forgotPassword: '/forgot-password',
       resetPassword: '/reset-password',
     },
     role: {
       admin: '/overview',        // NOT /admin/overview
       agent: '/workspace',       // NOT /agent/workspace
       customer: '/dashboard',    // NOT /dashboard/dashboard
     } as Record<UserRole, string>,
     dashboard: {
       home: '/dashboard',
       tickets: {
         list: '/tickets',
         new: '/tickets/new',
         view: (id: string) => `/tickets/${id}`,
       },
       profile: '/profile',
       settings: '/settings',
     },
     agent: {
       workspace: '/workspace',
       queue: '/queue',
       templates: '/templates',
     },
     admin: {
       overview: '/overview',
       settings: '/settings',
       team: '/team',
       reports: '/reports',
       departments: '/departments',
     },
     public: {
       home: '/',
       about: '/about',
       contact: '/contact',
     },
   }
   ```

2. **Middleware Updates**
   ```typescript
   // middleware.ts
   export const config = {
     matcher: [
       '/((?!api|_next/static|_next/image|favicon.ico).*)',
     ]
   }
   ```

3. **Navigation Updates**
   - Update all navigation components
   - Fix role-based navigation
   - Update breadcrumbs

### 4. Testing Requirements

1. **Route Access**
   - Verify auth protection
   - Test role-based access
   - Check redirects
   - Verify no parallel routing conflicts

2. **Navigation**
   - Test all navigation paths
   - Verify breadcrumbs
   - Check mobile navigation
   - Ensure consistent URL structure

3. **Features**
   - Test ticket system in new location
   - Verify agent workspace
   - Check admin features
   - Validate public pages

### 5. Documentation Updates

1. **Update Docs**
   - Route documentation
   - Navigation guides
   - API documentation
   - Next.js routing limitations

2. **Team Communication**
   - Share migration plan
   - Document breaking changes
   - Update PR templates
   - Note routing constraints

## Success Criteria
- All routes follow Next.js best practices
- Clear separation of concerns
- Improved navigation structure
- All features working in new locations
- No parallel routing conflicts
- Comprehensive test coverage
- Updated documentation 