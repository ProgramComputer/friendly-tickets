# Types Directory Restructure - Phase 1: Organization
Created: 2024-01-30

## Task Objective
Consolidate and reorganize all TypeScript types into a single `/types` directory with clear subdirectories for better organization and maintainability.

## Current State Assessment
- Types are currently split between `/types` and `/lib/types`
- Found files:
  - `/types/`:
    - supabase.ts (37KB)
    - tickets.ts (4.8KB)
    - auth.ts (708B)
  - `/lib/types/`:
    - supabase.ts (empty)
    - tickets.ts (1.7KB)
- Duplicate files exist between directories
- No clear organization structure

## Future State Goal
Single `/types` directory with clear subdirectories:
```
├── types/
│   ├── global/        # Global types (DB, env)
│   │   └── supabase.ts
│   ├── shared/        # Shared types
│   │   └── auth.ts
│   ├── features/      # Feature-specific types
│   │   └── tickets/
│   │       └── index.ts
```

## Implementation Plan

### 1. Create Directory Structure
- [x] Create new subdirectories in `/types`
- [x] Add README.md with usage guidelines
- [x] Set up type exports

### 2. Migrate Existing Types
- [x] Move supabase.ts to `/types/global`
- [x] Move auth.ts to `/types/shared`
- [x] Create tickets directory in features
- [x] Merge and move tickets.ts files
- [x] Update import paths
- [x] Remove old files and directories

### 3. Update Type Generation
- [x] Update Supabase type generation path in package.json
- [x] Test type generation (successful)
- [x] Update package.json scripts

### 4. Documentation Updates
- [ ] Update .cursorrules
- [x] Update import references in codebase
- [ ] Add type organization guidelines

## Progress Tracking

### Completed Tasks
- Created build notes file
- Analyzed current directory structure
- Planned new organization structure
- Created new directory structure
- Added comprehensive README with guidelines
- Created root index.ts for convenient exports
- Migrated and reorganized all existing types:
  - Moved supabase.ts to global/
  - Moved auth.ts to shared/
  - Created new tickets/index.ts with improved types
  - Removed old type files
- Improved ticket types to use Supabase generated types
- Updated Supabase type generation:
  - Modified package.json script to output to types/global/
  - Successfully tested type generation
  - Verified types are correctly generated in new location
- Updated import paths across the codebase:
  - Created and ran update script
  - Updated all references to old type locations
  - Verified changes in sample files

### Next Steps
1. Update .cursorrules with type organization guidelines
2. Review and update any affected components
3. Run type checking and tests to ensure no regressions

### Notes
- Successfully merged the two tickets.ts files into a more comprehensive version
- Improved type definitions by extending from Supabase generated types
- Organized types into logical groups with clear comments
- Added new types for history, custom fields, templates, and watchers
- Import paths have been updated to match new structure
- Consider adding more specific types for ticket-related features
- Supabase type generation is now properly configured for the new structure

### Import Path Changes
The following import path updates were made:
- `@/types/supabase` → `@/types/global/supabase`
- `@/types/auth` → `@/types/shared/auth`
- `@/types/tickets` → `@/types/features/tickets`
- `@/lib/types/tickets` → `@/types/features/tickets`
- Removed all references to `@/lib/types/`
