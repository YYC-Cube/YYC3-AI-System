---
file: README-P10-Handoff.md
description: YYC³便携式智能AI系统 - P10开发交接指南
author: YanYuCloudCube Team <admin@0379.email>
version: v1.6.0
created: 2026-03-18
updated: 2026-03-18
status: stable
tags: readme,handoff,p10,zh-CN
category: guide
language: zh-CN
project: yyc3-platform
phase: p10
audience: developers
complexity: advanced
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC3 PortAISys - P10 Development Handoff

> **YanYuCloudCube** | 万象归元于云枢 | 深栈智启新纪元

---

## Phase Summary

P10 delivers three features: **Circular Dependency Detection** (DFS-based DAG cycle guard with visual warning banner), **Timeline SVG Export** (one-click download of Gantt chart as publication-quality SVG), and **Header Multi-Instance Quick Access** (Layers icon with instance count badge + Ctrl+Shift+I shortcut).

---

## 1. Circular Dependency Detection

### Algorithm
When user attempts to add dependency `fromId → toId` (meaning `toId` depends on `fromId`):

```
1. Build adjacency list from ALL existing task dependencies
2. Tentatively add the new edge: adj[fromId] → toId
3. DFS from toId — if we can reach fromId, a cycle exists
4. If cycle detected: reject, show warning, toast error
5. If no cycle: proceed with addDependency as normal
```

**Time complexity:** O(V + E) per edge addition — efficient for typical task boards.

### Visual Warning
When a cycle is detected:
- **Red animated banner** appears below the toolbar with `animate-pulse`
- Contains AlertTriangle icon + bilingual message
- Auto-dismisses after 3 seconds (or dismiss manually via X button)
- Toast error notification also fires

### Example Cycle Detection
```
Task A depends on Task C
Task B depends on Task A  
Task C depends on Task B
→ A→B→C→A = CYCLE DETECTED ✕
```

### Code Location
- `TaskBoard.tsx` → `handleAddDependency()` function
- DFS inline with adjacency map construction
- `cycleWarning` state drives the banner visibility

---

## 2. Timeline SVG Export

### How It Works
Click the **"Export"** button in the Timeline toolbar → generates a complete SVG file and triggers browser download.

