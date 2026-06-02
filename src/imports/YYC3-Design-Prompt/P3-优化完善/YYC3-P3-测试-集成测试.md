---
file: YYC3-P3-测试-集成测试.md
description: 集成测试和 E2E 测试 (Playwright)
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
status: stable
tags: p3,testing,integration,e2e,playwright
---

# YYC³ P3-测试-集成测试

## 集成测试 (Vitest + RTL)

- 模块间交互: Store -> Service -> Bridge
- API 集成: React Query hooks + msw mock
- 数据库集成: StorageService + Dexie (fake-indexeddb)
- 文件系统集成: FileService + Tauri invoke mock
- 覆盖率目标: > 70%

## E2E 测试 (Playwright)

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:3201', headless: true },
  webServer: { command: 'pnpm dev', port: 3201 },
});
```

## E2E 测试用例

1. **文件浏览**: 打开/创建/重命名/删除文件
2. **代码编辑**: 打开文件 -> 编辑 -> 保存 -> 验证
3. **数据库连接**: 添加连接 -> 测试 -> 执行查询
4. **AI 对话**: 发送消息 -> 等待响应 -> 验证
5. **实时协作**: 双窗口同步编辑
6. **布局管理**: 面板拖拽/分割/合并/保存布局
7. **文件同步**: 编辑 -> 同步 -> 验证历史
8. **设置**: 主题切换/语言切换/快捷键配置

## data-testid 规范

- 面板: `panel-{type}`, 按钮: `btn-{action}`, 输入: `input-{field}`
- 列表项: `item-{id}`, 对话框: `dialog-{name}`

## CI 集成

```yaml
- run: pnpm test:e2e
  env: { CI: true }
```
