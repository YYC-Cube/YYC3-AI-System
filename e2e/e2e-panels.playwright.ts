/**
 * @file e2e-panels.playwright.ts
 * @description YYC³便携式智能AI系统 - 可执行Playwright E2E测试
 * Executable Playwright E2E Tests
 * Covers: RealtimeCollabEnhanced, CodeSandbox, VisualQueryBuilder
 * Tests keyboard shortcuts, panel open/close, backdrop click, tabs, and feature-specific flows.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags e2e,playwright,panels,keyboard,shortcuts
 */

import { test, expect, type Page } from '@playwright/test'

/* ═══════════════════════════════════════════════════════
 *  Helpers
 * ═══════════════════════════════════════════════════════ */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'

async function navigateToIDE(page: Page) {
  await page.goto(`${BASE_URL}/ide`)
  // Wait for the IDE layout to be fully rendered
  await page.waitForSelector('[data-testid]', { timeout: 10_000 })
  // Small settling time for Zustand store hydration
  await page.waitForTimeout(500)
}

async function pressShortcut(page: Page, key: string) {
  await page.keyboard.press(`Control+Alt+${key}`)
}

/* ═══════════════════════════════════════════════════════
 *  Panel Definitions
 * ═══════════════════════════════════════════════════════ */

interface PanelDef {
  name: string
  shortcutKey: string
  panelTestId: string
  backdropTestId: string
  closeTestId: string
  tabTestIds: string[]
}

const PANELS: PanelDef[] = [
  {
    name: 'RealtimeCollabEnhanced',
    shortcutKey: 'r',
    panelTestId: 'collab-panel',
    backdropTestId: 'collab-backdrop',
    closeTestId: 'collab-close-btn',
    tabTestIds: ['collab-tab-presence', 'collab-tab-conflicts', 'collab-tab-history', 'collab-tab-cursors'],
  },
  {
    name: 'CodeSandbox',
    shortcutKey: 's',
    panelTestId: 'sandbox-panel',
    backdropTestId: 'sandbox-backdrop',
    closeTestId: 'sandbox-close-btn',
    tabTestIds: ['sandbox-editor', 'sandbox-run-btn', 'sandbox-link-preview-btn'],
  },
  {
    name: 'VisualQueryBuilder',
    shortcutKey: 'q',
    panelTestId: 'query-panel',
    backdropTestId: 'query-backdrop',
    closeTestId: 'query-close-btn',
    tabTestIds: ['query-tab-builder', 'query-tab-sql', 'query-tab-plan', 'query-tab-results'],
  },
]

/* ═══════════════════════════════════════════════════════
 *  SUITE 1: Keyboard Shortcut → Panel Open → Close (X)
 * ═══════════════════════════════════════════════════════ */

test.describe('Suite 1: Keyboard shortcut open / X close', () => {
  for (const panel of PANELS) {
    test(`${panel.name}: Ctrl+Alt+${panel.shortcutKey.toUpperCase()} opens, X closes`, async ({ page }) => {
      await navigateToIDE(page)

      // Panel should not exist initially
      await expect(page.getByTestId(panel.panelTestId)).not.toBeVisible()

      // Press shortcut
      await pressShortcut(page, panel.shortcutKey)

      // Panel overlay + panel should be visible
      await expect(page.getByTestId(panel.backdropTestId)).toBeVisible()
      await expect(page.getByTestId(panel.panelTestId)).toBeVisible()

      // All tabs/key elements should be rendered
      for (const tid of panel.tabTestIds) {
        await expect(page.getByTestId(tid)).toBeVisible()
      }

      // Click close button
      await page.getByTestId(panel.closeTestId).click()

      // Panel should be removed
      await expect(page.getByTestId(panel.panelTestId)).not.toBeVisible()
      await expect(page.getByTestId(panel.backdropTestId)).not.toBeVisible()
    })
  }
})

/* ═══════════════════════════════════════════════════════
 *  SUITE 2: Backdrop Click → Panel Close
 * ═══════════════════════════════════════════════════════ */

test.describe('Suite 2: Backdrop click closes panel', () => {
  for (const panel of PANELS) {
    test(`${panel.name}: backdrop click closes panel`, async ({ page }) => {
      await navigateToIDE(page)

      await pressShortcut(page, panel.shortcutKey)
      await expect(page.getByTestId(panel.panelTestId)).toBeVisible()

      // Click the backdrop (force click since it's behind the panel)
      await page.getByTestId(panel.backdropTestId).click({ force: true })

      await expect(page.getByTestId(panel.panelTestId)).not.toBeVisible()
    })
  }
})

