# AGENTS.md

> Guide for AI agents working in the YYC³ Portable Intelligent AI System codebase.
> Only documents what is actually observed in the repo. When in doubt, read the file.

## Project Overview

**YYC³ Portable Intelligent AI System** (`@yyc3/ai-system`, v1.0.0) is a front-end-only
"full-stack" (FEFS) web application built as a portable IDE / AI coding assistant. It is a
browser PWA (via `vite-plugin-pwa`) deployed to GitHub Pages. Documentation mentions Tauri
for desktop wrapping, but the code in this repo is the Vite/React web app.

Core capabilities: multi-panel IDE layout, Monaco code editor, TipTap rich text,
AI-assisted code generation (multi-provider), real-time collaboration (Yjs), task board,
plugin system, theming, i18n (zh/en/ja/ko), offline-first storage (IndexedDB / OPFS /
localStorage).

- **License**: MIT
- **Team**: YanYuCloudCube Team <admin@0379.email>
- **Production URL**: https://ai.yyc3.top (GitHub Pages, custom domain)

## Essential Commands

Package manager is **pnpm** (see `.npmrc`, CI pins pnpm `10.32.1`, Node `20`). `npm`/`yarn`
also work but pnpm is canonical.

```bash
# Install
pnpm install

# Dev server (http://localhost:3156)
pnpm dev

# Production build → dist/
pnpm build
pnpm preview          # serve build on :3156

# Lint / format / types
pnpm lint             # ESLint (flat config)
pnpm lint:strict      # ESLint with --max-warnings 0
pnpm lint:fix
pnpm format           # Prettier write
pnpm format:check
pnpm typecheck        # tsc --noEmit

# Unit tests (Vitest)
pnpm test             # watch
pnpm test:run         # single run (CI)
pnpm test:ui          # browser UI
pnpm test:coverage    # v8 coverage (thresholds: 80% lines/funcs/branches/stmts)
pnpm test:performance # runs performance-monitor-service.test.ts

# E2E (Playwright) — auto-starts dev server
pnpm test:e2e
pnpm test:e2e:ui
pnpm test:e2e:headed
pnpm test:e2e:debug
pnpm test:e2e:report
pnpm benchmark        # e2e/performance-benchmark.test.ts

# Reports (Node ESM tsx loader)
pnpm report:bundle
pnpm report:performance
pnpm report:e2e

# Full local CI equivalent
pnpm ci               # lint && format:check && typecheck && test:run
```

Before committing, run: `pnpm lint && pnpm typecheck && pnpm test:run` (per CONTRIBUTING.md).

## Code Organization

```
src/
├── main.tsx                # App entry
├── App.auth-integration.tsx# Auth wiring variant
├── sw.ts                   # Service worker (excluded from tsconfig)
├── app/
│   ├── App.tsx             # Root component (theme/i18n/Sonner/ErrorBoundary)
│   ├── routes.tsx          # react-router v7 config (lazy + Suspense)
│   ├── store.ts            # Zustand global store (persisted)
│   ├── settingsStore.ts    # Settings-specific store
│   ├── types.ts            # App-level types
│   ├── components/         # All React components
│   │   ├── ui/             # shadcn/ui + Radix primitives (button.tsx, dialog.tsx, …)
│   │   ├── toolbars/       # LeftToolbar / MiddleToolbar / RightToolbar
│   │   ├── chat/ figma/    # Grouped feature components
│   │   └── __tests__/      # Component & integration unit tests
│   ├── services/           # Singleton service classes + __tests__/
│   ├── utils/              # Helpers (theme, i18n, cn, storage-keys, logger, …) + __tests__/
│   ├── store/slices/       # Zustand slices (chat, panel, theme)
│   ├── examples/
│   └── types/
├── services/               # Top-level infra services (sync, cache, websocket, offline)
├── providers/              # React providers (AuthProvider)
├── contexts/               # React contexts (AuthContext) + __tests__/
├── pages/                  # Auth pages (Login, Register, …) + __tests__/ + auth-routes.tsx
├── hooks/                  # useAuth, useTheme, useChatSession, useStreamText
├── types/                  # Shared ambient types (auth, sync, offline, websocket, sql.js.d.ts)
├── utils/                  # Generic utils + __tests__/
├── styles/                 # theme.css, tailwind.css, index.css, fonts.css
├── test/                   # Vitest setup.ts + test helpers + security tests
├── docs/                   # In-repo technical docs (Chinese)
└── imports/                # Prompt/spec markdown for AI imports

e2e/                        # Playwright specs (*.spec.ts) — testDir for Playwright
scripts/                    # Report generators (tsx) + cleanup/check scripts
docs/                       # Project documentation, design specs, handoffs, summaries
public/                     # Static assets + yyc3-icons/ (all-platform app icons)
.github/workflows/ci-cd.yml # CI/CD pipeline
```

