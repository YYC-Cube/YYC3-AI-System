---
file: README-P7-Handoff.md
description: YYC³便携式智能AI系统 - P7开发交接指南
author: YanYuCloudCube Team <admin@0379.email>
version: v1.3.0
created: 2026-03-18
updated: 2026-03-18
status: stable
tags: readme,handoff,p7,zh-CN
category: guide
language: zh-CN
project: yyc3-platform
phase: p7
audience: developers
complexity: advanced
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC3 PortAISys - P7 Development Handoff

> **YanYuCloudCube** | 万象归元于云枢 | 深栈智启新纪元

---

## Phase Summary

P7 delivers three production-quality Timeline enhancements: **drag date tooltip**, **Ctrl+Z/Y undo/redo for date changes**, and **SVG dependency arrow rendering**.

---

## 1. Drag Date Tooltip Preview

### What Changed
- **File**: `TaskBoard.tsx` → `TimelineView` → `handleResizeStart`
- **State**: `dragTooltip: { x, y, label } | null`
- **Format**: `YYYY-MM-DD` with zero-padded month/day

### Behavior
- During drag resize (left or right edge), a floating tooltip appears near the cursor
- Shows the **snapped date** value in real-time
- Positioned at `cursor.x + 12, cursor.y - 28` to avoid occluding the bar
- Styled with Liquid Glass: dark mode uses `bg-slate-800 text-indigo-300`, light uses `bg-white text-indigo-700`
- Disappears immediately on mouse up

### Visual Design
```
  ┌─────────────┐
  │ 2026-03-25  │ ← fixed z-[9999], pointer-events-none
  └─────────────┘
       ↑
     cursor
```

---

## 2. Ctrl+Z/Y Undo/Redo for Date Changes

### Architecture

```
task-store.ts
├── dateUndoStack: DateChangeRecord[]
├── dateRedoStack: DateChangeRecord[]
├── pushDateChange(record) → push to undo, clear redo
├── undoDateChange()       → pop undo, apply oldValue, push to redo
└── redoDateChange()       → pop redo, apply newValue, push to undo
```

### DateChangeRecord Interface
```typescript
export interface DateChangeRecord {
  taskId: string
  field: 'dueDate' | 'createdAt'
  oldValue: number | undefined
  newValue: number | undefined
  timestamp: number
}
```

### Trigger Points
1. **Mouse up after drag** → `pushDateChange()` records the change
2. **Ctrl+Z** (keyboard) → `undoDateChange()` + toast
3. **Ctrl+Y** or **Ctrl+Shift+Z** (keyboard) → `redoDateChange()` + toast
4. **Undo/Redo buttons** in Timeline toolbar → same actions with toast

### UI: Undo/Redo Buttons
```
[GanttChart] Timeline  [Day|Week|Month]  [↩ Undo] [↪ Redo]  "Drag bar edges..."
```
- Buttons are disabled (grayed out) when respective stack is empty
- Tooltips show keyboard shortcuts: `(Ctrl+Z)` / `(Ctrl+Y)`

### Stack Behavior
| Action | Undo Stack | Redo Stack |
|--------|-----------|------------|
| Drag complete | +1 record | Cleared |
| Ctrl+Z | -1 record | +1 record |
| Ctrl+Y | +1 record | -1 record |
| New drag after undo | +1 record | Cleared |

---

## 3. SVG Dependency Arrows

### What Changed
- **Task Store**: Sample tasks now include `dependencies` fields:
  - `task-sample-3` → depends on `task-sample-1`
  - `task-sample-6` → depends on `task-sample-5`, `task-sample-4`
  - `task-sample-8` → depends on `task-sample-7`
- **TimelineView**: SVG overlay layer with cubic bezier paths

### Arrow Computation
```
For each task with dependencies:
  fromTask = dependency task (source)
  toTask   = current task (target)
  
  fromX = LABEL_W + rightEdgePx(fromTask)   // end of dependency bar
  fromY = fromIndex * ROW_H + ROW_H/2       // vertical center of row
  toX   = LABEL_W + leftEdgePx(toTask)      // start of dependent bar
  toY   = toIndex * ROW_H + ROW_H/2         // vertical center of row
```

### SVG Path
- Uses **cubic bezier** curves for smooth routing
- Control point offset: `min(|dx| * 0.4, 60)` px
- Path: `M fromX fromY C (fromX+cp) fromY, (toX-cp) toY, toX toY`
- Stroke: indigo, dashed (`4 2`), 50% opacity, 1.5px width
- Arrow marker: 6×4 triangle polygon at endpoint

