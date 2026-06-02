/**
 * @file realtime-collab-offline-recovery.spec.ts
 * @description YYC³便携式智能AI系统 - 实时协作离线恢复E2E测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags playwright,e2e,collaboration,offline-recovery,websocket
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3156'

/* ═════════════════════════════════════════════════════
 *  Test Suite 6: 离线恢复 - 场景1: 离线状态下功能降级
 * ═══════════════════════════════════════════════════ */

test.describe('离线恢复 - 场景1: 离线状态下功能降级', () => {
  test('应该在离线时显示功能不可用提示', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 模拟网络断开
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'))
    })
    await page.waitForTimeout(1000)

    // 验证显示离线状态指示器
    const offlineIndicator = page.locator(
      '[data-testid="offline-status-indicator"]',
    )
    await expect(offlineIndicator).toBeVisible()

    // 验证显示离线状态
    await expect(offlineIndicator).toContainText('离线')

    // 验证禁用在线功能按钮
    const onlineFeatures = page.locator(
      '[data-testid="requires-online"][disabled]',
    )
    await expect(onlineFeatures).toHaveCount(1)

    // 验证显示降级提示
    const degradationWarning = page.locator(
      '[data-testid="degradation-warning"]',
    )
    await expect(degradationWarning).toBeVisible()
    await expect(degradationWarning).toContainText('网络不可用')
  })

  test('应该在离线时禁用实时协作功能', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 打开协作面板
    await page.keyboard.press('Control+Alt+r')
    await page.waitForSelector('[data-testid="collab-panel"]')

    // 验证在线状态显示协作功能可用
    const presenceTab = page.locator('[data-testid="collab-tab-presence"]')
    await expect(presenceTab).toBeEnabled()

    const cursorsTab = page.locator('[data-testid="collab-tab-cursors"]')
    await expect(cursorsTab).toBeEnabled()

    // 模拟网络断开
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'))
    })
    await page.waitForTimeout(1000)

    // 验证协作功能被禁用
    await expect(presenceTab).toBeDisabled()
    await expect(cursorsTab).toBeDisabled()

    // 验证显示功能不可用提示
    const offlineNotice = page.locator('[data-testid="offline-notice"]')
    await expect(offlineNotice).toBeVisible()
    await expect(offlineNotice).toContainText('实时协作功能不可用')
  })

  test('应该在离线时使用本地缓存数据', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 打开文件管理器
    await page.click('[data-testid="file-manager"]')
    await page.waitForSelector('[data-testid="file-list"]')

    // 记录在线时的文件列表
    const filesOnline = page.locator('[data-testid="file-item"]')
    const onlineCount = await filesOnline.count()

    // 模拟网络断开
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'))
    })
    await page.waitForTimeout(1000)

    // 验证仍然可以访问本地缓存的数据
    const filesOffline = page.locator('[data-testid="file-item"]')
    const offlineCount = await filesOffline.count()

    // 验证离线时显示的文件数量与在线时相同（使用缓存）
    expect(offlineCount).toBe(onlineCount)

    // 验证显示缓存提示
    const cacheNotice = page.locator('[data-testid="cache-notice"]')
    await expect(cacheNotice).toBeVisible()
    await expect(cacheNotice).toContainText('使用本地缓存数据')
  })
})

/* ═════════════════════════════════════════════════════
 *  Test Suite 7: 离线恢复 - 场景2: 离线操作队列和恢复
 * ═════════════════════════════════════════════════════ */

test.describe('离线恢复 - 场景2: 离线操作队列和恢复', () => {
  test('应该在离线时将操作加入队列', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 模拟网络断开
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'))
    })
    await page.waitForTimeout(1000)

    // 在离线状态下创建文件
    await page.click('[data-testid="create-file-button"]')
    await page.fill('[data-testid="file-name-input"]', 'offline-queue-1.js')
    await page.click('[data-testid="confirm-button"]')

    // 等待操作入队
    await page.waitForTimeout(500)

    // 验证离线状态指示器显示队列数量
    const offlineIndicator = page.locator(
      '[data-testid="offline-status-indicator"]',
    )
    await expect(offlineIndicator).toContainText('队列: 1')

    // 在离线状态下再创建一个文件
    await page.click('[data-testid="create-file-button"]')
    await page.fill('[data-testid="file-name-input"]', 'offline-queue-2.js')
    await page.click('[data-testid="confirm-button"]')

    // 等待操作入队
    await page.waitForTimeout(500)

    // 验证队列数量增加
    await expect(offlineIndicator).toContainText('队列: 2')
  })

  test('应该在恢复网络后自动同步队列操作', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 模拟网络断开
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'))
    })
    await page.waitForTimeout(1000)

    // 在离线状态下创建3个文件
    for (let i = 1; i <= 3; i++) {
      await page.click('[data-testid="create-file-button"]')
      await page.fill(
        '[data-testid="file-name-input"]',
        `offline-sync-${i}.js`,
      )
      await page.click('[data-testid="confirm-button"]')
      await page.waitForTimeout(500)
    }

    // 验证队列中有3个操作
    const offlineIndicator = page.locator(
      '[data-testid="offline-status-indicator"]',
    )
    await expect(offlineIndicator).toContainText('队列: 3')

    // 模拟网络恢复
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'))
    })

    // 等待自动同步开始
    await page.waitForTimeout(2000)

    // 验证连接状态变为同步中
    const connectionStatus = page.locator(
      '[data-testid="connection-status"]',
    )
    await expect(connectionStatus).toContainText('syncing')

    // 等待同步完成
    await page.waitForTimeout(5000)

    // 验证队列清空
    await expect(offlineIndicator).toContainText('队列: 0')

    // 验证同步完成，状态恢复为在线
    await expect(connectionStatus).toContainText('online')
  })

  test('应该在部分操作同步失败后继续重试', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 模拟网络断开
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'))
    })
    await page.waitForTimeout(1000)

    // 在离线状态下创建2个文件
    await page.click('[data-testid="create-file-button"]')
    await page.fill('[data-testid="file-name-input"]', 'success-file.js')
    await page.click('[data-testid="confirm-button"]')
    await page.waitForTimeout(500)

    await page.click('[data-testid="create-file-button"]')
    await page.fill('[data-testid="file-name-input"]', 'failure-file.js')
    await page.click('[data-testid="confirm-button"]')
    await page.waitForTimeout(500)

    // 模拟网络恢复
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'))
    })

    // Mock同步部分失败
    await page.evaluate(() => {
      ;(window as any).mockSyncFailure = ['failure-file.js']
    })

    // 等待同步尝试
    await page.waitForTimeout(5000)

    // 验证队列中仍有失败的操作
    const offlineIndicator = page.locator(
      '[data-testid="offline-status-indicator"]',
    )
    await expect(offlineIndicator).toContainText('队列: 1')

    // 验证显示同步失败通知
    const syncFailedNotice = page.locator(
      '[data-testid="sync-failed-notice"]',
    )
    await expect(syncFailedNotice).toBeVisible()
    await expect(syncFailedNotice).toContainText('部分操作同步失败')

    // 验证提供重试选项
    const retryButton = page.locator('[data-testid="retry-sync-button"]')
    await expect(retryButton).toBeVisible()

    // 点击重试按钮
    await retryButton.click()

    // 清除mock
    await page.evaluate(() => {
      delete (window as any).mockSyncFailure
    })

    // 等待重试完成
    await page.waitForTimeout(3000)

    // 验证队列清空
    await expect(offlineIndicator).toContainText('队列: 0')
  })
})
