# App Restructure Phase 2: Implementation

## Task Objective
Reorganize the application structure to better align with Next.js 14 best practices and improve code organization.

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
A clean, maintainable structure that follows Next.js 14 best practices with:
- Clear separation of client/server code
- Colocated components and server actions
- Proper error and loading states
- Organized shared utilities
- Standardized patterns for common scenarios
- Well-organized API routes with proper error handling

## Implementation Plan

1. **Reorganize App Directory**
   - [ ] Move global components to app/_components
   - [ ] Create ui/, layout/, forms/ subdirectories in _components
   - [ ] Add error.tsx and loading.tsx to each route group
   - [ ] Colocate API routes with their features
   - [ ] Ensure each route group has proper layout.tsx
   - [ ] Create standardized error boundary components
   - [ ] Create standardized loading state components
   - [ ] Add proper metadata.ts files for SEO

2. **Consolidate Lib Directory**
   - [ ] Create client/ and shared/ subdirectories
   - [ ] Move hooks/ to lib/client/hooks
   - [ ] Move types/ to lib/shared/types
   - [ ] Move schemas/ to lib/shared/schemas
   - [ ] Move constants/ to lib/shared/constants
   - [ ] Move utils/ to lib/shared/utils
   - [ ] Create patterns/ directory for reusable patterns

3. **Clean Up Root Directory**
   - [ ] Remove duplicate directories
   - [ ] Move configuration files to config/
   - [ ] Update import paths across the application
   - [ ] Update tsconfig.json paths if needed
   - [ ] Move middleware.ts to app/_lib/middleware

4. **Update Route-Specific Code**
   - [ ] Move route-specific components to their _components directories
   - [ ] Create _actions directories for server actions
   - [ ] Add proper error handling and loading states
   - [ ] Update layouts with proper metadata
   - [ ] Add route-specific middleware where needed

5. **Organize API Routes**
   - [ ] Move API routes to their feature directories
   - [ ] Implement proper error handling for all API routes
   - [ ] Add rate limiting middleware
   - [ ] Add validation middleware
   - [ ] Add proper TypeScript types for all API responses

6. **Middleware Organization**
   - [ ] Create app/_lib/middleware directory
   - [ ] Split middleware by feature (auth, analytics, etc.)
   - [ ] Add proper types for middleware
   - [ ] Add middleware tests
   - [ ] Document middleware patterns

7. **Component Patterns**
   - [ ] Create error boundary patterns
   - [ ] Create loading state patterns
   - [ ] Create data fetching patterns
   - [ ] Add proper TypeScript types for all patterns
   - [ ] Document pattern usage

8. **Documentation Updates**
   - [ ] Update README.md with new structure
   - [ ] Document component organization guidelines
   - [ ] Update import conventions
   - [ ] Document error handling patterns
   - [ ] Document middleware patterns
   - [ ] Document API route patterns
   - [ ] Add examples for common scenarios 