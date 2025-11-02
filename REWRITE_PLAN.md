# Repository Refactoring Plan

This plan guides pragmatic refactoring of the startPage project. The goal is to fix actual problems, not to introduce enterprise architecture patterns.

---

## The Real Problems

Your CLAUDE.md already states components should be max 500 lines and follow UNIX philosophy (single responsibility). Many files violate this. That's the problem. Everything else is a consequence.

---

## Problem Files

| Path | LoC | What's Wrong | What To Do |
| --- | --- | --- | --- |
| `src/routes/project/[id]/+page.svelte` | 1,275 | Monolithic: data fetches, modal state, keyboard shortcuts, REST calls, 12 boolean flags, duplicated toast logic | Split into smaller components. Extract modal state to local store. Move REST calls to API wrapper functions. Move keyboard shortcuts to dedicated utility. |
| `src/lib/features/projects/modals/project-edit-modal.svelte` | 1,052 | Mixes permission management, parent lookups, API calls, form validation | Extract permission editor to separate component. Move API calls to wrapper functions. Share validation logic. |
| `src/lib/features/projects/quick-links.svelte` | 894 | Mutates global stores, makes REST calls, hardcodes metadata, mixes presentation and data logic | Move CRUD operations to `src/lib/api/quickLinks.ts`. Keep component purely presentational. |
| `src/lib/features/analytics/analytics-dashboard.svelte` | 722 | Builds queries client-side, fetches multiple endpoints, mixes layout and data processing | Extract data fetching to load functions. Create smaller chart components that receive props. |
| `src/lib/features/analytics/reports-view.svelte` | 948 | 300+ lines of D3 manipulations mixed with modal plumbing | Extract report calculations to `src/lib/utils/analytics.ts`. Component just renders the results. |
| `src/lib/features/tasks/task-list-view.svelte` | 912 | Filter logic, drag-drop state, analytics fetch, view switching all in one file | Split into TaskList, TaskFilters, and TaskDnD components. Extract filter state to local store. |
| `src/lib/features/tasks/task-form.svelte` | 696 | Directly mutates global stores, owns validation, can't be reused | Share validation schema. Move API calls to wrapper functions. |
| `src/lib/stores/actions.ts` | 538 | Catch-all dumping ground for everything | Split into domain files: `projectActions.ts`, `taskActions.ts`, `timeActions.ts`, `linkActions.ts` |
| `src/lib/server/repositories/implementations/drizzle-project.repository.ts` | 560 | Mixes SQL, DTO mapping, tree traversal | Extract tree building to `src/lib/utils/projectTree.ts` (already exists, consolidate with it). Separate data mappers if needed. |

Other problem areas:
- `src/lib/features/tasks/tasks-view.svelte` - likely also too large
- Modal folder has duplicate modal frameworks - consolidate
- `src/lib/stores/index.ts` - debug logging and loose equality checks

---

## Refactoring Strategy

### 1. Split Large Files
**Goal:** No file over 500 lines

**Approach:**
- Identify natural boundaries (UI sections, data concerns, modal dialogs)
- Extract components using composition
- Example: `ProjectWorkspace.svelte` (shell) + `ProjectHeader.svelte` + `ProjectContent.svelte` + `ProjectModals.svelte`
- Keep existing functionality - just reorganize

