# YYC³ MVP 功能文档

## 🎯 MVP 定位

**MVP (Minimum Viable Product)** - AI 驱动的代码生成工作流

**核心价值：** 让开发者用自然语言快速创建 UI 组件

```
用户需求 → AI 理解 → 代码生成 → 实时预览 → 一键部署
```

---

## 🚀 快速开始

### 1. 打开 MVP 生成器

**方式一：通过工具栏**
1. 点击顶部工具栏 **✨ AI 生成** 按钮
2. 选择 **Component Generator**

**方式二：快捷键**
- 按下 `Ctrl+Shift+G` (Windows/Linux)
- 或 `Cmd+Shift+G` (macOS)

**方式三：命令面板**
1. 按下 `Ctrl+Shift+P` / `Cmd+Shift+P`
2. 输入 `Generate Component`
3. 选择对应命令

---

## 📝 使用指南

### 基本流程

#### 1️⃣ 描述你的需求

在输入框中用自然语言描述你想创建的组件：

```
创建一个登录表单，包含邮箱和密码字段，使用 Tailwind CSS 样式
```

或英文：

```
Create a login form with email and password fields, styled with Tailwind CSS
```

#### 2️⃣ 选择技术栈

- **Style**: React / Vue / Svelte
- **Framework**: Tailwind / Material UI / Ant Design

#### 3️⃣ 点击生成

点击 **Generate Component** 按钮，AI 开始生成代码。

#### 4️⃣ 查看结果

- **Code 标签**: 查看生成的代码
- **Preview 标签**: 查看组件预览
- **Explanation**: AI 解释生成的代码

#### 5️⃣ 使用代码

- **Copy**: 复制到剪贴板
- **Download**: 下载为文件
- **Insert**: 插入到当前文件

---

## 💡 提示词技巧

### 好的提示词

✅ **具体明确**
```
创建一个响应式导航栏，包含：
- 左侧 Logo
- 中间 5 个菜单项
- 右侧用户头像下拉菜单
- 移动端汉堡菜单
使用 Tailwind CSS，支持深色模式
```

✅ **包含技术要求**
```
生成一个数据表格组件：
- 支持分页（每页 10 条）
- 支持列排序
- 支持行选择
- 使用 React + TypeScript
- 使用 Ant Design 组件库
```

✅ **提供上下文**
```
为我们的电商网站创建产品卡片组件：
- 显示产品图片、名称、价格
- 添加"加入购物车"按钮
- 显示库存状态
- 风格现代简约，使用蓝色主题
```

### 避免的提示词

❌ **过于模糊**
```
做一个好看的按钮
```

❌ **缺少技术细节**
```
创建一个表单
```

❌ **需求矛盾**
```
用 Vue 写 React 组件，但要像 Angular 一样工作
```

---

## 🎨 快速模板

### 📱 导航栏
```
Create a responsive navigation bar with logo, menu items, and mobile hamburger menu
```

### 💰 价格卡片
```
Create a pricing card component with 3 tiers: Basic, Pro, and Enterprise
```

### 📊 仪表盘卡片
```
Create a dashboard card showing user statistics with icons and charts
```

### 📝 联系表单
```
Create a contact form with name, email, subject, and message fields
```

### 🎴 产品卡片
```
Create a product card with image, title, price, rating, and add to cart button
```

### 👤 用户资料
```
Create a user profile card with avatar, name, bio, and social links
```

---

## 🔧 高级功能

### 流式生成

MVP 支持流式响应，代码逐字显示：

```
正在生成...
[████████░░] 80%

正在编写组件...
正在添加样式...
正在优化代码...
```

### 代码解释

生成完成后，AI 会解释代码：

```
这个组件使用了 React Hooks 管理状态：
- useState 管理表单数据
- useEffect 处理表单提交
- useMemo 优化计算性能

样式采用 Tailwind CSS 工具类：
- flexbox 布局
- 响应式断点
- 深色模式支持
```

### 多轮对话

可以基于生成的代码继续优化：

**第一轮：**
```
创建一个按钮组件
```

**第二轮：**
```
添加加载状态和禁用状态
```

**第三轮：**
```
添加动画效果和主题支持
```

