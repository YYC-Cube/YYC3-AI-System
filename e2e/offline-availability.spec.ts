/**
 * @file offline-availability.spec.ts
 * @description YYC³便携式智能AI系统 - 离线可用性E2E测试套件
 * P0-12: 离线可用性测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags playwright,e2e,offline-availability,pwa
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3156'

/* ═════════════════════════════════════════════════════
 *  Test Suite 1: PWA基础功能 - Service Worker和缓存
 * ═══════════════════════════════════════════════════ */

test.describe('PWA基础功能 - Service Worker和缓存', () => {
  test.beforeEach(async ({ context }) => {
    // 每个测试前清除Service Worker和缓存
    await context.clearCookies()
    await context.clearPermissions()
    await context.grantPermissions(['service-worker'])
  })

  test('应该成功注册Service Worker', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 验证Service Worker注册状态
    const swRegistration = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistration()
    })

    expect(swRegistration).toBeTruthy()
    expect(swRegistration?.active).toBeTruthy()
    expect(swRegistration?.state).toBe('activated')
  })

  test('应该缓存静态资源', async ({ page, context }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 等待Service Worker激活
    await page.waitForTimeout(3000)

    // 验证静态资源被缓存
    const cachedResources = await page.evaluate(async () => {
      const cache = await caches.open('static-v1')
      return await cache.keys()
    })

    expect(cachedResources.length).toBeGreaterThan(0)

    // 验证关键资源被缓存
    const staticResources = cachedResources.map(req => req.url)
    expect(staticResources.some(url => url.includes('.js'))).toBeTruthy()
    expect(staticResources.some(url => url.includes('.css'))).toBeTruthy()
  })

  test('应该离线时从缓存加载静态资源', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 等待资源缓存完成
    await page.waitForTimeout(3000)

    // 记录在线时的内容
    const onlineContent = await page.content()

    // 模拟离线
    await page.context().setOffline(true)

    // 重新加载页面
    await page.reload()
    await page.waitForTimeout(2000)

    // 验证页面仍然可以加载（从缓存）
    const offlineContent = await page.content()
    expect(offlineContent.length).toBeGreaterThan(0)

    // 验证显示离线指示器
    const offlineIndicator = page.locator(
      '[data-testid="offline-status-indicator"]',
    )
    await expect(offlineIndicator).toBeVisible()
    await expect(offlineIndicator).toContainText('离线')
  })

  test('应该缓存API响应', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 打开文件管理器，触发API请求
    await page.click('[data-testid="file-manager"]')
    await page.waitForSelector('[data-testid="file-list"]')

    // 等待缓存完成
    await page.waitForTimeout(2000)

    // 验证API响应被缓存
    const cachedAPI = await page.evaluate(async () => {
      const cache = await caches.open('api-v1')
      return await cache.keys()
    })

    expect(cachedAPI.length).toBeGreaterThan(0)

    // 验证包含API请求
    const apiRequests = cachedAPI.map(req => req.url)
    expect(apiRequests.some(url => url.includes('/api/'))).toBeTruthy()
  })
})

/* ═════════════════════════════════════════════════════
 *  Test Suite 2: 在线/离线状态切换
 * ═══════════════════════════════════════════════════ */

test.describe('在线/离线状态切换', () => {
  test('应该正确检测网络状态变化', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 验证初始状态为在线
    const connectionStatus = page.locator('[data-testid="connection-status"]')
    await expect(connectionStatus).toContainText('online')

    // 模拟离线
    await page.context().setOffline(true)
    await page.waitForTimeout(1000)

    // 验证状态变为离线
    await expect(connectionStatus).toContainText('offline')

    // 模拟在线
    await page.context().setOffline(false)
    await page.waitForTimeout(1000)

    // 验证状态恢复为在线
    await expect(connectionStatus).toContainText('online')
  })

  test('应该在离线时显示离线指示器', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 模拟离线
    await page.context().setOffline(true)
    await page.waitForTimeout(1000)

    // 验证离线指示器显示
    const offlineIndicator = page.locator(
      '[data-testid="offline-status-indicator"]',
    )
    await expect(offlineIndicator).toBeVisible()
    await expect(offlineIndicator).toHaveText(/离线/)
  })

  test('应该显示离线时的降级提示', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 模拟离线
    await page.context().setOffline(true)
    await page.waitForTimeout(1000)

    // 验证显示降级提示
    const degradationWarning = page.locator(
      '[data-testid="degradation-warning"]',
    )
    await expect(degradationWarning).toBeVisible()
    await expect(degradationWarning).toContainText('网络不可用')
  })

  test('应该在离线时禁用在线功能', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 记录在线时的状态
    const onlineFeatures = page.locator('[data-testid="requires-online"]')
    const onlineCount = await onlineFeatures.count()
    const onlineDisabledCount = await onlineFeatures
      .filter({ hasAttribute: 'disabled' })
      .count()

    // 模拟离线
    await page.context().setOffline(true)
    await page.waitForTimeout(1000)

    // 验证在线功能被禁用
    const offlineFeatures = page.locator('[data-testid="requires-online"]')
    const offlineDisabledCount = await offlineFeatures
      .filter({ hasAttribute: 'disabled' })
      .count()

    expect(offlineDisabledCount).toBeGreaterThan(onlineDisabledCount)
  })
})

