# Customer Portal - Phase 2 Layout Design
Created: 2024-01-21

## Task Objective
Design and implement the layout for Phase 2 components, starting with the ticket creation flow and establishing a consistent structure for knowledge base, feedback, and chat features.

## Current State Assessment
- Phase 1 completed with ticket list and detail views
- Need to design cohesive layouts for new features
- Must maintain mobile responsiveness and accessibility

## Future State Goal
- Intuitive multi-step ticket creation flow
- Seamless integration of knowledge base
- Unified feedback collection interface
- Accessible chat widget

## Implementation Plan

### 1. Package Setup
```bash
# Form management and validation
npm install react-hook-form zod @hookform/resolvers/zod

# Rich text editor
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit

# File upload
npm install @uploadthing/react @uploadthing/next
```

### 2. Layout Structure

#### A. Ticket Creation Flow
```typescript
// Component structure
app/
  tickets/
    new/
      page.tsx              // Container for ticket creation
      _components/
        ticket-form/
          layout.tsx        // Multi-step form layout
          steps/
            basic-info.tsx  // Step 1: Title, description, category
            attachments.tsx // Step 2: File uploads
            priority.tsx    // Step 3: Priority and additional details
          progress.tsx      // Step progress indicator
          navigation.tsx    // Next/back navigation
          summary.tsx       // Final review step
```

#### B. Knowledge Base Layout
```typescript
app/
  knowledge-base/
    page.tsx               // KB home with categories
    categories/
      [id]/
        page.tsx          // Category articles list
    articles/
      [id]/
        page.tsx         // Article detail view
    _components/
      article-editor/    // Rich text editor
      search-bar/       // Search functionality
      category-tree/    // Navigation structure
```

#### C. Feedback System Layout
```typescript
components/
  feedback/
    satisfaction-survey/  // Ticket feedback
    article-feedback/    // KB article feedback
    comment-thread/     // Discussion system
    analytics/         // Feedback dashboard
```

#### D. Chat Widget Layout
```typescript
components/
  chat/
    widget/
      container.tsx    // Main chat widget
      header.tsx      // Status and controls
      messages.tsx    // Message thread
      input.tsx      // Message input with attachments
    availability.tsx  // Agent status indicator
```

### 3. Implementation Steps

#### A. Ticket Creation Flow
- [ ] Create form layout with step indicator
  - [ ] Responsive container with max-width
  - [ ] Progress bar or stepper
  - [ ] Step navigation
- [ ] Implement form steps
  - [ ] Basic information with rich text
  - [ ] File upload with preview
  - [ ] Priority and category selection
- [ ] Add form validation
  - [ ] Zod schema for each step
  - [ ] Error handling and display
- [ ] Create draft saving system
  - [ ] Auto-save functionality
  - [ ] Draft restoration

#### B. Knowledge Base Structure
- [ ] Design category navigation
- [ ] Create article editor layout
- [ ] Implement search interface
- [ ] Add version history UI

#### C. Feedback Components
- [ ] Design survey modal
- [ ] Create rating component
- [ ] Implement comment system
- [ ] Build analytics dashboard

#### D. Chat Interface
- [ ] Design floating chat widget
- [ ] Create message thread layout
- [ ] Add file sharing UI
- [ ] Implement status indicators

## Technical Considerations
- Use CSS Grid for complex layouts
- Implement proper form state management
- Ensure keyboard navigation
- Handle loading and error states
- Support dark mode
- Maintain accessibility standards

## Component Styling
```typescript
// Base styles for layouts
const layoutStyles = {
  container: 'max-w-3xl mx-auto p-6 space-y-8',
  card: 'rounded-lg border bg-card p-6',
  form: 'space-y-6',
  step: 'grid gap-4',
  navigation: 'flex justify-between mt-8',
}

// Form step transitions
const stepTransition = {
  enter: 'transition-opacity duration-300 ease-in-out',
  enterFrom: 'opacity-0',
  enterTo: 'opacity-100',
  leave: 'transition-opacity duration-300 ease-in-out',
  leaveFrom: 'opacity-100',
  leaveTo: 'opacity-0',
}
```

## Success Metrics
- Smooth step transitions
- No layout shifts during form progression
- Mobile-responsive at all breakpoints
- Passes accessibility audit
- Performance budget maintained

## Dependencies
- Next.js App Router
- Shadcn UI components
- TipTap editor
- UploadThing configuration
- Zod schemas

## Notes
- Consider using React.Suspense for code splitting
- Implement proper error boundaries
- Add loading skeletons for each step
- Consider adding form analytics
- Plan for i18n support 