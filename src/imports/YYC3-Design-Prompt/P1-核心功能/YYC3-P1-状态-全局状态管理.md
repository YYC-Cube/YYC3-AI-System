---
file: YYC3-P1-状态-全局状态管理.md
description: Zustand 全局状态管理设计
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
status: stable
tags: p1,state,zustand,global
---

# YYC³ P1-状态-全局状态管理

## Stores 架构

1. useAuthStore (persist) - user, isAuthenticated, login/logout/refreshToken
2. useUserStore (devtools + subscribeWithSelector) - users[], CRUD ops
3. useProjectStore (devtools + subscribeWithSelector) - projects[], CRUD ops
4. useEditorStore (subscribeWithSelector) - files[], editorConfig, searchState
5. useLayoutStore (devtools + persist) - panels, grid config, drag/resize state
6. usePreviewStore (subscribeWithSelector) - content, device, autoRefresh
7. useThemeStore (persist) - theme (light/dark/auto), toggleTheme
8. useNotificationStore (subscribeWithSelector) - notifications[], auto-dismiss

## 设计原则

- 选择器优化: useStore(state => state.field) 避免不必要重渲染
- Middleware: devtools(开发调试), persist(持久化), subscribeWithSelector(精确订阅)
- 类型安全: 完整 TypeScript 接口定义
