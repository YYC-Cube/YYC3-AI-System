---
file: YYC3-AI-开发指南-AI助手.md
description: YYC³ Portable Intelligent AI System 的 AI 助手使用指南，帮助 AI 助手在代码库中有效工作
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-19
updated: 2026-03-19
status: stable
tags: guide,agent,development,zh-CN
category: guide
language: zh-CN
audience: developers
complexity: intermediate
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC³ Portable Intelligent AI System - Agent Guide

> **言启象限 | 语枢未来**
> *Words Initiate Quadrants, Language Serves as Core for Future*

This guide helps AI agents work effectively in this codebase.

## Project Overview

**YYC³ Portable Intelligent AI System** is a modern desktop application using the Front-End-Only Full-Stack (FEFS) architecture. It combines React + TypeScript + Vite for the frontend with native desktop capabilities via Tauri.

**Key Characteristics:**
- Multi-panel IDE layout system
- AI-powered code generation and assistance
- Real-time collaboration (Yjs/WebSocket)
- Multi-provider AI service layer
- Comprehensive plugin system
- Task management with AI integration

---

## Essential Commands

### Development
```bash
# Install dependencies (preferred: pnpm)
pnpm install

# Start dev server (runs on http://localhost:3156)
pnpm dev

# Preview production build
pnpm preview
```

### Build & Deploy
```bash
# Build for production
pnpm build

# Type checking
pnpm typecheck
```

### Quality Assurance
```bash
# Run linter (ESLint)
pnpm lint

# Run unit tests (Vitest)
pnpm test

# Run unit tests with UI
pnpm test:ui

# Run unit tests once (CI mode)
pnpm test:run
```

### End-to-End Testing
```bash
# Run E2E tests (Playwright)
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui

# Run E2E tests in headed mode
pnpm test:e2e:headed

# Debug E2E tests
pnpm test:e2e:debug

# Show E2E test report
pnpm test:e2e:report
```

---

## Code Organization

```
src/
├── app/
│   ├── components/       # React components
│   │   ├── ui/         # Radix UI shadcn/ui components
│   │   ├── toolbars/   # IDE toolbar components
│   │   ├── figma/      # Figma integration components
│   │   └── __tests__/  # Component and E2E tests
│   ├── services/       # Business logic services (singletons)
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Root application component
│   ├── routes.ts       # React Router configuration
│   ├── store.ts        # Zustand global state
│   ├── settingsStore.ts # Settings-specific state
│   └── types.ts        # TypeScript type definitions
├── styles/             # CSS and theme files
├── docs/               # Technical documentation
├── imports/            # Import specifications and prompts
└── main.tsx            # Application entry point
```

### Key Directories

