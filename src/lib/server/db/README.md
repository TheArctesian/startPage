# Database Layer Documentation

This directory contains all database-related functionality for the productivity dashboard.

## Files Overview

### `index.ts`
Database connection setup using Drizzle ORM with Neon PostgreSQL.

**Exports:**
- `db`: Configured Drizzle database instance with schema

**Dependencies:**
- Requires `DATABASE_URL` environment variable
- Uses Neon serverless driver for PostgreSQL connection

### `schema.ts`
Complete database schema definition with tables and relationships.

**Tables:**
- `projects`: Project management with colors and icons
- `tasks`: Core task entity with time/intensity tracking
- `timeSessions`: Toggl-like time tracking sessions
- `quickLinks`: Project-specific quick access links
- `tags`: Task categorization tags
- `taskTags`: Many-to-many junction table for task-tag relationships

**Key Features:**
- Time estimation vs actual tracking
- Intensity levels (1-5 scale) for effort estimation
- Kanban board support with columns and positions
- Project-based organization
- Quick links with categories (docs, tools, resources)

**Enums:**
- `taskStatusEnum`: todo, in_progress, done, archived
- `priorityEnum`: low, medium, high
- `linkCategoryEnum`: docs, tools, resources, other

## Usage

```typescript
import { db } from './index';
import { tasks, projects } from './schema';

// Query example
const allTasks = await db.select().from(tasks);

// Insert example
const newTask = await db.insert(tasks).values({
  title: 'Complete project',
  estimatedMinutes: 60,
  estimatedIntensity: 3,
  projectId: 1
});
```

## Environment Setup

Create a `.env` file with:
```
DATABASE_URL="postgres://user:password@host:port/db-name"
```

## Migration Commands

```bash
yarn db:generate  # Generate migration files
yarn db:push      # Push schema to database
yarn db:migrate   # Run migrations
yarn db:studio    # Open Drizzle Studio
```