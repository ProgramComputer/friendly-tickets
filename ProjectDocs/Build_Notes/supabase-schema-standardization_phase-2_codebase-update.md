# Supabase Schema Standardization - Phase 2: Codebase Update
Created: 2024-01-30

## Task Objective
Update all codebase references from `auth_user_id` to `user_id` to match the database schema standardization.

## Current State Assessment
- Database schema uses `user_id`
- Application code has mixed usage:
  - Some files use `auth_user_id`
  - Some files use `user_id`
  - Inconsistent naming in queries and types
- Type definitions still reference `auth_user_id`

## Future State Goal
- Consistent use of `user_id` across the entire codebase
- Updated type definitions
- All queries using the standardized column name
- No references to `auth_user_id` except in migration history

## Implementation Plan

### 1. Update Type Definitions
- [ ] Update Supabase generated types
- [ ] Update custom type definitions
- [ ] Update type imports

### 2. Update Application Code
- [ ] Update database queries
- [ ] Update component props and interfaces
- [ ] Update hooks and services
- [ ] Update API routes

### 3. Update Tests and Scripts
- [ ] Update test files
- [ ] Update seed scripts
- [ ] Update utility scripts

### 4. Verification
- [ ] Run type checking
- [ ] Run tests
- [ ] Test database operations
- [ ] Verify auth flows

## Execution Steps

### Step 1: Update Type Definitions
1. Generate new Supabase types
2. Update custom type extensions
3. Update type imports in components

### Step 2: Update Application Code
1. Create search/replace script
2. Update database queries
3. Update component references
4. Update service layer

### Step 3: Testing
1. Run type checks
2. Run test suite
3. Manual testing of auth flows

## Progress Tracking

### Completed Tasks
- Created implementation plan
- Identified all affected files

### Next Steps
1. Start with type definitions
2. Create update script
3. Execute changes systematically

### Notes
- Need to maintain backward compatibility during transition
- Some files may require manual updates
- Test thoroughly after each major change
- Keep track of all modified files 