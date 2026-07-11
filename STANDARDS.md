# YYC³ 统一化规范文档 (STANDARDS)

> **言启象限 | 语枢未来** — 项目标准化规范权威来源
> 本文档基于代码库实际审计结果制定，作为所有新代码/文档的强制规范。

**版本**: v1.0.0 | **生效日期**: 2026-07-11 | **维护者**: YanYuCloudCube Team

---

## 目录

1. [设计语言规范](#1-设计语言规范)
2. [代码规范](#2-代码规范)
3. [文档规范](#3-文档规范)
4. [交互体验规范](#4-交互体验规范)
5. [已记录的架构债务](#5-已记录的架构债务)

---

## 1. 设计语言规范

### 1.1 双主题系统说明

本项目存在**两套并行的主题系统**，服务于不同组件层：

| 层 | 机制 | 驱动文件 | 服务对象 |
|---|---|---|---|
| **CSS 变量层** | `:root` + `.dark` CSS 自定义属性 + `@theme inline` 映射 | `src/styles/theme.css` | shadcn/ui 组件（`src/app/components/ui/`） |
| **JS Token 层** | `getThemeTokens()` 返回 Tailwind 工具类字符串 | `src/app/utils/theme.ts` | 应用功能组件（`src/app/components/` 非 ui/） |

> ⚠️ 两套系统当前不互通。`theme.css` 的 `--primary` 不影响 `getThemeTokens()` 的输出，反之亦然。新增组件时，**ui/ 组件用 CSS 变量类名（`bg-primary`），功能组件用 `getThemeTokens()` 返回的类串**。

### 1.2 主题预设（ThemeMode）

`src/app/utils/theme.ts` 定义 6 个预设：

| 模式 | 明/暗 | 主色 | 图标 |
|---|---|---|---|
| `system` | 跟随系统 | `#818cf8` | 🔄 |
| `light` | 明 | `#6366f1` | ☀️ |
| `dark` | 暗（默认） | `#818cf8` | 🌙 |
| `midnight` | 暗 | `#60a5fa` | 🌌 |
| `forest` | 暗 | `#34d399` | 🌲 |
| `sunset` | 明 | `#fb923c` | 🌅 |

### 1.3 CSS 变量清单（theme.css）

`:root` 与 `.dark` **必须对称定义**全部变量。当前规范变量：

- 基础：`--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--input-background`, `--switch-background`, `--ring`
- 图表：`--chart-1` 至 `--chart-5`
- 侧栏：`--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring`
- 排版：`--font-size` (16px), `--font-weight-medium` (500), `--font-weight-normal` (400), `--radius` (0.625rem)

**规则**：新增 CSS 变量时，`:root` 和 `.dark` 必须同时定义，否则暗色模式会出现视觉断层（已修复 `--input-background` / `--switch-background` 的历史缺口）。

### 1.4 类名合并工具 cn()

**唯一规范实现**：`src/app/utils/cn.ts`

```ts
import { cn } from '@/app/utils/cn';
// 或相对路径
import { cn } from '../utils/cn';
```

`src/app/components/ui/utils.ts` 已改为 re-export 入口，供 shadcn/ui 组件沿用 `import { cn } from './utils'` 惯例。**禁止新增 `cn()` 的重复实现**。

### 1.5 图标系统

**唯一图标库**：`lucide-react`。禁止引入 `react-icons`、`@heroicons`、`@mui/icons-material`。

```tsx
// ✅ 正确
import { Send, Trash2, Loader2 } from 'lucide-react';

// ❌ 禁止 — 会打包整个库
import * as LucideIcons from 'lucide-react';
```

> **🔧 ESLint 强制执行**：`no-restricted-syntax` 规则会阻止 `lucide-react` 的通配符/命名空间导入（报错）。此规则在 `eslint.config.js` 中配置，运行 `pnpm lint` 时自动检查。

**内联 SVG 规则**：仅允许用于无法用 Lucide 表达的可视化场景（图表、图形渲染如 FlameGraph/GitGraph/ER 图）。简单的 UI 图标（箭头、对勾、网格等）必须用 Lucide 组件。

### 1.6 排版

`theme.css` 的 `@layer base` 为 `h1`-`h4`、`label`、`button`、`input` 定义了默认字号/字重。Tailwind 工具类（`text-sm`、`text-lg`）会自动覆盖。无需在组件内重复设置基础排版。

### 1.7 主题桥接机制（D9 已实现）

`theme.css` 定义了两类 CSS 变量：

1. **规范变量**（`--primary`、`--secondary`、`--accent` 等）：驱动 shadcn/ui 组件
2. **品牌别名**（`--yyc3-primary`、`--yyc3-secondary` 等）：在 `:root` 中 `var()` 引用规范变量

`App.tsx` 的 `customThemeConfig` useEffect **同时写入两类变量**，使运行时自定义主题的颜色变更能传播到 shadcn/ui 组件：

```ts
// App.tsx — 桥接 JS 主题层到 CSS 变量层
root.style.setProperty('--primary', c.primary);     // shadcn/ui 组件响应
root.style.setProperty('--yyc3-primary', c.primary); // 代码直接引用的别名
```

新增 CSS 变量时，在 `theme.css` 的品牌别名块（`:root` 中的 `--yyc3-*` 区域）同步添加别名。

---

## 2. 代码规范

### 2.1 命名

| 类型 | 规范 | 示例 |
|---|---|---|
| 组件文件 | PascalCase | `UserProfile.tsx` |
| 服务文件 | kebab-case | `ai-provider.ts` |
| 工具文件 | kebab-case | `keyboard-shortcuts.ts` |
| 组件 | PascalCase | `function UserProfile()` |
| 函数/变量 | camelCase | `getUserData()` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| 类型/接口 | PascalCase | `UserConfig` |
| 枚举 | PascalCase + PascalCase 成员 | `ErrorCategory.NETWORK` |

### 2.2 导入导出

- **全部使用命名导出**（`export { Button }`、`export function HomePage()`）。
- **禁止默认导出**（`export default`），除非是路由懒加载的 `.then(m => ({ default: m.X }))` 转换。
- **import 排序**由 ESLint `import/order` 强制（`builtin → external → internal → parent → sibling → index`，组间空行，字母升序）。运行 `pnpm lint:fix` 自动整理。
- **路径别名**：`@/*` → `./src/*` 已配置但实际几乎未用。现有代码普遍用相对路径（`../store`）。**新代码不强求改别名，但禁止新增超过 2 层的 `../../`**。

### 2.3 文件头注释

项目存在两种 JSDoc 头风格，**不强制统一**（迁移成本过高），但新文件应优先用 **Style A**：

**Style A（`@tag` 格式，推荐）**：
```ts
/**
 * @file 文件名.ext
 * @description 简述
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created YYYY-MM-DD
 * @updated YYYY-MM-DD
 * @status stable | dev | test | draft | deprecated
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags tag1, tag2
 */
```

**Style B（`key:` 格式，存量）**：用于部分服务/组件文件，含 `brief`/`details`/`exports`/`notes` 字段。

**强制规则**（无论 Style A/B）：
- 版权行**必须**为 `Copyright (c) 2026 YanYuCloudCube Team`（禁止 `2024`/`2025`/`YYC³ Team`）
- 团队名**必须**为 `YanYuCloudCube Team`（全称，非 `YYC³ Team`）

### 2.4 日志

**服务层**（`src/services/`、`src/app/services/`）：必须用 `createLogger`。
```ts
import { createLogger } from '../utils/logger';
const logger = createLogger('ModuleName');
logger.info('消息', data);  // 生产自动静默 debug/info
```

**组件层**（`src/app/components/`）：允许 `console.error` 用于不可恢复错误；调试日志应迁移至 `createLogger`。

**禁止**：Service Worker（`src/sw.ts`）和构建配置（`src/config/`）用裸 `console`（独立运行时，无 logger 访问权限，属合理例外）。

### 2.5 代码格式

由 Prettier 强制（`.prettierrc`）：100 列、2 空格、单引号、分号、`trailingComma: 'es5'`、`arrowParens: 'always'`、LF。运行 `pnpm format`。

### 2.6 注释语言

JSDoc 文件头描述用**中文**（团队惯例）。行内注释中英文均可，但**单文件内应保持一致**（不要同一文件混用中英文行内注释）。

---

## 3. 文档规范

### 3.1 命名

| 类型 | 规范 | 示例 |
|---|---|---|
| 技术文档 | `YYC3-` 前缀 + 中文 | `YYC3-AI-存储架构设计.md` |
| 英文指南 | kebab-case | `cicd-configuration.md` |
| 阶段总结 | `YYC3-YYYY-MM-DD-` 前缀 | `YYC3-2026-03-23-工作总结.md` |
| 子目录 | `NN-YYC3-AI-` 编号前缀 | `04-YYC3-AI-功能设计/` |

### 3.2 标头模板（Markdown 文档）

```markdown
---
file: 文件名.md
description: 简述
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-MM-DD
updated: 2026-MM-DD
status: stable | draft | deprecated
tags: tag1, tag2
---
```

### 3.3 团队品牌头（长文档）

```markdown
> ***YanYuCloudCube***
> *言启象限 | 语枢未来*
> ***Words Initiate Quadrants, Language Serves as Core for Future***
```

---

## 4. 交互体验规范

### 4.1 加载状态

| 场景 | 规范 |
|---|---|
| 路由级懒加载 | `<Suspense fallback={<Skeleton />}>`（见 `routes.tsx`） |
| 内联小图标加载 | `<Loader2 className="size-4 animate-spin" />`（统一用 `size-4`，禁止 `w-2.5`/`w-3` 等碎片尺寸） |
| 区域占位 | `<Skeleton>` 组件（`src/app/components/ui/skeleton.tsx`） |

**规则**：`animate-spin` 旋转图标尺寸统一 `size-4`（按钮内）或 `size-6`（全屏）。禁止手写 `border-4 border-blue-500 border-t-transparent rounded-full animate-spin`。

### 4.2 通知（Toast）

**唯一规范**：`sonner` 的 `toast`。
```ts
import { toast } from 'sonner';
toast.success('操作成功');
toast.error('操作失败');
toast.info('提示信息');
```

**禁止**：`alert()`、`confirm()`、`prompt()`。

> **🔧 ESLint 强制执行**：`no-restricted-globals` 规则将 `alert`/`confirm`/`prompt` 标记为 **warning**（存量代码逐步迁移），新代码必须在 PR 中解决所有 warning。

`NotificationCenter.tsx` 是独立的通知中心面板，不替代 toast。

### 4.3 对话框/弹窗

**新代码规范**：新增模态/抽屉应优先用 shadcn 对话框组件（`Dialog`/`AlertDialog`/`Sheet`）。
如需轻量覆盖层，使用统一 `<Overlay>` 原语（`src/app/components/ui/overlay.tsx`），它标准化了 z-index、背景遮罩、ESC 关闭、点击外部关闭。

```tsx
import { Overlay } from '@/app/components/ui/overlay';

<Overlay open={isOpen} onClose={handleClose} showCloseButton layer="modal">
  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg">
    内容
  </div>
</Overlay>
```

**z-index 规范**（由 `<Overlay>` 组件强制执行）：`z-50`（标准模态 `modal`）、`z-[60]`（命令面板 `elevated`）、`z-[100]`（Toast `toast`）。禁止随意使用其他值。

> **📌 迁移参考**：`ConflictResolutionDialog.tsx` 已从手写 `fixed inset-0` 迁移至 `<Overlay>`，可作为迁移其他手写模态的参考模板。

### 4.4 错误处理

| 层 | 规范 |
|---|---|
| 用户可见错误 | `toast.error(message)` — 用户必须看到反馈 |
| 组件不可恢复错误 | `ErrorBoundary`（已在 `App.tsx` 全局包裹） |
| 表单错误 | 内联 `text-red-*` 文案（见 `pages/LoginPage.tsx`） |
| 服务层错误 | `logger.error()` + 向调用方抛出/返回错误状态 |
| **禁止** | 仅 `console.error` 而不通知用户（用户永远看不到） |

### 4.5 表单

现有页面（Login/Register/Forgot/Reset）统一用 `useState` + `errors` Record + 手写 `validateForm()`。`react-hook-form` 已安装但未采用。

**规则**：新表单**可选用** `react-hook-form`，但同一表单内不得混用两种模式。存量表单不强迁。

### 4.6 快捷键

项目已内置 `KeyboardShortcutsManager`（`src/app/utils/keyboard-shortcuts.ts`），在 `App.tsx` 导入时自动激活全局 `window.addEventListener('keydown')`。18 个默认快捷键已注册，包括命令面板（`Ctrl+Shift+P`）、搜索（`Ctrl+P`）、终端切换（``Ctrl+` ``）、主题切换（`Ctrl+Shift+T`）等。

**规则**：
- 新增全局快捷键应通过 `keyboardShortcuts.register()` 注册
- 快捷键 action 内访问 store 用动态导入：`import('../store').then(({ useAppStore }) => ...)`
- 组件级快捷键（仅在焦点内生效）可用 `onKeyDown`，但全局快捷键必须走管理器

---

## 5. 架构债务清单

以下债务经评估后处理状态如下：

| # | 债务 | 状态 | 处理方式 |
|---|---|---|---|
| D1 | 功能组件手写模态（60+ 处），未用 shadcn Dialog | ✅ **已创建迁移基础设施** | 创建 `<Overlay>` 原语（`ui/overlay.tsx`），标准化 z-index/背景/ESC 关闭，存量逐组件迁移 |
| D2 | 快捷键系统未被组件使用 | ✅ **已修复** | 修复 `require()` → 动态 `import()`，在 `App.tsx` 激活全局监听，18 个快捷键生效 |
| D3 | 功能组件（80+）用模板字符串拼 className，未用 `cn()` | 📋 低优先级 | `getThemeTokens()` 返回的预设组合无冲突风险，收益有限 |
| D4 | `docs/` 子目录镜像重复 | ✅ **已修复** | 删除 4 个镜像目录（`YYC3-AI-功能设计`/`YYC3-AI-测试报告`/`YYC3-AI-项目交接`/`P5-YYC3-AI-审核交付`） |
| D5 | `react-hook-form` + `ui/form.tsx` 已装未用 | 📋 低优先级 | 现有 `useState` + `validateForm` 模式内部一致，不强迁 |
| D6 | 文件头注释两种风格（Style A/B）并存 | 📋 低优先级 | 新文件用 Style A，存量不强制 |
| D7 | 加载状态碎片化（3 种实现、7 种尺寸） | ✅ **已修复** | 2 处手写 CSS spinner → `<Loader2 className="size-N animate-spin" />`，尺寸规范已写入第 4.1 节 |
| D8 | 图标导入通配符（`import * as LucideIcons`） | ✅ **已修复** | 3 个文件（WebSocketStatusPanel/SyncStatusPanel/ConflictResolutionDialog）改为具名导入 |
| D9 | 双主题系统不互通（CSS 变量 vs JS Token） | ✅ **已搭建桥接** | `App.tsx` 自定义主题同时写入 `--primary`/`--secondary` 等 CSS 变量，shadcn/ui 组件现可响应自定义主题 |

---

*本规范基于 2026-07-11 代码库审计制定，随架构演进持续更新。*
