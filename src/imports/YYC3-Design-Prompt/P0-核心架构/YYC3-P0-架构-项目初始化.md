---
file: YYC3-P0-架构-项目初始化.md
description: P0-核心架构 - 项目初始化和基础配置提示词
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
updated: 2026-03-14
status: stable
tags: p0,architecture,project-initialization
---

# YYC³ P0-架构 - 项目初始化

- **阶段编号**: P0-01
- **优先级**: P0-Critical
- **预计时间**: 30分钟

## 阶段目标

初始化 YYC³ AI Code 项目，搭建基础架构，配置开发环境。

## 技术栈

- React 18.3.1 / TypeScript 5.3.3 / Vite 5.0.12 / Tauri / Lucide React 0.312.0

## 项目结构

```
yyc3-ai-code/
├── packages/
│   ├── core/        # Core business logic
│   ├── ui/          # UI components
│   └── shared/      # Shared utilities
├── src/
│   ├── main.tsx     # Entry point
│   ├── App.tsx      # Root component
│   ├── components/  # Shared components
│   ├── stores/      # Zustand state
│   ├── hooks/       # Custom hooks
│   ├── types/       # TypeScript types
│   └── utils/       # Utilities
├── src-tauri/       # Tauri backend (Rust)
├── public/          # Static assets
├── vite.config.ts
├── tsconfig.json
└── tauri.conf.json
```

## 核心配置

### Vite: port 3201, alias @/ -> src/, react plugin

### TypeScript: ES2020, strict, react-jsx, bundler resolution

### Tauri: allowlist fs/dialog/notification/shell, bundle all targets

## 验收标准

- 开发服务器正常启动 (localhost:3201)
- Tauri 应用窗口正常打开
- TypeScript 编译无错误
- ESLint 检查通过
