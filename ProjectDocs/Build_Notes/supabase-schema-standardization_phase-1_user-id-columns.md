# Supabase Schema Standardization - Phase 1: User ID Columns
Created: 2024-01-30

## Task Objective
Standardize the user ID column naming across tables, changing from `auth_user_id` to `user_id` consistently.

## Current State Assessment
- Both `customers` and `team_members` tables have `auth_user_id` columns
- Some foreign key constraints reference these columns
- Inconsistent with our schema naming conventions
- May cause confusion in code and queries

## Future State Goal
- All tables use `user_id` consistently for auth user references
- Clean foreign key relationships
- Proper handling of any legacy `auth_user_id` references
- Clear documentation of the standard

## Implementation Plan

### 1. Create Migration
- [x] Create migration file with timestamp prefix
- [x] Add reversion safety check
- [x] Include column renames
- [x] Update foreign key constraints
- [x] Add trigger for handling legacy references

### 2. Test Migration
- [ ] Test migration locally
- [ ] Verify foreign key constraints
- [ ] Check trigger functionality
- [ ] Validate existing data

### 3. Update Types
- [ ] Generate new types after migration
- [ ] Update any type references in code
- [ ] Verify type safety

### 4. Documentation
- [ ] Update schema documentation
- [ ] Add migration notes
- [ ] Document naming convention

## Progress Tracking

### Completed Tasks
- Created migration file for standardizing user ID columns
- Added safety checks and reversion capability
- Created trigger for handling legacy references
- Updated foreign key constraints
- Added column comments

### Next Steps
1. Test migration locally
2. Update types and regenerate
3. Update documentation

### Notes
- Migration includes safety checks to prevent data loss
- Trigger function will handle any legacy code still using `auth_user_id`
- Foreign key constraints are properly updated
- Column comments added for clarity
- Need to test thoroughly before applying to production

### Schema Changes
The following changes are included:
1. Rename Columns:
   - `customers.auth_user_id` → `customers.user_id`
   - `team_members.auth_user_id` → `team_members.user_id`

2. Update Foreign Keys:
   - `ticket_history.changed_by` → references `team_members.user_id`
   - `ticket_status_history.changed_by` → references `team_members.user_id`

3. Added Triggers:
   - `handle_customers_auth_user_id`
   - `handle_team_members_auth_user_id`
   Both triggers ensure backward compatibility by handling any attempts to use the old column name. 