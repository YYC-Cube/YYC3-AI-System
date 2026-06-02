/**
 * @file realtime-collab-conflict-resolution.spec.ts
 * @description YYC³便携式智能AI系统 - 实时协作冲突解决E2E测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags playwright,e2e,collaboration,conflict-resolution,websocket
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3156'

/* ═══════════════════════════════════════════════════
 *  Test Suite 8: 冲突解决 - 场景1: 版本冲突检测
 * ═══════════════════════════════════════════════════ */

test.describe('冲突解决 - 场景1: 版本冲突检测', () => {
  test('应该检测到两个用户同时编辑同一文件的冲突', async ({
    browser,
  }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    try {
      // 两个用户打开IDE和同一文件
      await Promise.all([
        page1.goto(`${BASE_URL}/ide`),
        page2.goto(`${BASE_URL}/ide`),
      ])
      await Promise.all([page1.waitForLoadState('networkidle'), page2.waitForLoadState('networkidle')])

      await Promise.all([
        page1.click('[data-testid="file-manager"]'),
        page2.click('[data-testid="file-manager"]'),
      ])

      await Promise.all([
        page1.click('text=conflict-test.js'),
        page2.click('text=conflict-test.js'),
      ])

      await Promise.all([
        page1.waitForSelector('[data-testid="code-editor"]'),
        page2.waitForSelector('[data-testid="code-editor"]'),
      ])

      // 用户1编辑文件
      const editor1 = page1.locator('[data-testid="code-editor"] textarea').first()
      await editor1.fill('// User 1 edit\nconst a = 1')

      // 等待一小段时间
      await page1.waitForTimeout(500)

      // 用户2编辑同一文件（可能产生冲突）
      const editor2 = page2.locator('[data-testid="code-editor"] textarea').first()
      await editor2.fill('// User 2 edit\nconst b = 2')

      // 等待冲突检测
      await Promise.all([page1.waitForTimeout(2000), page2.waitForTimeout(2000)])

      // 验证显示冲突对话框
      const conflictDialog1 = page1.locator(
        '[data-testid="conflict-dialog"]',
      )
      const conflictDialog2 = page2.locator(
        '[data-testid="conflict-dialog"]',
      )

      // 至少一个用户应该看到冲突对话框
      const hasConflict1 = await conflictDialog1.isVisible().catch(() => false)
      const hasConflict2 = await conflictDialog2.isVisible().catch(() => false)

      expect(
        hasConflict1 || hasConflict2,
      ).toBe(true)
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('应该正确显示冲突的两个版本', async ({ browser }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    try {
      // 两个用户打开IDE和同一文件
      await Promise.all([
        page1.goto(`${BASE_URL}/ide`),
        page2.goto(`${BASE_URL}/ide`),
      ])
      await Promise.all([page1.waitForLoadState('networkidle'), page2.waitForLoadState('networkidle')])

      await Promise.all([
        page1.click('[data-testid="file-manager"]'),
        page2.click('[data-testid="file-manager"]'),
      ])

      await Promise.all([
        page1.click('text=version-conflict.js'),
        page2.click('text=version-conflict.js'),
      ])

      await Promise.all([
        page1.waitForSelector('[data-testid="code-editor"]'),
        page2.waitForSelector('[data-testid="code-editor"]'),
      ])

      // 用户1修改版本
      const editor1 = page1.locator('[data-testid="code-editor"] textarea').first()
      await editor1.fill('const version1 = "v1.0"')

      // 用户2修改版本
      const editor2 = page2.locator('[data-testid="code-editor"] textarea').first()
      await editor2.fill('const version2 = "v2.0"')

      // 等待冲突
      await page1.waitForTimeout(2000)

      // 验证冲突对话框显示本地版本
      const localVersion = page1.locator(
        '[data-testid="local-version-content"]',
      )
      await expect(localVersion).toBeVisible()
      await expect(localVersion).toContainText('const version1 = "v1.0"')

      // 验证冲突对话框显示远程版本
      const remoteVersion = page1.locator(
        '[data-testid="remote-version-content"]',
      )
      await expect(remoteVersion).toBeVisible()
      await expect(remoteVersion).toContainText('const version2 = "v2.0"')

      // 验证显示版本号
      await expect(
        page1.locator('[data-testid="local-version-number"]'),
      ).toBeVisible()
      await expect(
        page1.locator('[data-testid="remote-version-number"]'),
      ).toBeVisible()
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('应该显示冲突的差异对比', async ({ browser }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    try {
      // 两个用户打开IDE和同一文件
      await Promise.all([
        page1.goto(`${BASE_URL}/ide`),
        page2.goto(`${BASE_URL}/ide`),
      ])
      await Promise.all([page1.waitForLoadState('networkidle'), page2.waitForLoadState('networkidle')])

      await Promise.all([
        page1.click('[data-testid="file-manager"]'),
        page2.click('[data-testid="file-manager"]'),
      ])

      await Promise.all([
        page1.click('text=diff-conflict.js'),
        page2.click('text=diff-conflict.js'),
      ])

      await Promise.all([
        page1.waitForSelector('[data-testid="code-editor"]'),
        page2.waitForSelector('[data-testid="code-editor"]'),
      ])

      // 用户1添加内容
      const editor1 = page1.locator('[data-testid="code-editor"] textarea').first()
      await editor1.fill('const a = 1\nconst b = 2\nconst c = 3')

      // 用户2删除内容
      const editor2 = page2.locator('[data-testid="code-editor"] textarea').first()
      await editor2.fill('const a = 1')

      // 等待冲突
      await page1.waitForTimeout(2000)

      // 验证显示差异视图
      const diffView = page1.locator('[data-testid="diff-view"]')
      await expect(diffView).toBeVisible()

      // 验证显示新增的内容
      const addedLines = page1.locator(
        '[data-testid="diff-added"]',
      )
      await expect(addedLines).toHaveCount(2) // b和c

      // 验证显示删除的内容
      const removedLines = page1.locator(
        '[data-testid="diff-removed"]',
      )
      await expect(removedLines).toHaveCount(1)

      // 验证显示修改的内容
      const modifiedLines = page1.locator(
        '[data-testid="diff-modified"]',
      )
      await expect(modifiedLines).toHaveCount(1)
    } finally {
      await context1.close()
      await context2.close()
    }
  })
})

/* ═══════════════════════════════════════════════════
 *  Test Suite 9: 冲突解决 - 场景2: 冲突解决策略
 * ═══════════════════════════════════════════════════ */

test.describe('冲突解决 - 场景2: 冲突解决策略', () => {
  test('应该支持选择本地版本解决冲突', async ({ browser }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    try {
      // 两个用户打开IDE和同一文件
      await Promise.all([
        page1.goto(`${BASE_URL}/ide`),
        page2.goto(`${BASE_URL}/ide`),
      ])
      await Promise.all([page1.waitForLoadState('networkidle'), page2.waitForLoadState('networkidle')])

      await Promise.all([
        page1.click('[data-testid="file-manager"]'),
        page2.click('[data-testid="file-manager"]'),
      ])

      await Promise.all([
        page1.click('text=resolve-local.js'),
        page2.click('text=resolve-local.js'),
      ])

      await Promise.all([
        page1.waitForSelector('[data-testid="code-editor"]'),
        page2.waitForSelector('[data-testid="code-editor"]'),
      ])

      // 用户1修改
      const editor1 = page1.locator('[data-testid="code-editor"] textarea').first()
      await editor1.fill('// Local version\nconst x = 1')

      // 用户2修改
      const editor2 = page2.locator('[data-testid="code-editor"] textarea').first()
      await editor2.fill('// Remote version\nconst x = 2')

      // 等待冲突
      await page1.waitForTimeout(2000)

      // 点击"使用本地版本"按钮
      await page1.click('[data-testid="resolve-local"]')

      // 等待解决
      await page1.waitForTimeout(1000)

      // 验证冲突对话框关闭
      const conflictDialog = page1.locator(
        '[data-testid="conflict-dialog"]',
      )
      await expect(conflictDialog).not.toBeVisible()

      // 验证使用本地版本
      const finalContent = await editor1.inputValue()
      expect(finalContent).toContain('// Local version')
      expect(finalContent).toContain('const x = 1')
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('应该支持选择远程版本解决冲突', async ({ browser }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    try {
      // 两个用户打开IDE和同一文件
      await Promise.all([
        page1.goto(`${BASE_URL}/ide`),
        page2.goto(`${BASE_URL}/ide`),
      ])
      await Promise.all([page1.waitForLoadState('networkidle'), page2.waitForLoadState('networkidle')])

      await Promise.all([
        page1.click('[data-testid="file-manager"]'),
        page2.click('[data-testid="file-manager"]'),
      ])

      await Promise.all([
        page1.click('text=resolve-remote.js'),
        page2.click('text=resolve-remote.js'),
      ])

      await Promise.all([
        page1.waitForSelector('[data-testid="code-editor"]'),
        page2.waitForSelector('[data-testid="code-editor"]'),
      ])

      // 用户1修改
      const editor1 = page1.locator('[data-testid="code-editor"] textarea').first()
      await editor1.fill('// Local version\nconst y = 1')

      // 用户2修改
      const editor2 = page2.locator('[data-testid="code-editor"] textarea').first()
      await editor2.fill('// Remote version\nconst y = 2')

      // 等待冲突
      await page1.waitForTimeout(2000)

      // 点击"使用远程版本"按钮
      await page1.click('[data-testid="resolve-remote"]')

      // 等待解决
      await page1.waitForTimeout(1000)

      // 验证冲突对话框关闭
      const conflictDialog = page1.locator(
        '[data-testid="conflict-dialog"]',
      )
      await expect(conflictDialog).not.toBeVisible()

      // 验证使用远程版本
      const finalContent = await editor1.inputValue()
      expect(finalContent).toContain('// Remote version')
      expect(finalContent).toContain('const y = 2')
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('应该支持合并两个版本解决冲突', async ({ browser }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    try {
      // 两个用户打开IDE和同一文件
      await Promise.all([
        page1.goto(`${BASE_URL}/ide`),
        page2.goto(`${BASE_URL}/ide`),
      ])
      await Promise.all([page1.waitForLoadState('networkidle'), page2.waitForLoadState('networkidle')])

      await Promise.all([
        page1.click('[data-testid="file-manager"]'),
        page2.click('[data-testid="file-manager"]'),
      ])

      await Promise.all([
        page1.click('text=merge-versions.js'),
        page2.click('text=merge-versions.js'),
      ])

      await Promise.all([
        page1.waitForSelector('[data-testid="code-editor"]'),
        page2.waitForSelector('[data-testid="code-editor"]'),
      ])

      // 用户1添加函数
      const editor1 = page1.locator('[data-testid="code-editor"] textarea').first()
      await editor1.fill('function func1() {\n  return 1\n}\n')

      // 用户2添加另一个函数
      const editor2 = page2.locator('[data-testid="code-editor"] textarea').first()
      await editor2.fill('function func2() {\n  return 2\n}\n')

      // 等待冲突
      await page1.waitForTimeout(2000)

      // 点击"合并版本"按钮
      await page1.click('[data-testid="resolve-merge"]')

      // 等待解决
      await page1.waitForTimeout(1000)

      // 验证冲突对话框关闭
      const conflictDialog = page1.locator(
        '[data-testid="conflict-dialog"]',
      )
      await expect(conflictDialog).not.toBeVisible()

      // 验证合并后的内容包含两个函数
      const finalContent = await editor1.inputValue()
      expect(finalContent).toContain('function func1()')
      expect(finalContent).toContain('function func2()')
    } finally {
      await context1.close()
      await context2.close()
    }
  })
})