- **`src/app/components/ui/`**: Radix UI + shadcn/ui components with `cn()` utility for className merging
- **`src/app/services/`**: Service layer (AI provider, storage, sync, plugin runtime, etc.)
- **`src/app/utils/`**: Utilities (theme, i18n, collaboration, AI completion)
- **`src/app/components/__tests__/``: Component tests (Vitest) and E2E tests (Playwright)
- **`docs/`**: Project documentation and handoff notes

---

## Tech Stack & Dependencies

### Core Framework
- **React**: 18.3.1 (with React Router 7.13.0)
- **TypeScript**: 5.7.2
- **Vite**: 6.3.5 (dev server and build tool)

### State Management
- **Zustand**: ^5.0.11 (global state with persist middleware)
- No Redux or Context API for app-level state

### UI Components
- **Radix UI**: Unstyled accessible primitives (@radix-ui/react-*)
- **Material UI**: @mui/material, @mui/icons-material
- **Lucide React**: ^0.487.0 (icon library)
- **Sonner**: ^2.0.3 (toast notifications)

### Styling
- **Tailwind CSS**: 4.1.12 (via @tailwindcss/vite)
- **PostCSS**: For additional plugins (currently empty config)
- **CVA (class-variance-authority)**: ^0.7.1 (component variants)
- **clsx**: ^2.1.1 + **tailwind-merge**: ^3.2.0 (className merging)

### Editor & Preview
- **Monaco Editor**: ^0.55.1 (code editor)
- **TipTap**: ^3.20.1 (rich text editor)

### AI Integration
- Multiple AI providers (OpenAI, Anthropic, DeepSeek, 智谱AI, 百度文心, 阿里通义, Ollama)
- Custom AI service layer with caching, rate limiting, and performance tracking

### Real-time Collaboration
- **Yjs**: ^13.6.29 (CRDT for collaborative editing)
- **TipTap Y-Prosemirror**: ^1.3.7

### Testing
- **Vitest**: ^2.1.9 (unit tests)
- **Playwright**: ^1.50.0 (E2E tests)

### Other Key Libraries
- **React Hook Form**: ^7.55.0 (form management)
- **date-fns**: ^3.6.0 (date manipulation)
- **Recharts**: ^2.15.2 (charts)
- **react-dnd**: ^16.0.1 (drag and drop)
- **react-window**: ^2.2.7 (virtual scrolling)
- **zod**: (validation, referenced in config)

---

## Coding Standards & Conventions

### File Header Format (MANDATORY)

Every code file **must** include the following JSDoc-style header:

```typescript
/**
 * @file filename.ext
 * @description Brief description of file purpose
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created YYYY-MM-DD
 * @updated YYYY-MM-DD
 * @status stable | dev | test | draft | deprecated
 * @license MIT
 * @copyright Copyright (c) 2025 YanYuCloudCube Team. All rights reserved.
 * @tags tag1, tag2, tag3
 */
```

**Status values**: `stable` | `dev` | `test` | `draft` | `deprecated`

### Component Structure

UI components in `src/app/components/ui/` follow this pattern:

```tsx
import * as React from "react";
import { cn } from "./utils";

// Use forwardRef for better composition
const ComponentName = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="component-name" // Data attribute for styling/debugging
        className={cn("base-classes", className)}
        {...props}
      />
    );
  }
);
ComponentName.displayName = "ComponentName";

