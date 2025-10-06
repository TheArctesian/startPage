# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Personal productivity dashboard with hierarchical project management, unified todo/kanban system, time tracking, and quick links. Built with SvelteKit 2.x, Svelte 5, Tailwind CSS v4, Drizzle ORM, and Neon PostgreSQL database. Follows UNIX philosophy with modular, single-responsibility components.

**Recent Updates:**
- Authentication system with user management and permissions
- PWA support with manifest, service worker, and app icons  
- Enhanced task management with improved type safety
- Timer system improvements and bug fixes
- UI refinements and component modularization

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
│   ├── server/
│   │   ├── auth.ts          # Authentication utilities
│   │   ├── auth-guard.ts    # Route protection
│   │   ├── permissions.ts   # User permission system
│   │   └── db/             # Database schema and Neon connection
│   ├── stores/             # Svelte stores (actions, keyboard, sidebar, toasts, timers)
│   ├── components/         # Reusable UI components organized by feature
│   │   ├── analytics/      # D3.js charts and reporting
│   │   ├── base/          # Base UI components (Badge, Button, Card, etc.)
│   │   ├── dashboard/     # Main dashboard components
│   │   ├── keyboard/      # Keyboard shortcuts help
│   │   ├── layout/        # Layout components
│   │   ├── projects/      # Project management UI
│   │   ├── tasks/         # Task and kanban components
│   │   ├── timer/         # Time tracking components
│   │   └── ui/            # Generic UI components (Modal, Icon, etc.)
│   ├── styles/            # Centralized styling (Nord theme, component styles)
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions organized by domain
│       ├── date.ts           # Date formatting and due date utilities
│       ├── time.ts           # Time calculations and formatting
│       ├── task.ts           # Task status/priority configurations
│       ├── logger.ts         # Centralized logging system
│       ├── navigation.ts     # Navigation utilities
│       └── projectTree.ts    # Project tree utilities
├── routes/                # SvelteKit routes with +page and +server files
│   ├── api/              # REST API endpoints for all entities
│   │   ├── admin/        # Administrative API routes
│   │   ├── projects/     # Project CRUD and tree operations
│   │   ├── tasks/        # Task management with completion flow
│   │   ├── time-sessions/ # Time tracking session management
│   │   ├── quick-links/  # Quick link management
│   │   └── users/        # User management
│   ├── admin/            # Administrative interface
│   ├── login/            # Authentication pages
│   ├── signup/           # User registration
│   ├── pending-approval/ # User approval workflow
│   └── project/[id]/     # Dynamic project pages
└── app.css               # Global styles with Tailwind directives
static/                   # PWA assets (manifest, icons, service worker)
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
- **Keep components small and focused (UNIX philosophy)**
- **Maximum 500 lines per file** - split larger components into smaller ones
- Store shared state in Svelte stores (`src/lib/stores/`)
- Prefer server-side data fetching with `+page.server.ts`
- Use TypeScript for type safety
- **Always import utilities instead of duplicating code**:
  - `import { formatTime } from '$lib/utils/time'`
  - `import { formatDueDate } from '$lib/utils/date'`
  - `import { statusConfig } from '$lib/utils/task'`
  - `import { logger } from '$lib/utils/logger'`

### Utility Modules
**Date Utilities** (`src/lib/utils/date.ts`):
- `formatDueDate(date)` - Formats due dates with urgency indicators
- `formatRelativeTime(date)` - Human-readable time differences
- `formatDateDisplay(date)` - Consistent date display formatting

**Time Utilities** (`src/lib/utils/time.ts`):
- `formatTime(minutes)` - Convert minutes to "2h 30m" format
- `calculateTimeSpent(task)` - Calculate total time from sessions
- `calculateTimeProgress(task)` - Progress percentage vs estimates

**Task Utilities** (`src/lib/utils/task.ts`):
- `statusConfig` - Status configurations (colors, icons, labels)
- `priorityConfig` - Priority configurations 
- `getPriorityColor(priority)` - Priority-specific colors

**Logger Utilities** (`src/lib/utils/logger.ts`):
- `logger.debug/info/warn/error()` - Centralized logging
- `storeLogger`, `apiLogger`, `componentLogger` - Context-specific loggers
- **Never use console.log directly** - always use logger utilities

### Component Composition Patterns
**TaskCard Example** (split into smaller components):
- `TaskCardDisplay.svelte` - Visual presentation only
- `TaskCardActions.svelte` - Action buttons and handlers  
- `TaskCardDraggable.svelte` - Drag/drop functionality wrapper
- `TaskCard.svelte` - Main component composing the above

**Modal Patterns**:
- `BaseModal.svelte` - Generic modal wrapper
- `FormModal.svelte` - Form-specific modal with submit/cancel
- Never create modal components > 300 lines - use composition

### API Structure
All API endpoints follow RESTful conventions under `/api/`:
- `/api/projects/` - Project CRUD operations with user permissions
- `/api/projects/tree/` - Hierarchical project tree data
- `/api/projects/[id]/users/` - Project user management and permissions
- `/api/tasks/` - Task management with filtering and user context
- `/api/tasks/[id]/complete/` - Task completion with intensity tracking
- `/api/tasks/in-progress/` - Get current active tasks per user
- `/api/time-sessions/` - Time tracking sessions with start/stop endpoints
- `/api/time-sessions/active/` - Active timer management
- `/api/quick-links/` - Quick link management per project
- `/api/users/` - User management and registration
- `/api/admin/users/` - Administrative user operations

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
7. **Authentication System**: User registration, login, and permission-based access
8. **PWA Support**: Progressive Web App with offline capabilities, app icons, and service worker
9. **Multi-Timer System**: Simultaneous task timing with floating timer widgets
10. **Admin Interface**: User management and approval workflow for new registrations

### Testing & Development Notes
- MDSvex enabled for Markdown component support
- Prettier configured with Svelte and Tailwind plugins
- TypeScript strict mode enabled
- Drizzle Kit for database schema management
- Environment variable validation on startup
- PWA manifest and service worker configured for offline support
- Authentication middleware protects routes and API endpoints
- Component composition patterns maintain UNIX philosophy (small, focused modules)