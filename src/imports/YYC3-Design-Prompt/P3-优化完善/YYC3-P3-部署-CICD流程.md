---
file: YYC3-P3-部署-CICD流程.md
description: CI/CD 流程 (GitHub Actions + Tauri 多平台构建)
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
status: stable
tags: p3,deployment,cicd,github-actions
---

# YYC³ P3-部署-CICD流程

## CI Pipeline (GitHub Actions)

```yaml
name: Build & Test
on: [push, pull_request]
jobs:
  lint-test:
    runs-on: ubuntu-latest
    steps:
      - pnpm install --frozen-lockfile
      - pnpm lint
      - pnpm typecheck
      - pnpm test --coverage
      - upload coverage to codecov

  build-linux:
    runs-on: ubuntu-latest
    needs: lint-test
    steps:
      - pnpm build
      - pnpm tauri build
      - upload artifact: *.AppImage

  build-macos:
    runs-on: macos-latest
    needs: lint-test
    steps:
      - pnpm build
      - pnpm tauri build
      - upload artifact: *.dmg

  build-windows:
    runs-on: windows-latest
    needs: lint-test
    steps:
      - pnpm build
      - pnpm tauri build
      - upload artifact: *.msi, *.exe

  release:
    needs: [build-linux, build-macos, build-windows]
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/')
    steps:
      - download all artifacts
      - create GitHub Release with signed installers
```

## 构建配置

- Node.js: 20, pnpm: 8.x
- Rust: stable, targets: x86_64-unknown-linux-gnu, aarch64-apple-darwin, x86_64-pc-windows-msvc
- 签名: macOS notarization, Windows code signing
- 自动更新: Tauri updater (可选)

## 目标

- 二进制大小: < 12MB (Tauri)
- 构建时间: < 15min (含所有平台)
- 测试覆盖率: lint + typecheck + unit (80%) + e2e

## 发布流程

1. 打 tag: `git tag v1.0.0`
2. 推送: `git push --tags`
3. CI 自动构建 3 平台
4. 自动创建 GitHub Release
5. 附件: .AppImage + .dmg + .msi + .exe
