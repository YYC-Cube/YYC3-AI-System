/**
 * @file realtime-collab-reconnect.spec.ts
 * @description YYC³便携式智能AI系统 - 实时协作断线重连E2E测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags playwright,e2e,collaboration,reconnect,websocket,offline
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3156'

/* ═════════════════════════════════════════════════════
 *  Test Suite 4: 断线重连 - 场景1: 网络断开自动重连
 * ═════════════════════════════════════════════════════ */

test.describe('断线重连 - 场景1: 网络断开自动重连', () => {
  test('应该在网络断开后自动重连', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 打开协作面板查看连接状态
    await page.keyboard.press('Control+Alt+r')
    await page.waitForSelector('[data-testid="collab-panel"]')

    // 验证初始连接状态
    const connectionStatus = page.locator(
      '[data-testid="connection-status"]',
    )
    await expect(connectionStatus).toContainText('online')

    // 模拟网络断开（通过关闭WebSocket连接）
    // 注意：实际测试中可能需要使用CDP或mock来模拟网络断开
    await page.evaluate(() => {
      // 模拟网络断开
      window.dispatchEvent(new Event('offline'))
    })

    // 等待状态更新
    await page.waitForTimeout(2000)

    // 验证连接状态变为离线
    await expect(connectionStatus).toContainText('offline')

    // 验证显示离线通知
    const offlineNotification = page.locator(
      '[data-testid="offline-notification"]',
    )
    await expect(offlineNotification).toBeVisible()

    // 模拟网络恢复
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'))
    })

    // 等待自动重连
    await page.waitForTimeout(3000)

    // 验证连接状态恢复为在线
    await expect(connectionStatus).toContainText('online')

    // 验证离线通知消失
    await expect(offlineNotification).not.toBeVisible()
  })

  test('应该在多次断线重连后保持连接稳定性', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 打开协作面板
    await page.keyboard.press('Control+Alt+r')
    await page.waitForSelector('[data-testid="collab-panel"]')

    const connectionStatus = page.locator(
      '[data-testid="connection-status"]',
    )

    // 模拟3次断线重连
    for (let i = 0; i < 3; i++) {
      // 断开网络
      await page.evaluate(() => {
        window.dispatchEvent(new Event('offline'))
      })
      await page.waitForTimeout(2000)

      await expect(connectionStatus).toContainText('offline')

      // 恢复网络
      await page.evaluate(() => {
        window.dispatchEvent(new Event('online'))
      })
      await page.waitForTimeout(3000)

      // 验证重连成功
      await expect(connectionStatus).toContainText('online')
    }

    // 验证最终连接状态稳定
    await page.waitForTimeout(2000)
    await expect(connectionStatus).toContainText('online')
  })

  test('应该在重连失败后继续尝试重连', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 打开协作面板
    await page.keyboard.press('Control+Alt+r')
    await page.waitForSelector('[data-testid="collab-panel"]')

    const connectionStatus = page.locator(
      '[data-testid="connection-status"]',
    )

    // 模拟网络断开并重连失败
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'))
    })
    await page.waitForTimeout(2000)

    await expect(connectionStatus).toContainText('offline')

    // 模拟网络恢复但WebSocket连接失败
    await page.evaluate(() => {
      // Mock WebSocket连接失败
      ;(window as any).mockWebSocketConnect = false
      window.dispatchEvent(new Event('online'))
    })
    await page.waitForTimeout(3000)

    // 验证显示重连中状态
    await expect(connectionStatus).toContainText('reconnecting')

    // 验证重连计数器显示
    const reconnectAttempts = page.locator(
      '[data-testid="reconnect-attempts"]',
    )
    await expect(reconnectAttempts).toBeVisible()

    // 等待多次重连尝试
    await page.waitForTimeout(10000)

    // 验证仍在尝试重连
    await expect(connectionStatus).toContainText('reconnecting')

    // 清除mock
    await page.evaluate(() => {
      ;(window as any).mockWebSocketConnect = true
    })
  })
})