---

## 📦 输出格式

### 生成的代码

```tsx
import React, { useState } from 'react'

interface LoginFormProps {
  onSubmit: (data: { email: string; password: string }) => void
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onSubmit({ email, password })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form fields... */}
    </form>
  )
}
```

### 文件结构

```
GeneratedComponent.tsx    # 主组件
GeneratedComponent.test.ts # 测试文件（可选）
GeneratedComponent.stories.tsx # Storybook 故事（可选）
```

---

## 🧪 测试与调试

### 查看生成日志

打开浏览器控制台查看详细信息：

```javascript
[MVP] Generation started
[MVP] Prompt: Create a login form...
[MVP] Streaming response...
[MVP] Generation completed in 3.2s
```

### 错误处理

如果生成失败，检查：

1. **AI 模型配置** - 确认已配置 AI 提供商
2. **网络连接** - 确认网络正常
3. **提示词质量** - 确保描述清晰具体

### 重新生成

不满意结果？点击 **Regenerate** 按钮重新生成。

---

## 🎯 最佳实践

### 1. 迭代式开发

不要期望一次完美，多轮迭代：

```
第 1 轮：基础结构
第 2 轮：添加样式
第 3 轮：优化交互
第 4 轮：完善细节
```

### 2. 分而治之

复杂组件拆分描述：

❌ **太复杂**
```
创建一个完整的电商网站，包含首页、产品页、购物车、结账、用户中心...
```

✅ **拆分描述**
```
第 1 步：创建产品列表组件
第 2 步：创建产品卡片组件
第 3 步：创建购物车组件
...
```

### 3. 提供示例

有参考设计时，提供截图或链接：

```
参考这个设计：https://dribbble.com/shots/xxx
创建一个类似的登录页面
```

### 4. 指定约束

明确技术约束：

```
使用 React 18+
使用 TypeScript 严格模式
使用 Tailwind CSS 3.0+
支持 IE11（如果需要）
```

---

## 🔐 安全注意事项

### 代码审查

AI 生成的代码应经过审查：

1. **安全检查** - 无 XSS 漏洞
2. **性能检查** - 无性能问题
3. **可访问性** - 符合 WCAG 标准

### 依赖管理

检查生成的依赖：

```json
{
  "dependencies": ["react", "react-dom"]
}
```

确保依赖是安全的、最新的。

---

## 📊 性能指标

### 生成时间

| 组件复杂度 | 预计时间 |
|-----------|---------|
| 简单（按钮、卡片） | 2-5 秒 |
| 中等（表单、列表） | 5-10 秒 |
| 复杂（仪表盘、表格） | 10-20 秒 |

### Token 使用

| 操作 | Token 消耗 |
|------|-----------|
| 简单组件 | ~500 tokens |
| 中等组件 | ~1500 tokens |
| 复杂组件 | ~3000 tokens |

---

## 🐛 故障排查

### 问题 1: 生成失败

**症状：** 显示错误信息

**解决方案：**
1. 检查 AI 模型配置
2. 确认网络连接
3. 简化提示词

### 问题 2: 代码不完整

**症状：** 生成的代码被截断

**解决方案：**
1. 点击 **Regenerate**
2. 拆分复杂需求
3. 减少上下文长度

### 问题 3: 样式不正确

**症状：** 预览与描述不符

**解决方案：**
1. 明确指定样式要求
2. 提供示例参考
3. 手动调整样式

---

## 📚 参考资料

- [React 官方文档](https://react.dev/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [TypeScript 文档](https://www.typescriptlang.org/)

---

## 🎯 路线图

### v1.0 (当前版本)
- ✅ 自然语言到代码
- ✅ 流式生成
- ✅ 代码解释
- ✅ 一键复制/下载

### v1.1 (计划中)
- 🔄 图片上传识别
- 🔄 实时预览渲染
- 🔄 多轮对话优化
- 🔄 代码优化建议

### v1.2 (未来)
- 🔮 一键部署
- 🔮 协作编辑
- 🔮 组件库集成
- 🔮 自定义模板

---

**版本:** v1.0.0  
**最后更新:** 2026-03-19  
**状态:** MVP
