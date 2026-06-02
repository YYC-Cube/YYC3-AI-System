/**
 * @file performance-monitor-service.test.ts
 * @description YYC³便携式智能AI系统 - 性能监控服务测试
 * Performance Monitor Service Test
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-26
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,service,performance,monitoring
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock PerformanceObserver and requestAnimationFrame before importing the service
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()
const mockPerformanceObserverCallback = vi.fn()

class MockPerformanceObserver {
  constructor(callback: unknown) {
    mockPerformanceObserverCallback.mockImplementation(callback)
  }
  observe = mockObserve
  disconnect = mockDisconnect
}

global.PerformanceObserver = MockPerformanceObserver as unknown
global.requestAnimationFrame = vi.fn((cb) => 1)
global.cancelAnimationFrame = vi.fn()

// Mock Performance API
const mockPerformanceEntry = {
  name: 'example',
  entryType: 'navigation',
  startTime: 0,
  duration: 1000,
}

global.performance = {
  now: vi.fn(() => Date.now()),
  getEntriesByType: vi.fn(() => [mockPerformanceEntry]),
  getEntriesByName: vi.fn(() => [mockPerformanceEntry]),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024,
    totalJSHeapSize: 100 * 1024 * 1024,
    jsHeapSizeLimit: 200 * 1024 * 1024,
  },
} as unknown

// Import after mocks are set up
const { performanceMonitorService, PerformanceMonitorService } = await import('../performance-monitor-service') as unknown

describe('PerformanceMonitorService - Singleton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should have instance', () => {
    expect(performanceMonitorService).toBeDefined()
  })

  test('should be an object', () => {
    expect(typeof performanceMonitorService).toBe('object')
  })
})

describe('PerformanceMonitorService - Metrics Collection', () => {
  test('should get current metrics', () => {
    const metrics = performanceMonitorService.getCurrentMetrics()

    expect(metrics).toBeDefined()
    expect(metrics).toHaveProperty('fcp')
    expect(metrics).toHaveProperty('lcp')
    expect(metrics).toHaveProperty('fid')
    expect(metrics).toHaveProperty('cls')
    expect(metrics).toHaveProperty('ttfb')
    expect(metrics).toHaveProperty('timestamp')
  })

  test('should have valid metric values', () => {
    const metrics = performanceMonitorService.getCurrentMetrics()

    expect(typeof metrics.fcp).toBe('number')
    expect(typeof metrics.lcp).toBe('number')
    expect(typeof metrics.fid).toBe('number')
    expect(typeof metrics.cls).toBe('number')
    expect(typeof metrics.ttfb).toBe('number')
    expect(typeof metrics.pageLoadTime).toBe('number')
  })

  test('should have memory metrics', () => {
    const metrics = performanceMonitorService.getCurrentMetrics()

    expect(metrics).toHaveProperty('usedMemory')
    expect(metrics).toHaveProperty('totalMemory')
    expect(metrics).toHaveProperty('memoryLimit')
  })

  test('should have render metrics', () => {
    const metrics = performanceMonitorService.getCurrentMetrics()

    expect(metrics).toHaveProperty('frameRate')
    expect(metrics).toHaveProperty('droppedFrames')
    expect(metrics).toHaveProperty('longTasks')
  })

  test('should have resource metrics', () => {
    const metrics = performanceMonitorService.getCurrentMetrics()

    expect(metrics).toHaveProperty('resourceCount')
    expect(metrics).toHaveProperty('resourceSize')
    expect(metrics).toHaveProperty('scriptCount')
    expect(metrics).toHaveProperty('scriptSize')
  })
})

describe('PerformanceMonitorService - History Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should get history', () => {
    const history = performanceMonitorService.getHistory()

    expect(history).toBeDefined()
    expect(history).toHaveProperty('metrics')
    expect(history).toHaveProperty('warnings')
    expect(history).toHaveProperty('summary')
  })

  test('should have history metrics array', () => {
    const history = performanceMonitorService.getHistory()

    expect(Array.isArray(history.metrics)).toBe(true)
  })

  test('should have history warnings array', () => {
    const history = performanceMonitorService.getHistory()

    expect(Array.isArray(history.warnings)).toBe(true)
  })

  test('should have history summary', () => {
    const history = performanceMonitorService.getHistory()

    expect(history.summary).toBeDefined()
    expect(history.summary).toHaveProperty('avgFCP')
    expect(history.summary).toHaveProperty('avgLCP')
    expect(history.summary).toHaveProperty('avgFID')
    expect(history.summary).toHaveProperty('avgCLS')
    expect(history.summary).toHaveProperty('avgPageLoadTime')
    expect(history.summary).toHaveProperty('warningCount')
    expect(history.summary).toHaveProperty('criticalCount')
  })

  test('should get limited history', () => {
    const history = performanceMonitorService.getHistory(10)

    expect(history.metrics.length).toBeLessThanOrEqual(10)
  })
})

describe('PerformanceMonitorService - Event Handling', () => {
  test('should add event listener', () => {
    const listener = vi.fn()

    expect(() => performanceMonitorService.on('metric', listener)).not.toThrow()
  })

  test('should remove event listener', () => {
    expect(() => performanceMonitorService.off('metric')).not.toThrow()
  })
})

describe('PerformanceMonitorService - Configuration', () => {
  test('should get config', () => {
    const config = performanceMonitorService.getConfig()

    expect(config).toBeDefined()
    expect(config).toHaveProperty('enableMetrics')
    expect(config).toHaveProperty('enableWarnings')
    expect(config).toHaveProperty('enableHistory')
    expect(config).toHaveProperty('historyLimit')
    expect(config).toHaveProperty('enableAutoReport')
    expect(config).toHaveProperty('reportInterval')
    expect(config).toHaveProperty('thresholds')
  })

  test('should update config', () => {
    const newConfig = {
      enableMetrics: false,
      enableWarnings: false,
      enableHistory: false,
      historyLimit: 50,
    }

    expect(() => performanceMonitorService.updateConfig(newConfig)).not.toThrow()
  })

  test('should have thresholds', () => {
    const config = performanceMonitorService.getConfig()

    expect(config.thresholds).toBeDefined()
    expect(config.thresholds).toHaveProperty('fcp')
    expect(config.thresholds).toHaveProperty('lcp')
    expect(config.thresholds).toHaveProperty('fid')
    expect(config.thresholds).toHaveProperty('cls')
    expect(config.thresholds).toHaveProperty('ttfb')
    expect(config.thresholds).toHaveProperty('pageLoadTime')
    expect(config.thresholds).toHaveProperty('frameRate')
  })
})

describe('PerformanceMonitorService - Lifecycle', () => {
  afterEach(() => {
    performanceMonitorService.destroy()
  })

  test('should initialize', async () => {
    await expect(performanceMonitorService.initialize()).resolves.not.toThrow()
  })

  test('should clear history', () => {
    expect(() => performanceMonitorService.clearHistory()).not.toThrow()
  })

  test('should destroy', () => {
    expect(() => performanceMonitorService.destroy()).not.toThrow()
  })
})

describe('PerformanceMonitorService - Timestamp Validation', () => {
  test('should have valid timestamp in metrics', () => {
    const metrics = performanceMonitorService.getCurrentMetrics()

    expect(metrics.timestamp).toBeGreaterThan(0)
    expect(typeof metrics.timestamp).toBe('number')
  })
})
