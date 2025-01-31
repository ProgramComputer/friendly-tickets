# TypeScript Types Organization

This directory contains all TypeScript type definitions for the project, organized in a clear and maintainable structure.

## Directory Structure

```
├── types/
│   ├── global/        # Global types (DB, env, config)
│   │   └── supabase.ts
│   ├── shared/        # Shared types used across features
│   │   └── auth.ts
│   ├── features/      # Feature-specific types
│   │   └── tickets/
│   │       └── index.ts
```

## Guidelines

### 1. Directory Usage

- `global/`: Contains types that are fundamental to the application
  - Database types (Supabase)
  - Environment variables
  - Global configuration
  - These types should be treated as read-only and only updated through automated processes

- `shared/`: Contains types used across multiple features
  - Authentication and authorization
  - Common UI components
  - Utility types
  - These types should be generic and reusable

- `features/`: Contains types specific to feature modules
  - Organized by feature name
  - Each feature should have its own directory
  - Complex features should use an index.ts file for exports

### 2. Naming Conventions

- Use PascalCase for type and interface names
- Use camelCase for type properties
- Add `Type` suffix for complex types
- Add `Props` suffix for component props
- Add `Config` suffix for configuration types

Example:
```typescript
interface UserProps {
  name: string;
  email: string;
}

type AuthConfigType = {
  providers: string[];
  redirectUrl: string;
};
```

### 3. Type Organization

- One type per file for large types
- Group related small types in a single file
- Use barrel exports (index.ts) for feature directories
- Keep types close to their implementation

### 4. Import/Export Guidelines

- Always use named exports
- Export types from feature index.ts files
- Import from the closest possible source
- Avoid circular dependencies

Example:
```typescript
// Good
import { TicketStatus } from "@/types/features/tickets";

// Avoid
import { TicketStatus } from "@/types/features/tickets/status";
```

### 5. Documentation

- Document complex types with JSDoc comments
- Include examples for non-obvious usage
- Note any dependencies or requirements

Example:
```typescript
/**
 * Configuration for ticket automation rules
 * @property {string} condition - The condition that triggers the rule
 * @property {string[]} actions - List of actions to perform
 * @example
 * {
 *   condition: "status === 'open'",
 *   actions: ['assignToTeam', 'sendNotification']
 * }
 */
interface TicketRuleConfig {
  condition: string;
  actions: string[];
}
```

### 6. Type Generation

- Supabase types are automatically generated in `global/supabase.ts`
- Do not modify generated types directly
- Create wrapper types if modifications are needed

## Best Practices

1. Keep types simple and focused
2. Use composition over inheritance
3. Leverage TypeScript's utility types
4. Maintain strict type checking
5. Avoid using `any`
6. Use discriminated unions for complex state

## Updating Types

1. Add new types to appropriate directories
2. Update relevant index.ts files
3. Run type checking: `npm run type-check`
4. Update documentation if needed
5. Test affected components 