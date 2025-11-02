# TODO 09 — Add Tests

## Goal
Test the code you refactored. Start with utils, then API wrappers.

## What To Test
**Only test the new code from TODOs 01-08.** Don't try to test everything.

### 1. Setup Vitest

Install dependencies:
```bash
yarn add -D vitest @vitest/ui @testing-library/svelte jsdom
```

**`vitest.config.ts`**
```typescript
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@vite/plugin-svelte';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    globals: true,
    environment: 'jsdom'
  }
});
```

**`package.json`** - add scripts:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

### 2. Test Utility Functions

These are pure functions - easiest to test.

**`src/lib/utils/__tests__/date.test.ts`**
```typescript
import { describe, it, expect } from 'vitest';
import { formatDueDate, formatRelativeTime } from '../date';

describe('formatDueDate', () => {
  it('shows "Today" for today', () => {
    const today = new Date();
    expect(formatDueDate(today)).toContain('Today');
  });

  it('shows "Tomorrow" for tomorrow', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(formatDueDate(tomorrow)).toContain('Tomorrow');
  });

  it('shows "Overdue" for past dates', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatDueDate(yesterday)).toContain('Overdue');
  });
});
```

**`src/lib/utils/__tests__/time.test.ts`**
```typescript
import { describe, it, expect } from 'vitest';
import { formatTime, calculateTimeSpent } from '../time';

describe('formatTime', () => {
  it('formats minutes correctly', () => {
    expect(formatTime(0)).toBe('0m');
    expect(formatTime(30)).toBe('30m');
    expect(formatTime(60)).toBe('1h');
    expect(formatTime(90)).toBe('1h 30m');
    expect(formatTime(150)).toBe('2h 30m');
  });
});

describe('calculateTimeSpent', () => {
  it('sums time sessions', () => {
    const task = {
      timeSessions: [
        { startedAt: '2024-01-01T10:00:00Z', endedAt: '2024-01-01T10:30:00Z' },
        { startedAt: '2024-01-01T14:00:00Z', endedAt: '2024-01-01T15:00:00Z' }
      ]
    };
    expect(calculateTimeSpent(task)).toBe(90); // 30 + 60 minutes
  });
});
```

**If you did TODO 05**, test analytics calculations:

**`src/lib/utils/analytics/__tests__/calculations.test.ts`**
```typescript
import { describe, it, expect } from 'vitest';
import { calculateDailyStats, calculateIntensityDistribution } from '../calculations';

describe('calculateDailyStats', () => {
  it('aggregates tasks by date', () => {
    const data = {
      tasks: [
        { status: 'done', completedAt: '2024-01-01T10:00:00Z', actualMinutes: 30 },
        { status: 'done', completedAt: '2024-01-01T14:00:00Z', actualMinutes: 45 }
      ],
      timeSessions: [],
      dateRange: { start: new Date('2024-01-01'), end: new Date('2024-01-02') }
    };

    const result = calculateDailyStats(data);

    expect(result[0].date).toBe('2024-01-01');
    expect(result[0].tasksCompleted).toBe(2);
    expect(result[0].minutesTracked).toBe(75);
  });
});

describe('calculateIntensityDistribution', () => {
  it('counts tasks by intensity', () => {
    const tasks = [
      { status: 'done', actualIntensity: 3 },
      { status: 'done', actualIntensity: 5 },
      { status: 'done', actualIntensity: 3 },
      { status: 'todo', actualIntensity: null }
    ];

    const result = calculateIntensityDistribution(tasks);

    expect(result[3]).toBe(2);
    expect(result[5]).toBe(1);
  });
});
```

### 3. Test API Wrappers

Mock fetch to test API wrappers.

**`src/lib/api/__tests__/projects.test.ts`**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchProjects, createProject, updateProject } from '../projects';

describe('projects API', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = vi.fn();
  });

  it('fetchProjects calls correct endpoint', async () => {
    const mockProjects = [{ id: 1, name: 'Test' }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockProjects
    });

    const result = await fetchProjects();

    expect(fetch).toHaveBeenCalledWith('/api/projects');
    expect(result).toEqual(mockProjects);
  });

  it('fetchProjects with stats includes query param', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => []
    });

    await fetchProjects(true);

    expect(fetch).toHaveBeenCalledWith('/api/projects?stats=true');
  });

  it('createProject sends POST request', async () => {
    const newProject = { name: 'New', description: 'Test' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, ...newProject })
    });

    await createProject(newProject);

    expect(fetch).toHaveBeenCalledWith('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProject)
    });
  });

  it('throws on non-2xx response', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404
    });

    await expect(fetchProjects()).rejects.toThrow('Failed to fetch projects: 404');
  });
});
```

**Do similar tests for tasks, quickLinks, timeSessions API wrappers.**

### 4. Test Validation (If You Extracted It)

**If you did TODO 08** and created shared validation:

**`src/lib/utils/__tests__/validation.test.ts`**
```typescript
import { describe, it, expect } from 'vitest';
import { validateRequired, validateEmail, validateUrl, validateLength } from '../validation';

describe('validateRequired', () => {
  it('returns error for empty string', () => {
    expect(validateRequired('', 'Name')).toBe('Name is required');
    expect(validateRequired('  ', 'Name')).toBe('Name is required');
  });

  it('returns null for valid string', () => {
    expect(validateRequired('test', 'Name')).toBeNull();
  });
});

describe('validateEmail', () => {
  it('returns error for invalid email', () => {
    expect(validateEmail('notanemail')).toBeTruthy();
    expect(validateEmail('')).toBeTruthy();
  });

  it('returns null for valid email', () => {
    expect(validateEmail('test@example.com')).toBeNull();
  });
});
```

### 5. Don't Test Everything

**Don't test:**
- Svelte components (yet) - too much setup
- Store actions (integration tests, not unit tests)
- Server-side code (different test setup)
- UI interactions (unless you really want to)

**Do test:**
- Pure utility functions
- API wrappers
- Validation logic
- Data transformations

## Acceptance Criteria
- Running `yarn test` works
- Tests for date, time, task utils pass
- Tests for API wrappers pass
- If you extracted calculations (TODO 05), tests for those pass
- If you extracted validation (TODO 08), tests for that pass
- At least 20 tests total

## Run Tests
```bash
yarn test              # Run once
yarn test:watch        # Watch mode
yarn test:ui           # Visual UI
```

Add to your workflow:
```bash
# Before committing
yarn check    # Type checking
yarn test     # Run tests
yarn lint     # Prettier
```

## Coverage
Don't aim for 100%. Aim for:
- ✅ All pure utility functions tested
- ✅ All API wrappers tested
- ✅ Critical business logic tested
- ❌ Component rendering not tested (yet)
- ❌ Edge cases in UI not tested (yet)

That's good enough.
