---
file: README-P9-Handoff.md
description: YYC³便携式智能AI系统 - P9开发交接指南
author: YanYuCloudCube Team <admin@0379.email>
version: v1.5.0
created: 2026-03-18
updated: 2026-03-18
status: stable
tags: readme,handoff,p9,zh-CN
category: guide
language: zh-CN
project: yyc3-platform
phase: p9
audience: developers
complexity: advanced
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC3 PortAISys - P9 Development Handoff

> **YanYuCloudCube** | 万象归元于云枢 | 深栈智启新纪元

---

## Phase Summary

P9 delivers three major features: **Multi-Instance Panel UI** (full visual management for windows/workspaces/sessions/IPC with Liquid Glass styling), **Dependency Editing UI** (click-to-delete arrows, two-click connect mode for creating dependencies), and **AI Critical Path Optimization** (automated bottleneck detection, parallelization suggestions, overdue/blocked alerts).

---

## 1. Multi-Instance Panel UI

### Component: `/src/app/components/MultiInstancePanel.tsx`

Full-featured management panel with four tabs:

| Tab | Features |
|-----|----------|
| **Windows** | Create (type + title), close, minimize, maximize, restore, focus, status badges (Main/Visible/Hidden/Min) |
| **Workspaces** | Create (type + name), activate, duplicate, export (clipboard JSON), import (paste JSON), delete, session count |
| **Sessions** | Stats dashboard (total/active/idle/suspended), create with workspace selection, activate, suspend, resume, delete |
| **IPC Log** | Real-time message viewer (color-coded by type), refresh, clear, timestamp display, data preview |

### Integration
- **Store**: `multiInstancePanelOpen` / `setMultiInstancePanelOpen` in AppStore
- **IDELayout**: Lazy-loaded via `React.lazy`, conditional rendering
- **Keyboard shortcut**: Can be opened via Command Palette or Header

### Architecture
```
MultiInstancePanel
├── WindowsTab ──→ useWindowManagerStore
├── WorkspacesTab ──→ useWorkspaceManagerStore  
├── SessionsTab ──→ useSessionManagerStore
└── IPCLogTab ──→ ipcManager.getMessageLog()
```

---

## 2. Dependency Editing UI

### Two Interaction Modes

#### Click-to-Delete (on existing arrows)
```
1. Toggle "Deps" button in Timeline toolbar → depEditMode = true
2. SVG arrows become interactive (pointer-events enabled)
3. Click any arrow → removes dependency from target task
4. Toast notification: "Dependency removed"
```

**Implementation details:**
- SVG `pointer-events-none` removed when `depEditMode` is true
- Invisible wider hitbox path (`strokeWidth="12"`, transparent) layered over visible arrow for easy clicking
- Critical-path arrows render as solid amber lines (vs dashed indigo for normal deps)

#### Two-Click Connect
```
1. With depEditMode ON, click first task bar → connectSource = taskId
   - Source bar shows pulsing cyan ring (`animate-pulse ring-2 ring-cyan-400`)
   - Other bars show faint cyan ring as potential targets
2. Click second task bar → handleAddDependency(source, target)
   - Adds source to target's dependencies array
   - connectSource resets to null
   - Toast notification: "Dependency added"
```

**Guards:**
- Self-dependency prevented (`fromId === toId` check)
- Duplicate dependency prevented (checks existing deps array)

### Visual Indicators
| State | Visual |
|-------|--------|
| Normal arrows | Dashed indigo, `strokeOpacity="0.5"` |
| Critical-path arrows | Solid amber, `strokeWidth="2"`, amber arrowhead marker |
| Dep edit mode | Full opacity arrows, hover highlights |
| Source selected | Pulsing cyan ring on source bar |
| Potential targets | Faint cyan ring on all other bars |

---

## 3. AI Critical Path Optimization

### Suggestions Engine

Computed via `useMemo` from `criticalPathIds` and `sortedTasks`:

| Suggestion | Trigger | Icon |
|------------|---------|------|
| **Bottleneck Detected** | Longest duration task on critical path | `TrendingDown` (amber) |
| **Parallelization Opportunity** | Non-critical tasks exist that can run in parallel | `Sparkles` (green) |
| **Overdue Critical Tasks** | Critical-path tasks past due date, not done | `AlertTriangle` (red) |
| **Blocked Critical Tasks** | Critical-path tasks with `status === 'blocked'` | `Ban` (orange) |

### UI Panel
- Toggle via **"AI Optimize"** button (purple) in Timeline toolbar
- Only appears when `showCriticalPath` is ON and `criticalPathIds.size > 1`
- Each suggestion card shows:
  - Icon (color-coded by severity)
  - Title + description
  - Clickable task chips that open the task editor on click

### Example Output
```
┌──────────────────────────────────────────────────────────┐
│ ⚡ AI Critical Path Optimization                         │
│                                                          │
│ 📉 Bottleneck Detected                                  │
│    "P1 AI 任务看板交互" is the longest task on the       │
│    critical path. Consider splitting into subtasks.      │
│    [P1 AI 任务看板交互]                                  │
│                                                          │
│ ✨ Parallelization Opportunity                           │
│    2 tasks can run in parallel with the critical path.   │
└──────────────────────────────────────────────────────────┘
```

---

## Files Modified/Created

| File | Action | Summary |
|------|--------|---------|
| `components/MultiInstancePanel.tsx` | **Created** | Full 4-tab panel UI (Windows/Workspaces/Sessions/IPC) |
| `components/TaskBoard.tsx` | Modified | Dep editing (delete/connect), AI optimization, interactive arrows |
| `components/IDELayout.tsx` | Modified | Lazy-load MultiInstancePanel, store bindings |
| `store.ts` | Modified | +`multiInstancePanelOpen` / `setMultiInstancePanelOpen` |
| `utils/i18n-data.ts` | Modified | +35 keys (zh) + 35 keys (en) |
| `utils/i18n-ja.ts` | Modified | +10 ja overrides |
| `utils/i18n-ko.ts` | Modified | +10 ko overrides |
| `__tests__/task-board-p5.test.ts` | Updated | +20 new tests |
| `docs/README-P9-Handoff.md` | Created | This document |

---

## i18n Keys Added

### Task Board Dependency & AI (per language)
| Key | zh | en |
|-----|----|----|
| `tbDepEdit` | 依赖编辑 | Deps |
| `tbDepRemoved` | 依赖已移除 | Dependency removed |
| `tbDepAdded` | 依赖已添加 | Dependency added |
| `tbDepClickSource` | 点击任务条设置源 | Click a task bar to set source |
| `tbDepClickTarget` | 点击任务条设置目标 | Click a task bar to set target |
| `tbAiOptimize` | AI 优化 | AI Optimize |
| `tbAiOptTitle` | AI 关键路径优化建议 | AI Critical Path Optimization |
| `tbAiBottleneck` | 检测到瓶颈 | Bottleneck Detected |
| `tbAiParallel` | 并行化机会 | Parallelization Opportunity |
| `tbAiOverdue` | 逾期关键任务 | Overdue Critical Tasks |
| `tbAiBlocked` | 阻塞关键任务 | Blocked Critical Tasks |

### Multi-Instance Panel (25 keys per language)
`miTitle`, `miWindows`, `miWorkspaces`, `miSessions`, `miIpcLog`, `miSearch`, `miInstances`, `miNewWindow`, `miWindowCreated`, `miWindowClosed`, `miWindowTitle`, `miCreate`, `miVisible`, `miHidden`, `miMinimized`, `miNoWindows`, `miWorkspaceCount`, `miNewWorkspace`, `miWorkspaceCreated`, `miWorkspaceName`, `miImport`, `miExported`, `miImported`, `miImportFailed`, `miPasteJson`, `miActivated`, `miDuplicated`, `miDeleted`, `miNoWorkspaces`, `miSessionCount`, `miTotal`, `miActive`, `miIdle`, `miSuspended`, `miNewSession`, `miSessionCreated`, `miSessionName`, `miSelectWorkspace`, `miResumed`, `miSuspendedAction`, `miFocused`, `miNoSessions`, `miMessages`, `miRefresh`, `miClear`, `miCleared`, `miNoMessages`

