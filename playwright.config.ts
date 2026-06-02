/**
 * @file playwright.config.ts
 * @description YYC³ Playwright E2E 测试配置 - 独立于 Vitest
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2025-03-19
 * @updated 2025-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2025 YanYuCloudCube Team
 * @tags playwright, e2e, testing, config
 */

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3156',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3156',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
