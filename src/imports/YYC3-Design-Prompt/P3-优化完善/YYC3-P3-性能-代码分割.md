---
file: YYC3-P3-性能-代码分割.md
description: 代码分割策略 (Route-based + Vendor + Dynamic import)
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
status: stable
tags: p3,performance,code-splitting
---

# YYC³ P3-性能-代码分割

## 策略

### 1. Route-based Splitting

```typescript
const Home = React.lazy(() => import('./pages/Home'));
const Editor = React.lazy(() => import('./pages/Editor'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Database = React.lazy(() => import('./pages/Database'));
const Collaboration = React.lazy(() => import('./pages/Collaboration'));
```

- 每个路由页面独立 chunk
- Suspense fallback 加载指示器

### 2. Vendor Chunks (vite.config.ts)

```typescript
manualChunks: {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'editor-vendor': ['@tiptap/react', '@tiptap/starter-kit', 'monaco-editor'],
  'ui-vendor': ['framer-motion', 'lucide-react'],
  'utils-vendor': ['dayjs', 'lodash-es', 'zustand'],
  'collab-vendor': ['yjs', 'y-websocket'],
  'ai-vendor': ['openai', '@anthropic-ai/sdk'],
}
```

### 3. Dynamic Import (按需加载)

```typescript
// 重型模块按需加载
const MonacoEditor = React.lazy(() => import('./editor/MonacoEditor'));
const TipTapEditor = React.lazy(() => import('./editor/TipTapEditor'));
const ThreeJSPreview = React.lazy(() => import('./preview/ThreeJSPreview'));
const TerminalPanel = React.lazy(() => import('./panels/TerminalPanel'));
```

### 4. Prefetch 策略

```typescript
// 预加载可能需要的模块
const prefetchEditor = () => import('./editor/MonacoEditor');
// 鼠标悬停时预加载
<Link onMouseEnter={prefetchEditor} to="/editor">编辑器</Link>
```

## 构建优化

- chunkSizeWarningLimit: 1000KB
- minify: terser (drop_console/debugger)
- sourcemap: true (production 可选关闭)
- tree-shaking: ES modules, sideEffects: false
