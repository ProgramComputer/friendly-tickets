# App Restructure Phase 2: Implementation (Revised)

## Task Objective
Reorganize the application structure to better align with Next.js 14 best practices and our established code guidelines.

## Current State Assessment
- Multiple directories at root level causing confusion
- Duplicate directories (hooks, types)
- Components not properly colocated with their features
- Missing error and loading states in route groups
- Services and API routes not properly organized
- Middleware logic not properly organized
- Missing component patterns for error handling and loading states
- API routes scattered across the application

## Future State Goal
A clean, maintainable structure that follows our established guidelines with:
- Clear separation of client/server code
- Properly organized components following our component structure
- Standardized patterns for common scenarios
- Well-organized API routes with proper error handling
- Maximum file size of 150 lines per file

## Implementation Plan

1. **Reorganize Components Directory**
   - [ ] Create components/shared/ for reusable components
     - [ ] buttons/ subdirectory
     - [ ] forms/ subdirectory
     - [ ] layout/ subdirectory
   - [ ] Create components/features/ for feature-specific components
     - [ ] auth/ subdirectory
     - [ ] dashboard/ subdirectory
   - [ ] Create components/ui/ for Shadcn UI components
   - [ ] Ensure all components are under 150 lines
   - [ ] Use named exports for all components
   - [ ] Add proper TypeScript interfaces for props

2. **Reorganize App Directory**
   - [ ] Ensure proper route group structure:
     - [ ] (marketing)/ for public pages
     - [ ] (auth)/ for authentication
     - [ ] (dashboard)/ for main application
     - [ ] (agent)/ for agent features
     - [ ] (admin)/ for admin features
   - [ ] Add proper layouts for each route group
   - [ ] Add error.tsx and loading.tsx to each group
   - [ ] Add metadata.ts files for SEO
   - [ ] Colocate API routes with their features

3. **Reorganize Lib Directory**
   - [ ] Organize supabase/
     - [ ] current/ for current schema
     - [ ] domain/ for domain-specific logic
   - [ ] Organize constants/
     - [ ] auth/ for auth constants
     - [ ] ui/ for UI constants
   - [ ] Organize hooks/
     - [ ] useAuth/ for auth hooks
     - [ ] useUI/ for UI hooks
   - [ ] Organize middleware/
     - [ ] auth/ for auth middleware
     - [ ] rbac/ for role-based access
   - [ ] Ensure utils/ contains only shared utilities

4. **Update Route-Specific Code**
   - [ ] Move route-specific components to components/features/
   - [ ] Create server actions in route directories
   - [ ] Add proper error handling using error boundaries
   - [ ] Add loading states using Suspense
   - [ ] Update layouts with proper metadata

5. **Implement Error Handling**
   - [ ] Add error boundaries to each route
   - [ ] Implement proper error logging
   - [ ] Add user-friendly error messages
   - [ ] Use Zod for form validation
   - [ ] Use next-safe-action for server actions

6. **Testing Setup**
   - [ ] Set up unit tests for utilities
   - [ ] Set up integration tests for components
   - [ ] Set up E2E tests for critical flows
   - [ ] Set up Supabase local testing

7. **Documentation Updates**
   - [ ] Update README.md with new structure
   - [ ] Document component guidelines
   - [ ] Document error handling patterns
   - [ ] Document testing patterns
   - [ ] Add examples for common scenarios

## Key Guidelines to Follow
- Keep files under 150 lines
- Use functional, declarative programming
- Use TypeScript interfaces for public contracts
- Handle errors with early returns
- Use proper naming conventions (lowercase-with-dashes)
- Maintain proper documentation
- Follow mobile-first responsive design
- Use Server Components by default
- Only use 'use client' when necessary 