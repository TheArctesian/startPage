# Repository Guidelines

## Project Structure & Module Organization
- SvelteKit app keeps pages, `+page.ts`, and request handlers together in `src/routes`, with RESTful endpoints in `src/routes/api`.
- Share reusable logic under `src/lib`, grouping features, UI primitives, stores, server helpers, and shared types; mirror feature folders for tests (e.g. `src/lib/features/search/search.test.ts`).
- Persist static assets in `static/`, database migrations in `migrations/`, and manage schema via `drizzle.config.ts`.
- Update `src/lib/types/database.ts` whenever migrations shift table definitions.

## Build, Test, and Development Commands
- `yarn dev` – run the Vite dev server with hot reloading mirroring production routes.
- `yarn build` then `yarn preview` – compile the production bundle and sanity-check locally.
- `yarn check` / `yarn check:watch` – run SvelteKit sync plus `svelte-check` for type and template validation.
- `yarn lint` and `yarn format` – verify or apply Prettier formatting with Svelte and Tailwind plugins.
- Database routines: `yarn db:generate`, `yarn db:push`, `yarn db:migrate`, `yarn db:studio`.

## Coding Style & Naming Conventions
- Prettier enforces two-space indentation, import ordering, and Tailwind class sorting; run `yarn format` before pushing.
- Use PascalCase for Svelte components, camelCase for stores/utilities, and SCREAMING_SNAKE_CASE for constants.
- Co-locate component styles in the `.svelte` file; put shared tokens in `src/lib/styles`. Keep server-only code inside `src/lib/server`.

## Testing Guidelines
- Lean on `yarn check` for type safety until UI automation arrives; add co-located tests as `*.test.ts` beside source files.
- Favor descriptive test names such as `it('handles paused timers')`; document manual verification for sensitive flows (`src/routes/project`, `src/routes/api`).

## Commit & Pull Request Guidelines
- Prefer imperative commit messages (`Add timer pause guard`) and keep them concise.
- PRs should state intent, note migrations or breaking changes, link issues, and include screenshots or GIFs for UI updates.
- Confirm `yarn check`, `yarn lint`, and relevant database commands succeed before requesting review.

## Security & Configuration Tips
- Store secrets in `.env` and mirror placeholders in `.env.example`; never commit real credentials.
- Centralize server integrations in `src/lib/server` to avoid leaking sensitive logic into the client bundle.