---

## Test Suite Update

| Suite | New Tests | Running Total |
|-------|-----------|--------------|
| Previous (P5-P8) | — | 63 |
| Dependency Editing | 4 | 67 |
| AI Critical Path Optimization | 4 | 71 |
| Multi-Instance Panel Integration | 4 | 75 |
| i18n P9 Keys | 4 | 79 |
| **P9 Total New** | **16** | **79** |

**Run:** `pnpm vitest run src/app/components/__tests__/task-board-p5.test.ts`

---

## Local Development Checklist

### Multi-Instance Panel
1. Open the app → find the Multi-Instance Panel entry (via Command Palette or store toggle)
2. **Windows tab**: Create a new window → verify it appears in the grid → minimize → restore → close
3. **Workspaces tab**: Create workspace → activate → duplicate → export (check clipboard) → import
4. **Sessions tab**: Create session → observe stats update → suspend → resume → delete
5. **IPC Log tab**: Perform actions above → observe messages appear → refresh → clear

### Dependency Editing
6. Open Task Board → Timeline view → click **"Deps"** toggle
7. **Delete**: Click any dependency arrow → observe it disappears + toast
8. **Connect**: Click task bar A (source shows cyan pulse) → click task bar B → new arrow appears + toast
9. Click "Deps" again to exit edit mode
10. Verify Ctrl+Z undoes date changes but not dependency edits (separate concern)

### AI Critical Path Optimization
11. Ensure Critical Path is ON → click **"AI Optimize"** button
12. Observe suggestion cards:
    - Bottleneck: identifies longest task
    - Parallelization: counts non-critical tasks
    - Overdue: lists past-due critical tasks
    - Blocked: lists blocked critical tasks
13. Click task chip in a suggestion → task editor opens

### Run All Tests
14. `pnpm vitest run src/app/components/__tests__/task-board-p5.test.ts`
15. Expect **79** passing tests (was 63)

---

## Suggestions for Next Phase (P10)

1. **Cycle detection** in dependency editor — prevent circular dependencies with visual warning
2. **Drag-to-connect** — mouse drag from task bar right edge to another bar's left edge to create dependency
3. **Multi-Instance Panel in Header** — quick-access button with instance count badge
4. **Workspace templates** — predefined configs (Frontend, Backend, Full-Stack, AI Research)
5. **AI auto-scheduling** — re-order critical path tasks based on resource availability and team capacity
6. **Timeline export** — export Gantt chart as PNG/SVG

---

## Cumulative Phase Summary

| Phase | Features | Tests Added | Total Tests |
|-------|----------|-------------|-------------|
| P5 | i18n keys, Timeline zoom, badge logic | 18 | 18 |
| P6 | Virtual list, snap-to-day, reminder read | 9 | 27 |
| P7 | Drag tooltip, undo/redo, dependency arrows | 16 | 43 |
| P8 | Critical path, minimap, multi-instance stores | 20 | 63 |
| **P9** | **Multi-Instance Panel, dep editing, AI optimize** | **16** | **79** |

---

**Document Version**: v1.5.0
**Last Updated**: 2026-03-18
**Maintainer**: YanYuCloudCube Team

> **言启象限 | 语枢未来 | Words Initiate Quadrants, Language Serves as Core for Future**
> **万象归元于云枢 | 深栈智启新纪元**
> **All things converge in cloud pivot; Deep stacks ignite a new era of intelligence**