export { ComponentName };
```

**Key points:**
- Use `React.forwardRef` for all components
- Export component with `displayName` set
- Use `cn()` utility for className merging (from `ui/utils.ts`)
- Include `data-slot` attribute for consistency

### Component with Variants (CVA)

For components with multiple variants (e.g., Button):

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "variant-classes",
        secondary: "variant-classes",
      },
      size: {
        default: "size-classes",
        sm: "size-classes",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

### TypeScript Configuration

- **Strict mode**: Enabled
- **Path mapping**: `@/*` → `./src/*` (use `@/app/...` for imports)
- **Module resolution**: `bundler`
- **JSX**: `react-jsx` (automatic runtime)
- **No emit**: True (handled by Vite)

**Always run type checking before committing:**
```bash
pnpm typecheck
```

---

## State Management (Zustand)

Global state is managed via Zustand with persist middleware for localStorage.

### Store Location
- **Main store**: `src/app/store.ts` (useAppStore)
- **Settings store**: `src/app/settingsStore.ts`

### Store Pattern

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  // State
  theme: 'light' | 'dark'
  language: 'zh' | 'en' | 'ja' | 'ko'

  // Actions
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  setLanguage: (lang: 'zh' | 'en' | 'ja' | 'ko') => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'zh',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'yyc3-storage',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
      }),
    }
  )
)
```

### Using the Store

```tsx
import { useAppStore } from '@/app/store'

function Component() {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)
  const toggleTheme = useAppStore((s) => s.toggleTheme)

  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  )
}
```

---

## Service Layer Architecture

Services are singleton classes that encapsulate business logic.

### Service Pattern

```typescript
// src/app/services/some-service.ts

import type { SomeType } from '../types'

export class SomeService {
  private instance: SomeType | null = null

  constructor() {
    // Initialize
  }

  public someMethod(param: string): SomeType {
    // Implementation
    return this.instance
  }
}

// Singleton export
export const someService = new SomeService()
```

### Available Services (from `src/app/services/index.ts`)

| Service | Purpose |
|---------|---------|
| `aiProviderService` | Multi-provider AI service (OpenAI, Anthropic, etc.) |
| `storageService` | LocalStorage abstraction |
| `syncService` | Data synchronization with conflict resolution |
| `pluginRuntime` | Plugin system management |
| `dbService` | Database connection and query management |
| `quickActionsService` | Quick actions and clipboard history |
| `codeGenerator`, `codeOptimizer`, `codeExplainer` | AI code generation utilities |
| `useTaskStore` | Task management state |

### Importing Services

```typescript
// Import individual services
import { aiProviderService, storageService } from '@/app/services'

// Import hooks for service interaction
import { useAIProvider, useStorage, useSync } from '@/app/services'
```

---

## Theme System

YYC³ uses a comprehensive theme system with multiple presets.

### Available Themes

| Theme | Mode | Accent |
|-------|------|--------|
| `light` | Light | Indigo |
| `dark` | Dark | Indigo (default) |
| `midnight` | Dark | Blue |
| `forest` | Dark | Emerald |
| `sunset` | Light | Orange |

### Theme Utilities

```typescript
import { getThemeTokens, nextTheme, type ThemeMode } from '@/app/utils/theme'

// Get theme tokens
const tokens = getThemeTokens('dark')
console.log(tokens.isDark) // true

// Get next theme in cycle
const next = nextTheme('dark') // 'midnight'
```

### Using Theme in Components

```tsx
import { useAppStore } from '@/app/store'
import { getThemeTokens } from '@/app/utils/theme'

function Component() {
  const theme = useAppStore((s) => s.theme)
  const t = getThemeTokens(theme)

  return (
    <div className={t.isDark ? 'dark-styles' : 'light-styles'}>
      Content
    </div>
  )
}
```

### Applying Dark Mode

The App component automatically adds/removes the `dark` class on `html` element:

```tsx
// From src/app/App.tsx
useEffect(() => {
  const t = getThemeTokens(theme)
  if (t.isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}, [theme])
```

---

## Internationalization (i18n)

YYC³ supports multiple languages: Chinese (zh), English (en), Japanese (ja), Korean (ko).

### i18n Utilities

```typescript
import { getI18n, type Language, nextLanguage } from '@/app/utils/i18n'

// Get translations for a language
const i18n = getI18n('zh')
console.log(i18n.appName) // 'YYC³ CloudPivot Intelli-Matrix'

// Get next language
const next = nextLanguage('zh') // 'en'
```

### Language State

```typescript
import { useAppStore } from '@/app/store'

function Component() {
  const language = useAppStore((s) => s.language)
  const setLanguage = useAppStore((s) => s.setLanguage)

  return <button onClick={() => setLanguage('en')}>English</button>
}
```

---

## Routing

React Router v7 is configured in `src/app/routes.ts`.

### Current Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `HomePage` | Landing page |
| `/ide` | `IDELayout` | Main IDE interface |
| `/settings` | `SettingsPage` | Settings page |

### Adding New Routes

```typescript
// src/app/routes.ts
import { createBrowserRouter } from 'react-router'
import { NewPage } from './components/NewPage'

export const router = createBrowserRouter([
  // ...existing routes
  {
    path: '/new-page',
    Component: NewPage,
  },
])
```

### Navigation

```tsx
import { useNavigate } from 'react-router'

function Component() {
  const navigate = useNavigate()

  return <button onClick={() => navigate('/settings')}>Settings</button>
}
```

---

## Testing

### Unit Tests (Vitest)

Test files are located in `src/app/components/__tests__/` with `*.test.ts` extension.

**Test file example:**

```typescript
/**
 * @file component.test.ts
 * @description Unit tests for Component
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags tests,unit
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Component } from '../Component'

describe('Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render correctly', () => {
    render(<Component />)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })
})
```

**Running tests:**
```bash
# Watch mode
pnpm test

# Single run
pnpm test:run

# UI mode
pnpm test:ui
```

### E2E Tests (Playwright)

E2E test files are in `src/app/components/__tests__/` with `*.playwright.ts` or `*.spec.tsx` extension.

**Playwright configuration:**
- Test directory: `./src/app/components/__tests__`
- Base URL: `http://localhost:3156`
- Browsers: Chromium, Firefox, WebKit
- Auto-starts dev server (reuses if running)

**E2E test example:**

```typescript
/**
 * @file e2e-new-panels.spec.tsx
 * @description E2E tests for new panel features
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags tests,e2e
 */

