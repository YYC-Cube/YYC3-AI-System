---
file: README-Development-Handoff.md
description: YYC³便携式智能AI系统 - 开发交接和本地设置指南
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-18
updated: 2026-03-18
status: stable
tags: readme,handoff,development,setup,zh-CN
category: guide
language: zh-CN
project: yyc3-portable-ai-system
phase: development
audience: developers
complexity: intermediate
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC3 PortAISys - Development Handoff Guide

> **YanYuCloudCube** | Words Initiate Quadrants, Language Serves as Core for Future

---

## Project Overview

YYC3 PortAISys is a multi-panel low-code AI development platform built with:
- **React 19** + **TypeScript 5.x** + **Vite 6**
- **Tailwind CSS v4** (Liquid Glass visual style)
- **Zustand** (state management with persist middleware)
- **react-dnd** (drag-and-drop interactions)
- **Motion** (animations)
- **Sonner** (toast notifications)
- **Lucide React** (icon system)

---

## Architecture Summary

```
src/app/
├── App.tsx                    # Root with RouterProvider
├── routes.ts                  # React Router data mode config
├── store.ts                   # Main Zustand store (useAppStore)
├── components/
│   ├── IDELayout.tsx          # 34-panel IDE layout with DndProvider
│   ├── Header.tsx             # Top nav with badge system
│   ├── TaskBoard.tsx          # AI Task Board (Kanban + List + Timeline)
│   ├── NotificationCenter.tsx # Slide-in notification panel
│   ├── ChatInterface.tsx      # AI chat with auto task extraction
│   ├── QuickActionsPanel.tsx  # AI quick actions system
│   └── ... (60+ components)
├── services/
│   ├── task-store.ts          # Task Zustand store (persist)
│   ├── task-inference.ts      # Local regex task extraction engine
│   ├── task-reminder.ts       # 30s polling + browser notifications
│   ├── task-actions.ts        # Copy/export/split/merge operations
│   ├── task-ai-integration.ts # AI response → task extraction
│   └── index.ts               # Service barrel exports
├── utils/
│   ├── theme.ts               # Theme tokens (8 presets, Liquid Glass)
│   └── i18n.ts                # 4-language i18n (en/zh/ja/ko)
└── styles/
    ├── theme.css              # Tailwind v4 tokens
    └── fonts.css              # Font imports
```

---

## Key Systems & Their Entry Points

### 1. AI Task Board (`TaskBoard.tsx`)

**Features:**
- Kanban view with react-dnd drag between columns
- List view with inline status selector
- Timeline/Gantt view with Day/Week/Month zoom + drag-to-resize dueDate
- AI Inference button (extracts tasks from chat via `task-inference.ts`)
- Batch operations (mark done, archive, delete)
- Edit modal with dueDate, estimatedHours, tags, subtasks

**State:** `useTaskStore` (Zustand persist → `localStorage: yyc3-task-store`)

**Launch:** `Ctrl+Shift+B` or Header Quick Actions → AI Task Board

### 2. Notification System

**Components:**
- `Header.tsx` → Bell icon with combined badge count (notifications + task reminders)
- `NotificationCenter.tsx` → Slide-in panel with category filters

**Event System:**
- `task-reminder.ts` dispatches `CustomEvent('task-reminder')` on `window`
- Both Header and NotificationCenter listen for this event
- Header increments badge; NotificationCenter creates notification entry

### 3. Theme System

**8 Presets:** dark, light, midnight, sunset, forest, ocean, aurora, rose
**Tokens:** All accessed via `getThemeTokens(theme)` → `t.isDark`, `t.surface.*`, `t.accent.*`, etc.

### 4. i18n System

**4 Languages:** en, zh, ja, ko
**Access:** `getI18n(language)` → `i.keyName`
**New keys use fallback pattern:** `(i as any).newKey || 'English fallback'`

---

## State Management

### Main Store (`store.ts`)
```ts
useAppStore: {
  theme, language, viewMode,
  taskBoardOpen, notificationCenterOpen,
  // ... 34+ panel open states
  // ... collaborators, recentProjects
}
```

