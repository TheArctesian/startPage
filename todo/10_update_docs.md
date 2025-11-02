# TODO 10 — Update Documentation

## Goal
Update CLAUDE.md and AGENTS.md to reflect the refactoring you did.

## What To Update

### 1. CLAUDE.md - Add API Wrapper Pattern

Add a new section after "Component Conventions":

```markdown
### API Wrapper Pattern
**Never make raw fetch calls in components.** Use API wrappers from `src/lib/api/`:

```typescript
// ❌ Don't do this in components
const res = await fetch('/api/tasks', { method: 'POST', body: ... });

// ✅ Do this instead
import { createTask } from '$lib/api/tasks';
const task = await createTask(data);
```

All API wrappers:
- Return typed data
- Throw on errors with descriptive messages
- Handle JSON parsing
- Located in `src/lib/api/`:
  - `projects.ts` - project CRUD and permissions
  - `tasks.ts` - task management
  - `quickLinks.ts` - quick link management
  - `timeSessions.ts` - time tracking
  - `analytics.ts` - analytics data
```

### 2. CLAUDE.md - Update Store Organization

Update the stores section:

```markdown
### Store Organization
Stores are organized by domain:
- `src/lib/stores/projectActions.ts` - project operations and state
- `src/lib/stores/taskActions.ts` - task operations and state
- `src/lib/stores/quickLinkActions.ts` - quick link operations
- `src/lib/stores/timeActions.ts` - timer operations
- `src/lib/stores/toasts.ts` - toast notifications
- `src/lib/stores/sidebar.ts` - sidebar state
- `src/lib/stores/keyboard.ts` - keyboard shortcuts

Import from specific files:
```typescript
import { loadProjects, createProject } from '$lib/stores/projectActions';
import { loadTasks, updateTask } from '$lib/stores/taskActions';
```
```

### 3. CLAUDE.md - Add Component Size Reminder

Add emphasis to the component size limit:

```markdown
### Component Size Limits
**Hard limit: 500 lines per file.** No exceptions.

If a component exceeds 500 lines:
1. Identify natural boundaries (UI sections, modals, forms)
2. Extract into smaller components
3. Use composition with props and callbacks
4. Don't create "services" or "facades" - just split the file

Example: A 1,000 line page becomes:
- `Page.svelte` (~200 lines) - orchestrates everything
- `PageHeader.svelte` (~100 lines) - header section
- `PageContent.svelte` (~300 lines) - main content
- `PageModals.svelte` (~200 lines) - modal dialogs
```

### 4. CLAUDE.md - Document Testing

Add a testing section:

```markdown
### Testing
Tests use Vitest and are colocated with source files:

```bash
yarn test              # Run all tests
yarn test:watch        # Watch mode
yarn test:ui           # Visual UI
```

**What to test:**
- ✅ Pure utility functions in `src/lib/utils/`
- ✅ API wrappers in `src/lib/api/`
- ✅ Data transformations and calculations
- ❌ Component rendering (too much setup)
- ❌ Store integration (focus on logic)

**Test file naming:**
- `src/lib/utils/date.ts` → `src/lib/utils/__tests__/date.test.ts`
- `src/lib/api/tasks.ts` → `src/lib/api/__tests__/tasks.test.ts`

Keep tests simple and focused on behavior, not implementation.
```

### 5. Update AGENTS.md

If AGENTS.md exists, update the workflow section:

```markdown
## Development Workflow

1. **Before starting:**
   - Pull latest: `git pull origin main`
   - Check types: `yarn check`
   - Run tests: `yarn test`

2. **While working:**
   - Keep components < 500 lines
   - Use API wrappers from `src/lib/api/`
   - Import from specific store files
   - Add tests for new utilities

3. **Before committing:**
   - Type check: `yarn check`
   - Run tests: `yarn test`
   - Format: `yarn format`
   - Lint: `yarn lint`

4. **Commit message format:**
   - feat: new feature
   - fix: bug fix
   - refactor: code restructuring
   - test: adding tests
   - docs: documentation updates
```

### 6. Add Refactoring Notes (Optional)

If you want to document what changed:

**`docs/refactoring-2024.md`**
```markdown
# Refactoring Summary (Nov 2024)

## What Changed
- Split files > 500 lines into smaller components
- Extracted API wrappers to `src/lib/api/`
- Organized stores by domain
- Added utility tests with Vitest

## Migration Guide

### API Calls
Before:
```typescript
const res = await fetch('/api/tasks', { ... });
const tasks = await res.json();
```

After:
```typescript
import { fetchTasks } from '$lib/api/tasks';
const tasks = await fetchTasks(projectId);
```

### Store Imports
Before:
```typescript
import { loadProjects, createTask } from '$lib/stores/actions';
```

After:
```typescript
import { loadProjects } from '$lib/stores/projectActions';
import { createTask } from '$lib/stores/taskActions';
```

### Component Structure
Large components split into:
- Page shell (orchestration)
- Feature components (sections)
- Modal components (dialogs)
- Form components (reusable forms)

See examples in `src/routes/project/[id]/` and `src/lib/features/`.
```

## What NOT To Document

- Don't document implementation details
- Don't create architecture diagrams
- Don't write a "contributor guide" if you don't have contributors
- Don't document every function - code should be self-explanatory

## Acceptance Criteria
- CLAUDE.md has API wrapper pattern
- CLAUDE.md has updated store organization
- CLAUDE.md has component size limits emphasized
- CLAUDE.md has testing section
- If AGENTS.md exists, workflow is updated
- Documentation is concise and practical

## Keep It Short
Good docs are:
- ✅ Short
- ✅ Practical
- ✅ Up to date
- ✅ Example-driven

Bad docs are:
- ❌ Long
- ❌ Theoretical
- ❌ Outdated
- ❌ Prose-heavy

Aim for good docs.