import { test, expect } from '@playwright/test'

test('should open IDE layout', async ({ page }) => {
  await page.goto('http://localhost:3156/ide')
  await expect(page.locator('[data-testid="ide-layout"]')).toBeVisible()
})

test('should navigate to settings', async ({ page }) => {
  await page.goto('http://localhost:3156')
  await page.click('text=Settings')
  await expect(page).toHaveURL(/\/settings/)
})
```

**Running E2E tests:**
```bash
# All browsers
pnpm test:e2e

# UI mode
pnpm test:e2e:ui

# Headed mode
pnpm test:e2e:headed

# Debug mode
pnpm test:e2e:debug

# View report
pnpm test:e2e:report
```

---

## Important Gotchas & Non-Obvious Patterns

### 1. Port Configuration

- **Dev server**: Uses port **3156** (configured in `vite.config.ts` and package.json scripts)
- **Default dev command**: `vite --port 3156`
- **Preview**: Also uses port 3156

### 2. Tailwind CSS v4

This project uses Tailwind CSS v4 via `@tailwindcss/vite` plugin.

**Important:**
- Do NOT add `tailwindcss` or `autoprefixer` to `postcss.config.mjs`
- The Vite plugin handles everything automatically
- PostCSS config only exists for additional plugins (currently empty)

### 3. Path Alias

Use `@/` for imports from `src/` directory:

```typescript
// ✅ Correct
import { useAppStore } from '@/app/store'
import { Button } from '@/app/components/ui/button'

// ❌ Incorrect
import { useAppStore } from '../../store'
```

### 4. File Header Requirement

**ALL** code files must include the standard file header. This is checked by the team and is part of the code standards.

### 5. PostCSS Config

The `postcss.config.mjs` file intentionally has an empty export:

```javascript
export default {}
```

This is because Tailwind v4's Vite plugin handles everything. Do not add PostCSS plugins unless explicitly needed.

### 6. Service Singletons

Services are exported as singleton instances, not classes:

```typescript
// ✅ Correct - import the singleton
import { aiProviderService } from '@/app/services'

// ❌ Incorrect - don't import the class
import { AIProviderService } from '@/app/services'
```

### 7. Toast Notifications

Use **Sonner** for toast notifications (already configured in `App.tsx`):

```tsx
import { toast } from 'sonner'

function Component() {
  return (
    <button onClick={() => toast.success('Operation completed')}>
      Click Me
    </button>
  )
}
```

### 8. Zustand Persist Middleware

The store uses `persist` middleware with localStorage:

```typescript
// Storage key is 'yyc3-storage'
persist(
  (set) => ({ ... }),
  {
    name: 'yyc3-storage',
    partialize: (state) => ({
      // Only persist specific fields
      theme: state.theme,
      language: state.language,
    }),
  }
)
```

### 9. Playwright Auto-Starts Dev Server

When running E2E tests, Playwright automatically starts the dev server via the `webServer` config in `playwright.config.ts`. You don't need to manually start `pnpm dev`.

### 10. Chinese Comments and Documentation

This project is developed by a Chinese team (YanYuCloudCube). Documentation and some comments are in Chinese. When adding comments, follow the existing pattern:

```typescript
/**
 * @file 文件名
 * @description 文件描述（中文）
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @status dev
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team. All rights reserved.
 * @tags tag1, tag2, tag3
 */
