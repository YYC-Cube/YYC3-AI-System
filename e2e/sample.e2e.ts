/**
 * @file sample.e2e.ts
 * @description YYC³便携式智能AI系统 - Playwright E2E示例测试
 * Playwright E2E Sample Tests
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags playwright,e2e,sample
 */

import { test, expect } from '@playwright/test'

test.describe('YYC³ Application', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('http://localhost:3156')
    await expect(page).toHaveTitle(/YYC/)
  })

  test('should display header', async ({ page }) => {
    await page.goto('http://localhost:3156')
    const header = page.locator('header').first()
    await expect(header).toBeVisible()
  })

  test('should navigate to IDE', async ({ page }) => {
    await page.goto('http://localhost:3156')
    await page.click('a[href="/ide"]')
    await expect(page).toHaveURL(/.*\/ide/)
  })
})
