# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Personal productivity dashboard with todo/kanban system, quick links, and statistics tracking. Built with SvelteKit, Tailwind CSS v4, Drizzle ORM, and Neon database. Follows UNIX philosophy with modular, single-responsibility components.

## Key Commands

### Development
```bash
yarn dev          # Start development server (port 5173)
yarn build        # Build for production
yarn preview      # Preview production build
yarn check        # Type checking
yarn lint         # Run prettier check
yarn format       # Auto-format code
```

### Database
```bash
yarn db:push      # Push schema changes to database
yarn db:generate  # Generate migrations
yarn db:migrate   # Run migrations
yarn db:studio    # Open Drizzle Studio
```

## Architecture

### Tech Stack
- **Frontend**: SvelteKit 2.x with Svelte 5
- **Styling**: Tailwind CSS v4 with Nord theme
- **Database**: Neon (PostgreSQL) with Drizzle ORM
- **Deployment**: Vercel

### Project Structure
```
src/
├── lib/
│   ├── server/db/    # Database schema and connections
│   ├── stores/       # Svelte stores for state management
│   ├── components/   # Reusable UI components
│   └── styles/       # Centralized styling (Nord theme)
├── routes/           # SvelteKit routes
└── app.css          # Global styles with Tailwind
```

### Design Principles
1. **UNIX Philosophy**: Each module does one thing well
2. **Nord Theme**: All colors use CSS variables from Nord palette
3. **Centralized Styling**: All CSS attributes in dedicated style files
4. **Multi-Project Support**: Handle multiple companies/projects simultaneously
5. **Unified Task System**: Todos and kanban cards share the same schema

### Database Schema Core Tables
- `projects`: Multi-company project management
- `boards`: Kanban boards per project  
- `tasks`: Unified tasks for todos and kanban
- `links`: Quick access links with categories
- `stats`: Personal productivity metrics

### Nord Color Variables
Use these CSS variables for consistent theming:
- Background: `--nord0` to `--nord3` (dark to light)
- Text: `--nord4` to `--nord6` (light shades)
- Accent: `--nord7` to `--nord10` (frost blues)
- Status: `--nord11` (error), `--nord14` (success)

### Component Conventions
- Use Tailwind classes for layout, Nord CSS variables for colors
- Keep components small and focused (UNIX philosophy)
- Store state in Svelte stores, not component state when shared
- Prefer server-side data fetching with +page.server.ts

### Environment Variables
Required in `.env`:
- `DATABASE_URL`: Neon PostgreSQL connection string