# AGENTS.md

## Repo shape

- pnpm workspace (`pnpm-workspace.yaml` → `apps/*`), single git repo at the root. Course sandbox for Alura's AI-Native Software Engineering; no business domain implemented yet.
- `apps/web` — React 19 + Vite 8, **plain JavaScript** (no TypeScript).
- `apps/api` — NestJS 12, TypeScript in **ESM** mode, tests on Vitest.
- `Setup/` — course study material (AI model concepts), not application code. Don't import or "fix" it.
- There is **no integration yet**: web does not call the API, and the API has no CORS or Vite proxy configured.

## Commands

Run from the repo root. `pnpm web <cmd>` and `pnpm api <cmd>` forward any command to the given app.

| Goal | Command |
|---|---|
| Both dev servers | `pnpm dev` |
| Web only (5173) / API only (3000) | `pnpm dev:web` / `pnpm dev:api` |
| One API unit test | `pnpm api test src/app.controller.spec.ts` |
| One web component test (after setup) | `pnpm web test src/components/atoms/Button.test.jsx` |
| Unit tests in watch mode | `pnpm api test:watch` |
| API e2e tests | `pnpm api test:e2e` |
| Lint all / build all | `pnpm lint` / `pnpm build` |

- Root `pnpm test` runs `vitest run` and matches only `**/*.spec.ts`; e2e (`test/**/*.e2e-spec.ts`) needs `pnpm api test:e2e`.
- API port honors `PORT` (default 3000).

## Windows: pnpm.exe is blocked on this machine

Device Guard / Application Control blocks `pnpm.exe`, so every `pnpm` invocation fails with *"política de Controle de Aplicativo bloqueou este arquivo"* (exit 4551). The pnpm copy at `%LOCALAPPDATA%\pnpm\.tools` is blocked too.

Working alternatives (verified). Run each from its own app directory — both Vite and Nest resolve their config from the current directory:

```powershell
cd apps/web; node node_modules/vite/bin/vite.js
cd apps/api; node node_modules/@nestjs/cli/bin/nest.js start --watch
```

To run package scripts, use a JS build of pnpm: `npm pack pnpm@10.18.3`, extract, then `node <dir>/package/bin/pnpm.cjs <script>`. Root scripts that call `pnpm` internally (`dev:api`, `dev:web`, `test`, `lint`) still fail under that workaround — invoke the inner command instead, e.g. `node <dir>/package/bin/pnpm.cjs --filter api start:dev`. Report the block instead of editing scripts or reinstalling pnpm unless asked.

## API conventions (`apps/api`)

- ESM: relative imports must end in `.js` (e.g. `./app.module.js`) even in `.ts` files; no `__dirname` (use `import.meta.dirname`).
- Vitest, not Jest: globals are enabled and `vi.fn()` replaces jest mocks. `vitest.config.ts` handles `*.spec.ts` (colocated with source); `vitest.config.e2e.ts` handles `test/*.e2e-spec.ts` via supertest.
- `nest build` emits to `dist/` with `deleteOutDir` and excludes specs; `start:prod` = `node dist/main`.
- Read `apps/api/AGENTS.md` **before adding libraries**. Nest 12 is newer than most training data (docs index: `https://docs.nestjs.com/llms.txt`), prefer first-party packages, and validation uses Standard Schema (`StandardSchemaValidationPipe`) rather than class-validator.
- NestJS Observe telemetry is not wired (`ObserveModule` is absent), so no production traces/logs are available.

### REST contract

Every new endpoint must follow REST, not RPC:

- Resource-oriented, plural-noun URLs (`/users`, `/users/:id`); no verbs in paths (`/getUsers`, `/users/create`). Nest at most one sub-resource (`/users/:id/orders`).
- Map CRUD to methods and status codes: `GET` 200 (404 when missing), `POST` 201 + `Location` header, `PUT` full replace 200/204, `PATCH` partial update 200/204, `DELETE` 204. Never return 200 with an error body.
- Validate at the boundary (DTOs + Standard Schema) and use one error shape for all non-2xx responses (e.g. RFC 9457 `application/problem+json`).
- DTOs are the public contract: never expose persistence entities directly.
- Pagination, filtering and sorting go through query params (`?page=&limit=&sort=`), not the body or path segments.
- Keep handlers stateless; `GET`, `PUT` and `DELETE` must be idempotent.

## Web conventions (`apps/web`)

- JavaScript + JSX only; Vite uses `@vitejs/plugin-react` (Oxc). Don't introduce TypeScript without being asked.
- **Atomic Design** lives in `src/components/{atoms,molecules,organisms,templates}` plus `src/pages`. Dependencies point one way only — atoms → molecules → organisms → templates → pages; never import upward.
  - atoms: presentational and domain-agnostic (no data fetching); molecules compose atoms; organisms own domain behavior; templates define layout/slots; pages wire data and compose templates.
- **Tailwind CSS** is the styling system (not installed yet — add it with the Vite plugin when the first UI task starts). Style with utility classes in JSX; no CSS-in-JS, per-component CSS files, or ad-hoc `style` props. Global CSS is only for reset/tokens.
- Every component must ship with a test covering its essential usage (renders with key props + main interaction), colocated as `Component.test.jsx`. Assert behavior, not markup snapshots.
- No web test runner exists yet: when the first component is created, add Vitest + `@testing-library/react` (jsdom) and a `test` script so root `pnpm test` also covers web.
- oxlint only (`react/rules-of-hooks` is an error).

## Git conventions

- One repository at the root; never run `git init` inside `apps/*`.
- Use **Conventional Commits** for both apps: `<type>(<scope>): <subject>`, e.g. `feat(web): add button atom`, `fix(api): return 404 when user is missing`.
  - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
  - Scope is `web` or `api`; omit it for repo-wide changes. Subject is imperative, lowercase, in English (matches existing history), with no trailing period.
  - Use the body to explain *why* when it is not obvious; breaking changes go in a `BREAKING CHANGE:` footer.
- One logical change per commit; don't mix web and api changes.
- No commit hooks or lint enforcement exist yet — follow the convention manually.

## Session logs

- Every session's full dialogue is recorded in `prompts/sessoes/AAAA-MM-DD-HHMM-<tool>.md` (e.g. `2026-11-09-1228-opencode.md`).
- Format: header with tool, model and timezone — never machine names, usernames, home directories or absolute paths — then each user prompt followed by the assistant reply, in order. Keep the user text verbatim, except absolute paths, which must be redacted.
- A long attachment can be referenced by path instead of duplicated.
- Sanitize paths from prompts, commands and outputs: use repository-relative paths or placeholders such as `<repo-root>` and `<tmp>`.
