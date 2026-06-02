---
file: README-P8-Handoff.md
description: YYC³便携式智能AI系统 - P8开发交接指南
author: YanYuCloudCube Team <admin@0379.email>
version: v1.4.0
created: 2026-03-18
updated: 2026-03-18
status: stable
tags: readme,handoff,p8,zh-CN
category: guide
language: zh-CN
project: yyc3-platform
phase: p8
audience: developers
complexity: advanced
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC3 PortAISys - P8 Development Handoff

> **YanYuCloudCube** | 万象归元于云枢 | 深栈智启新纪元

---

## Phase Summary

P8 delivers three major features: **Critical Path Highlighting** (auto-detect longest dependency chain with toggle & visual glow), **Timeline Minimap** (navigation thumbnail with draggable viewport), and **Multi-Instance Management System** (WindowManager, WorkspaceManager, SessionManager, IPCManager stores per the P2 design spec).

---

## 1. Critical Path Highlighting

### Algorithm
- **Topological sort** via Kahn's algorithm on the task dependency DAG
- **Longest-path dynamic programming**: `dist[node] = max(dist[predecessor] + duration(node))`
- **Backtrace** from the node with maximum accumulated distance to reconstruct the critical path chain

### Visual
- Tasks on the critical path get `ring-2 ring-amber-400/70 shadow-[0_0_6px_rgba(251,191,36,0.4)]` — a glowing amber ring
- A `★` star icon appears next to critical-path task titles in the label column
- In the minimap, critical-path bars render in `bg-amber-400/80` (distinct from normal `bg-indigo-400/40`)

### Toggle Button
```
[Critical Path (3)]   ← amber badge when ON, neutral when OFF
```
- Located in the Timeline toolbar between redo button and hint text
- Shows count of tasks in critical path
- State: `showCriticalPath` (default: `true`)

### Performance
- `criticalPathIds` is a `useMemo` — only recomputes when `sortedTasks` changes
- Algorithm runs in O(V + E) time — efficient even for large task sets

---

## 2. Timeline Minimap Navigation

### Architecture
```
scrollContainerRef ──→ main scrollable div (overflow-x: auto)
       ↕ scroll events
 [scrollLeft, containerWidth] state
       ↕ scale computation
 Minimap (280px wide, 28px tall)
   ├── Mini task bars (scaled proportionally)
   ├── Today marker (scaled indigo line)
   └── Viewport indicator (draggable rectangle)
```

### Interactions
| Interaction | Behavior |
|-------------|----------|
| **Click** on minimap | Smooth-scroll main view to center on clicked position |
| **Drag** viewport indicator | Real-time scroll tracking (grab cursor) |
| **Window resize** | Auto-recalculate containerWidth |

### Scaling
```
minimapScale = MINIMAP_W / totalContentWidth
viewportW = max(8, containerWidth * minimapScale)
viewportX = scrollLeft * minimapScale
```

### Visual
```
┌──────────────────────────────────────┐
│ ▪▪▪  ▪▪▪▪▪  ▪▪  ▪▪▪▪▪▪  ▪▪▪       │  ← mini bars
│      │     ┌────────┐               │  ← viewport indicator
│      ↑     └────────┘               │
│    today                            │
└──────────────────────────────────────┘
[Minimap]           ★ Critical: 3 tasks
```

---

## 3. Multi-Instance Management System

### File: `/src/app/services/multi-instance.ts`

Implements the full P2 design spec (YYC3-P2-Advanced-Feature-Multi-Instance.md) as Zustand stores:

### Stores Created

| Store | localStorage Key | Purpose |
|-------|-----------------|---------|
| `useWindowManagerStore` | `yyc3-window-manager` | App instance lifecycle (create/close/minimize/maximize/move/resize) |
| `useWorkspaceManagerStore` | `yyc3-workspace-manager` | Project workspaces (create/activate/duplicate/export/import) |
| `useSessionManagerStore` | `yyc3-session-manager` | AI chat, code edit, debug, terminal sessions |
| `ipcManager` (singleton) | in-memory | Event bus for cross-instance communication |

### Type Definitions
```typescript
InstanceType    = 'main' | 'secondary' | 'popup' | 'preview'
WindowType      = 'main' | 'editor' | 'preview' | 'terminal' | 'ai-chat' | 'settings'
WorkspaceType   = 'project' | 'ai-session' | 'debug' | 'custom'
SessionType     = 'ai-chat' | 'code-edit' | 'debug' | 'preview' | 'terminal'
IPCMessageType  = 'instance-created' | 'instance-closed' | 'workspace-*' | 'session-*' | 'state-sync' | ...
```

### Key Interfaces
- `AppInstance` — window position, size, state, session associations
- `Workspace` — project isolation with config (editor, AI, theme)
- `Session` — active/idle/suspended lifecycle with data payload
- `IPCMessage` — typed message passing with sender/receiver IDs