### Visual
```
  [Task A ████████]───╮
                      ╰──→[Task B ██████████]
```

### Performance
- Arrows computed via `useMemo` — only recalculate when `sortedTasks`, `rangeStart`, or `zc.pxPerDay` change
- SVG layer uses `pointer-events-none` to not interfere with bar interactions
- Positioned absolutely over the task rows area

---

## Files Modified/Created

| File | Action | Summary |
|------|--------|---------|
| `services/task-store.ts` | Modified | Added `DateChangeRecord`, `dateUndoStack/Redo`, `pushDateChange`, `undoDateChange`, `redoDateChange`; sample dependencies |
| `components/TaskBoard.tsx` | Modified | Drag tooltip, undo/redo buttons + keyboard, SVG dependency arrows |
| `utils/i18n-data.ts` | Modified | Added `tbUndo/tbRedo/tbUndone/tbRedone/tbDependency` (zh + en) |
| `utils/i18n-ja.ts` | Modified | Added ja overrides for new keys |
| `utils/i18n-ko.ts` | Modified | Added ko overrides for new keys |
| `__tests__/task-board-p5.test.ts` | Updated | +17 new tests |
| `docs/README-P7-Handoff.md` | Created | This document |

---

## i18n Keys Added (5 per language)

| Key | zh | en | ja | ko |
|-----|----|----|----|----|
| `tbUndo` | 撤销 | Undo | 元に戻す | 실행 취소 |
| `tbRedo` | 重做 | Redo | やり直す | 다시 실행 |
| `tbUndone` | 已撤销日期变更 | Undo date change | 日付変更を元に戻しました | 날짜 변경을 취소했습니다 |
| `tbRedone` | 已重做日期变更 | Redo date change | 日付変更をやり直しました | 날짜 변경을 다시 실행했습니다 |
| `tbDependency` | 依赖 | Dependency | 依存関係 | 의존성 |

---

## Test Suite Update

**File:** `/src/app/components/__tests__/task-board-p5.test.ts`

| Suite | New Tests | Running Total |
|-------|-----------|--------------|
| Previous (P5+P6) | — | 27 |
| Drag Date Tooltip | 3 | 30 |
| Undo/Redo Date Changes | 4 | 34 |
| Dependency Arrow Computation | 5 | 39 |
| i18n P7 Undo/Redo Keys | 4 | 43 |
| **P7 Total** | **16** | **43** |

**Run:** `pnpm vitest run src/app/components/__tests__/task-board-p5.test.ts`

---

## Local Development Checklist

1. `pnpm install` → verify dependencies
2. `pnpm dev` → start dev server
3. Open Task Board (Ctrl+Shift+B) → switch to **Timeline** view

### Test: Drag Tooltip
4. Hover over any Gantt bar's right edge → cursor becomes `ew-resize`
5. Click and drag → floating date tooltip appears near cursor
6. Release → tooltip disappears, toast shows "Due date updated"

### Test: Undo/Redo
7. After a drag, press **Ctrl+Z** → bar reverts to previous position, toast: "Undo date change"
8. Press **Ctrl+Y** → bar returns to dragged position, toast: "Redo date change"
9. Click the **↩ Undo** / **↪ Redo** buttons in the toolbar → same behavior
10. Verify buttons are disabled when stacks are empty

### Test: Dependency Arrows
11. In Timeline view, observe dashed indigo arrows connecting:
    - Task 1 → Task 3
    - Task 4, Task 5 → Task 6
    - Task 7 → Task 8
12. Zoom to Week/Month → arrows scale with the timeline
13. Arrows should not interfere with bar clicks or drag handles

### Test: Run Tests
14. `pnpm vitest run src/app/components/__tests__/task-board-p5.test.ts`
15. Expect 43 passing tests

---

## Suggestions for Next Phase (P8)

1. **Dependency Editor UI**: Click arrow to remove dependency; drag between bars to create new dependency
2. **Critical Path Highlighting**: Auto-detect and highlight the longest dependency chain
3. **Timeline Minimap**: A small overview bar showing the full timeline range with viewport indicator
4. **Task Duration Editor**: Inline edit estimated hours directly on the Gantt bar
5. **Export Gantt as PNG/SVG**: Screenshot/export the timeline for external sharing

---

**Document Version**: v1.3.0
**Last Updated**: 2026-03-18
**Maintainer**: YanYuCloudCube Team

> **言启象限 | 语枢未来 | Words Initiate Quadrants, Language Serves as Core for Future**
