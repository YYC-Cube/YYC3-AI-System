/**
 * @file ai-features.spec.ts
 * @description YYC³便携式智能AI系统 - AI功能E2E测试
 * AI Features E2E Tests
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @status active
 * @tags playwright,e2e,ai,features
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3156'

/* ═════════════════════════════════════════════════════
 *  P1-05-2: AI功能E2E测试 (2个测试用例)
 * ═══════════════════════════════════════════════════ */

test.describe('AI功能 - AI Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/ide`)
    await page.waitForLoadState('networkidle')
  })

  test('应该完成AI代码生成和审查流程', async ({ page }) => {
    // Step 1: 打开聊天面板
    await page.click('[data-testid="chat-panel-trigger"]')
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible()

    // Step 2: 请求AI生成代码
    const chatInput = page.locator('[data-testid="chat-input"]')
    await chatInput.fill('生成一个用于表单验证的TypeScript函数')
    await page.click('[data-testid="send-message-button"]')

    // Step 3: 等待AI生成代码
    await page.waitForSelector('[data-testid="ai-response"]', { timeout: 10000 })
    const aiResponse = page.locator('[data-testid="ai-response"]')
    await expect(aiResponse).toBeVisible()
    await expect(aiResponse).toContainText('function')

    // Step 4: 插入生成的代码到编辑器
    await page.click('[data-testid="insert-code-button"]')
    await page.waitForTimeout(500)

    // Step 5: 请求AI审查代码
    const editor = page.locator('[data-testid="monaco-editor"]').nth(0)
    await editor.click()
    await page.keyboard.press('Control+A')
    await page.click('[data-testid="ai-review-button"]')

    // Step 6: 等待AI审查结果
    await page.waitForSelector('[data-testid="ai-review-result"]', { timeout: 10000 })
    const reviewResult = page.locator('[data-testid="ai-review-result"]')
    await expect(reviewResult).toBeVisible()
    await expect(reviewResult).toContainText('审查结果')

    // Step 7: 应用AI建议的改进
    await page.click('[data-testid="apply-ai-suggestions"]')
    await expect(page.locator('[data-testid="suggestions-applied"]')).toBeVisible()

    // Step 8: 验证代码已改进
    const improvedCode = await editor.textContent()
    expect(improvedCode).toContain('function')

    // Step 9: 保存最终代码
    await page.click('[data-testid="save-file-button"]')

    // Step 10: 验证AI代码生成和审查流程完成
    await expect(page.locator('[data-testid="ai-code-review-complete"]')).toBeVisible()
  })

  test('应该完成AI代码重构和优化流程', async ({ page }) => {
    // Step 1: 在编辑器中输入需要重构的代码
    const editor = page.locator('[data-testid="monaco-editor"]').nth(0)
    await editor.click()
    await editor.type(`const data = fetch('https://api.example.com/users')
  .then(response => response.json())
  .then(json => console.log(json))
  .catch(error => console.error(error))

data.then(result => {
  console.log(result)
})`)

    // Step 2: 打开AI重构面板
    await page.click('[data-testid="ai-refactor-trigger"]')
    await expect(page.locator('[data-testid="ai-refactor-panel"]')).toBeVisible()

    // Step 3: 选择重构策略
    await page.click('[data-testid="refactor-strategy-async-await"]')

    // Step 4: 点击"开始重构"按钮
    await page.click('[data-testid="start-refactor-button"]')

    // Step 5: 等待AI分析代码
    await page.waitForSelector('[data-testid="refactor-analyzing"]', { state: 'detached' })
    await expect(page.locator('[data-testid="refactor-complete"]')).toBeVisible()

    // Step 6: 查看重构建议
    await expect(page.locator('[data-testid="refactor-suggestions"]')).toBeVisible()
    await expect(page.locator('[data-testid="refactor-suggestions"]')).toContainText('async/await')

    // Step 7: 预览重构后的代码
    const previewCode = page.locator('[data-testid="refactored-code-preview"]')
    await expect(previewCode).toBeVisible()
    await expect(previewCode).toContainText('async')

    // Step 8: 应用重构
    await page.click('[data-testid="apply-refactor-button"]')

    // Step 9: 验证编辑器中的代码已更新
    const refactoredCode = await editor.textContent()
    expect(refactoredCode).toContain('async')
    expect(refactoredCode).toContain('await')

    // Step 10: 保存重构后的代码
    await page.click('[data-testid="save-file-button"]')

    // Step 11: 运行代码分析以验证优化效果
    await page.click('[data-testid="run-code-analysis"]')
    await page.waitForSelector('[data-testid="analysis-result"]')
    const analysisResult = page.locator('[data-testid="analysis-result"]')
    await expect(analysisResult).toBeVisible()
    await expect(analysisResult).toContainText('优化')

    // Step 12: 验证AI代码重构和优化流程完成
    await expect(page.locator('[data-testid="ai-refactor-optimize-complete"]')).toBeVisible()
  })
})