### Test file locations (important — two distinct systems)

- **Vitest** (`vitest.config.ts`): matches `src/**/*.{test,spec}.{js,ts,jsx,tsx}`. Most tests
  live in `__tests__/` folders next to the code they cover (`src/app/components/__tests__/`,
  `src/app/services/__tests__/`, `src/contexts/__tests__/`, `src/utils/__tests__/`, etc.).
- **Playwright** (`playwright.config.ts`): `testDir: './e2e'`. E2E files are `*.spec.ts` under
  `e2e/` — **not** in `src/`. (A few stray `*.playwright.ts`/`e2e-panels.playwright.ts` files
  exist under `src/app/components/__tests__/` but are not the configured E2E testDir.)

## Tech Stack (verified from package.json)

- **React** 18.3.1, **react-router** 7.13.0 (DOM 7.13.2)
- **TypeScript** 5.7.2 (strict, `ES2022`, `moduleResolution: bundler`, `jsx: react-jsx`)
- **Vite** 6.3.5 (pinned via pnpm override), **vite-plugin-pwa**
- **State**: **Zustand** ^5.0.11 with `persist` middleware (localStorage key `yyc3-storage`).
  No Redux. React Context only for scoped concerns (e.g. `AuthContext`).
- **UI**: **Radix UI** primitives (`@radix-ui/react-*`) styled in **shadcn/ui** style using
  `class-variance-authority`, `clsx`, `tailwind-merge`. `lucide-react` icons. `sonner` toasts.
  > NOTE: README references Material UI / `@mui/*` — **these are not present** in
  > `package.json`. Do not import them.
- **Styling**: **Tailwind CSS v4** via `@tailwindcss/vite` (NOT PostCSS plugin).
  `postcss.config.mjs` is intentionally empty.
- **Editors**: `@monaco-editor/react` ^4.7.0 (Monaco 0.55.1), **TipTap** ^3.20.1.
- **Collaboration**: **Yjs** ^13.6.29 + `y-prosemirror` + TipTap collab extensions.
- **Virtualization**: `@tanstack/react-virtual` (not `react-window`).
- **Forms**: `react-hook-form` 7.55.0. **Charts**: `recharts`. **DnD**: `react-dnd`.
- **DB**: `sql.js` ^1.14.1 (marked `external` in rollup config), `idb` for IndexedDB.
- **Testing**: **Vitest** ^4.1.0 (jsdom, `@testing-library/react`, `fake-indexeddb`),
  **Playwright** ^1.50.0.
- **Misc**: `date-fns`, `uuid`, `motion`, `next-themes`, `vaul`, `react-resizable-panels`.

## Conventions & Patterns

### File header (expected on source files)

Most `src/**` files carry a JSDoc header. Follow the existing pattern when creating files:

```ts
/**
 * @file filename.ext
 * @description Brief purpose
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created YYYY-MM-DD
 * @updated YYYY-MM-DD
 * @status stable | dev | test | draft | deprecated
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team. All rights reserved.
 * @tags tag1, tag2
 */
```

Note: some files use a slightly different block (`brief:`/`details:`/`exports:`/`notes:`
keys) — match whatever the surrounding files use.

### Path alias

`@/*` → `./src/*` (configured in `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`).
Prefer `@/app/...` imports over deep relative paths.

### UI components (shadcn/ui pattern)

Components in `src/app/components/ui/` use `React.forwardRef`, `displayName`, a `data-slot`
attribute, and `cn()` from `ui/utils.ts`. Variants via `cva`. See `button.tsx` for the
canonical example. `asChild` uses `@radix-ui/react-slot`.

### Services

Singleton instances exported from `src/app/services/index.ts` (e.g. `aiProviderService`,
`storageService`, `syncService`, `pluginRuntime`, `dbService`, `quickActionsService`,
`useTaskStore`). Import the singleton, not the class.

### State (Zustand)

Selector-based access: `const theme = useAppStore((s) => s.theme)`. Persist with
`partialize` to choose which fields land in localStorage under key `yyc3-storage`.
Settings live in a separate `settingsStore.ts`. Sliced stores live under
`src/app/store/slices/`.

### Routing

`src/app/routes.tsx` defines a `createBrowserRouter` with three routes — `/` (HomePage),
`/ide` (IDELayout), `/settings` (SettingsPage) — each lazy-loaded with `React.lazy` +
`<Suspense>`. Auth routes live in `src/pages/auth-routes.tsx`.

### Imports ordering (enforced by ESLint)

`import/order` is an **error**: groups `builtin → external → internal → parent → sibling →
index`, `newlines-between: always`, alphabetical. Run `pnpm lint:fix` to auto-sort.