### Task Store (`task-store.ts`)
```ts
useTaskStore: {
  tasks: Task[],
  reminders: Reminder[],
  filter: TaskFilter,
  viewMode: 'kanban' | 'list' | 'timeline',
  // CRUD operations, batch operations, sorting
}
```

### Settings Store (`settingsStore.ts`)
```ts
useSettingsStore: {
  // AI provider configs, model settings, shortcuts
  // Persisted to localStorage key: yyc3-settings
}
```

---

## Recent Changes (This Session)

### Phase 1 (Previous)
- react-dnd integrated for Kanban card drag between columns
- NotificationCenter wired to task-reminder CustomEvent
- Timeline/Gantt view with dueDate/estimatedHours bar rendering

### Phase 2 (Current - P5 Closing)
1. **AI Inference Entry Button** → Purple "AI Infer" button in TaskBoard toolbar
   - Dynamic imports `task-inference.ts`
   - Reads chat messages from appStore
   - Creates tasks with `source: 'ai-inferred'`

2. **Timeline Drag-to-Resize dueDate** → Right-edge resize handle on Gantt bars
   - Native mousemove/mouseup for performance
   - Real-time `updateTask` calls during drag
   - Visual ring feedback (`ring-2 ring-indigo-400/50`)

3. **Header Bell Badge** → Combined notification + task reminder count
   - Subscribes to `useTaskStore(s => s.reminders)` for unread count
   - Listens for `task-reminder` CustomEvent for real-time increment
   - `totalBadge = unreadCount + unreadTaskReminders + taskReminderEventCount`

4. **Timeline Week/Month Zoom** → Day/Week/Month toggle above Gantt chart
   - Day: 32px/day, individual date labels
   - Week: 12px/day, weekly labels (W1 3月)
   - Month: 4px/day, monthly labels (2026-03)
   - Bar text hidden at month zoom for readability

---

## Development Workflow

### Local Setup
```bash
pnpm install
pnpm dev          # Start dev server
```

### Key Conventions
- **File headers**: All `.ts`/`.tsx` files must have JSDoc header (see `guidelines/YYC3-Code-header.md`)
- **Imports**: Barrel exports from `services/index.ts`
- **Styling**: Tailwind v4 classes + theme tokens (never hardcode colors)
- **i18n**: All user-facing strings via `getI18n()`, new keys use fallback pattern
- **State**: Zustand with persist for user data, plain Zustand for UI state

### Adding a New Panel to IDELayout
1. Create component in `components/`
2. Add `panelNameOpen` / `setPanelNameOpen` to `store.ts`
3. Add lazy import + conditional render in `IDELayout.tsx`
4. Add keyboard shortcut in shortcuts config
5. Add i18n keys for title/subtitle

---

## Known Limitations

1. **react-dnd ref types**: `as any` cast needed for `dropRef`/`dragRef` (react-dnd v16 + React 19 type mismatch)
2. **Timeline resize**: Only right-edge (dueDate) drag supported; start date drag not yet implemented
3. **i18n new keys**: Some new keys (`tbAiInfer`, `tbDay`, `tbWeek`, `tbMonth`, etc.) only have English fallbacks; need addition to all 4 language files
4. **Task reminder event count**: Counter in Header doesn't reset on NotificationCenter read (minor UX issue)

---

## File Reference (Modified This Phase)

| File | Changes |
|------|---------|
| `components/TaskBoard.tsx` | AI Infer button, Timeline zoom, drag resize, DnD |
| `components/Header.tsx` | Task reminder badge, useTaskStore subscription |
| `components/NotificationCenter.tsx` | task-reminder event listener (prev phase) |
| `docs/YYC3-P5-Closing-Review-Report.md` | 12-category audit report |
| `docs/README-Development-Handoff.md` | This file |

---

## Contact

- **Team**: YanYuCloudCube Team
- **Email**: admin@0379.email
- **Brand**: YYC3 Family AI

---

**Document Version**: v1.0.0
**Last Updated**: 2026-03-18
