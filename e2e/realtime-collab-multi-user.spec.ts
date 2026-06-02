/**
 * @file realtime-collab-multi-user.spec.ts
 * @description YYC³便携式智能AI系统 - 实时协作多用户E2E测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags playwright,e2e,collaboration,multi-user,websocket
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3156'

/* ═════════════════════════════════════════════════════
 *  Test Suite 1: 多用户实时协作 - 场景1: 同时编辑代码
 * ═════════════════════════════════════════════════════ */

test.describe('多用户实时协作 - 场景1: 同时编辑代码', () => {
  test('应该支持两个用户同时编辑同一文件', async ({ browser }) => {
    // 创建两个用户上下文（模拟两个用户）
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    try {
      // 用户1打开IDE
      await page1.goto(`${BASE_URL}/ide`)
      await page1.waitForLoadState('networkidle')

      // 用户2打开IDE
      await page2.goto(`${BASE_URL}/ide`)
      await page2.waitForLoadState('networkidle')

      // 用户1打开文件
      await page1.click('[data-testid="file-manager"]')
      await page1.click('text=test.js')
      await page1.waitForSelector('[data-testid="code-editor"]')

      // 用户2打开同一文件
      await page2.click('[data-testid="file-manager"]')
      await page2.click('text=test.js')
      await page2.waitForSelector('[data-testid="code-editor"]')

      // 用户1在编辑器中输入代码
      const editor1 = page1.locator('[data-testid="code-editor"] textarea').first()
      await editor1.fill('// User 1\nconst hello = "Hello World"')

      // 等待WebSocket同步（假设需要1-2秒）
      await page1.waitForTimeout(2000)

      // 验证用户2看到用户1的编辑
      const editor2 = page2.locator('[data-testid="code-editor"] textarea').first()
      const content2 = await editor2.inputValue()

      expect(content2).toContain('// User 1')
      expect(content2).toContain('const hello = "Hello World"')

      // 用户2添加更多代码
      await editor2.fill(`${content2}\n\n// User 2\nconsole.log(hello)`)

      // 等待同步
      await page2.waitForTimeout(2000)

      // 验证用户1看到用户2的编辑
      const content1 = await editor1.inputValue()

      expect(content1).toContain('// User 2')
      expect(content1).toContain('console.log(hello)')
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('应该支持多个用户同时编辑不同文件', async ({ browser }) => {
    // 创建三个用户上下文
    const contexts = await Promise.all([
      browser.newContext(),
      browser.newContext(),
      browser.newContext(),
    ])

    const pages = await Promise.all(contexts.map((ctx) => ctx.newPage()))

    try {
      // 用户1打开file1.js
      await pages[0].goto(`${BASE_URL}/ide`)
      await pages[0].waitForLoadState('networkidle')
      await pages[0].click('[data-testid="file-manager"]')
      await pages[0].click('text=file1.js')
      await pages[0].waitForSelector('[data-testid="code-editor"]')

      // 用户2打开file2.js
      await pages[1].goto(`${BASE_URL}/ide`)
      await pages[1].waitForLoadState('networkidle')
      await pages[1].click('[data-testid="file-manager"]')
      await pages[1].click('text=file2.js')
      await pages[1].waitForSelector('[data-testid="code-editor"]')

      // 用户3打开file3.js
      await pages[2].goto(`${BASE_URL}/ide`)
      await pages[2].waitForLoadState('networkidle')
      await pages[2].click('[data-testid="file-manager"]')
      await pages[2].click('text=file3.js')
      await pages[2].waitForSelector('[data-testid="code-editor"]')

      // 每个用户编辑自己的文件
      const editors = pages.map((page) =>
        page.locator('[data-testid="code-editor"] textarea').first(),
      )

      await editors[0].fill('// User 1 editing file1.js\nconst a = 1')
      await editors[1].fill('// User 2 editing file2.js\nconst b = 2')
      await editors[2].fill('// User 3 editing file3.js\nconst c = 3')

      // 等待同步
      await Promise.all(pages.map((page) => page.waitForTimeout(2000)))

      // 验证每个用户看到自己的编辑
      const contents = await Promise.all(
        editors.map((editor) => editor.inputValue()),
      )

      expect(contents[0]).toContain('// User 1 editing file1.js')
      expect(contents[1]).toContain('// User 2 editing file2.js')
      expect(contents[2]).toContain('// User 3 editing file3.js')
    } finally {
      await Promise.all(contexts.map((ctx) => ctx.close()))
    }
  })

  test('应该支持多用户同时协作编辑并显示光标位置', async ({
    browser,
  }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    try {
      // 两个用户打开IDE和同一文件
      await page1.goto(`${BASE_URL}/ide`)
      await page1.waitForLoadState('networkidle')
      await page1.click('[data-testid="file-manager"]')
      await page1.click('text=collaboration.js')
      await page1.waitForSelector('[data-testid="code-editor"]')

      await page2.goto(`${BASE_URL}/ide`)
      await page2.waitForLoadState('networkidle')
      await page2.click('[data-testid="file-manager"]')
      await page2.click('text=collaboration.js')
      await page2.waitForSelector('[data-testid="code-editor"]')

      // 打开协作面板
      await Promise.all([
        page1.keyboard.press('Control+Alt+r'),
        page2.keyboard.press('Control+Alt+r'),
      ])

      // 等待协作面板打开
      await Promise.all([
        page1.waitForSelector('[data-testid="collab-panel"]'),
        page2.waitForSelector('[data-testid="collab-panel"]'),
      ])

      // 用户1移动光标
      const editor1 = page1.locator('[data-testid="code-editor"]').first()
      await editor1.click()
      await page1.keyboard.press('ArrowDown')
      await page1.keyboard.press('ArrowDown')
      await page1.keyboard.press('ArrowRight')

      // 等待光标同步
      await page1.waitForTimeout(1000)

      // 验证用户2看到用户1的光标位置
      const cursors = page2.locator('[data-testid="remote-cursor"]')
      await expect(cursors).toHaveCount(1)

      // 验证光标位置信息
      const cursorInfo = page2.locator(
        '[data-testid="cursor-info-user-1"]',
      )
      await expect(cursorInfo).toBeVisible()
    } finally {
      await context1.close()
      await context2.close()
    }
  })
})

/* ═════════════════════════════════════════════════════
 *  Test Suite 2: 多用户实时协作 - 场景2: 实时消息同步
 * ═════════════════════════════════════════════════════ */

test.describe('多用户实时协作 - 场景2: 实时消息同步', () => {
  test('应该支持用户A发送消息，用户B实时接收', async ({
    browser,
  }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    try {
      // 两个用户打开聊天界面
      await Promise.all([
        page1.goto(`${BASE_URL}/chat`),
        page2.goto(`${BASE_URL}/chat`),
      ])
      await Promise.all([page1.waitForLoadState('networkidle'), page2.waitForLoadState('networkidle')])

      // 用户A发送消息
      const messageInput1 = page1.locator(
        '[data-testid="message-input"]',
      )
      await messageInput1.fill('Hello from User A!')
      await page1.click('[data-testid="send-button"]')

      // 等待消息发送
      await page1.waitForTimeout(1000)

      // 验证用户B收到消息
      const messages = page2.locator('[data-testid="message-item"]')
      await expect(messages).toHaveCount(1)

      const messageText = messages.first()
      await expect(messageText).toContainText('Hello from User A!')
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('应该支持多用户同时发送消息并保持消息顺序', async ({
    browser,
  }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    try {
      // 两个用户打开聊天界面
      await Promise.all([
        page1.goto(`${BASE_URL}/chat`),
        page2.goto(`${BASE_URL}/chat`),
      ])
      await Promise.all([page1.waitForLoadState('networkidle'), page2.waitForLoadState('networkidle')])

      // 用户A发送消息
      const messageInput1 = page1.locator('[data-testid="message-input"]')
      await messageInput1.fill('Message 1 from A')
      await page1.click('[data-testid="send-button"]')
      await page1.waitForTimeout(500)

      // 用户B发送消息
      const messageInput2 = page2.locator('[data-testid="message-input"]')
      await messageInput2.fill('Message 1 from B')
      await page2.click('[data-testid="send-button"]')
      await page2.waitForTimeout(500)

      // 用户A发送第二条消息
      await messageInput1.fill('Message 2 from A')
      await page1.click('[data-testid="send-button"]')
      await page1.waitForTimeout(500)

      // 用户B发送第二条消息
      await messageInput2.fill('Message 2 from B')
      await page2.click('[data-testid="send-button"]')
      await page2.waitForTimeout(500)

      // 等待所有消息同步
      await page1.waitForTimeout(2000)
      await page2.waitForTimeout(2000)

      // 验证两个用户都看到4条消息
      const messages1 = page1.locator('[data-testid="message-item"]')
      const messages2 = page2.locator('[data-testid="message-item"]')

      await expect(messages1).toHaveCount(4)
      await expect(messages2).toHaveCount(4)

      // 验证消息顺序
      const allText1 = await messages1.allTextContents()
      const allText2 = await messages2.allTextContents()

      expect(allText1).toEqual(allText2)
      expect(allText1[0]).toContain('Message 1 from A')
      expect(allText1[1]).toContain('Message 1 from B')
      expect(allText1[2]).toContain('Message 2 from A')
      expect(allText1[3]).toContain('Message 2 from B')
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('应该支持用户A删除消息，用户B实时看到删除', async ({
    browser,
  }) => {
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()

    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    try {
      // 两个用户打开聊天界面
      await Promise.all([
        page1.goto(`${BASE_URL}/chat`),
        page2.goto(`${BASE_URL}/chat`),
      ])
      await Promise.all([page1.waitForLoadState('networkidle'), page2.waitForLoadState('networkidle')])

      // 用户A发送消息
      const messageInput1 = page1.locator('[data-testid="message-input"]')
      await messageInput1.fill('This message will be deleted')
      await page1.click('[data-testid="send-button"]')
      await page1.waitForTimeout(1000)

      // 验证用户B收到消息
      const messages2 = page2.locator('[data-testid="message-item"]')
      await expect(messages2).toHaveCount(1)

      // 用户A删除消息
      await page1.click('[data-testid="message-delete-button"]')
      await page1.waitForTimeout(1000)

      // 验证用户B看到消息被删除
      await expect(messages2).toHaveCount(0)
    } finally {
      await context1.close()
      await context2.close()
    }
  })
})

/* ═════════════════════════════════════════════════════
 *  Test Suite 3: 多用户实时协作 - 场景3: 文件操作同步
 * ═════════════════════════════════════════════════════ */

test.describe('多用户实时协作 - 场景3: 文件操作同步', () => {
  test('应该支持用户A创建文件，用户B实时看到新文件', async ({
    browser,
  }) => {
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

      // 用户A创建新文件
      await page1.click('[data-testid="create-file-button"]')
      await page1.fill('[data-testid="file-name-input"]', 'new-file.js')
      await page1.click('[data-testid="confirm-button"]')

      // 等待文件创建
      await page1.waitForTimeout(1000)

      // 验证用户B看到新文件
      const files = page2.locator('[data-testid="file-item"]')
      const newFile = files.filter({ hasText: 'new-file.js' })
      await expect(newFile).toBeVisible()
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('应该支持用户A删除文件，用户B实时看到文件删除', async ({
    browser,
  }) => {
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

      // 验证初始文件数量
      const files2 = page2.locator('[data-testid="file-item"]')
      const initialCount = await files2.count()

      // 用户A删除文件
      await page1.click('[data-testid="file-item"] >> text=test-delete.js')
      await page1.click('[data-testid="delete-file-button"]')
      await page1.click('[data-testid="confirm-button"]')

      // 等待文件删除
      await page1.waitForTimeout(1000)

      // 验证用户B看到文件减少
      const finalCount = await files2.count()
      expect(finalCount).toBeLessThan(initialCount)
    } finally {
      await context1.close()
      await context2.close()
    }
  })

  test('应该支持用户A重命名文件，用户B实时看到文件名更新', async ({
    browser,
  }) => {
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

      // 用户A重命名文件
      await page1.click('[data-testid="file-item"] >> text=old-name.js')
      await page1.click('[data-testid="rename-file-button"]')
      await page1.fill('[data-testid="file-name-input"]', 'new-name.js')
      await page1.click('[data-testid="confirm-button"]')

      // 等待文件重命名
      await page1.waitForTimeout(1000)

      // 验证用户B看到文件名更新
      const renamedFile = page2.locator(
        '[data-testid="file-item"] >> text=new-name.js',
      )
      await expect(renamedFile).toBeVisible()

      // 验证旧文件名不存在
      const oldFile = page2.locator(
        '[data-testid="file-item"] >> text=old-name.js',
      )
      await expect(oldFile).not.toBeVisible()
    } finally {
      await context1.close()
      await context2.close()
    }
  })
})