/* ═════════════════════════════════════════════════════
 *  Test Suite 3: 离线数据持久化 - IndexedDB
 * ═══════════════════════════════════════════════════ */

test.describe('离线数据持久化 - IndexedDB', () => {
  test('应该将数据保存到IndexedDB', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 创建一个文件
    await page.click('[data-testid="create-file-button"]')
    await page.fill('[data-testid="file-name-input"]', 'test-file.js')
    await page.click('[data-testid="confirm-button"]')
    await page.waitForTimeout(1000)

    // 验证IndexedDB中存在该文件
    const fileExists = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('YYC3DB', 1)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const db = request.result
          const transaction = db.transaction(['files'], 'readonly')
          const objectStore = transaction.objectStore('files')
          const getRequest = objectStore.get('test-file.js')
          getRequest.onsuccess = () => resolve(!!getRequest.result)
          getRequest.onerror = () => reject(getRequest.error)
        }
      })
    })

    expect(fileExists).toBeTruthy()
  })

  test('应该离线时可以访问IndexedDB数据', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 创建一个文件
    await page.click('[data-testid="create-file-button"]')
    await page.fill('[data-testid="file-name-input"]', 'offline-access.js')
    await page.click('[data-testid="confirm-button"]')
    await page.waitForTimeout(1000)

    // 模拟离线
    await page.context().setOffline(true)
    await page.waitForTimeout(1000)

    // 打开文件管理器
    await page.click('[data-testid="file-manager"]')
    await page.waitForSelector('[data-testid="file-list"]')

    // 验证可以访问离线创建的文件
    const fileItem = page.locator(
      '[data-testid="file-item"][data-file-name="offline-access.js"]',
    )
    await expect(fileItem).toBeVisible()
  })

  test('应该更新IndexedDB中的数据', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 创建一个文件
    await page.click('[data-testid="create-file-button"]')
    await page.fill('[data-testid="file-name-input"]', 'update-test.js')
    await page.click('[data-testid="confirm-button"]')
    await page.waitForTimeout(1000)

    // 打开文件并编辑内容
    await page.click(
      '[data-testid="file-item"][data-file-name="update-test.js"]',
    )
    await page.waitForSelector('[data-testid="code-editor"]')
    await page.fill('[data-testid="code-editor"]', 'console.log("Hello, World!")')
    await page.click('[data-testid="save-button"]')
    await page.waitForTimeout(1000)

    // 验证IndexedDB中的数据已更新
    const fileContent = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('YYC3DB', 1)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const db = request.result
          const transaction = db.transaction(['files'], 'readonly')
          const objectStore = transaction.objectStore('files')
          const getRequest = objectStore.get('update-test.js')
          getRequest.onsuccess = () => resolve(getRequest.result?.content)
          getRequest.onerror = () => reject(getRequest.error)
        }
      })
    })

    expect(fileContent).toBe('console.log("Hello, World!")')
  })

  test('应该删除IndexedDB中的数据', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 创建一个文件
    await page.click('[data-testid="create-file-button"]')
    await page.fill('[data-testid="file-name-input"]', 'delete-test.js')
    await page.click('[data-testid="confirm-button"]')
    await page.waitForTimeout(1000)

    // 验证文件存在
    let fileExists = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('YYC3DB', 1)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const db = request.result
          const transaction = db.transaction(['files'], 'readonly')
          const objectStore = transaction.objectStore('files')
          const getRequest = objectStore.get('delete-test.js')
          getRequest.onsuccess = () => resolve(!!getRequest.result)
          getRequest.onerror = () => reject(getRequest.error)
        }
      })
    })

    expect(fileExists).toBeTruthy()

    // 删除文件
    await page.click(
      '[data-testid="file-item"][data-file-name="delete-test.js"]',
    )
    await page.click('[data-testid="delete-button"]')
    await page.click('[data-testid="confirm-button"]')
    await page.waitForTimeout(1000)

    // 验证文件已从IndexedDB删除
    fileExists = await page.evaluate(async () => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('YYC3DB', 1)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const db = request.result
          const transaction = db.transaction(['files'], 'readonly')
          const objectStore = transaction.objectStore('files')
          const getRequest = objectStore.get('delete-test.js')
          getRequest.onsuccess = () => resolve(!!getRequest.result)
          getRequest.onerror = () => reject(getRequest.error)
        }
      })
    })

    expect(fileExists).toBeFalsy()
  })
})

