---
file: YYC3-P2-插件-插件系统.md
description: 插件系统架构设计和实现
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
status: stable
tags: p2,plugin,system,architecture
---

# YYC³ P2-插件-插件系统

## 功能目标
1. 插件加载：动态加载和管理插件
2. 插件通信：插件间消息传递机制
3. 生命周期：activate/deactivate 完整管理
4. 权限控制：storage|network|clipboard|notification|editor|database|ai
5. 热更新支持
6. 依赖管理

## 核心类型

### PluginManifest
```typescript
interface PluginManifest {
  id: string; name: string; version: string; description: string;
  author: string; appVersion: string; main: string; icon?: string;
  permissions: PluginPermission[]; dependencies?: string[];
  config?: PluginConfig[];
}
```

### PluginAPI
```typescript
interface PluginAPI {
  registerCommand(command, handler): void;
  registerMenuItem(item): void;
  registerToolbarButton(button): void;
  registerPanel(panel): void;
  sendMessage(pluginId, message): void;
  onMessage(handler): void;
  storage: PluginStorage; // get/set/delete/clear
  editor: EditorAPI;      // getContent/setContent/insertText/getSelection
  ai: AIAPI;              // chat/generateCode/completeCode
}
```

### Plugin 状态
- status: 'loading' | 'active' | 'inactive' | 'error'

## PluginManager
- loadPlugin(manifest): 动态 import(main) -> new module.default(api) -> activate()
- unloadPlugin(id): deactivate() -> delete
- getActivePlugins(): 过滤 active 状态
- sendMessage/onMessage: 插件间消息传递 (Map<string, Set<handler>>)

## PluginAPIImpl
- commands Map, menuItems Map, toolbarButtons Map, panels Map
- storage -> PluginStorageImpl (IndexedDB)
- editor -> EditorAPIImpl (Monaco bridge)
- ai -> AIAPIImpl (aiProviderManager bridge)