**Component contracts**
```svelte
<!-- src/lib/features/projects/ProjectWorkspaceShell.svelte -->
export let snapshot: ProjectWorkspaceSnapshot;
export let onOpenModal: (modal: 'newTask' | 'editTask' | 'analytics' | 'reports' | 'quickLink') => void;
export let onCloseModal: () => void;

<!-- src/lib/features/projects/ProjectHeader.svelte -->
export let project: ProjectWithDetails;
export let permissions: { canEdit: boolean; level: PermissionLevel | 'admin' };
export let onEditProject: () => void;
export let onNavigate: (projectId: number) => void;

<!-- src/lib/features/tasks/TaskBoard.svelte -->
export let viewModel: TaskBoardViewModel;
export let onStatusChange: (taskId: number, status: TaskStatus) => void;
export let onEditTask: (taskId: number) => void;
export let onDeleteTask: (taskId: number) => void;

<!-- src/lib/features/projects/ProjectModals.svelte -->
export let modalState: {
  active: 'none' | 'newTask' | 'editTask' | 'completeTask' | 'analytics' | 'reports' | 'quickLink';
  taskId?: number;
  quickLinkId?: number;
};
export let snapshot: ProjectWorkspaceSnapshot;
export let closeModal: () => void;
```
Every extracted component must stick to these inputs/outputs so tests can stub them easily.

**Start with:** `src/routes/project/[id]/+page.svelte` - this is the worst offender

### 2. Organize Stores
**Goal:** Domain-specific store files instead of one dumping ground

**Approach:**
- Split `src/lib/stores/actions.ts` by domain:
  - `src/lib/stores/projectActions.ts` - project CRUD
  - `src/lib/stores/taskActions.ts` - task operations
  - `src/lib/stores/timeActions.ts` - timer controls
  - `src/lib/stores/linkActions.ts` - quick link operations
- Keep the same patterns (stores + action functions)
- No architecture changes, just organization

**Required exports**
```ts
// src/lib/stores/projectActions.ts
export async function loadProjects(opts?: { includeStats?: boolean }): Promise<ProjectWithDetails[]>;
export async function createProject(payload: NewProject): Promise<Project>;
export async function updateProject(id: number, payload: Partial<Project>): Promise<Project>;
export async function deleteProject(id: number): Promise<void>;
export async function setActiveProject(projectId: number): Promise<void>;

// src/lib/stores/taskActions.ts
export async function loadTasks(projectId?: number): Promise<TaskWithDetails[]>;
export async function createTask(payload: TaskFormData): Promise<TaskWithDetails>;
export async function updateTask(id: number, payload: Partial<TaskFormData>): Promise<TaskWithDetails>;
export async function deleteTask(id: number): Promise<void>;
export async function changeTaskStatus(id: number, status: TaskStatus): Promise<TaskWithDetails>;

// src/lib/stores/linkActions.ts
export async function loadQuickLinks(projectId: number): Promise<QuickLink[]>;
export async function createQuickLink(payload: NewQuickLink): Promise<QuickLink>;
export async function updateQuickLink(id: number, payload: Partial<QuickLinkFormData>): Promise<QuickLink>;
export async function deleteQuickLink(id: number): Promise<void>;
```
Each module must also export the writable stores it owns (e.g. `export const projectList = writable<ProjectWithDetails[]>([])`) so consumers know the single source of truth.

### 3. Extract API Wrappers
**Goal:** Don't make fetch calls directly in components

**Approach:**
- Create `src/lib/api/` directory with:
  - `src/lib/api/projects.ts` - project endpoints
  - `src/lib/api/tasks.ts` - task endpoints
  - `src/lib/api/timeSessions.ts` - timer endpoints
  - `src/lib/api/quickLinks.ts` - link endpoints
- These are just thin wrappers that return typed responses
- Components call these instead of raw fetch

**Example:**
```typescript
// src/lib/api/tasks.ts
export async function updateTask(id: number, data: Partial<Task>) {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}
```