/* ═════════════════════════════════════════════════════
 *  Test Suite 4: 离线操作队列和同步
 * ═══════════════════════════════════════════════════ */

test.describe('离线操作队列和同步', () => {
  test('应该将离线操作加入队列', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 模拟离线
    await page.context().setOffline(true)
    await page.waitForTimeout(1000)

    // 创建一个文件
    await page.click('[data-testid="create-file-button"]')
    await page.fill('[data-testid="file-name-input"]', 'offline-queue-1.js')
    await page.click('[data-testid="confirm-button"]')
    await page.waitForTimeout(500)

    // 验证队列中有操作
    const offlineIndicator = page.locator(
      '[data-testid="offline-status-indicator"]',
    )
    await expect(offlineIndicator).toContainText('队列: 1')

    // 创建另一个文件
    await page.click('[data-testid="create-file-button"]')
    await page.fill('[data-testid="file-name-input"]', 'offline-queue-2.js')
    await page.click('[data-testid="confirm-button"]')
    await page.waitForTimeout(500)

    // 验证队列增加
    await expect(offlineIndicator).toContainText('队列: 2')
  })

  test('应该在恢复网络后自动同步队列操作', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 模拟离线
    await page.context().setOffline(true)
    await page.waitForTimeout(1000)

    // 创建3个文件
    for (let i = 1; i <= 3; i++) {
      await page.click('[data-testid="create-file-button"]')
      await page.fill('[data-testid="file-name-input"]', `sync-test-${i}.js`)
      await page.click('[data-testid="confirm-button"]')
      await page.waitForTimeout(500)
    }

    // 验证队列中有3个操作
    const offlineIndicator = page.locator(
      '[data-testid="offline-status-indicator"]',
    )
    await expect(offlineIndicator).toContainText('队列: 3')

    // 模拟在线
    await page.context().setOffline(false)
    await page.waitForTimeout(2000)

    // 验证连接状态变为同步中
    const connectionStatus = page.locator('[data-testid="connection-status"]')
    await expect(connectionStatus).toContainText('syncing')

    // 等待同步完成
    await page.waitForTimeout(5000)

    // 验证队列清空
    await expect(offlineIndicator).toContainText('队列: 0')

    // 验证同步完成，状态恢复为在线
    await expect(connectionStatus).toContainText('online')
  })

  test('应该在同步失败后继续重试', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 模拟离线
    await page.context().setOffline(true)
    await page.waitForTimeout(1000)

    // 创建一个文件
    await page.click('[data-testid="create-file-button"]')
    await page.fill('[data-testid="file-name-input"]', 'retry-test.js')
    await page.click('[data-testid="confirm-button"]')
    await page.waitForTimeout(500)

    // 模拟在线
    await page.context().setOffline(false)

    // Mock同步失败
    await page.evaluate(() => {
      ;(window as unknown).mockSyncFailure = ['retry-test.js']
    })

    // 等待同步尝试
    await page.waitForTimeout(5000)

    // 验证队列中仍有操作
    const offlineIndicator = page.locator(
      '[data-testid="offline-status-indicator"]',
    )
    await expect(offlineIndicator).toContainText('队列: 1')

    // 清除mock
    await page.evaluate(() => {
      delete (window as unknown).mockSyncFailure
    })

    // 点击重试按钮
    await page.click('[data-testid="retry-sync-button"]')

    // 等待重试完成
    await page.waitForTimeout(3000)

    // 验证队列清空
    await expect(offlineIndicator).toContainText('队列: 0')
  })

  test('应该处理同步冲突', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 模拟离线
    await page.context().setOffline(true)
    await page.waitForTimeout(1000)

    // 编辑文件
    await page.click('[data-testid="file-item"][data-file-name="test.js"]')
    await page.waitForSelector('[data-testid="code-editor"]')
    await page.fill('[data-testid="code-editor"]', '// Offline edit')
    await page.click('[data-testid="save-button"]')
    await page.waitForTimeout(500)

    // Mock同步冲突
    await page.evaluate(() => {
      ;(window as unknown).mockSyncConflict = ['test.js']
    })

    // 模拟在线
    await page.context().setOffline(false)

    // 等待同步尝试
    await page.waitForTimeout(3000)

    // 验证显示冲突解决对话框
    const conflictDialog = page.locator('[data-testid="conflict-dialog"]')
    await expect(conflictDialog).toBeVisible()
    await expect(conflictDialog).toContainText('同步冲突')

    // 选择保留本地版本
    await page.click('[data-testid="keep-local-button"]')

    // 等待冲突解决
    await page.waitForTimeout(2000)

    // 验证队列清空
    const offlineIndicator = page.locator(
      '[data-testid="offline-status-indicator"]',
    )
    await expect(offlineIndicator).toContainText('队列: 0')
  })
})