### SVG Contents
| Element | Details |
|---------|---------|
| Background | Dark (#0f172a) or Light (#ffffff) based on current theme |
| Header labels | Date labels at configured intervals |
| Today line | Dashed indigo vertical line |
| Task labels | Left-aligned task titles (truncated to 22 chars) |
| Task bars | Color-coded by priority (red/orange/blue/green) |
| Critical path highlight | Amber stroke ring around critical-path bars |
| Dependency arrows | Cubic bezier curves (dashed indigo or solid amber for CP) |

### Export Details
- **Format:** SVG (vector, infinite scalability)
- **Filename:** `yyc3-timeline-YYYY-MM-DD.svg`
- **Method:** Blob URL → `<a>` click → auto-download
- **Theme-aware:** Exports match current dark/light theme

### Code Location
- `TaskBoard.tsx` → `handleExportTimeline()` callback
- Programmatic SVG string construction from `sortedTasks`, `depArrows`, `criticalPathIds`

---

## 3. Header Multi-Instance Quick Access

### Button
- **Icon:** `Layers` (from lucide-react)
- **Position:** After Quick Actions (Zap) in header icon row
- **Badge:** Shows instance count when > 1 (red circular badge)
- **Action:** Opens `MultiInstancePanel` modal
- **Shortcut:** `Ctrl+Shift+I`

### Integration
```
Header.tsx
├── import { useWindowManagerStore }
├── instanceCount = useWindowManagerStore(s => s.instances.length)
├── headerIcons[...] += { icon: Layers, badge: instanceCount > 1 ? instanceCount : undefined }
└── onClick → setMultiInstancePanelOpen(true)

IDELayout.tsx
├── Ctrl+Shift+I → setMultiInstancePanelOpen(true)
```

---

## Files Modified

| File | Action | Summary |
|------|--------|---------|
| `TaskBoard.tsx` | Modified | Cycle detection DFS in handleAddDependency, cycleWarning banner, handleExportTimeline SVG generator, Export button |
| `Header.tsx` | Modified | +Layers import, +useWindowManagerStore, +instanceCount badge, +Multi-Instance icon entry |
| `IDELayout.tsx` | Modified | +Ctrl+Shift+I shortcut |
| `utils/i18n-data.ts` | Modified | +4 keys zh, +4 keys en (tbCycleDetected, tbCycleDesc, tbExport, tbExported) |
| `utils/i18n-ja.ts` | Modified | +4 keys ja |
| `utils/i18n-ko.ts` | Modified | +4 keys ko |
| `__tests__/task-board-p5.test.ts` | Updated | +17 tests |
| `docs/README-P10-Handoff.md` | Created | This document |

---

## i18n Keys Added (P10)

| Key | zh | en | ja | ko |
|-----|----|----|----|----|
| `tbCycleDetected` | 检测到循环依赖！无法添加此链接。 | Circular dependency detected! Cannot add this link. | 循環依存が検出されました！ | 순환 의존성이 감지되었습니다! |
| `tbCycleDesc` | 添加此依赖会形成环路... | Adding this dependency would create a cycle... | この依存関係を追加すると... | 이 의존성을 추가하면... |
| `tbExport` | 导出 | Export | エクスポート | 내보내기 |
| `tbExported` | Timeline 已导出为 SVG | Timeline exported as SVG | タイムラインをSVGとして... | 타임라인이 SVG로... |

---

## Test Suite Update

| Suite | New Tests | Running Total |
|-------|-----------|--------------|
| Previous (P5-P9) | — | 79 |
| Cycle Detection | 5 | 84 |
| Timeline Export | 3 | 87 |
| Header Multi-Instance | 3 | 90 |
| i18n P10 Keys | 4 | 93 |
| **P10 Total New** | **15** | **~94** |

**Run:** `pnpm vitest run src/app/components/__tests__/task-board-p5.test.ts`

---

## Local Development Checklist

### Cycle Detection
1. Open Task Board → Timeline → enable "Deps" mode
2. Find two tasks that have existing dependencies (e.g., Task A depends on Task B)
3. Try to connect Task B → Task A (creating a cycle)
4. **Expected:** Red pulsing banner appears: "Circular dependency detected!"
5. **Expected:** Toast error notification
6. **Expected:** Banner auto-dismisses after 3 seconds
7. Try a valid connection (no cycle) → should succeed normally

### Timeline Export
8. Open Task Board → Timeline view (with some tasks visible)
9. Click **"Export"** button in the toolbar
10. **Expected:** Browser downloads `yyc3-timeline-YYYY-MM-DD.svg`
11. Open the SVG in browser or image viewer
12. **Verify:** Task bars, labels, dependency arrows, critical path highlights, today line all visible
13. Switch to light theme → export again → verify light-theme SVG

### Header Multi-Instance Button
14. Look at the Header icon row → find **Layers** icon (after Zap)
15. **Expected:** If > 1 instance exists in store, a red badge with count appears
16. Click the icon → **Expected:** MultiInstancePanel modal opens
17. Press `Ctrl+Shift+I` → **Expected:** Same panel opens
18. Create 2+ instances in the panel → go back to Header → verify badge appears

### Run All Tests
19. `pnpm vitest run src/app/components/__tests__/task-board-p5.test.ts`
20. Expect **~94** passing tests

---

## Cumulative Phase Summary

| Phase | Features | Tests Added | Total Tests |
|-------|----------|-------------|-------------|
| P5 | i18n keys, Timeline zoom, badge logic | 18 | 18 |
| P6 | Virtual list, snap-to-day, reminder read | 9 | 27 |
| P7 | Drag tooltip, undo/redo, dependency arrows | 16 | 43 |
| P8 | Critical path, minimap, multi-instance stores | 20 | 63 |
| P9 | Multi-Instance Panel, dep editing, AI optimize | 16 | 79 |
| **P10** | **Cycle detection, SVG export, Header MI button** | **~15** | **~94** |

---

## Suggestions for Next Phase (P11)

1. **PNG export** — render SVG to canvas then export as PNG (for non-vector use cases)
2. **Drag-to-connect dependencies** — mouse drag from bar right edge → another bar left edge
3. **Workspace templates** — predefined configurations (Frontend, Backend, Full-Stack, AI Research)
4. **Task dependency graph view** — dedicated force-directed graph visualization panel
5. **AI auto-scheduling** — reorder critical path tasks based on resource availability
6. **Multi-instance IPC real Tauri bridge** — replace simulated IPC with actual `invoke()` calls

---

**Document Version**: v1.6.0
**Last Updated**: 2026-03-18
**Maintainer**: YanYuCloudCube Team

> **言启象限 | 语枢未来 | Words Initiate Quadrants, Language Serves as Core for Future**
> **万象归元于云枢 | 深栈智启新纪元**
> **All things converge in cloud pivot; Deep stacks ignite a new era of intelligence**