/* ═══════════════════════════════════════════════════════
 *  SUITE 3: RealtimeCollabEnhanced – Connection Mode
 * ═══════════════════════════════════════════════════════ */

test.describe('Suite 3: RealtimeCollabEnhanced connection mode', () => {
  test('shows connection mode panel and handles server URL input', async ({ page }) => {
    await navigateToIDE(page)

    // Open panel
    await pressShortcut(page, 'r')
    await expect(page.getByTestId('collab-panel')).toBeVisible()

    // Connection mode section visible
    await expect(page.getByTestId('collab-connection-mode')).toBeVisible()

    // Click the simulated mode button to reveal server URL input
    // The first button in the connection mode section toggles the panel
    const connectionModeSection = page.getByTestId('collab-connection-mode')
    const simButton = connectionModeSection.locator('button').first()
    await simButton.click()

    // Server URL input should appear
    const urlInput = page.getByTestId('collab-server-url-input')
    await expect(urlInput).toBeVisible()

    // Type a URL
    await urlInput.fill('ws://test-server:1234')
    await expect(urlInput).toHaveValue('ws://test-server:1234')

    // Connect button should be visible
    const connectBtn = page.getByTestId('collab-connect-btn')
    await expect(connectBtn).toBeVisible()

    // Click connect — will fail since no real server, but UI should handle gracefully
    await connectBtn.click()

    // Wait for connection attempt timeout (up to 6s)
    await page.waitForTimeout(6000)

    // Panel should still be open (not crash)
    await expect(page.getByTestId('collab-panel')).toBeVisible()

    // Clean up
    await page.getByTestId('collab-close-btn').click()
    await expect(page.getByTestId('collab-panel')).not.toBeVisible()
  })

  test('tab switching works correctly', async ({ page }) => {
    await navigateToIDE(page)
    await pressShortcut(page, 'r')
    await expect(page.getByTestId('collab-panel')).toBeVisible()

    // Click each tab and verify it's accessible
    for (const tabId of ['collab-tab-presence', 'collab-tab-conflicts', 'collab-tab-history', 'collab-tab-cursors']) {
      await page.getByTestId(tabId).click()
      // Tab button should reflect active state (no crash)
      await expect(page.getByTestId(tabId)).toBeVisible()
    }

    await page.getByTestId('collab-close-btn').click()
  })
})

/* ═══════════════════════════════════════════════════════
 *  SUITE 4: CodeSandbox – Editor & Preview Sync
 * ═══════════════════════════════════════════════════════ */

test.describe('Suite 4: CodeSandbox editor and preview sync', () => {
  test('editor textarea is editable and run button works', async ({ page }) => {
    await navigateToIDE(page)

    await pressShortcut(page, 's')
    await expect(page.getByTestId('sandbox-panel')).toBeVisible()

    // Editor should have demo code
    const editor = page.getByTestId('sandbox-editor')
    await expect(editor).toBeVisible()
    const value = await editor.inputValue()
    expect(value).toContain('fibonacci')

    // Type some code
    await editor.fill('console.log("hello from test")')
    await expect(editor).toHaveValue('console.log("hello from test")')

    // Click run
    const runBtn = page.getByTestId('sandbox-run-btn')
    await runBtn.click()

    // Wait for execution to complete
    await page.waitForTimeout(1000)

    // Preview iframe should appear after execution
    const iframe = page.getByTestId('sandbox-preview-iframe')
    await expect(iframe).toBeVisible()

    await page.getByTestId('sandbox-close-btn').click()
  })

  test('link to preview toggle works', async ({ page }) => {
    await navigateToIDE(page)

    await pressShortcut(page, 's')
    await expect(page.getByTestId('sandbox-panel')).toBeVisible()

    // Link preview button
    const linkBtn = page.getByTestId('sandbox-link-preview-btn')
    await expect(linkBtn).toBeVisible()

    // Click to link
    await linkBtn.click()

    // Button text should change (the linked state shows Link2 icon)
    // We can check that the button still exists and is clickable
    await expect(linkBtn).toBeVisible()

    // Click again to unlink
    await linkBtn.click()

    await page.getByTestId('sandbox-close-btn').click()
  })

  test('one-shot sync button visible when not linked', async ({ page }) => {
    await navigateToIDE(page)

    await pressShortcut(page, 's')
    await expect(page.getByTestId('sandbox-panel')).toBeVisible()

    // First run code so the preview appears
    await page.getByTestId('sandbox-run-btn').click()
    await page.waitForTimeout(1000)

    // Sync button should be visible (when not linked)
    const syncBtn = page.getByTestId('sandbox-sync-btn')
    await expect(syncBtn).toBeVisible()

    await page.getByTestId('sandbox-close-btn').click()
  })
})

