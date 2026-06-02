/**
 * @file collaboration-features.spec.ts
 * @description YYC³便携式智能AI系统 - 协作功能E2E测试
 * Collaboration Features E2E Tests
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @status active
 * @tags playwright,e2e,collaboration,realtime
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3156'

/* ═════════════════════════════════════════════════════
 *  P1-05-3: 协作功能E2E测试 (2个测试用例)
 * ═══════════════════════════════════════════════════ */

test.describe('协作功能 - Collaboration Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')
  })

  test('应该完成多用户实时协作流程', async ({ browser }) => {
    // 创建两个浏览器上下文模拟两个用户
    const user1Context = await browser.newContext()
    const user2Context = await browser.newContext()

    const user1Page = await user1Context.newPage()
    const user2Page = await user2Context.newPage()

    // Step 1: 两个用户同时打开IDE
    await user1Page.goto(`${BASE_URL}/ide`)
    await user1Page.waitForLoadState('networkidle')

    await user2Page.goto(`${BASE_URL}/ide`)
    await user2Page.waitForLoadState('networkidle')

    // Step 2: 用户1创建文件并编辑
    await user1Page.click('[data-testid="file-manager-trigger"]')
    await user1Page.click('[data-testid="create-new-file-button"]')
    await user1Page.fill('[data-testid="file-name-input"]', 'shared.ts')
    await user1Page.click('[data-testid="create-file-confirm"]')

    const editor1 = user1Page.locator('[data-testid="monaco-editor"]').nth(0)
    await editor1.fill('const sharedData = "Hello from User1"')
    await user1Page.click('[data-testid="save-file-button"]')

    // Step 3: 用户2打开同一文件
    await user2Page.click('[data-testid="file-manager-trigger"]')
    await user2Page.click('text=shared.ts')
    await user2Page.waitForTimeout(500)

    // Step 4: 验证用户2能看到用户1的光标
    const user1Cursor = user2Page.locator('[data-testid="collab-cursor-user1"]')
    await expect(user1Cursor).toBeVisible()
    await expect(user1Cursor).toContainText('User1')

    // Step 5: 用户2编辑文件
    const editor2 = user2Page.locator('[data-testid="monaco-editor"]').nth(0)
    await editor2.click()
    await editor2.fill('const sharedData = "Hello from User2"')
    await user2Page.click('[data-testid="save-file-button"]')

    // Step 6: 验证用户1能看到用户2的光标
    const user2Cursor = user1Page.locator('[data-testid="collab-cursor-user2"]')
    await expect(user2Cursor).toBeVisible()
    await expect(user2Cursor).toContainText('User2')

    // Step 7: 验证实时协作状态指示器
    const collabStatus1 = user1Page.locator('[data-testid="collab-status"]')
    await expect(collabStatus1).toBeVisible()
    await expect(collabStatus1).toContainText('2 users')

    const collabStatus2 = user2Page.locator('[data-testid="collab-status"]')
    await expect(collabStatus2).toBeVisible()
    await expect(collabStatus2).toContainText('2 users')

    // Step 8: 验证协作历史记录
    await user1Page.click('[data-testid="collab-history-trigger"]')
    await expect(user1Page.locator('[data-testid="collab-history-panel"]')).toBeVisible()
    await expect(user1Page.locator('[data-testid="collab-history"]')).toContainText('User1')
    await expect(user1Page.locator('[data-testid="collab-history"]')).toContainText('User2')

    // Step 9: 验证多用户协作流程完成
    await expect(user1Page.locator('[data-testid="multi-user-collab-complete"]')).toBeVisible()
    await expect(user2Page.locator('[data-testid="multi-user-collab-complete"]')).toBeVisible()

    // 清理
    await user1Context.close()
    await user2Context.close()
  })

  test('应该完成协作冲突解决流程', async ({ browser }) => {
    // 创建两个浏览器上下文模拟冲突场景
    const user1Context = await browser.newContext()
    const user2Context = await browser.newContext()

    const user1Page = await user1Context.newPage()
    const user2Page = await user2Context.newPage()

    // Step 1: 两个用户同时打开同一文件
    await user1Page.goto(`${BASE_URL}/ide`)
    await user1Page.waitForLoadState('networkidle')
    await user1Page.click('[data-testid="file-manager-trigger"]')
    await user1Page.click('[data-testid="create-new-file-button"]')
    await user1Page.fill('[data-testid="file-name-input"]', 'conflict.ts')
    await user1Page.click('[data-testid="create-file-confirm"]')

    const editor1 = user1Page.locator('[data-testid="monaco-editor"]').nth(0)
    await editor1.fill('const value = 1')

    await user2Page.goto(`${BASE_URL}/ide`)
    await user2Page.waitForLoadState('networkidle')
    await user2Page.click('[data-testid="file-manager-trigger"]')
    await user2Page.click('text=conflict.ts')

    const editor2 = user2Page.locator('[data-testid="monaco-editor"]').nth(0)
    await editor2.fill('const value = 1')

    // Step 2: 用户1保存文件
    await user1Page.click('[data-testid="save-file-button"]')

    // Step 3: 用户2修改同一行并保存（触发冲突）
    await editor2.fill('const value = 2')
    await user2Page.click('[data-testid="save-file-button"]')

    // Step 4: 等待冲突检测
    await user2Page.waitForSelector('[data-testid="conflict-detected"]', { timeout: 10000 })
    await expect(user2Page.locator('[data-testid="conflict-detected"]')).toBeVisible()

    // Step 5: 打开冲突解决对话框
    await user2Page.click('[data-testid="resolve-conflict-trigger"]')
    await expect(user2Page.locator('[data-testid="conflict-resolution-dialog"]')).toBeVisible()

    // Step 6: 查看冲突详情
    await expect(user2Page.locator('[data-testid="conflict-local"]')).toContainText('const value = 2')
    await expect(user2Page.locator('[data-testid="conflict-remote"]')).toContainText('const value = 1')

    // Step 7: 选择解决策略（合并）
    await user2Page.click('[data-testid="merge-strategy"]')

    // Step 8: 查看合并预览
    const mergedPreview = user2Page.locator('[data-testid="merged-preview"]')
    await expect(mergedPreview).toBeVisible()

    // Step 9: 应用合并结果
    await user2Page.click('[data-testid="apply-merge-button"]')

    // Step 10: 验证冲突已解决
    await expect(user2Page.locator('[data-testid="conflict-resolved"]')).toBeVisible()

    // Step 11: 验证用户1也能看到更新
    await user1Page.reload()
    await user1Page.waitForLoadState('networkidle')
    const updatedContent = await editor1.textContent()
    expect(updatedContent).toContain('const value')

    // Step 12: 验证协作冲突解决流程完成
    await expect(user2Page.locator('[data-testid="conflict-resolution-complete"]')).toBeVisible()

    // 清理
    await user1Context.close()
    await user2Context.close()
  })
})
