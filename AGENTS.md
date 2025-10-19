# Repository Guidelines

## Project Structure & Module Organization
- `src/routes` contains SvelteKit pages and API endpoints. Page components live alongside their `+page.server.ts` loaders, while REST-style handlers sit under `src/routes/api`.
- `src/lib` holds reusable code: domain features (`src/lib/features`), UI primitives (`src/lib/ui`), state stores (`src/lib/stores`), server utilities (`src/lib/server`), and shared types (`src/lib/types`). Favor extending these modules before adding new top-level folders.
- Persistent assets belong in `static/`; database migrations live in `migrations/` and are managed via `drizzle.config.ts`.

## Build, Test, and Development Commands
- `yarn dev` — starts the Vite dev server with hot module reloading.
- `yarn build` and `yarn preview` — produce and inspect the production bundle.
- `yarn check` or `yarn check:watch` — run SvelteKit sync plus `svelte-check` for type and template validation.
- `yarn format` / `yarn lint` — apply or verify Prettier formatting (includes Svelte and Tailwind plugins).
- `yarn db:generate`, `yarn db:push`, `yarn db:migrate`, `yarn db:studio` — manage Drizzle ORM schema and migrations.

## Coding Style & Naming Conventions
- Prettier enforces 2-space indentation and ordering rules; run `yarn format` before pushing.
- Svelte components use PascalCase filenames, stores/utilities favor camelCase, and constants stay SCREAMING_SNAKE_CASE.
- Co-locate component-specific styles in the Svelte file; shared styles belong in `src/lib/styles`.
- Keep server-only logic inside `src/lib/server` to avoid bundling secrets in the client build.

## Testing Guidelines
- Automated UI tests are not in place yet; rely on `yarn check` and targeted unit tests for utilities when adding coverage.
- When contributing tests, mirror the feature’s folder (e.g., `src/lib/utils/time.test.ts`) and use descriptive `it('handles paused timers')` phrasing.
- Document manual verification steps in your PR when touching critical routes (`src/routes/project`, `src/routes/api`).

## Commit & Pull Request Guidelines
- Prefer concise, imperative commit subjects (`Add timer pause guard`) over conversational notes seen in legacy history.
- Each PR should outline the intent, highlight migrations or breaking changes, and link the relevant issue. Include screenshots or GIFs for UI changes and note any new environment variables.
- Ensure CI prerequisites (`yarn check`, `yarn lint`, required DB migrations) succeed locally before requesting review.

## Database & Configuration Tips
- Configure environment secrets via `.env` (mirrored in `.env.example` when you add new keys). Never commit real credentials.
- Evolving the schema? Update `src/lib/types/database.ts` alongside Drizzle migrations to keep type inference current.
