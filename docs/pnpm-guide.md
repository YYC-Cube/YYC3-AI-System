# YYC³ 项目 pnpm 使用指南

## 📖 目录

- [pnpm 简介](#pnpm-简介)
- [安装配置](#安装配置)
- [基础使用](#基础使用)
- [高级功能](#高级功能)
- [最佳实践](#最佳实践)
- [故障排除](#故障排除)
- [迁移指南](#迁移指南)

---

## pnpm 简介

### 什么是 pnpm？

pnpm 是一个快速、节省磁盘空间的 JavaScript 包管理器。它通过使用硬链接和符号链接来节省磁盘空间并提高性能。

### 为什么 YYC³ 选择 pnpm？

| 特性 | pnpm | npm | yarn |
|------|------|-----|------|
| 安装速度 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| 磁盘空间 | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| 依赖管理 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Monorepo | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**YYC³ 项目优势**:
- ⚡ 安装速度快 3-4 倍
- 💾 节省 60%+ 磁盘空间
- 🔒 严格的依赖管理，防止幽灵依赖
- 📦 内置 Monorepo 支持

---

## 安装配置

### 安装 pnpm

#### 方法 1: 使用 npm (推荐)

```bash
npm install -g pnpm@10.32.1
```

#### 方法 2: 使用 corepack (Node.js 内置)

```bash
# 启用 corepack
corepack enable

# 激活特定版本
corepack prepare pnpm@10.32.1 --activate
```

#### 方法 3: 使用安装脚本 (macOS/Linux)

```bash
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### 验证安装

```bash
# 检查版本
pnpm --version
# 应显示: 10.32.1

# 检查安装位置
which pnpm
```

### 配置 .npmrc

项目根目录创建 `.npmrc` 文件：

```ini
# 严格依赖解析
strict-peer-dependencies=false

# 自动安装 peer dependencies
auto-install-peers=true

# 缓存配置
cache-dir=~/.pnpm-store

# 国内镜像加速 (可选)
# registry=https://registry.npmmirror.com
```

---

## 基础使用

### 项目初始化

```bash
# 克隆项目
git clone <repository-url>
cd YYC3-Portable-Intelligent-AI-System

# 安装依赖
pnpm install

# 或使用冻结锁文件（CI 环境）
pnpm install --frozen-lockfile
```

### 依赖管理

#### 安装依赖

```bash
# 安装所有依赖
pnpm install

# 安装生产依赖
pnpm add <package-name>

# 安装开发依赖
pnpm add -D <package-name>

# 安装全局依赖
pnpm add -g <package-name>

# 安装特定版本
pnpm add <package-name>@<version>

# 安装特定标签
pnpm add <package-name>@beta
```

#### 更新依赖

```bash
# 更新所有依赖
pnpm update

# 更新特定依赖
pnpm update <package-name>

# 更新到最新版本（忽略范围）
pnpm update --latest <package-name>

# 检查过时的依赖
pnpm outdated
```

#### 移除依赖

```bash
# 移除依赖
pnpm remove <package-name>

# 移除开发依赖
pnpm remove -D <package-name>

# 移除全局依赖
pnpm remove -g <package-name>
```

### 脚本执行

```bash
# 运行 package.json 中的脚本
pnpm run <script-name>

# 简写形式
pnpm <script-name>

# 示例
pnpm dev          # 启动开发服务器
pnpm build        # 构建项目
pnpm test         # 运行测试
pnpm lint         # 代码检查
```

### 查看依赖

```bash
# 查看依赖树
pnpm list

# 查看顶层依赖
pnpm list --depth=0

# 查看全局依赖
pnpm list -g

# 查看特定包的信息
pnpm why <package-name>

# 查看依赖详情
pnpm info <package-name>
```

---

## 高级功能

### Workspace (Monorepo)

pnpm 内置支持 Monorepo 架构。

#### 配置 workspace

创建 `pnpm-workspace.yaml`:

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
  - '!**/test/**'
```

#### workspace 命令

```bash
# 在所有包中运行命令
pnpm -r <command>

# 在特定包中运行命令
pnpm --filter <package-name> <command>

# 示例
pnpm --filter @yyc3/ui build
pnpm -r test
```

### Overrides (依赖覆盖)

在 `package.json` 中配置：

```json
{
  "pnpm": {
    "overrides": {
      "vite": "6.3.5",
      "react": "^18.3.1"
    }
  }
}
```

### Patching (依赖补丁)

```bash
# 创建补丁
pnpm patch <package-name>@<version>

# 应用补丁
pnpm patch-commit <patch-dir>
```

### Store 管理

pnpm 使用全局 store 存储所有包。

```bash
# 查看 store 位置
pnpm store path

# 清理未使用的包
pnpm store prune

# 查看 store 状态
pnpm store status
```

### 钩子脚本

在 `package.json` 中配置：

```json
{
  "scripts": {
    "preinstall": "echo 'Before install'",
    "postinstall": "echo 'After install'"
  }
}
```

---

## 最佳实践

### 1. 锁文件管理

**始终提交 `pnpm-lock.yaml`**

```bash
# .gitignore 中不要忽略
# pnpm-lock.yaml

# CI/CD 使用冻结锁文件
pnpm install --frozen-lockfile
```

### 2. 版本固定

**推荐**: 在 CI/CD 中固定版本

```yaml
# .github/workflows/ci.yml
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 10.32.1
```

### 3. 依赖审计

```bash
# 检查安全漏洞
pnpm audit

# 自动修复
pnpm audit --fix
```

### 4. 清理项目

```bash
# 清理 node_modules
rm -rf node_modules

# 清理 pnpm store
pnpm store prune

# 重新安装
pnpm install
```

### 5. 性能优化

```bash
# 使用缓存
pnpm install --prefer-offline

# 并行安装
pnpm install --no-lockfile

# 减少网络请求
pnpm install --offline
```

---

## 故障排除

### 问题 1: 安装失败

**症状**: `pnpm install` 失败

**解决方案**:
```bash
# 1. 清理缓存
pnpm store prune

# 2. 删除 node_modules
rm -rf node_modules

# 3. 删除锁文件（谨慎）
rm pnpm-lock.yaml

# 4. 重新安装
pnpm install
```

### 问题 2: 依赖冲突

**症状**: peer dependency 警告

**解决方案**:
```bash
# 方法 1: 自动安装 peer dependencies
# .npmrc
auto-install-peers=true

# 方法 2: 手动安装缺失的 peer dependencies
pnpm add <missing-peer-dependency>

# 方法 3: 使用 overrides
# package.json
{
  "pnpm": {
    "overrides": {
      "problematic-package": "fixed-version"
    }
  }
}
```

### 问题 3: 权限问题

**症状**: EACCES 错误

**解决方案**:
```bash
# macOS/Linux
sudo chown -R $(whoami) ~/.pnpm-store

# 或更改 store 位置
# .npmrc
store-dir=~/.pnpm-store
```

### 问题 4: 网络问题

**症状**: 网络超时

**解决方案**:
```bash
# 使用国内镜像
pnpm config set registry https://registry.npmmirror.com

# 或在 .npmrc 中配置
registry=https://registry.npmmirror.com
```

### 问题 5:幽灵依赖

**症状**: 代码中使用了未声明的依赖

**解决方案**:
```bash
# pnpm 会自动检测并报错
# 解决方法：显式声明依赖
pnpm add <package-name>
```

---

## 迁移指南

### 从 npm 迁移

```bash
# 1. 删除 npm 相关文件
rm -rf node_modules package-lock.json

# 2. 使用 pnpm 安装
pnpm import  # 从 package-lock.json 导入
# 或
pnpm install

# 3. 提交 pnpm-lock.yaml
git add pnpm-lock.yaml
git commit -m "chore: migrate from npm to pnpm"
```

### 从 yarn 迁移

```bash
# 1. 删除 yarn 相关文件
rm -rf node_modules yarn.lock

# 2. 使用 pnpm 导入
pnpm import  # 从 yarn.lock 导入

# 3. 安装依赖
pnpm install

# 4. 提交 pnpm-lock.yaml
git add pnpm-lock.yaml
git commit -m "chore: migrate from yarn to pnpm"
```

### 迁移后检查

```bash
# 1. 运行测试
pnpm test

# 2. 构建项目
pnpm build

# 3. 检查依赖
pnpm list --depth=0

# 4. 更新 CI/CD 配置
# 使用 pnpm/action-setup@v2
```

---

## pnpm vs npm 命令对照表

| 操作 | pnpm | npm |
|------|------|-----|
| 安装依赖 | `pnpm install` | `npm install` |
| 添加依赖 | `pnpm add <pkg>` | `npm install <pkg>` |
| 添加开发依赖 | `pnpm add -D <pkg>` | `npm install -D <pkg>` |
| 运行脚本 | `pnpm <script>` | `npm run <script>` |
| 更新依赖 | `pnpm update` | `npm update` |
| 移除依赖 | `pnpm remove <pkg>` | `npm uninstall <pkg>` |
| 查看依赖 | `pnpm list` | `npm list` |
| 审计安全 | `pnpm audit` | `npm audit` |
| 全局安装 | `pnpm add -g <pkg>` | `npm install -g <pkg>` |

---

## 📚 参考资源

- [pnpm 官方文档](https://pnpm.io/)
- [pnpm GitHub](https://github.com/pnpm/pnpm)
- [pnpm vs npm](https://pnpm.io/feature-comparison)
- [YYC³ 包管理器分析](./package-manager-analysis.md)
- [YYC³ 团队开发指南](./team-development-guide.md)

---

## 💡 小贴士

### 1. 使用 pnpm CLI 别名

```bash
# 在 .zshrc 或 .bashrc 中添加
alias pi="pnpm install"
alias pa="pnpm add"
alias pad="pnpm add -D"
alias pr="pnpm run"
alias pt="pnpm test"
alias pb="pnpm build"
```

### 2. 使用 pnpm 自动补全

```bash
# 启用自动补全
pnpm completion > ~/.zsh/completion/_pnpm
```

### 3. 使用 pnpm doctor

```bash
# 诊断 pnpm 问题
pnpm doctor
```

---

**文档维护**: YYC³ Team  
**最后更新**: 2026-04-08  
**版本**: v1.0.0
