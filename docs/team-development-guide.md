# YYC³ 团队开发指南

## 📋 目录

- [项目概述](#项目概述)
- [环境配置](#环境配置)
- [包管理器使用](#包管理器使用)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [测试规范](#测试规范)
- [CI/CD 流程](#cicd-流程)
- [部署流程](#部署流程)
- [常见问题](#常见问题)

---

## 项目概述

### YYC³ 便携式智能 AI 系统

**项目名称**: YYC³ Portable Intelligent AI System  
**技术栈**: React 18 + TypeScript + Vite + pnpm  
**包管理器**: pnpm 10.32.1  
**Node.js 版本**: 20.x

### 核心特性

- 🎨 现代化 UI 组件库（Radix UI + Tailwind CSS）
- 🤝 实时协作功能（Yjs + TipTap）
- 🧠 AI 集成能力
- 📱 响应式设计
- 🔐 完整的认证系统
- 📊 数据可视化

---

## 环境配置

### 必需软件

1. **Node.js** (v20.x)
   ```bash
   # 使用 nvm 安装
   nvm install 20
   nvm use 20
   
   # 验证版本
   node --version  # 应显示 v20.x.x
   ```

2. **pnpm** (v10.32.1)
   ```bash
   # 使用 npm 全局安装
   npm install -g pnpm@10.32.1
   
   # 或使用 corepack (Node.js 内置)
   corepack enable
   corepack prepare pnpm@10.32.1 --activate
   
   # 验证版本
   pnpm --version  # 应显示 10.32.1
   ```

3. **Git**
   ```bash
   git --version
   ```

### 项目初始化

```bash
# 1. 克隆项目
git clone <repository-url>
cd YYC3-Portable-Intelligent-AI-System

# 2. 安装依赖
pnpm install

# 3. 启动开发服务器
pnpm dev

# 4. 在浏览器中打开
# http://localhost:3156
```

### IDE 配置

#### VS Code 推荐扩展

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "vitest.explorer"
  ]
}
```

#### VS Code 设置

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## 包管理器使用

### 为什么选择 pnpm？

- ⚡ **速度快**: 比 npm 快 3-4 倍
- 💾 **节省空间**: 节省 60%+ 磁盘空间
- 🔒 **更安全**: 严格的依赖管理
- 📦 **Monorepo 支持**: 未来扩展性

### 常用命令

#### 依赖管理

```bash
# 安装所有依赖
pnpm install

# 安装生产依赖
pnpm add <package-name>

# 安装开发依赖
pnpm add -D <package-name>

# 安装全局依赖
pnpm add -g <package-name>

# 更新依赖
pnpm update <package-name>

# 移除依赖
pnpm remove <package-name>
```

#### 脚本执行

```bash
# 启动开发服务器
pnpm dev

# 构建项目
pnpm build

# 运行测试
pnpm test

# 运行测试（单次）
pnpm test:run

# 运行测试覆盖率
pnpm test:coverage

# 代码检查
pnpm lint

# 代码格式化
pnpm format

# 类型检查
pnpm typecheck
```

#### pnpm 特有命令

```bash
# 查看 store 位置
pnpm store path

# 清理 store
pnpm store prune

# 查看依赖树
pnpm list --depth=0

# 查看过时的依赖
pnpm outdated

# 审计安全漏洞
pnpm audit
```

### 锁文件管理

**重要**: 始终提交 `pnpm-lock.yaml` 文件

```bash
# 确保使用锁文件安装
pnpm install --frozen-lockfile

# 更新锁文件
pnpm install --lockfile-only
```

---

## 开发流程

### 分支策略

```
main (生产分支)
  └── develop (开发分支)
        ├── feature/* (功能分支)
        ├── bugfix/* (修复分支)
        └── release/* (发布分支)
```

### 开发工作流

1. **创建功能分支**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **开发和测试**
   ```bash
   # 启动开发服务器
   pnpm dev
   
   # 运行测试
   pnpm test
   
   # 代码检查
   pnpm lint
   ```

3. **提交代码**
   ```bash
   # 暂存更改
   git add .
   
   # 提交（遵循 Conventional Commits）
   git commit -m "feat: add new feature"
   
   # 推送到远程
   git push origin feature/your-feature-name
   ```

4. **创建 Pull Request**
   - 在 GitHub 上创建 PR
   - 等待 CI/CD 检查通过
   - 代码审查通过后合并

### 提交信息规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (type)**:
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具相关
- `perf`: 性能优化

**示例**:
```bash
feat(auth): add OAuth2 login support

- Add Google OAuth provider
- Add GitHub OAuth provider
- Update login UI

Closes #123
```

---

## 代码规范

### TypeScript 规范

1. **类型定义**
   ```typescript
   // ✅ 推荐
   interface User {
     id: string
     name: string
     email: string
   }
   
   // ❌ 避免
   type User = {
     id: any
     name: any
   }
   ```

2. **函数定义**
   ```typescript
   // ✅ 推荐
   const fetchUser = async (id: string): Promise<User> => {
     // ...
   }
   
   // ❌ 避免
   function fetchUser(id) {
     // ...
   }
   ```

3. **导入导出**
   ```typescript
   // ✅ 推荐
   export { User }
   export type { UserProps }
   
   // ❌ 避免
   export default User
   ```

### React 规范

1. **组件定义**
   ```typescript
   // ✅ 推荐
   export const Button: React.FC<ButtonProps> = ({ children, onClick }) => {
     return <button onClick={onClick}>{children}</button>
   }
   
   // ❌ 避免
   export default function Button(props) {
     return <button>{props.children}</button>
   }
   ```

2. **Hooks 使用**
   ```typescript
   // ✅ 推荐
   const [state, setState] = useState<User | null>(null)
   
   useEffect(() => {
     // 清理函数
     return () => {
       // cleanup
     }
   }, [dependency])
   ```

### 文件命名

```
组件: PascalCase.tsx (Button.tsx)
工具: camelCase.ts (formatDate.ts)
类型: camelCase.ts (types.ts)
测试: *.test.ts(x) (Button.test.tsx)
样式: *.css (Button.css)
```

### ESLint 和 Prettier

```bash
# 运行 ESLint
pnpm lint

# 自动修复
pnpm lint:fix

# 检查格式
pnpm format:check

# 自动格式化
pnpm format
```

---

## 测试规范

### 测试类型

1. **单元测试** (`*.test.ts`)
   - 测试独立函数和组件
   - 覆盖率要求: 80%+

2. **集成测试** (`*.integration.test.ts`)
   - 测试模块间交互
   - 测试 API 集成

3. **E2E 测试** (`e2e/*.test.ts`)
   - 测试用户流程
   - 使用 Playwright

### 测试命令

```bash
# 运行所有测试
pnpm test

# 运行特定测试文件
pnpm test Button.test.tsx

# 运行测试覆盖率
pnpm test:coverage

# 运行 E2E 测试
pnpm test:e2e

# E2E 测试 UI 模式
pnpm test:e2e:ui
```

### 测试最佳实践

1. **测试命名**
   ```typescript
   describe('Button', () => {
     it('should render with correct text', () => {
       // ...
     })
     
     it('should handle click event', () => {
       // ...
     })
   })
   ```

2. **使用 Testing Library**
   ```typescript
   import { render, screen, fireEvent } from '@testing-library/react'
   
   it('should increment counter', () => {
     render(<Counter />)
     const button = screen.getByRole('button')
     fireEvent.click(button)
     expect(screen.getByText('1')).toBeInTheDocument()
   })
   ```

3. **Mock 外部依赖**
   ```typescript
   vi.mock('../../services/api', () => ({
     fetchUser: vi.fn().mockResolvedValue({ id: '1', name: 'Test' })
   }))
   ```

---

## CI/CD 流程

### GitHub Actions 工作流

项目使用 GitHub Actions 进行持续集成和部署。

#### 工作流阶段

1. **代码质量检查** (quality)
   - ESLint 检查
   - Prettier 格式检查
   - TypeScript 类型检查

2. **单元测试** (test)
   - 运行测试套件
   - 生成覆盖率报告
   - 上传到 Codecov

3. **E2E 测试** (e2e)
   - 运行 Playwright 测试
   - 生成测试报告

4. **构建验证** (build)
   - 构建项目
   - 检查构建产物

5. **性能测试** (performance)
   - 仅在 main 分支运行
   - 生成性能报告

6. **部署** (deploy)
   - 仅在 main 分支运行
   - 部署到生产环境

### CI/CD 配置优化

项目已配置 pnpm 缓存优化：

```yaml
env:
  PNPM_VERSION: '10.32.1'
  NODE_VERSION: '20'

steps:
  - name: Setup pnpm
    uses: pnpm/action-setup@v2
    with:
      version: ${{ env.PNPM_VERSION }}
  
  - name: Setup pnpm cache
    uses: actions/cache@v4
    with:
      path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
      key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
```

### 查看 CI/CD 状态

- 在 GitHub 仓库的 Actions 标签页查看
- 每个 PR 都会自动运行 CI/CD
- 测试覆盖率报告在 Codecov 查看

---

## 部署流程

### 生产部署

1. **自动部署** (推荐)
   - 合并到 main 分支后自动触发
   - CI/CD 自动构建和部署

2. **手动部署**
   ```bash
   # 构建项目
   pnpm build
   
   # 部署到服务器
   # (根据实际部署平台配置)
   ```

### 环境变量

创建 `.env.production` 文件：

```env
VITE_API_URL=https://api.example.com
VITE_APP_ENV=production
```

### 部署检查清单

- [ ] 所有测试通过
- [ ] 代码审查完成
- [ ] 构建成功
- [ ] 环境变量配置正确
- [ ] 性能测试通过
- [ ] 文档更新

---

## 常见问题

### 依赖安装问题

**问题**: `pnpm install` 失败

**解决方案**:
```bash
# 清理 pnpm store
pnpm store prune

# 删除 node_modules
rm -rf node_modules

# 重新安装
pnpm install
```

### 类型错误

**问题**: TypeScript 类型错误

**解决方案**:
```bash
# 运行类型检查
pnpm typecheck

# 查看详细错误
pnpm typecheck --pretty
```

### 测试失败

**问题**: 测试在本地通过但 CI 失败

**解决方案**:
```bash
# 运行与 CI 相同的命令
pnpm test:run

# 检查环境变量
# 检查时区设置
# 检查依赖版本
```

### pnpm vs npm

**问题**: 可以使用 npm 吗？

**答案**: 不推荐。项目使用 pnpm 特有功能（如 overrides），使用 npm 可能导致依赖问题。

**如果必须使用**:
```bash
# 删除 pnpm 相关文件
rm -rf node_modules pnpm-lock.yaml

# 使用 npm 安装
npm install

# 注意：可能需要手动处理依赖冲突
```

### 缓存问题

**问题**: 开发服务器缓存问题

**解决方案**:
```bash
# 清理 Vite 缓存
rm -rf node_modules/.vite

# 清理浏览器缓存
# Chrome: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
```

---

## 📚 相关文档

- [包管理器分析报告](./package-manager-analysis.md)
- [pnpm 使用指南](./pnpm-guide.md)
- [项目 README](../README.md)
- [认证集成指南](../README-AUTH-INTEGRATION.md)

---

## 🤝 团队协作

### 代码审查

1. 所有代码变更需要 PR
2. 至少 1 人审查通过
3. CI/CD 检查全部通过
4. 解决所有审查意见

### 沟通渠道

- GitHub Issues: 问题跟踪
- GitHub Discussions: 技术讨论
- Pull Requests: 代码审查

---

**文档维护**: YYC³ Team  
**最后更新**: 2026-04-08  
**版本**: v1.0.0
