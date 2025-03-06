# AutoCRM - Customer Support & Ticketing Platform

AutoCRM is a modern customer support system designed to manage tickets, facilitate real-time messaging, and streamline support workflows. Built with Next.js 15 and Supabase, it provides a comprehensive platform for customers, agents, and administrators.

## 🚀 Key Features

- **Ticket Management**: Create, track, and resolve customer support tickets
- **Real-time Messaging**: Chat between customers and support agents
- **Role-based Access**: Separate interfaces for customers, agents, and admins
- **Knowledge Base**: Resources to help customers find answers quickly
- **Team Management**: Organize agents into departments and teams
- **Performance Analytics**: Track support metrics and team performance

## 💻 Tech Stack

- **Frontend**: Next.js 15 with App Router and React Server Components
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **State Management**: Zustand and React Query
- **Realtime**: WebSockets / Supabase Realtime
- **Testing**: Playwright for E2E, Jest for unit tests

## 🏗️ Project Structure

```
├── app/                  # Next.js App Router
│   ├── (admin)/          # Admin-specific routes
│   ├── (agent)/          # Agent-specific routes
│   ├── (auth)/           # Authentication routes
│   ├── (dashboard)/      # Customer dashboard routes
│   ├── (marketing)/      # Public marketing pages
│   ├── (public)/         # Public-facing routes
│   ├── api/              # API routes
│   └── _lib/             # Server-only code
├── components/           # React components
│   ├── shared/           # Shared UI components
│   ├── features/         # Feature-specific components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility functions and helpers
├── hooks/                # Custom React hooks
├── public/               # Static assets
├── supabase/             # Supabase configuration and migrations
├── types/                # TypeScript type definitions
└── ProjectDocs/          # Project documentation
```

## 🔧 Development Setup

### Prerequisites

- Node.js 18+ and npm
- Supabase account and CLI

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/your-username/autocrm.git
   cd autocrm
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Set up environment variables:
   ```sh
   cp .env.example .env
   # Fill in the required values in .env
   ```

4. Start the development server:
   ```sh
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view the application.

### Supabase Setup

1. Install the Supabase CLI:
   ```sh
   npm install -g supabase
   ```

2. Link your Supabase project:
   ```sh
   supabase login
   supabase link --project-ref <your-project-id>
   ```

3. Generate TypeScript types:
   ```sh
   npm run db:types
   ```

## 🧪 Testing

- Run end-to-end tests:
  ```sh
  npm run test:e2e
  ```

- Run end-to-end tests with UI:
  ```sh
  npm run test:e2e:ui
  ```

- Run unit tests:
  ```sh
  npm run test:unit
  ```

## 📚 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Lint codebase
- `npm run db:push` - Push database changes to Supabase
- `npm run db:pull` - Pull database schema from Supabase
- `npm run db:types` - Generate TypeScript types from Supabase schema
- `npm run seed` - Seed the database with test data

## 🧩 Project Structure Details

### Role-Based Routes

- **(admin)/** - Admin dashboard, user management, system settings
- **(agent)/** - Agent workspace, ticket management, customer interactions
- **(auth)/** - Authentication pages (login, register, password reset)
- **(dashboard)/** - Customer dashboard, ticket creation and tracking
- **(marketing)/** - Public marketing pages, landing page
- **(public)/** - Other public-facing pages

### Key Components

- **TicketDetail** - Displays ticket information and conversation history
- **TicketQueue** - Agent-facing ticket management with filters
- **TeamOverview** - Admin page for team performance tracking
- **KnowledgeBase** - Customer-facing resources and articles

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Commit your changes: `git commit -m 'feat: add some feature'`
3. Push to the branch: `git push origin feature/your-feature-name`
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