/* ═════════════════════════════════════════════════════
 *  Test Suite 5: 离线UI和用户体验
 * ═══════════════════════════════════════════════════ */

test.describe('离线UI和用户体验', () => {
  test('应该在离线时显示缓存提示', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 打开文件管理器
    await page.click('[data-testid="file-manager"]')
    await page.waitForSelector('[data-testid="file-list"]')

    // 模拟离线
    await page.context().setOffline(true)
    await page.waitForTimeout(1000)

    // 验证显示缓存提示
    const cacheNotice = page.locator('[data-testid="cache-notice"]')
    await expect(cacheNotice).toBeVisible()
    await expect(cacheNotice).toContainText('使用本地缓存数据')
  })

  test('应该在离线时提供手动同步按钮', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 模拟离线
    await page.context().setOffline(true)
    await page.waitForTimeout(1000)

    // 验证手动同步按钮可见
    const manualSyncButton = page.locator('[data-testid="manual-sync-button"]')
    await expect(manualSyncButton).toBeVisible()
  })

  test('应该在离线时显示操作历史', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 模拟离线
    await page.context().setOffline(true)
    await page.waitForTimeout(1000)

    // 创建一个文件
    await page.click('[data-testid="create-file-button"]')
    await page.fill('[data-testid="file-name-input"]', 'history-test.js')
    await page.click('[data-testid="confirm-button"]')
    await page.waitForTimeout(500)

    // 验证显示操作历史
    const operationHistory = page.locator('[data-testid="operation-history"]')
    await expect(operationHistory).toBeVisible()
  })

  test('应该在离线时提供性能统计', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 模拟离线
    await page.context().setOffline(true)
    await page.waitForTimeout(1000)

    // 验证显示性能统计
    const performanceStats = page.locator('[data-testid="performance-stats"]')
    await expect(performanceStats).toBeVisible()
  })
})

/* ═════════════════════════════════════════════════════
 *  Test Suite 6: 性能测试 - 离线场景
 * ═══════════════════════════════════════════════════ */

test.describe('性能测试 - 离线场景', () => {
  test('应该在离线时快速加载页面', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 等待资源缓存完成
    await page.waitForTimeout(3000)

    // 记录在线加载时间
    const onlineLoadTime = await page.evaluate(() => {
      return performance.timing.loadEventEnd - performance.timing.navigationStart
    })

    // 模拟离线
    await page.context().setOffline(true)

    // 重新加载页面并测量时间
    const startTime = Date.now()
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    const offlineLoadTime = Date.now() - startTime

    // 验证离线加载时间<1秒（从缓存）
    expect(offlineLoadTime).toBeLessThan(1000)

    // 验证离线加载比在线加载快
    expect(offlineLoadTime).toBeLessThan(onlineLoadTime)
  })

  test('应该在大数据量下保持离线性能', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 创建大量文件
    for (let i = 1; i <= 100; i++) {
      await page.click('[data-testid="create-file-button"]')
      await page.fill('[data-testid="file-name-input"]', `bulk-file-${i}.js`)
      await page.click('[data-testid="confirm-button"]')
      if (i % 10 === 0) {
        await page.waitForTimeout(100)
      }
    }

    // 模拟离线
    await page.context().setOffline(true)
    await page.waitForTimeout(1000)

    // 测量渲染时间
    const startTime = Date.now()
    await page.click('[data-testid="file-manager"]')
    await page.waitForSelector('[data-testid="file-list"]')
    const renderTime = Date.now() - startTime

    // 验证渲染时间<2秒
    expect(renderTime).toBeLessThan(2000)
  })

  test('应该在频繁切换网络状态时保持稳定', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 频繁切换网络状态
    for (let i = 1; i <= 10; i++) {
      await page.context().setOffline(true)
      await page.waitForTimeout(500)
      await page.context().setOffline(false)
      await page.waitForTimeout(500)
    }

    // 验证应用仍然正常运行
    const connectionStatus = page.locator('[data-testid="connection-status"]')
    await expect(connectionStatus).toContainText('online')

    // 验证可以打开文件管理器
    await page.click('[data-testid="file-manager"]')
    await page.waitForSelector('[data-testid="file-list"]')
    const files = page.locator('[data-testid="file-item"]')
    expect(await files.count()).toBeGreaterThan(0)
  })
})
