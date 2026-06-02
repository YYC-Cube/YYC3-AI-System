---
file: YYC3-P0-架构-构建配置.md
description: Vite 和 Tauri 构建配置
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
updated: 2026-03-14
status: stable
tags: p0,architecture,build,vite,tauri
---

# YYC³ P0-架构 - 构建配置

## Vite 配置

- plugins: [react()]
- alias: @/ -> src/
- server: port 3201, host true, hmr overlay
- build: sourcemap, terser (drop_console/debugger)
- manualChunks: react-vendor, editor-vendor, ui-vendor, utils-vendor
- chunkSizeWarningLimit: 1000

## TypeScript 配置

- target: ES2020, module: ESNext, jsx: react-jsx
- strict: true, noUnusedLocals/Parameters
- paths: @/* -> ./src/*

## Tauri 配置

- devPath: http://localhost:3201
- bundle: identifier com.yyc3.yyc3-ai-code
- icons: 32x32, 128x128, 128x128@2x, icon.icns, icon.ico
- CSP: default-src 'self'

## ESLint

- extends: recommended, typescript, react-hooks, prettier
- rules: react-refresh/only-export-components warn

## Prettier

- semi: true, singleQuote: true, printWidth: 100, tabWidth: 2, trailingComma: es5

## Scripts

- dev / build / preview / tauri:dev / tauri:build
- lint / lint:fix / format / format:check
- test / test:ui / test:coverage / typecheck
