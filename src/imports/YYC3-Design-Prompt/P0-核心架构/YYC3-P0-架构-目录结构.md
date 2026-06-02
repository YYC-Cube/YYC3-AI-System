---
file: YYC3-P0-架构-目录结构.md
description: 项目目录结构定义，基于模块化设计原则
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
updated: 2026-03-14
status: stable
tags: p0,architecture,directory,structure
---

# YYC³ P0-架构 - 目录结构

## 设计原则

1. 模块化：高内聚低耦合
2. 可扩展性：易于添加新功能
3. 一致性：统一命名和结构规范

## 命名规范

- 目录名: kebab-case
- 文件名: kebab-case
- 组件名: PascalCase
- 类型名: PascalCase
- 常量名: UPPER_SNAKE_CASE
- 函数名: camelCase

## 完整目录结构

```
yyc3-ai-code/
├── .github/workflows/          # CI/CD
├── .vscode/                    # VSCode 配置
├── public/                     # 静态资源
├── src/
│   ├── api/                    # API 客户端
│   │   ├── client.ts
│   │   ├── endpoints/          # auth.ts, user.ts, project.ts
│   │   └── types.ts
│   ├── assets/                 # images/, icons/, fonts/, styles/
│   ├── components/
│   │   ├── ui/                 # Button/, Input/, Modal/, Dropdown/
│   │   ├── layout/             # Header/, Sidebar/, Footer/
│   │   ├── feedback/           # Toast/, Alert/
│   │   └── data-display/       # Table/, Card/
│   ├── contexts/               # ThemeContext, AuthContext, LayoutContext
│   ├── editor/                 # TipTap, Monaco, Markdown editors
│   ├── hooks/                  # useDebounce, useThrottle, useLocalStorage...
│   ├── layouts/                # MainLayout, AuthLayout, EditorLayout
│   ├── pages/                  # Home/, Editor/, Settings/, Collaboration/
│   ├── router/                 # routes.ts, guards.ts
│   ├── services/               # auth/, user/, project/
│   ├── storage/                # db.ts, encryption.ts, sync.ts, cache.ts
│   ├── stores/                 # useLayoutStore, useEditorStore, useAuthStore
│   ├── types/                  # api.ts, models.ts, components.ts, utils.ts
│   ├── utils/                  # format, validation, date, string, number
│   ├── styles/                 # globals.css, variables.css, themes/
│   ├── constants/              # api.ts, routes.ts, storage.ts
│   ├── config/                 # app.config.ts, env.config.ts
│   ├── i18n/                   # locales/zh-CN.json, en-US.json
│   ├── tests/                  # setup.ts, utils.ts, mocks.ts
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands/           # fs.rs, dialog.rs, notification.rs
│   │   └── utils/
│   ├── Cargo.toml
│   └── tauri.conf.json
├── tests/                      # unit/, integration/, e2e/
├── docs/                       # 项目文档
├── scripts/                    # build.sh, dev.sh, test.sh
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 组件文件组织

```
Component/
├── Component.tsx         # 实现
├── Component.test.tsx    # 测试
├── Component.types.ts    # 类型
└── index.ts             # 导出
```
