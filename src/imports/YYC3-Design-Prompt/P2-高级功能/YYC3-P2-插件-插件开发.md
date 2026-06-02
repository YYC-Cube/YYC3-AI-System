---
file: YYC3-P2-插件-插件开发.md
description: 插件开发指南和 API 文档
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
status: stable
tags: p2,plugin,development
---

# YYC³ P2-插件-插件开发

## 开发环境: Node.js>=18, TypeScript>=5, Vite>=5

## 项目结构
```
my-yyc3-plugin/
├── src/index.ts (入口), components/, services/, types/, utils/
├── public/icon.svg
├── package.json (含 yyc3.permissions 配置)
└── vite.config.ts (lib 模式, external react/react-dom)
```

## 核心 API

### BasePlugin 基类
- abstract activate(context: PluginContext): void
- abstract deactivate(): void
- onConfigChange?(config): void

### PluginContext
- api: PluginAPI (ui/editor/ai/database/collaboration/fetch/sendMessage/onMessage)
- config, storage, logger

### UI API
- registerPanel({id, title, position, component, icon, closable, resizable})
- registerButton({id, label, icon, position, onClick})
- registerMenuItem({id, label, position, onClick})
- showNotification/showDialog/showInputBox/showQuickPick

### Editor API
- getContent/setContent/getSelection/setSelection/insertText
- getFilePath/getLanguage/format/onContentChange

### AI API
- generateCode(prompt, options)/completeCode/optimizeCode/explainCode/reviewCode

## 示例插件
1. 代码格式化插件: registerButton -> editor.format()
2. AI 代码生成插件: registerMenuItem -> ai.generateCode(selection) -> insertText
3. 自定义面板插件: registerPanel -> React 组件

## 测试: Vitest + mock PluginContext
## 打包: vite build (ES module), npm pack
## 发布: 提交到 YYC3 插件市场
