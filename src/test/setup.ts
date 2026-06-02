/**
 * file: setup.ts
 * description: 测试环境配置 - 设置Vitest测试所需的Mock和全局配置
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-03-19
 * updated: 2026-04-01
 * status: active
 * tags: [test],[setup],[mock]
 *
 * brief: Vitest测试环境初始化配置
 *
 * details:
 * - 设置jsdom环境
 * - Mock ResizeObserver和IntersectionObserver
 * - Mock localStorage和sessionStorage
 * - Mock IndexedDB
 * - Mock fetch API
 * - Mock window.matchMedia
 *
 * dependencies: Vitest, React Testing Library, fake-indexeddb
 * exports: 测试环境配置
 * notes: 在所有测试文件之前运行
 */

import '@testing-library/jest-dom'
import 'fake-indexeddb/auto'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver (required for Radix UI components)
class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: ResizeObserverMock,
})

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  root = null
  rootMargin = ''
  thresholds = []
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: IntersectionObserverMock,
})

// Mock Element.scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// fake-indexeddb 已经通过 'fake-indexeddb/auto' 自动设置
// 无需手动 mock IndexedDB 相关类型

// Mock fetch
global.fetch = vi.fn()

// Mock console.error to suppress expected test warnings
const originalConsoleError = console.error
console.error = (...args: any[]) => {
  if (
    args[0]?.includes?.('Warning:') ||
    args[0]?.includes?.('Error:') ||
    args[0]?.includes?.('MODULE_NOT_FOUND')
  ) {
    return
  }
  originalConsoleError(...args)
}
