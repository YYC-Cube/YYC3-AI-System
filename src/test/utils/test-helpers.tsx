/**
 * @file test-helpers.tsx
 * @description YYC³便携式智能AI系统 - 测试辅助工具
 * Test Helper Functions
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-26
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,helpers,mocks
 */

import { render, RenderOptions, RenderResult } from '@testing-library/react'
import * as React from 'react'
import { vi, expect } from 'vitest'

import { SidebarProvider } from '../../app/components/ui/sidebar'

/**
 * 渲染包装在 SidebarProvider 中的组件
 */
export function renderWithSidebar(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <SidebarProvider defaultOpen={true}>
        {children}
      </SidebarProvider>
    )
  }

  return render(ui, { ...options, wrapper: Wrapper })
}

/**
 * 创建一个模拟的 app store
 */
export function createMockStore(overrides: Record<string, any> = {}): Record<string, any> {
  return {
    theme: 'light' as const,
    messages: [],
    addMessage: vi.fn(),
    updateMessage: vi.fn(),
    currentFile: null,
    setCurrentFile: vi.fn(),
    updateFileContent: vi.fn(),
    activePanel: 'editor' as const,
    setActivePanel: vi.fn(),
    ...overrides,
  }
}

/**
 * 等待指定时间（用于测试异步操作）
 */
export async function waitFor(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 模拟用户输入事件
 */
export function simulateTyping(element: HTMLInputElement | HTMLTextAreaElement, text: string) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
  nativeInputValueSetter?.call(element, text)
  element.dispatchEvent(new Event('input', { bubbles: true }))
}

/**
 * 模拟文件拖放
 */
export function simulateFileDrop(target: HTMLElement, files: File[]) {
  const dropEvent = new Event('drop', { bubbles: true }) as unknown
  dropEvent.dataTransfer = {
    files,
    items: [],
    types: ['Files'],
  }
  target.dispatchEvent(dropEvent)
}

/**
 * 创建模拟文件对象
 */
export function createMockFile(name: string, content: string, type = 'text/plain'): File {
  const file = new File([content], name, { type })
  Object.defineProperty(file, 'size', { value: content.length })
  return file
}

/**
 * 模拟键盘快捷键
 */
export function simulateKeyPress(element: HTMLElement, key: string, ctrlKey = false) {
  const event = new KeyboardEvent('keydown', {
    key,
    code: key,
    ctrlKey,
    bubbles: true,
    cancelable: true,
  })
  element.dispatchEvent(event)
}

/**
 * 等待元素出现在 DOM 中
 */
export async function waitForElement(
  getBy: (...args: unknown[]) => HTMLElement | null,
  timeout = 5000
): Promise<HTMLElement> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    try {
      const element = getBy()
      if (element) return element
    } catch (error) {
      await waitFor(50)
    }
  }
  
  throw new Error(`Element not found within ${timeout}ms`)
}

/**
 * 模拟 API 响应
 */
export function mockApiResponse<T>(data: T, delay = 100) {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay)
  })
}

/**
 * 模拟 API 错误
 */
export function mockApiError(message: string, delay = 100): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), delay)
  })
}

/**
 * 清除所有定时器和模拟
 */
export function cleanupMocks() {
  vi.clearAllMocks()
  vi.clearAllTimers()
}

/**
 * 重置 localStorage
 */
export function resetLocalStorage() {
  localStorage.clear()
}

/**
 * 设置 localStorage mock
 */
export function setupLocalStorageMock() {
  const localStorageMock = (() => {
    let store: Record<string, string> = {}

    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = String(value)
      },
      removeItem: (key: string) => {
        delete store[key]
      },
      clear: () => {
        store = {}
      },
      length: 0,
      key: (index: number) => Object.keys(store)[index] || null,
    }
  })()

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  })

  return localStorageMock
}

/**
 * 模拟窗口大小调整
 */
export function simulateResize(width: number, height: number) {
  window.innerWidth = width
  window.innerHeight = height
  window.dispatchEvent(new Event('resize'))
}

/**
 * 模拟网络状态变化
 */
export function simulateOnlineStatus(online: boolean) {
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    value: online,
  })
  window.dispatchEvent(new Event(online ? 'online' : 'offline'))
}

/**
 * 创建模拟的 WebSocket 连接
 */
export class MockWebSocket {
  static instances: MockWebSocket[] = []
  
  readyState = 0
  url: string
  
  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
    
    // 模拟异步连接
    setTimeout(() => {
      this.readyState = 1 // OPEN
      this.onopen?.(new Event('open'))
    }, 10)
  }
  
  send(data: string) {
    // 模拟发送数据
  }
  
  close() {
    this.readyState = 3 // CLOSED
    this.onclose?.(new CloseEvent('close'))
  }
  
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  
  static reset() {
    MockWebSocket.instances = []
  }
}

/**
 * 设置全局 WebSocket mock
 */
export function setupWebSocketMock() {
  global.WebSocket = MockWebSocket as unknown
}

/**
 * 创建模拟的 Clipboard API
 */
export function setupClipboardMock(): { writeText: ReturnType<typeof vi.fn>; readText: ReturnType<typeof vi.fn> } {
  const mockClipboard = {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  }
  
  Object.assign(navigator, {
    clipboard: mockClipboard,
  })
  
  return mockClipboard
}

/**
 * 验证组件是否渲染
 */
export function expectComponentRendered(element: HTMLElement) {
  expect(element).toBeInTheDocument()
  expect(element.tagName).toBeTruthy()
}

/**
 * 验证组件的文本内容
 */
export function expectTextContent(element: HTMLElement, expectedText: string) {
  expect(element.textContent).toBe(expectedText)
}

/**
 * 验证组件的属性
 */
export function expectAttribute(
  element: HTMLElement,
  attributeName: string,
  expectedValue: string
) {
  expect(element.getAttribute(attributeName)).toBe(expectedValue)
}