### Prettier

100 cols, 2-space, single quotes, semis, `trailingComma: 'es5'`, `arrowParens: 'always'`,
LF endings.

## Testing Notes & Gotchas

- **Vitest runs serialized**: `pool: 'vmThreads'`, `isolate: false`, `fileParallelism: false`,
  `maxConcurrency: 1`. 30s timeouts on test/hook/teardown.
- `src/test/setup.ts` globally mocks `matchMedia`, `ResizeObserver`, `IntersectionObserver`,
  `scrollIntoView`, `localStorage`, `sessionStorage`, `fetch`, and registers
  `fake-indexeddb/auto` + `@testing-library/jest-dom`. It also suppresses `console.error`
  for messages containing `Warning:`/`Error:`/`MODULE_NOT_FOUND`.
- Coverage thresholds are **80%** for lines/functions/branches/statements and will fail CI
  if `pnpm test:coverage` drops below.
- **CI test strategy** (`.github/workflows/ci-cd.yml`, `test` job): `src/utils/`,
  `src/services/`, `src/test/`, `src/contexts/`, `src/pages/` must pass. Tests under
  `src/app/utils/` and `src/app/components/` run with `continue-on-error: true` and specific
  excludes (`agent-framework*`, `data-layer*`, `function-layer*`, `complete-dev-workflow*`,
  `services-coverage*`, `components-coverage*`, `CollabIndicator*`, `ai-provider*`,
  `business-components*`, `ui-components*`) — these are known pre-existing failures. Don't be
  surprised if a broad `pnpm test:run` shows failures; scope runs to a path when iterating.
- **Playwright** auto-starts the dev server (`webServer.command: 'npm run dev'`,
  `reuseExistingServer: !CI`). Base URL `http://localhost:3156`. Projects: chromium, firefox,
  webkit. `forbidOnly` in CI, 2 retries in CI.
- Install browsers once: `npx playwright install`.

## Build & Deploy Notes

- `vite.config.ts` sets `base: '/'` (custom domain deployment).
- Manual chunk splitting is configured (`react-core`, `ui-components`, `monaco-editor`,
  `editor-tiptap`, `collaboration`, `charts`, `dnd`, `forms`, `markdown`, `motion`,
  `notifications`, `vendor`). `sql.js` is a rollup `external`.
- PWA precache raises `maximumFileSizeToCacheInBytes` to 10 MB for Monaco; extensive
  `runtimeCaching` rules for CDNs, fonts, images, API, AI API.
- CI deploys `dist/` to GitHub Pages on pushes to `main`, writes `CNAME` → `ai.yyc3.top`
  and `.nojekyll`.

## ESLint Quirks

- Flat config in `eslint.config.js` (a legacy `.eslintrc.cjs` also exists but the flat file
  is the active one used by `eslint .`).
- **`eslint-plugin-react-hooks` is disabled** (v4 incompatible with ESLint 9; commented out).
  Hook rules are therefore not enforced by lint — review manually.
- `@typescript-eslint/no-explicit-any`, `no-non-null-assertion`, `no-unused-expressions` are
  **off**. `no-unused-vars` is a `warn` (ignores `^_`-prefixed). Test files relax these further.
- `prefer-const` and `no-var` are errors; `no-debugger` is warn.

## Project-Specific Context

- Documentation and many code comments are in **Chinese** (Simplified). Match the surrounding
  language when adding comments/docs.
- Theme tokens and presets live in `src/app/utils/theme.ts` and `src/styles/theme.css`. Dark
  mode is toggled by adding/removing the `dark` class on `<html>` (see `App.tsx`).
- i18n dictionaries are in `src/app/utils/i18n-{zh,en,ja,ko}.ts`; access via
  `getI18n(language)` / `nextLanguage`.
- AI provider presets and multi-provider routing live in `src/app/services/ai-provider.ts`
  (OpenAI, Anthropic, DeepSeek, 智谱, 文心, 通义, Ollama, etc.).
- Storage layer is layered: `storage-service.ts` (localStorage abstraction), `opfs-storage.ts`
  (Origin Private File System), `idb` (IndexedDB), plus sync/conflict/cache services under
  `src/services/`.

## Useful Docs in Repo

- `CONTRIBUTING.md` — setup, naming, commit (Conventional Commits) and PR conventions.
- `docs/YYC3-AI-开发指南/AGENTS.md` — a longer (partly outdated) agent guide; cross-check
  any claim there against the actual code before relying on it.
- `docs/05-YYC3-AI-开发指南/` and `src/docs/` — design specs and technical docs (Chinese).
- `docs/cicd-configuration.md`, `docs/pnpm-guide.md`, `docs/package-manager-analysis.md`.
