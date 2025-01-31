# Types Directory Restructure
Created: 2024-01-22

## Task Objective
Consolidate all TypeScript types into a single `/types` directory with clear subdirectories for better organization and maintainability.

## Current State Assessment
- Types split between `/types` and `/lib/types`
- Supabase types generated in root `/types`
- Unclear separation between global and feature-specific types

## Future State Goal
Single `/types` directory with clear subdirectories:
```
├── types/
│   ├── global/        # Global types (DB, env)
│   ├── shared/        # Shared types
│   ├── features/      # Feature-specific types
```

## Implementation Plan

### 1. Update Supabase Type Generation
- [ ] Modify package.json script
- [ ] Update type generation path
- [ ] Test type generation

### 2. Create Directory Structure
- [ ] Create new subdirectories
- [ ] Add README.md with usage guidelines
- [ ] Set up type exports

### 3. Migrate Existing Types
- [ ] Move types from /lib/types
- [ ] Update import paths
- [ ] Remove old directories

### 4. Update Documentation
- [ ] Update .cursorrules
- [ ] Update relevant documentation
- [ ] Add type organization guidelines 