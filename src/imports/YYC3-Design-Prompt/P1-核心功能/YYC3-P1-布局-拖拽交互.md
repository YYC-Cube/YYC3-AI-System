---
file: YYC3-P1-布局-拖拽交互.md
description: 布局拖拽交互功能
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
status: stable
tags: p1,layout,drag,drop
---

# YYC³ P1-布局-拖拽交互

## useLayoutStore (Zustand + devtools + persist)

- panels[], selectedPanelId, dragging state, resizing state
- Panel ops: add/remove/update/select
- Drag: startDrag(panelId, e) -> onDrag(e) -> endDrag()
- Resize: startResize(panelId, direction, e) -> onResize(e) -> endResize()
- Grid snap: round to gridSize (default 20px)
- Layout persistence: localStorage auto-save

## DraggablePanel 组件

- Header 拖拽手柄 + title + 控制按钮 (minimize/maximize/close)
- Content area
- ResizeHandle (e/s/se 方向)
- 最小尺寸限制

## LayoutGrid 组件

- CSS Grid background lines (可切换)
- DraggablePanel 渲染