/* ═════════════════════════════════════════════════════
 *  Test Suite 5: 断线重连 - 场景2: 重连后数据同步
 * ═════════════════════════════════════════════════════ */

test.describe('断线重连 - 场景2: 重连后数据同步', () => {
  test('应该在重连后自动同步离线操作', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 打开离线状态指示器
    await page.waitForSelector('[data-testid="offline-status-indicator"]')

    // 模拟网络断开
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'))
    })
    await page.waitForTimeout(2000)

    // 在离线状态下执行操作（创建文件）
    await page.click('[data-testid="create-file-button"]')
    await page.fill('[data-testid="file-name-input"]', 'offline-file.js')
    await page.click('[data-testid="confirm-button"]')

    // 验证操作被加入队列
    const offlineIndicator = page.locator(
      '[data-testid="offline-status-indicator"]',
    )
    await expect(offlineIndicator).toContainText('队列: 1')

    // 在离线状态下再创建一个文件
    await page.click('[data-testid="create-file-button"]')
    await page.fill('[data-testid="file-name-input"]', 'offline-file-2.js')
    await page.click('[data-testid="confirm-button"]')

    // 验证队列数量增加
    await expect(offlineIndicator).toContainText('队列: 2')

    // 模拟网络恢复
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'))
    })
    await page.waitForTimeout(3000)

    // 验证连接状态恢复为在线
    const connectionStatus = page.locator(
      '[data-testid="connection-status"]',
    )
    await expect(connectionStatus).toContainText('online')

    // 验证状态变为同步中
    await expect(connectionStatus).toContainText('syncing')

    // 等待同步完成
    await page.waitForTimeout(3000)

    // 验证同步完成，队列清空
    await expect(offlineIndicator).not.toContainText('队列: 2')
    await expect(offlineIndicator).toContainText('队列: 0')

    // 验证最终状态恢复为在线
    await expect(connectionStatus).toContainText('online')
  })

  test('应该在重连后正确处理冲突', async ({ browser }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    try {
      // 用户1打开IDE
      await page1.goto(`${BASE_URL}/ide`)
      await page1.waitForLoadState('networkidle')
      await page1.click('[data-testid="file-manager"]')
      await page1.click('text=conflict-test.js')
      await page1.waitForSelector('[data-testid="code-editor"]')

      // 用户2打开IDE
      await page2.goto(`${BASE_URL}/ide`)
      await page2.waitForLoadState('networkidle')
      await page2.click('[data-testid="file-manager"]')
      await page2.click('text=conflict-test.js')
      await page2.waitForSelector('[data-testid="code-editor"]')

      // 用户1在离线状态下编辑文件
      await page1.evaluate(() => {
        window.dispatchEvent(new Event('offline'))
      })
      await page1.waitForTimeout(1000)

      const editor1 = page1.locator('[data-testid="code-editor"] textarea').first()
      await editor1.fill('// User 1 offline edit\nconst version1 = "v1"')

      // 用户2在线编辑同一文件
      const editor2 = page2.locator('[data-testid="code-editor"] textarea').first()
      await editor2.fill('// User 2 online edit\nconst version2 = "v2"')

      // 用户1重连
      await page1.evaluate(() => {
        window.dispatchEvent(new Event('online'))
      })
      await page1.waitForTimeout(3000)

      // 验证显示冲突解决对话框
      const conflictDialog = page1.locator(
        '[data-testid="conflict-dialog"]',
      )
      await expect(conflictDialog).toBeVisible()

      // 验证冲突对话框显示两个版本
      await expect(
        page1.locator('[data-testid="local-version"]'),
      ).toBeVisible()
      await expect(
        page1.locator('[data-testid="remote-version"]'),
      ).toBeVisible()

      // 验证提供解决选项
      await expect(
        page1.locator('[data-testid="resolve-local"]'),
      ).toBeVisible()
      await expect(
        page1.locator('[data-testid="resolve-remote"]'),
      ).toBeVisible()
      await expect(
        page1.locator('[data-testid="resolve-merge"]'),
      ).toBeVisible()
    } finally {
      await context1.close()
      await context2.close()
    }
  })
})
