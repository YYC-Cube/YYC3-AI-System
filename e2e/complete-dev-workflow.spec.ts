/**
 * @file complete-dev-workflow.spec.ts
 * @description YYC³便携式智能AI系统 - 完整开发流程E2E测试
 * Complete Development Workflow E2E Tests
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @status active
 * @tags playwright,e2e,workflow,dev
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3156'

/* ═════════════════════════════════════════════════════
 *  P1-05-1: 完整开发流程E2E测试 (3个测试用例)
 * ═══════════════════════════════════════════════════ */

test.describe('完整开发流程 - Complete Development Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')
  })

  test('应该完成从文件创建到预览的完整开发流程', async ({ page }) => {
    // Step 1: 打开文件管理器
    await page.click('[data-testid="file-manager-trigger"]')
    await expect(page.locator('[data-testid="file-manager"]')).toBeVisible()

    // Step 2: 创建新文件
    await page.click('[data-testid="create-new-file-button"]')
    await page.fill('[data-testid="file-name-input"]', 'App.tsx')
    await page.click('[data-testid="create-file-confirm"]')

    // Step 3: 验证文件已创建并在编辑器中打开
    await expect(page.locator('[data-testid="monaco-editor"]')).toBeVisible()
    const editor = page.locator('[data-testid="monaco-editor"]').nth(0)
    await expect(editor).toBeVisible()

    // Step 4: 编写代码
    await editor.fill(`export default function App() {
      return <div>Hello World</div>
    }`)

    // Step 5: 保存文件
    await page.click('[data-testid="save-file-button"]')
    await expect(page.locator('[data-testid="save-success-indicator"]')).toBeVisible()

    // Step 6: 打开预览面板
    await page.click('[data-testid="preview-panel-trigger"]')
    await expect(page.locator('[data-testid="preview-panel"]')).toBeVisible()

    // Step 7: 验证预览内容
    await page.waitForSelector('[data-testid="preview-content"]')
    const preview = page.locator('[data-testid="preview-content"]')
    await expect(preview).toContainText('Hello World')

    // Step 8: 验证工作流完成指示器
    await expect(page.locator('[data-testid="workflow-complete"]')).toBeVisible()
  })

  test('应该完成AI辅助开发流程', async ({ page }) => {
    // Step 1: 打开聊天面板
    await page.click('[data-testid="chat-panel-trigger"]')
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible()

    // Step 2: 向AI发送代码生成请求
    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('创建一个React按钮组件')
    await page.click('[data-testid="send-message-button"]')

    // Step 3: 等待AI响应
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 10000 })
    await expect(page.locator('[data-testid="ai-response"]')).toBeVisible()

    // Step 4: 点击"插入代码"按钮
    await page.click('[data-testid="insert-code-button"]')
    await expect(page.locator('[data-testid="code-inserted-indicator"]')).toBeVisible()

    // Step 5: 验证代码已插入到编辑器
    const editor = page.locator('[data-testid="monaco-editor"]').nth(0)
    const editorContent = await editor.textContent()
    expect(editorContent).toContain('Button')

    // Step 6: 保存AI生成的代码
    await page.click('[data-testid="save-file-button"]')

    // Step 7: 在预览中验证AI生成的组件
    await page.click('[data-testid="preview-panel-trigger"]')
    await page.waitForSelector('[data-testid="preview-content"]')
    await expect(page.locator('[data-testid="preview-content"]')).toContainText('Button')

    // Step 8: 验证AI辅助工作流完成
    await expect(page.locator('[data-testid="ai-workflow-complete"]')).toBeVisible()
  })

  test('应该完成多文件项目开发流程', async ({ page }) => {
    // Step 1: 创建第一个文件
    await page.click('[data-testid="file-manager-trigger"]')
    await page.click('[data-testid="create-new-file-button"]')
    await page.fill('[data-testid="file-name-input"]', 'types.ts')
    await page.click('[data-testid="create-file-confirm"]')

    // 编辑第一个文件
    const editor1 = page.locator('[data-testid="monaco-editor"]').nth(0)
    await editor1.fill(`export interface User {
      id: number
      name: string
      email: string
    }`)
    await page.click('[data-testid="save-file-button"]')

    // Step 2: 创建第二个文件
    await page.click('[data-testid="create-new-file-button"]')
    await page.fill('[data-testid="file-name-input"]', 'api.ts')
    await page.click('[data-testid="create-file-confirm"]')

    // 编辑第二个文件（导入第一个文件）
    const editor2 = page.locator('[data-testid="monaco-editor"]').nth(0)
    await editor2.fill(`import { User } from './types'

export const fetchUser = async (id: number): Promise<User> => {
  const response = await fetch(\`/api/users/\${id}\`)
  return response.json()
}`)
    await page.click('[data-testid="save-file-button"]')

    // Step 3: 创建第三个文件（主要组件）
    await page.click('[data-testid="create-new-file-button"]')
    await page.fill('[data-testid="file-name-input"]', 'App.tsx')
    await page.click('[data-testid="create-file-confirm"]')

    // 编辑第三个文件
    const editor3 = page.locator('[data-testid="monaco-editor"]').nth(0)
    await editor3.fill(`import { useState, useEffect } from 'react'
import { fetchUser, User } from './api'

export default function App() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUser(1).then(setUser)
  }, [])

  return <div>{user?.name}</div>
}`)
    await page.click('[data-testid="save-file-button"]')

    // Step 4: 验证文件树包含所有文件
    const fileTree = page.locator('[data-testid="file-tree"]')
    await expect(fileTree).toContainText('types.ts')
    await expect(fileTree).toContainText('api.ts')
    await expect(fileTree).toContainText('App.tsx')

    // Step 5: 验证多文件项目工作流完成
    await expect(page.locator('[data-testid="multi-file-workflow-complete"]')).toBeVisible()
  })
})
