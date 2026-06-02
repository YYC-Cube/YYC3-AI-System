/**
 * @file edge-cases.spec.ts
 * @description YYC³便携式智能AI系统 - 边缘场景E2E测试
 * Edge Cases E2E Tests
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @status active
 * @tags playwright,e2e,edge-cases
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3156'

/* ═════════════════════════════════════════════════════
 *  P1-05-4: 边缘场景E2E测试 (3个测试用例)
 * ═══════════════════════════════════════════════════ */

test.describe('边缘场景 - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')
  })

  test('应该处理超大文件编辑场景', async ({ page }) => {
    // Step 1: 打开文件管理器
    await page.click('[data-testid="file-manager-trigger"]')
    await expect(page.locator('[data-testid="file-manager"]')).toBeVisible()

    // Step 2: 创建超大文件（模拟10000行代码）
    await page.click('[data-testid="create-new-file-button"]')
    await page.fill('[data-testid="file-name-input"]', 'large.ts')
    await page.click('[data-testid="create-file-confirm"]')

    // Step 3: 在编辑器中输入大量内容
    const editor = page.locator('[data-testid="monaco-editor"]').nth(0)
    const largeContent = Array.from({ length: 10000 }, (_, i) =>
      `const line${i} = ${i};\n`
    ).join('')

    await editor.click()
    await editor.fill(largeContent, { timeout: 30000 })

    // Step 4: 验证编辑器性能指标
    await page.click('[data-testid="performance-trigger"]')
    await expect(page.locator('[data-testid="performance-panel"]')).toBeVisible()

    // 检查渲染时间
    const renderTime = page.locator('[data-testid="render-time"]')
    await expect(renderTime).toBeVisible()
    const renderTimeText = await renderTime.textContent()
    expect(parseInt(renderTimeText || '0')).toBeLessThan(5000)

    // 检查内存使用
    const memoryUsage = page.locator('[data-testid="memory-usage"]')
    await expect(memoryUsage).toBeVisible()

    // Step 5: 测试滚动性能
    await editor.click()
    await page.keyboard.press('End')
    await page.waitForTimeout(500)
    await page.keyboard.press('Home')
    await page.waitForTimeout(500)

    // 验证滚动后渲染仍然流畅
    await page.click('[data-testid="performance-trigger"]')
    const scrollPerformance = page.locator('[data-testid="scroll-performance"]')
    await expect(scrollPerformance).toBeVisible()
    const scrollPerformanceText = await scrollPerformance.textContent()
    expect(parseInt(scrollPerformanceText || '0')).toBeGreaterThan(30) // 至少30fps

    // Step 6: 保存超大文件
    await page.click('[data-testid="save-file-button"]')
    await expect(page.locator('[data-testid="save-success-indicator"]')).toBeVisible()

    // Step 7: 验证大文件编辑场景处理完成
    await expect(page.locator('[data-testid="large-file-handled"]')).toBeVisible()
  })

  test('应该处理网络不稳定场景', async ({ context, page }) => {
    // Step 1: 创建测试文件
    await page.click('[data-testid="file-manager-trigger"]')
    await page.click('[data-testid="create-new-file-button"]')
    await page.fill('[data-testid="file-name-input"]', 'network.ts')
    await page.click('[data-testid="create-file-confirm"]')

    const editor = page.locator('[data-testid="monaco-editor"]').nth(0)
    await editor.fill('const data = await fetch("https://api.example.com/data")')

    // Step 2: 模拟网络延迟
    await context.setOffline(false)
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      route.continue()
    })

    // Step 3: 尝试保存（应该显示加载状态）
    await page.click('[data-testid="save-file-button"]')
    await expect(page.locator('[data-testid="save-loading"]')).toBeVisible()

    // Step 4: 等待保存完成
    await expect(page.locator('[data-testid="save-success-indicator"]')).toBeVisible({ timeout: 10000 })

    // Step 5: 模拟网络波动（延迟变化）
    await page.route('**/*', async (route) => {
      const delay = Math.random() * 3000
      await new Promise(resolve => setTimeout(resolve, delay))
      route.continue()
    })

    // Step 6: 在网络波动中多次保存
    for (let i = 0; i < 5; i++) {
      await editor.fill(`const data = await fetch("https://api.example.com/data") // ${i}`)
      await page.click('[data-testid="save-file-button"]')
      await expect(page.locator('[data-testid="save-success-indicator"]')).toBeVisible({ timeout: 10000 })
    }

    // Step 7: 模拟网络超时
    await page.route('**/*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 60000))
    })

    // Step 8: 尝试保存（应该显示超时错误）
    await editor.fill('const data = await fetch("https://api.example.com/data") // timeout test')
    await page.click('[data-testid="save-file-button"]')

    await expect(page.locator('[data-testid="save-timeout-error"]')).toBeVisible({ timeout: 12000 })

    // Step 9: 恢复网络并重试
    await page.unroute('**/*')
    await page.click('[data-testid="retry-save-button"]')
    await expect(page.locator('[data-testid="save-success-indicator"]')).toBeVisible({ timeout: 5000 })

    // Step 10: 验证网络不稳定场景处理完成
    await expect(page.locator('[data-testid="network-instability-handled"]')).toBeVisible()
  })

  test('应该处理浏览器资源限制场景', async ({ page, context }) => {
    // Step 1: 打开多个标签页和面板
    await page.click('[data-testid="file-manager-trigger"]')
    await page.click('[data-testid="chat-panel-trigger"]')
    await page.click('[data-testid="preview-panel-trigger"]')
    await page.click('[data-testid="ai-panel-trigger"]')

    // Step 2: 创建多个文件
    const fileNames = ['file1.ts', 'file2.ts', 'file3.ts', 'file4.ts', 'file5.ts']
    for (const fileName of fileNames) {
      await page.click('[data-testid="create-new-file-button"]')
      await page.fill('[data-testid="file-name-input"]', fileName)
      await page.click('[data-testid="create-file-confirm"]')

      const editor = page.locator('[data-testid="monaco-editor"]').nth(0)
      await editor.fill(`// Content of ${fileName}\n` + 'const x = 1;\n'.repeat(100))
    }

    // Step 3: 打开所有文件（模拟内存压力）
    for (const fileName of fileNames) {
      await page.click(`text=${fileName}`)
      await page.waitForTimeout(200)
    }

    // Step 4: 检查内存使用情况
    await page.click('[data-testid="performance-trigger"]')
    await expect(page.locator('[data-testid="performance-panel"]')).toBeVisible()

    const memoryUsage = page.locator('[data-testid="memory-usage"]')
    await expect(memoryUsage).toBeVisible()

    // Step 5: 模拟低内存环境
    const memoryMetrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory
      }
      return null
    })

    if (memoryMetrics) {
      console.log('Memory metrics:', memoryMetrics)
    }

    // Step 6: 触发垃圾回收（如果支持）
    await page.evaluate(() => {
      if (window.gc) {
        window.gc()
      }
    })

    await page.waitForTimeout(1000)

    // Step 7: 检查性能优化是否生效
    const optimizedMemory = page.locator('[data-testid="optimized-memory"]')
    await expect(optimizedMemory).toBeVisible()

    // Step 8: 测试虚拟列表性能（文件管理器）
    const fileManager = page.locator('[data-testid="file-manager"]')
    await fileManager.click()

    // 快速滚动文件列表
    for (let i = 0; i < 10; i++) {
      await fileManager.evaluate((el) => {
        el.scrollTop = el.scrollHeight
      })
      await page.waitForTimeout(100)
      await fileManager.evaluate((el) => {
        el.scrollTop = 0
      })
      await page.waitForTimeout(100)
    }

    // 验证滚动仍然流畅
    await page.click('[data-testid="performance-trigger"]')
    const scrollPerformance = page.locator('[data-testid="scroll-performance"]')
    await expect(scrollPerformance).toBeVisible()

    // Step 9: 测试大量消息的聊天性能
    const chatInput = page.locator('[data-testid="chat-input"]')
    for (let i = 0; i < 50; i++) {
      await chatInput.fill(`Message ${i}`)
      await page.click('[data-testid="send-message-button"]')
      await page.waitForTimeout(50)
    }

    // Step 10: 验证消息列表性能
    const messageList = page.locator('[data-testid="message-list"]')
    await expect(messageList).toBeVisible()

    // 滚动到底部测试性能
    await messageList.evaluate((el) => {
      el.scrollTop = el.scrollHeight
    })
    await page.waitForTimeout(500)

    // Step 11: 验证浏览器资源限制场景处理完成
    await expect(page.locator('[data-testid="resource-limits-handled"]')).toBeVisible()
  })
})