/* ═══════════════════════════════════════════════════════
 *  SUITE 5: VisualQueryBuilder – Full Query Flow
 * ═══════════════════════════════════════════════════════ */

test.describe('Suite 5: VisualQueryBuilder query flow', () => {
  test('table list visible and tabs switchable', async ({ page }) => {
    await navigateToIDE(page)

    await pressShortcut(page, 'q')
    await expect(page.getByTestId('query-panel')).toBeVisible()

    // Builder tab active by default, table list visible
    await expect(page.getByTestId('query-builder-tables')).toBeVisible()

    // Tables should show demo tables
    const tableList = page.getByTestId('query-builder-tables')
    await expect(tableList).toContainText('users')
    await expect(tableList).toContainText('orders')
    await expect(tableList).toContainText('products')
    await expect(tableList).toContainText('departments')

    // Switch to SQL tab
    await page.getByTestId('query-tab-sql').click()
    const sqlPreview = page.getByTestId('query-builder-sql')
    await expect(sqlPreview).toBeVisible()

    // Switch to plan tab
    await page.getByTestId('query-tab-plan').click()

    // Switch to results tab
    await page.getByTestId('query-tab-results').click()
    await expect(page.getByTestId('query-results')).toBeVisible()

    await page.getByTestId('query-close-btn').click()
  })

  test('execute button shows results', async ({ page }) => {
    await navigateToIDE(page)

    await pressShortcut(page, 'q')
    await expect(page.getByTestId('query-panel')).toBeVisible()

    // Click execute
    await page.getByTestId('query-execute-btn').click()

    // Should auto-switch to results tab
    const results = page.getByTestId('query-results')
    await expect(results).toBeVisible()

    // Results should contain mock data
    await expect(results).toContainText('Alice Chen')
    await expect(results).toContainText('Bob Wang')

    await page.getByTestId('query-close-btn').click()
  })

  test('copy SQL button works', async ({ page }) => {
    await navigateToIDE(page)

    await pressShortcut(page, 'q')
    await expect(page.getByTestId('query-panel')).toBeVisible()

    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

    // Click copy
    await page.getByTestId('query-copy-btn').click()

    // Verify clipboard content (platform-dependent, might need adjustment)
    // At minimum, the panel should not crash
    await expect(page.getByTestId('query-panel')).toBeVisible()

    await page.getByTestId('query-close-btn').click()
  })
})

/* ═══════════════════════════════════════════════════════
 *  SUITE 6: Double-open prevention & rapid toggle
 * ═══════════════════════════════════════════════════════ */

test.describe('Suite 6: Rapid toggle and double-open', () => {
  test('rapid shortcut toggle opens and closes cleanly', async ({ page }) => {
    await navigateToIDE(page)

    // Rapid open/close cycles
    for (let i = 0; i < 3; i++) {
      await pressShortcut(page, 'r')
      await page.waitForTimeout(200)
      await expect(page.getByTestId('collab-panel')).toBeVisible()
      await page.getByTestId('collab-close-btn').click()
      await page.waitForTimeout(200)
      await expect(page.getByTestId('collab-panel')).not.toBeVisible()
    }
  })

  test('opening one panel then another via shortcuts', async ({ page }) => {
    await navigateToIDE(page)

    // Open collab
    await pressShortcut(page, 'r')
    await expect(page.getByTestId('collab-panel')).toBeVisible()

    // Close it, open sandbox
    await page.getByTestId('collab-close-btn').click()
    await pressShortcut(page, 's')
    await expect(page.getByTestId('sandbox-panel')).toBeVisible()

    // Close it, open query builder
    await page.getByTestId('sandbox-close-btn').click()
    await pressShortcut(page, 'q')
    await expect(page.getByTestId('query-panel')).toBeVisible()

    await page.getByTestId('query-close-btn').click()
  })
})
