# UI Context - Zendesk-Inspired Design System

## Design Principles

### Visual Hierarchy
- Clean, uncluttered interfaces with clear visual hierarchy
- Content-first approach with ample white space
- Consistent padding and spacing using Tailwind's spacing scale
- Clear separation between interactive and static elements

### Color Palette

```typescript
// lib/constants/ui/colors.ts
export const colors = {
  // Primary Brand Colors
  primary: {
    DEFAULT: '#03363D',  // Deep Teal - Main brand color
    light: '#2F3941',    // Light Teal - Secondary actions
    hover: '#1F73B7',    // Blue - Hover states
  },
  
  // Secondary Colors
  secondary: {
    DEFAULT: '#49545C',  // Slate - Secondary text
    light: '#87929D',    // Light Slate - Tertiary text
    hover: '#C2C8CC',    // Hover state for secondary
  },
  
  // Status Colors
  status: {
    success: '#087443',  // Green - Success states
    warning: '#B35F00',  // Orange - Warning states
    error: '#B30000',    // Red - Error states
    info: '#0077C5',     // Blue - Info states
  },
  
  // Background Colors
  background: {
    primary: '#FFFFFF',  // White - Primary background
    secondary: '#F8F9F9', // Light Gray - Secondary background
    tertiary: '#EBF0F4', // Lighter Gray - Tertiary background
  },
  
  // Border Colors
  border: {
    light: '#D8DCDE',    // Light border
    DEFAULT: '#C2C8CC',  // Default border
    dark: '#87929D',     // Dark border
  }
}
```

### Typography

```typescript
// lib/constants/ui/typography.ts
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],     // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],    // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],  // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],   // 24px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  }
}
```

## Component Patterns

### Layout Components

#### Page Layout
- Consistent header height of 64px
- Sidebar width of 280px (collapsible on mobile)
- Content area with max-width of 1280px
- Responsive padding: sm:px-4 md:px-6 lg:px-8

#### Card Components
- Rounded corners (rounded-lg)
- Subtle shadows (shadow-sm)
- Consistent padding (p-4 sm:p-6)
- Hover states for interactive cards

### Navigation

#### Main Navigation
- Clear active states
- Icon + Text for items
- Collapsible sections
- Mobile-friendly drawer

#### Breadcrumbs
- Clear hierarchy
- Maximum of 3 visible items
- Truncate middle items if needed

### Forms

#### Input Fields
```typescript
// Base input styles
const inputStyles = {
  base: 'w-full rounded-md border border-border px-3 py-2 text-sm',
  focus: 'focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light',
  error: 'border-status-error focus:ring-status-error focus:border-status-error',
  disabled: 'bg-background-secondary cursor-not-allowed opacity-75'
}
```

#### Buttons
```typescript
// Button variants
const buttonVariants = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'bg-background-secondary text-secondary hover:bg-background-tertiary',
  ghost: 'hover:bg-background-secondary',
  danger: 'bg-status-error text-white hover:bg-status-error/90'
}
```

### Interactive Elements

#### Tooltips
- Show on hover after 200ms delay
- Hide on mouse leave
- Position based on available space
- Max width of 250px

#### Modals & Dialogs
- Centered on screen
- Overlay with background blur
- Close on escape key
- Close on overlay click
- Responsive sizing

### Data Display

#### Tables
- Sticky headers
- Alternating row colors
- Responsive horizontal scroll on mobile
- Row hover states

#### Lists
- Clear item separation
- Consistent spacing
- Interactive hover states
- Support for icons and badges

### Feedback & Status

#### Loading States
- Skeleton loaders for content
- Spinner for actions
- Progress bars for uploads
- Loading overlay for full-page loads

#### Notifications
- Toast messages for feedback
- Status indicators for items
- Progress indicators for long operations
- Error states with recovery actions

## Accessibility

### Focus States
- Visible focus rings on all interactive elements
- Skip to main content link
- Keyboard navigation support
- ARIA labels and roles

### Color Contrast
- Meet WCAG 2.1 AA standards
- Sufficient contrast for text
- Non-color dependent status indicators
- Dark mode support ready

### Motion & Animation
- Respect reduced motion preferences
- Subtle transitions (150-300ms)
- No purely decorative animation
- Clear loading indicators

## Responsive Design

### Breakpoints
```typescript
// lib/constants/ui/breakpoints.ts
export const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablets
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px' // Extra large screens
}
```

### Mobile Considerations
- Touch targets minimum 44x44px
- Swipe gestures where appropriate
- Collapsible navigation
- Simplified layouts for small screens

## Implementation Guidelines

### Component Structure
- Use TypeScript for all components
- Implement proper prop types
- Use composition over inheritance
- Keep components focused and small

### State Management
- Use Zustand for global UI state
- React Query for server state
- Local state for component-specific needs
- Clear loading/error states

### Performance
- Lazy load non-critical components
- Optimize images and assets
- Minimize bundle size
- Use proper memoization

### Code Organization
- Group related components
- Shared utilities in lib/utils
- Constants in lib/constants
- Types in types/ directory 