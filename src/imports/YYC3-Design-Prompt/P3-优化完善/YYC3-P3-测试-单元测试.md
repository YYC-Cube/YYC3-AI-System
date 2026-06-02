---
file: YYC3-P3-测试-单元测试.md
description: Vitest 单元测试框架和策略
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
status: stable
tags: p3,testing,unit,vitest
---

# YYC³ P3-测试-单元测试

## 框架

| 工具                        | 用途         |
| --------------------------- | ------------ |
| Vitest                      | 测试运行器   |
| @testing-library/react      | 组件测试     |
| @testing-library/user-event | 用户交互模拟 |
| msw (Mock Service Worker)   | API Mock     |
| c8                          | 覆盖率报告   |

## 配置 (vitest.config.ts)

```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'c8',
      reporter: ['text', 'html', 'json'],
      thresholds: { lines: 80, branches: 80, functions: 80, statements: 80 },
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
```

## 测试范围

1. **工具函数**: format, validation, date, string, crypto
2. **业务逻辑**: FileService, VersionService, SyncService, AIService
3. **Zustand Stores**: useAuthStore, useEditorStore, useLayoutStore, usePreviewStore
4. **自定义 Hooks**: useDebounce, useThrottle, useLocalStorage
5. **加密**: encrypt/decrypt 往返测试, 错误密码测试

## 测试规范

- AAA 模式: Arrange -> Act -> Assert
- 每个 test 独立, beforeEach 重置状态
- Mock 外部依赖 (API, Tauri invoke, IndexedDB)
- 断言: toBe/toEqual/toHaveBeenCalled/toThrow

## 覆盖率目标: > 80% (lines/branches/functions/statements)
