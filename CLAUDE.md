# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Personal productivity dashboard with hierarchical project management, unified todo/kanban system, time tracking, and quick links. Built with SvelteKit 2.x, Svelte 5, Tailwind CSS v4, Drizzle ORM, and Neon PostgreSQL database. Follows UNIX philosophy with modular, single-responsibility components.

## Key Commands

### Development
```bash
yarn dev          # Start development server (port 5173)
yarn build        # Build for production
yarn preview      # Preview production build
yarn check        # Type checking with svelte-check
yarn lint         # Run prettier check
yarn format       # Auto-format code with prettier
```

### Database Management
```bash
yarn db:push      # Push schema changes to Neon database
yarn db:generate  # Generate Drizzle migrations
yarn db:migrate   # Run database migrations
yarn db:studio    # Open Drizzle Studio for database UI
```

## Architecture

### Tech Stack
- **Frontend**: SvelteKit 2.x with Svelte 5 (latest runes API)
- **Styling**: Tailwind CSS v4 with comprehensive Nord theme system
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Deployment**: Vercel adapter
- **Visualization**: D3.js for analytics charts

### Project Structure
```
src/
├── lib/
│   ├── server/db/    # Database schema and Neon connection
│   ├── stores/       # Svelte stores (actions, keyboard, sidebar, toasts)
│   ├── components/   # Reusable UI components organized by feature
│   │   ├── analytics/
│   │   ├── dashboard/
│   │   ├── keyboard/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── timer/
│   │   └── ui/
│   ├── styles/       # Centralized styling (Nord theme, component styles)
│   ├── types/        # TypeScript type definitions
│   └── utils/        # Utility functions (navigation, projectTree)
├── routes/           # SvelteKit routes with +page and +server files
│   ├── api/         # REST API endpoints for all entities
│   └── project/[id]/ # Dynamic project pages
└── app.css          # Global styles with Tailwind directives
```

### Design Principles
1. **UNIX Philosophy**: Each module does one thing well
2. **Nord Theme**: All colors use CSS variables from `nord-theme.css`
3. **Centralized Styling**: CSS attributes in dedicated style files
4. **Hierarchical Projects**: Support for nested project structures with parent-child relationships
5. **Unified Task System**: Single schema for todos and kanban cards with time/intensity tracking

### Database Schema Core Tables
- `projects`: Hierarchical multi-project management with parent/child relationships
- `tasks`: Unified tasks with time estimation, intensity tracking, and kanban support
- `timeSessions`: Toggl-like time tracking sessions per task
- `quickLinks`: Categorized quick access links per project
- `tags`: Flexible tagging system for tasks

Key enums:
- `task_status`: 'todo' | 'in_progress' | 'done' | 'archived'
- `priority`: 'low' | 'medium' | 'high'
- `project_status`: 'active' | 'done' | 'archived'
- `link_category`: 'docs' | 'tools' | 'resources' | 'other'

### Component Conventions
- Use Svelte 5 runes (`$state`, `$derived`, `$effect`)
- Tailwind classes for layout, Nord CSS variables for colors
- Keep components small and focused (UNIX philosophy)
- Store shared state in Svelte stores (`src/lib/stores/`)
- Prefer server-side data fetching with `+page.server.ts`
- Use TypeScript for type safety

### API Structure
All API endpoints follow RESTful conventions under `/api/`:
- `/api/projects/` - Project CRUD operations
- `/api/projects/tree/` - Hierarchical project tree data
- `/api/tasks/` - Task management with filtering
- `/api/tasks/in-progress/` - Get current active tasks
- `/api/time-sessions/` - Time tracking sessions
- `/api/quick-links/` - Quick link management

### Environment Variables
Required in `.env`:
- `DATABASE_URL`: Neon PostgreSQL connection string (format: `postgresql://user:password@host/database?sslmode=require`)

### Task Flow & Time Tracking
Tasks include both estimation and actual tracking:
- **Estimation**: `estimatedMinutes` and `estimatedIntensity` (1-5 scale)
- **Actual**: `actualMinutes` and `actualIntensity` (filled after completion)
- **Time Sessions**: Multiple start/stop sessions per task
- **Completion Flow**: Tasks moved to 'done' require actual intensity rating

### Key Features
1. **Hierarchical Project Tree**: Projects can have parent-child relationships with path tracking
2. **Time Tracking**: Toggl-like timer with sessions, manual entry support
3. **Intensity System**: 1-5 scale for effort estimation and actual tracking
4. **Quick Links Sidebar**: Categorized links per project for fast access
5. **Kanban Board**: Drag-and-drop support with column positions
6. **Analytics Dashboard**: D3.js charts for accuracy metrics and time analysis

### Testing & Development Notes
- MDSvex enabled for Markdown component support
- Prettier configured with Svelte and Tailwind plugins
- TypeScript strict mode enabled
- Drizzle Kit for database schema management
- Environment variable validation on startup