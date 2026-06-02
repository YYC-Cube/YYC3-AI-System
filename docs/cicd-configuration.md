# YYC³ CI/CD 配置说明

## 📋 目录

- [概述](#概述)
- [工作流结构](#工作流结构)
- [配置详解](#配置详解)
- [pnpm 集成](#pnpm-集成)
- [缓存策略](#缓存策略)
- [环境变量](#环境变量)
- [最佳实践](#最佳实践)
- [故障排除](#故障排除)

---

## 概述

YYC³ 项目使用 **GitHub Actions** 作为 CI/CD 平台，实现自动化代码质量检查、测试、构建和部署。

### CI/CD 目标

- ✅ 代码质量保证
- ✅ 自动化测试
- ✅ 构建验证
- ✅ 性能监控
- ✅ 自动化部署

### 技术栈

- **CI 平台**: GitHub Actions
- **包管理器**: pnpm 10.32.1
- **Node.js**: v20.x
- **测试框架**: Vitest + Playwright
- **代码质量**: ESLint + Prettier + TypeScript

---

## 工作流结构

### 工作流文件位置

```
.github/
└── workflows/
    └── ci-cd.yml
```

### 工作流阶段

```
┌─────────────┐
│   Quality   │ 代码质量检查
└──────┬──────┘
       │
       v
┌─────────────┐
│    Test     │ 单元测试 (并行 4 个分片)
└──────┬──────┘
       │
       v
┌─────────────┐
│     E2E     │ E2E 测试
└──────┬──────┘
       │
       v
┌─────────────┐
│    Build    │ 构建验证
└──────┬──────┘
       │
       v
┌─────────────┐
│ Performance │ 性能测试 (仅 main 分支)
└──────┬──────┘
       │
       v
┌─────────────┐
│   Deploy    │ 部署 (仅 main 分支)
└─────────────┘
```

---

## 配置详解

### 全局环境变量

```yaml
env:
  PNPM_VERSION: '10.32.1'
  NODE_VERSION: '20'
```

**说明**:
- 统一管理 pnpm 和 Node.js 版本
- 确保所有 job 使用相同版本
- 便于版本升级和维护

### 触发条件

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

**触发场景**:
- 推送到 main 或 develop 分支
- 创建或更新 Pull Request

---

## pnpm 集成

### pnpm 安装配置

```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: ${{ env.PNPM_VERSION }}
```

**优势**:
- 自动安装指定版本的 pnpm
- 无需手动配置环境
- 支持跨平台

### Node.js 配置

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: ${{ env.NODE_VERSION }}
    cache: 'pnpm'
```

**说明**:
- `cache: 'pnpm'` 启用 Node.js 内置的 pnpm 缓存
- 自动缓存 `node_modules`
- 加速依赖安装

### 依赖安装

```yaml
- name: Install dependencies
  run: pnpm install --frozen-lockfile
```

**参数说明**:
- `--frozen-lockfile`: 使用锁文件，确保依赖一致性
- CI 环境必须使用此参数
- 防止意外更新依赖

---

## 缓存策略

### pnpm Store 缓存

```yaml
- name: Get pnpm store directory
  shell: bash
  run: |
    echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_OUTPUT
  id: pnpm-cache

- name: Setup pnpm cache
  uses: actions/cache@v4
  with:
    path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
    key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-pnpm-store-
```

**缓存策略**:
1. **Key**: 基于操作系统和 pnpm-lock.yaml 哈希
2. **Restore Keys**: 如果精确匹配失败，使用前缀匹配
3. **Path**: pnpm 全局 store 目录

**性能提升**:
- 首次安装: ~45 秒
- 使用缓存: ~8 秒
- 提升约 5.6 倍

### 缓存失效场景

- `pnpm-lock.yaml` 文件变更
- 手动清除缓存
- 缓存过期（默认 7 天）

---

## 环境变量

### Secrets 配置

在 GitHub 仓库设置中配置：

```
Settings → Secrets and variables → Actions → New repository secret
```

**必需的 Secrets**:

| Secret 名称 | 用途 | 示例 |
|------------|------|------|
| `CODECOV_TOKEN` | Codecov 上传令牌 | `xxx-xxx-xxx` |
| `DEPLOY_KEY` | 部署密钥 | (根据部署平台) |

### 使用 Secrets

```yaml
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
```

### 环境变量配置

```yaml
- name: Run tests
  env:
    NODE_ENV: test
    CI: true
  run: pnpm test
```

---

## Job 详解

### 1. Quality (代码质量)

```yaml
quality:
  name: Code Quality
  runs-on: ubuntu-latest
  steps:
    - ESLint 检查
    - Prettier 格式检查
    - TypeScript 类型检查
```

**检查内容**:
- 代码风格一致性
- 潜在错误检测
- 类型安全验证

### 2. Test (单元测试)

```yaml
test:
  name: Test Suite
  runs-on: ubuntu-latest
  needs: quality
  strategy:
    matrix:
      shard: [1, 2, 3, 4]
```

**特性**:
- 并行执行 4 个分片
- 生成覆盖率报告
- 上传到 Codecov
- 检查覆盖率阈值 (80%)

### 3. E2E (端到端测试)

```yaml
e2e:
  name: E2E Tests
  runs-on: ubuntu-latest
  needs: test
```

**特性**:
- 使用 Playwright
- 自动安装浏览器
- 失败时上传截图
- 保留测试报告 7 天

### 4. Build (构建验证)

```yaml
build:
  name: Build Verification
  runs-on: ubuntu-latest
  needs: [test, e2e]
```

**特性**:
- 验证构建成功
- 检查构建产物大小
- 上传构建产物

### 5. Performance (性能测试)

```yaml
performance:
  name: Performance Tests
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'
  needs: build
```

**特性**:
- 仅在 main 分支运行
- 运行性能基准测试
- 生成性能报告
- 保留报告 30 天

### 6. Deploy (部署)

```yaml
deploy:
  name: Deploy
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'
  needs: [build, performance]
```

**特性**:
- 仅在 main 分支运行
- 使用构建产物
- 支持多种部署平台

---

## 最佳实践

### 1. 版本固定

```yaml
# ✅ 推荐
env:
  PNPM_VERSION: '10.32.1'
  NODE_VERSION: '20'

# ❌ 避免
- uses: pnpm/action-setup@v2
  with:
    version: latest  # 不确定版本
```

### 2. 依赖缓存

```yaml
# ✅ 推荐 - 使用 pnpm store 缓存
- name: Setup pnpm cache
  uses: actions/cache@v4

# ❌ 避免 - 不使用缓存
- run: pnpm install  # 每次都从网络下载
```

### 3. 并行测试

```yaml
# ✅ 推荐 - 使用矩阵并行
strategy:
  matrix:
    shard: [1, 2, 3, 4]

# ❌ 避免 - 串行执行
# 测试时间长，资源利用率低
```

### 4. 条件执行

```yaml
# ✅ 推荐 - 条件执行
if: github.ref == 'refs/heads/main'

# ❌ 避免 - 所有分支都执行部署
# 可能导致意外部署
```

### 5. 错误处理

```yaml
# ✅ 推荐 - 上传失败产物
- name: Upload E2E screenshots
  if: failure()
  uses: actions/upload-artifact@v4

# ❌ 避免 - 忽略错误
# 无法调试失败原因
```

---

## 故障排除

### 问题 1: pnpm 安装失败

**症状**: `pnpm: command not found`

**解决方案**:
```yaml
# 确保 pnpm/action-setup 在 setup-node 之前
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: ${{ env.PNPM_VERSION }}

- name: Setup Node.js
  uses: actions/setup-node@v4
```

### 问题 2: 缓存未命中

**症状**: 每次都重新安装依赖

**解决方案**:
```bash
# 检查缓存 key
# 确保 pnpm-lock.yaml 已提交
git add pnpm-lock.yaml
git commit -m "chore: update lockfile"
```

### 问题 3: 测试超时

**症状**: 测试运行超时

**解决方案**:
```yaml
# 增加超时时间
- name: Run tests
  timeout-minutes: 30
  run: pnpm test
```

### 问题 4: 内存不足

**症状**: JavaScript heap out of memory

**解决方案**:
```yaml
- name: Run tests
  env:
    NODE_OPTIONS: '--max-old-space-size=4096'
  run: pnpm test
```

### 问题 5: Secrets 未找到

**症状**: `Error: The secret 'CODECOV_TOKEN' was not found`

**解决方案**:
1. 检查 GitHub 仓库设置
2. 确认 Secret 名称正确
3. 确认 Secret 已保存

---

## 监控和报告

### 查看工作流状态

1. **GitHub Actions 页面**
   - 访问仓库的 Actions 标签
   - 查看工作流运行历史
   - 查看详细日志

2. **状态徽章**

在 README.md 中添加：

```markdown
![CI/CD](https://github.com/owner/repo/workflows/CI%2FCD%20Pipeline/badge.svg)
```

### Codecov 集成

```yaml
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: ./coverage/coverage-final.json
    flags: unittests
    name: codecov-umbrella
```

**功能**:
- 自动上传覆盖率报告
- 生成覆盖率徽章
- PR 中显示覆盖率变化

---

## 扩展配置

### 添加新的 Job

```yaml
jobs:
  # 新增安全扫描
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - name: Run security audit
        run: pnpm audit
```

### 添加通知

```yaml
- name: Notify on failure
  if: failure()
  run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
      -d '{"text": "CI/CD failed for ${{ github.repository }}"}'
```

### 添加部署环境

```yaml
deploy:
  environment:
    name: production
    url: https://yyc3.example.com
```

---

## 📚 相关文档

- [GitHub Actions 官方文档](https://docs.github.com/en/actions)
- [pnpm CI/CD 集成](https://pnpm.io/continuous-integration)
- [YYC³ 团队开发指南](./team-development-guide.md)
- [YYC³ pnpm 使用指南](./pnpm-guide.md)

---

**文档维护**: YYC³ Team  
**最后更新**: 2026-04-08  
**版本**: v1.0.0
