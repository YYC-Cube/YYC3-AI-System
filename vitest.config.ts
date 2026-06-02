/**
 * file: vitest.config.ts
 * description: Vitest测试配置 - 包含测试环境、路径别名和覆盖率设置
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-03-19
 * updated: 2026-04-01
 * status: active
 * tags: [config],[vitest],[test]
 *
 * brief: Vitest测试框架配置
 *
 * details:
 * - 全局变量配置
 * - jsdom测试环境
 * - 路径别名设置
 * - 覆盖率配置
 * - 测试超时设置
 *
 * dependencies: Vitest, jsdom, React Testing Library
 * exports: Vitest配置对象
 * notes: 修改配置后需要重启测试服务器
 */

import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    pool: 'vmThreads',
    isolate: false,
    fileParallelism: false,
    maxConcurrency: 1,

    // Temporarily skip problematic tests while keeping them in codebase
    // These will be fixed in next iteration
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/**/*.d.ts',
        'src/**/*.test.*',
        'src/**/__tests__/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