```

---

## Common Tasks

### Creating a New Component

1. Create component file: `src/app/components/MyComponent.tsx`
2. Add file header (mandatory)
3. Use the component structure pattern
4. Import UI components from `ui/` directory
5. Test with `pnpm test`

### Creating a New Service

1. Create service file: `src/app/services/my-service.ts`
2. Add file header
3. Export singleton instance
4. Add to `src/app/services/index.ts` exports
5. Create tests in `__tests__/services.test.ts`

### Adding a New Route

1. Create component: `src/app/components/NewPage.tsx`
2. Add to `src/app/routes.ts` router configuration
3. Update TypeScript types if needed
4. Test navigation

### Adding a New UI Component (shadcn/ui)

1. Create component in `src/app/components/ui/`
2. Follow the existing pattern (forwardRef, cn, data-slot)
3. Use CVA for components with variants
4. Add to component exports
5. Write tests

### Updating Theme Colors

1. Theme colors are in `src/app/utils/theme.ts`
2. Modify `getPalette()` function or accent mappings
3. Test all theme presets
4. Verify dark/light mode switching

### Adding AI Provider

1. Update `src/app/services/ai-provider.ts` `PRESET_PROVIDERS`
2. Add provider configuration with models
3. Update types in `src/app/types.ts` if needed
4. Test provider connection and chat
5. Update documentation

---

## Documentation Resources

### Key Documentation Files

- **`docs/Guidelines.md`**: Complete project guidelines (Chinese)
- **`docs/YYC3-theme-design-system.md`**: Theme design system
- **`docs/liquid-glass-ui-ux.md`**: UI/UX guidelines
- **`docs/README-Development-Handoff.md`**: Development handoff notes
- **`README.md`**: Project overview and quick start

### Technical Documentation (Chinese)

Located in `src/docs/`:
- `01-YYC3-机制总结-核心设计.md` (Core design)
- `02-YYC3-系统架构-技术栈规范.md` (Architecture)
- `03-YYC3-首页设计-品牌与交互.md` (Homepage design)
- `04-YYC3-编程模式-多联式布局.md` (Programming mode)
- `05-YYC3-图标系统-设计规范.md` (Icon system)
- `06-YYC3-技术实现-开发规范.md` (Technical implementation)
- `07-YYC3-数据模型-架构设计.md` (Data model)
- `08-YYC3-代码生成-智能规范.md` (Code generation)
- `09-YYC3-安全性能-优化策略.md` (Security & performance)
- `10-YYC3-部署运维-最佳实践.md` (Deployment)

---

## Troubleshooting

### Dev Server Not Starting

```bash
# Check if port 3156 is in use
lsof -i :3156  # macOS/Linux
netstat -ano | findstr :3156  # Windows

# Kill process if needed
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### TypeScript Errors

```bash
# Run type check to see all errors
pnpm typecheck

# Clean and reinstall
rm -rf node_modules dist .vite
pnpm install
```

### Playwright Tests Failing

```bash
# Install Playwright browsers
npx playwright install

# Update Playwright
npx playwright install --with-deps

# Run with debug mode
pnpm test:e2e:debug
```

### Build Failing

```bash
# Check build output
pnpm build

# Vite debug mode
DEBUG=vite:* pnpm build

# Check for circular dependencies
```

---

## Version Control Notes

- This is **not a git repository** (based on env info)
- Use git for version control when initializing
- Follow conventional commit messages
- The `.gitignore` is already configured

---

## Contact & Team Information

**Team**: YanYuCloudCube Team
**Email**: admin@0379.email
**Website**: https://yyc3.com
**Project**: YYC³ Portable Intelligent AI System
**License**: MIT

---

**Last Updated**: 2026-03-19
**Document Version**: v1.0.0
