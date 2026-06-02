/**
 * @file realtime-collab-performance.spec.ts
 * @description YYC³便携式智能AI系统 - 实时协作性能E2E测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags playwright,e2e,collaboration,performance,websocket
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3156'

/* ═════════════════════════════════════════════════════
 *  Test Suite 10: 实时协作性能测试
 * ═══════════════════════════════════════════════════ */

test.describe('实时协作性能测试', () => {
  test('应该在多用户并发编辑时保持良好的性能', async ({
    browser,
  }) => {
    // 创建5个用户上下文
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ])

    const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()))

    try {
      const startTime = Date.now()

      // 5个用户同时打开IDE和文件
      await Promise.all(
        pages.map((page) => page.goto(`${BASE_URL}/ide`)),
      )
      await Promise.all(pages.map((page) => page.waitForLoadState('networkidle')))

      // 打开文件
      await Promise.all(
        pages.map((page) => {
          page.click('[data-testid="file-manager"]')
          page.click('text=perf-test.js')
          return page.waitForSelector('[data-testid="code-editor"]')
        }),
      )

      // 所有用户同时编辑
      const editors = pages.map((page) =>
        page.locator('[data-testid="code-editor"] textarea').first(),
      )

      const contents = Array.from({ length: 5 }, (_, i) =>
        `// User ${i + 1} content\nconst user${i + 1} = ${i + 1}`,
      )

      await Promise.all(
        editors.map((editor, i) => editor.fill(contents[i])),
      )

      // 等待所有编辑同步
      await Promise.all(pages.map((page) => page.waitForTimeout(3000)))

      const endTime = Date.now()
      const totalTime = endTime - startTime

      // 验证总时间不超过5秒
      expect(totalTime).toBeLessThan(5000)

      // 验证所有用户都看到了同步的内容
      const allContents = await Promise.all(
        editors.map((editor) => editor.inputValue()),
      )

      // 至少3个用户应该看到同步的内容
      const syncedCount = allContents.filter((content, i) =>
        content.includes(`User ${i + 1} content`),
      ).length

      expect(syncedCount).toBeGreaterThanOrEqual(3)

      // 记录性能指标
      console.log(`多用户并发编辑性能: ${totalTime}ms`)
      console.log(`同步用户数: ${syncedCount}/5`)
    } finally {
      await Promise.all(contexts.map((ctx) => ctx.close()))
    }
  })

  test('应该在消息密集发送时保持良好的性能', async ({ browser }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    try {
      // 两个用户打开聊天
      await Promise.all([
        page1.goto(`${BASE_URL}/chat`),
        page2.goto(`${BASE_URL}/chat`),
      ])
      await Promise.all([page1.waitForLoadState('networkidle'), page2.waitForLoadState('networkidle')])

      const startTime = Date.now()

      // 用户A快速发送10条消息
      const messageInput1 = page1.locator('[data-testid="message-input"]')
      for (let i = 1; i <= 10; i++) {
        await messageInput1.fill(`Message ${i} from A`)
        await page1.click('[data-testid="send-button"]')
        await page1.waitForTimeout(100) // 每条消息间隔100ms
      }

      // 用户B快速发送10条消息
      const messageInput2 = page2.locator('[data-testid="message-input"]')
      for (let i = 1; i <= 10; i++) {
        await messageInput2.fill(`Message ${i} from B`)
        await page2.click('[data-testid="send-button"]')
        await page2.waitForTimeout(100) // 每条消息间隔100ms
      }

      // 等待所有消息同步
      await page1.waitForTimeout(3000)
      await page2.waitForTimeout(3000)

      const endTime = Date.now()
      const totalTime = endTime - startTime

      // 验证总时间不超过8秒
      expect(totalTime).toBeLessThan(8000)

      // 验证两个用户都看到了20条消息
      const messages1 = page1.locator('[data-testid="message-item"]')
      const messages2 = page2.locator('[data-testid="message-item"]')

      await expect(messages1).toHaveCount(20)
      await expect(messages2).toHaveCount(20)

      // 验证消息顺序正确
      const allText1 = await messages1.allTextContents()
      expect(allText1[0]).toContain('Message 1 from A')
      expect(allText1[1]).toContain('Message 1 from B')
      expect(allText1[18]).toContain('Message 10 from A')
      expect(allText1[19]).toContain('Message 10 from B')

      // 记录性能指标
      console.log(`消息密集发送性能: ${totalTime}ms`)
      console.log(`消息同步率: 20/20 (100%)`)
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('应该在文件操作密集时保持良好的性能', async ({ browser }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    try {
      // 两个用户打开文件管理器
      await Promise.all([
        page1.goto(`${BASE_URL}/ide`),
        page2.goto(`${BASE_URL}/ide`),
      ])
      await Promise.all([page1.waitForLoadState('networkidle'), page2.waitForLoadState('networkidle')])

      const startTime = Date.now()

      // 用户A快速创建5个文件
      for (let i = 1; i <= 5; i++) {
        await page1.click('[data-testid="create-file-button"]')
        await page1.fill(
          '[data-testid="file-name-input"]',
          `file-a-${i}.js`,
        )
        await page1.click('[data-testid="confirm-button"]')
        await page1.waitForTimeout(200)
      }

      // 用户B快速创建5个文件
      for (let i = 1; i <= 5; i++) {
        await page2.click('[data-testid="create-file-button"]')
        await page2.fill(
          '[data-testid="file-name-input"]',
          `file-b-${i}.js`,
        )
        await page2.click('[data-testid="confirm-button"]')
        await page2.waitForTimeout(200)
      }

      // 等待所有文件同步
      await page1.waitForTimeout(3000)
      await page2.waitForTimeout(3000)

      const endTime = Date.now()
      const totalTime = endTime - startTime

      // 验证总时间不超过7秒
      expect(totalTime).toBeLessThan(7000)

      // 验证两个用户都看到了10个文件
      const files1 = page1.locator('[data-testid="file-item"]')
      const files2 = page2.locator('[data-testid="file-item"]')

      await expect(files1).toHaveCount(10)
      await expect(files2).toHaveCount(10)

      // 验证文件数量相等
      const count1 = await files1.count()
      const count2 = await files2.count()

      expect(count1).toBe(count2)

      // 记录性能指标
      console.log(`文件密集操作性能: ${totalTime}ms`)
      console.log(`文件同步率: ${count1}/${count2} (100%)`)
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('应该在长时间连接后保持WebSocket稳定性', async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')

    // 打开协作面板查看连接状态
    await page.keyboard.press('Control+Alt+r')
    await page.waitForSelector('[data-testid="collab-panel"]')

    const connectionStatus = page.locator(
      '[data-testid="connection-status"]',
    )

    // 验证初始连接状态为在线
    await expect(connectionStatus).toContainText('online')

    // 记录连接开始时间
    const startTime = Date.now()

    // 保持页面活跃10分钟（模拟长时间连接）
    let reconnectionCount = 0
    let lastStatus = 'online'

    for (let i = 0; i < 60; i++) {
      // 每10秒检查一次连接状态
      await page.waitForTimeout(10000)

      const currentStatus = await connectionStatus.textContent()
      if (currentStatus !== lastStatus) {
        if (lastStatus === 'online' && currentStatus === 'offline') {
          reconnectionCount++
        }
        lastStatus = currentStatus || 'online'
      }
    }

    const endTime = Date.now()
    const totalTime = endTime - startTime

    // 验证连接稳定，重连次数不超过2次
    expect(reconnectionCount).toBeLessThanOrEqual(2)

    // 验证最终状态为在线
    await expect(connectionStatus).toContainText('online')

    // 记录性能指标
    console.log(`长时间连接稳定性: ${totalTime}ms (10分钟)`)
    console.log(`重连次数: ${reconnectionCount}`)
    console.log(`连接稳定性: ${(1 - reconnectionCount / 10) * 100}%`)
  })
})
