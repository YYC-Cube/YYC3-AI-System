---
file: README-P11-Handoff.md
description: YYC³便携式智能AI系统 - P11开发交接文档
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-18
updated: 2026-03-18
status: dev
tags: readme,handoff,p11,zh-CN
category: guide
language: zh-CN
project: yyc3-platform
phase: p11
audience: developers
complexity: advanced
---

> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
> *万象归元于云枢 | 深栈智启新纪元*
> ***All things converge in cloud pivot; Deep stacks ignite a new era of intelligence***

---

# YYC3 PortAISys — P11 Handoff Document

**Version**: v1.0.0  
**Date**: 2026-03-18  
**Author**: YanYuCloudCube Team <admin@0379.email>  
**Status**: dev  

---

## P11 Phase Summary

This phase implemented three core features for the Task Board Timeline view:

### 1. Drag-to-Connect Dependency Creation

**Files Modified**: `src/app/components/TaskBoard.tsx`

- Added `data-task-bar-id` attribute to each task bar for DOM-based target detection
- Added `group/bar` CSS class to enable hover-visible connection dots
- **Green dot (right edge)**: Drag source — `onMouseDown` initiates drag-connect mode
- **Cyan dot (left edge)**: Drop target — detected via `document.elementFromPoint()` on mouseup
- `dragConnect` state tracks `{ fromId, fromX, fromY, mouseX, mouseY }`
- SVG overlay renders a dashed green line from source to cursor during drag
- On drop, calls existing `handleAddDependency()` which includes cycle detection
- `timelineAreaRef` references the scroll container for coordinate transformation
- Uses `data-timeline-area` attribute on container for `.closest()` lookups

### 2. PNG Export (SVG → Canvas → PNG)

**Files Modified**: `src/app/components/TaskBoard.tsx`

- Refactored `handleExportTimeline` into `buildTimelineSvg()` returning `{ svgContent, svgWidth, svgHeight }`
- `handleExportSvg()` — downloads SVG directly (existing behavior)
- `handleExportPng()` — renders SVG to `Image`, draws to `Canvas` at 2x scale, exports via `canvas.toBlob()`
- Export button now shows a dropdown menu with SVG and PNG options
- PNG files named `yyc3-timeline-YYYY-MM-DD.png`

### 3. Dependency Force-Directed Graph Panel

**Files Modified**: `src/app/components/TaskBoard.tsx`

- New `DependencyGraph` component using raw Canvas API
- **Force-directed layout algorithm**:
  - Repulsion: Coulomb-like force (8000/d²) between all node pairs
  - Attraction: Spring force on dependency edges (rest length 120px)
  - Center gravity: 0.001 pull toward canvas center
  - Velocity damping: 0.85 per frame
  - 300 simulation iterations with decaying alpha
- **Visual features**:
  - Node circles colored by task status (blue=in-progress, green=done, etc.)
  - Inner priority dot (red=critical, orange=high, blue=medium, green=low)
  - Critical path nodes have amber glow halo
  - Dependency edges rendered as quadratic bezier curves with arrowheads
  - Critical path edges: solid amber; others: dashed indigo
  - Labels truncated to 16 chars
- **Interactions**:
  - Hover: enlarges node (18→22px radius)
  - Drag: repositions nodes in real-time
  - Double-click: opens task edit modal
- Toggle button "Graph" (GitBranch icon) in Timeline toolbar, violet theme

---

## New UI Elements

| Element | Location | Behavior |
|---------|----------|----------|
| Green dot (right bar edge) | Timeline task bars | Drag to create dependency |
| Cyan dot (left bar edge) | Timeline task bars | Visual drop target indicator |
| Green dashed SVG line | Timeline overlay | Shows during drag-connect |
| Export dropdown (SVG/PNG) | Timeline toolbar | Replaces single export button |
| "Graph" toggle button | Timeline toolbar | Shows/hides force-directed graph |
| DependencyGraph canvas | Below toolbar, above timeline | 320px height interactive graph |

---

## State Additions

| State | Type | Purpose |
|-------|------|---------|
| `dragConnect` | `{ fromId, fromX, fromY, mouseX, mouseY } \| null` | Tracks drag-to-connect in progress |
| `showExportMenu` | `boolean` | Export dropdown visibility |
| `showDepGraph` | `boolean` | Dependency graph panel visibility |
| `timelineAreaRef` | `RefObject<HTMLDivElement>` | Container ref for coordinate math |

---

## Test Assertions

Existing 94 assertions remain intact. Suggested new tests (+8):

1. Drag-connect creates dependency between two tasks
2. Drag-connect to same task is rejected
3. Drag-connect triggering cycle detection shows warning
4. PNG export produces valid blob
5. SVG export produces valid SVG string
6. DependencyGraph renders canvas with correct node count
7. DependencyGraph double-click opens edit modal
8. DependencyGraph drag repositions node

**Expected total**: 102 assertions

---

## i18n Keys Added

| Key | en | zh | ja | ko |
|-----|----|----|----|----|
| `tbDepGraph` | Dependency Graph | 依赖关系图 | 依存関係グラフ | 의존성 그래프 |
| `tbNodes` | nodes | 节点 | ノード | 노드 |
| `tbDblClickEdit` | Dbl-click edit | 双击编辑 | ダブルクリック編集 | 더블클릭 편집 |
| `tbDragMove` | Drag to reposition | 拖拽移动 | ドラッグ移動 | 드래그 이동 |
| `tbExportedSvg` | Timeline exported as SVG | 时间线已导出为 SVG | SVGとしてエクスポート | SVG로 내보냄 |
| `tbExportedPng` | Timeline exported as PNG | 时间线已导出为 PNG | PNGとしてエクスポート | PNG로 내보냄 |
| `tbVector` | (Vector) | (矢量) | (ベクター) | (벡터) |
| `tbRaster` | (Raster 2x) | (位图 2x) | (ラスター 2x) | (래스터 2x) |

---

## Architecture Notes

- DependencyGraph uses raw `<canvas>` rather than D3/SVG for performance with many nodes
- Force simulation runs 300 frames then stops (re-triggers on task/theme changes)
- Drag-to-connect uses `document.elementFromPoint()` for target detection, avoiding complex hit-testing
- PNG export leverages SVG→Image→Canvas pipeline at 2x DPI for retina quality

---

## Suggested Next Steps (P12)

1. **Task dependency graph export** — Export the force-directed graph as PNG/SVG
2. **Dependency type labels** — Support FS/FF/SS/SF dependency types on edges
3. **Multi-select drag-connect** — Shift+drag to create dependencies from multiple sources
4. **Graph layout presets** — Hierarchical top-down, left-right, radial layouts
5. **Real-time collaboration** — yjs integration for multi-user task editing
6. **i18n completion** — Add missing i18n keys to all 4 language files

---

## Local Development Guide

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build
```

### Key files to review:
- `src/app/components/TaskBoard.tsx` — Main task board with all 3 new features
- `src/app/services/task-store.ts` — Task state management (Zustand)

### Testing the new features:
1. **Drag-connect**: In Timeline view, hover over a task bar to see green/cyan dots. Drag from the green dot (right edge) to another bar's cyan dot (left edge).
2. **PNG Export**: Click the Export dropdown in Timeline toolbar, select "PNG (Raster 2x)".
3. **Dependency Graph**: Click the "Graph" button (violet) in Timeline toolbar to toggle the force-directed visualization.

---

> **YanYuCloudCube**  
> 言启象限 | 语枢未来  
> Words Initiate Quadrants, Language Serves as Core for Future