### IPC Manager Features
- Event subscription with `on()` returning unsubscribe function
- `broadcast()` for all-instance messaging
- `sendToInstance()` for targeted messaging
- Message log (last 200) for debugging
- In-memory event bus (web environment), ready for Tauri bridge upgrade

### Tauri Bridge Readiness
All store actions are structured to replace `ipcManager.broadcast()` calls with `invoke()` Tauri commands when deploying to desktop:
```typescript
// Web (current): ipcManager.broadcast('instance-created', instance)
// Tauri (future): await invoke('broadcast_message', { type: 'instance-created', data: instance })
```

---

## Files Modified/Created

| File | Action | Summary |
|------|--------|---------|
| `components/TaskBoard.tsx` | Modified | Critical path computation, toggle button, minimap, isCriticalPath prop |
| `services/multi-instance.ts` | **Created** | WindowManager, WorkspaceManager, SessionManager, IPCManager |
| `utils/i18n-data.ts` | Modified | +3 keys (zh + en): tbCriticalPath, tbCriticalPathLabel, tbMinimap |
| `utils/i18n-ja.ts` | Modified | +3 ja overrides |
| `utils/i18n-ko.ts` | Modified | +3 ko overrides |
| `__tests__/task-board-p5.test.ts` | Updated | +22 new tests |
| `docs/README-P8-Handoff.md` | Created | This document |

---

## i18n Keys Added (3 per language)

| Key | zh | en | ja | ko |
|-----|----|----|----|----|
| `tbCriticalPath` | 关键路径 | Critical Path | クリティカルパス | 크리티컬 패스 |
| `tbCriticalPathLabel` | 关键 | Critical | クリティカル | 크리티컬 |
| `tbMinimap` | 导航 | Minimap | ミニマップ | 미니맵 |

---

## Test Suite Update

| Suite | New Tests | Running Total |
|-------|-----------|--------------|
| Previous (P5+P6+P7) | — | 43 |
| Critical Path Algorithm | 3 | 46 |
| Timeline Minimap | 3 | 49 |
| Multi-Instance WindowManager | 3 | 52 |
| Multi-Instance WorkspaceManager | 3 | 55 |
| Multi-Instance SessionManager | 2 | 57 |
| IPC Manager | 2 | 59 |
| i18n P8 Keys | 4 | 63 |
| **P8 Total New** | **20** | **63** |

**Run:** `pnpm vitest run src/app/components/__tests__/task-board-p5.test.ts`

---

## Local Development Checklist

### Critical Path
1. `pnpm dev` → open Task Board → switch to **Timeline** view
2. Observe amber glow rings on tasks in the longest dependency chain
3. Look for `★` markers next to critical-path task titles
4. Click **Critical Path (N)** button to toggle highlight on/off
5. Verify count matches the actual dependency chain length

### Minimap
6. Scroll the timeline horizontally → observe viewport indicator moves in minimap
7. Click anywhere on the minimap → main view smooth-scrolls to that position
8. Drag the viewport indicator → real-time scroll tracking
9. Resize browser window → viewport indicator width updates

### Multi-Instance
10. Import stores in console: `import { useWindowManagerStore } from './services/multi-instance'`
11. Create instance: `useWindowManagerStore.getState().createInstance('editor')`
12. Verify localStorage key `yyc3-window-manager` is populated
13. Test workspace CRUD: create, activate, duplicate, export, import
14. Test session lifecycle: create, suspend, resume, delete
15. Test IPC: `ipcManager.on('state-sync', console.log)` then `ipcManager.broadcast('state-sync', {test:1})`

### Run All Tests
16. `pnpm vitest run src/app/components/__tests__/task-board-p5.test.ts`
17. Expect **63** passing tests

---

## Suggestions for Next Phase (P9)

1. **Multi-Instance Panel UI**: Build a visual panel component showing all windows/workspaces/sessions with create/switch/close controls
2. **Dependency Editor UI**: Click arrows to remove, drag between bars to create new dependencies
3. **Critical Path Optimization Suggestions**: AI-powered recommendations to shorten the critical path
4. **Timeline Export**: Export Gantt chart as PNG/SVG for sharing
5. **Workspace Templates**: Predefined workspace configurations (Frontend, Backend, Full-Stack, AI Research)

---

## Cumulative Phase Summary

| Phase | Features | Tests Added | Total Tests |
|-------|----------|-------------|-------------|
| P5 | i18n keys, Timeline zoom, badge logic | 18 | 18 |
| P6 | Virtual list, snap-to-day, reminder read | 9 | 27 |
| P7 | Drag tooltip, undo/redo, dependency arrows | 16 | 43 |
| **P8** | **Critical path, minimap, multi-instance** | **20** | **63** |

---

**Document Version**: v1.4.0
**Last Updated**: 2026-03-18
**Maintainer**: YanYuCloudCube Team

> **言启象限 | 语枢未来 | Words Initiate Quadrants, Language Serves as Core for Future**