**Required API surface**
```ts
// src/lib/api/projects.ts
export async function fetchProjects(params?: { stats?: boolean }): Promise<ProjectWithDetails[]>;
export async function fetchProject(id: number): Promise<ProjectWithDetails>;
export async function postProject(payload: NewProject): Promise<Project>;
export async function putProject(id: number, payload: Partial<Project>): Promise<Project>;
export async function deleteProject(id: number): Promise<void>;
export async function fetchProjectUsers(id: number): Promise<ProjectUserWithDetails[]>;
export async function addProjectUser(id: number, payload: { email: string; permission: PermissionLevel }): Promise<void>;
export async function removeProjectUser(id: number, userId: number): Promise<void>;

// src/lib/api/tasks.ts
export async function fetchTasks(params?: { projectId?: number; details?: boolean }): Promise<TaskWithDetails[]>;
export async function postTask(payload: TaskFormData): Promise<TaskWithDetails>;
export async function putTask(id: number, payload: Partial<TaskFormData>): Promise<TaskWithDetails>;
export async function patchTaskStatus(id: number, status: TaskStatus): Promise<TaskWithDetails>;
export async function deleteTask(id: number): Promise<void>;

// src/lib/api/quickLinks.ts
export async function fetchQuickLinks(projectId: number): Promise<QuickLink[]>;
export async function postQuickLink(payload: NewQuickLink): Promise<QuickLink>;
export async function putQuickLink(id: number, payload: Partial<QuickLinkFormData>): Promise<QuickLink>;
export async function deleteQuickLink(id: number): Promise<void>;
```
Each wrapper must throw on non-2xx status with a meaningful error message so components can surface it via toasts.

### 4. Consolidate Common Patterns
**Goal:** Remove duplication

**Approach:**
- Create base modal component with slots for reuse
- Extract shared form validation to `src/lib/utils/validation.ts`
- Consolidate toast logic (already using a store, but usage is duplicated)
- Share modal state patterns (open/close handlers)

### 5. Add Testing Gradually
**Goal:** Tests for new code and refactored modules

**Approach:**
- Add Vitest to project
- Start with utility functions (already pure and testable):
  - `src/lib/utils/date.ts`
  - `src/lib/utils/time.ts`
  - `src/lib/utils/task.ts`
- Add component tests as you split files
- Don't aim for 100% coverage - just test critical logic

### 6. Improve Existing Documentation
**Goal:** Make CLAUDE.md even better

**Approach:**
- Add section on API wrapper pattern
- Document store organization conventions
- Add examples of good component composition
- Keep it practical and concise

---

## Implementation Order

### Priority 1: Large Files
These violate your stated 500-line limit and make everything harder:
1. `src/routes/project/[id]/+page.svelte` (1,275 lines)
2. `src/lib/features/projects/modals/project-edit-modal.svelte` (1,052 lines)
3. `src/lib/features/analytics/reports-view.svelte` (948 lines)
4. `src/lib/features/tasks/task-list-view.svelte` (912 lines)
5. `src/lib/features/projects/quick-links.svelte` (894 lines)

Split these first. Everything else gets easier.

### Priority 2: Store Organization
Split `src/lib/stores/actions.ts` into domain files. This makes it obvious where to add new functionality.

### Priority 3: API Wrappers
Create the `src/lib/api/` directory and move fetch calls out of components. Do this as you touch files, not all at once.

### Priority 4: Common Patterns
Create shared modal and form utilities after you've refactored a few modals and seen the patterns.

### Priority 5: Testing
Add Vitest and write tests as you refactor modules. Start with utilities.

---

## Rules

1. **Incremental:** Refactor one file at a time. Commit often. Keep main working.
2. **No rewrites:** Split and extract, don't rebuild from scratch.
3. **No new patterns:** Use existing Svelte stores, SvelteKit conventions, and Drizzle patterns.
4. **Test as you go:** Add tests for refactored modules, but don't block on full coverage.
5. **Update docs:** Keep CLAUDE.md in sync with new conventions.

---

## Success Criteria

- No file over 500 lines
- `stores/actions.ts` split into focused domain files
- Components use API wrappers instead of raw fetch
- At least one shared modal component
- Tests exist for utility functions
- CLAUDE.md documents new patterns

---

## What This Plan DOESN'T Include

No service layers. No dependency inversion. No abstract repositories. No domain entities. No use cases. No infrastructure adapters. No composition roots. No legacy shims. No architectural diagrams. No ADRs. No "phases."

Just pragmatic refactoring of code that's currently too large.
