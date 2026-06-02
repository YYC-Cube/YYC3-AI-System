---
file: YYC3-P1-前端-多面板布局.md
description: 多面板布局系统提示词
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
status: stable
tags: p1,frontend,multi-panel-layout
---

# YYC³ P1-前端-多面板布局

## Panel Types
code-editor, file-browser, preview, terminal, debug, output, search, ai-chat, database, version-control

## 组件架构
LayoutProvider -> Workspace -> PanelContainer -> Panel (PanelHeader + TabBar + PanelContent) + PanelResizeHandle + PanelToolbar

## LayoutContext API
- Panel CRUD: addPanel, removePanel, updatePanel, movePanel, resizePanel
- Panel State: lockPanel, minimizePanel, maximizePanel
- Tab CRUD: addTab, removeTab, switchTab, updateTab
- Layout: setActivePanel, saveLayout, loadLayout, resetLayout

## Default Layout (12-column grid)
- file-browser: x=0 w=3 h=12
- code-editor: x=3 w=6 h=12
- preview: x=9 w=3 h=12

## 技术栈
react-grid-layout, react-dnd + html5-backend, react-resizable, react-split-pane, react-tabs

## 样式: Liquid Glass 毛玻璃风格
- backdrop-filter: blur(10px)
- background: rgba(30,41,59,0.8)
- border: active ? 2px solid #6366f1 : 1px solid #334155
