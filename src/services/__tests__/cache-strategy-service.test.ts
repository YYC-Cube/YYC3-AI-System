/**
 * @file cache-strategy-service.test.ts
 * @description YYC³便携式智能AI系统 - 缓存策略服务测试
 * Cache Strategy Service Test
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,service,cache,strategy
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

import { CacheStrategyService, cacheStrategyService } from '../cache-strategy-service'

// Mock Cache API
const mockCacheStore = {
  match: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  keys: vi.fn().mockResolvedValue([]),
}

const mockCaches = {
  open: vi.fn().mockResolvedValue(mockCacheStore as unknown),
  delete: vi.fn(),
  has: vi.fn(),
  keys: vi.fn().mockResolvedValue([]),
  match: vi.fn(),
}

global.caches = mockCaches as unknown as CacheStorage

describe('CacheStrategyService - Singleton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should have instance', () => {
    expect(cacheStrategyService).toBeDefined()
  })

  test('should be an object', () => {
    expect(typeof cacheStrategyService).toBe('object')
  })
})

describe('CacheStrategyService - Cache Registration', () => {
  test('should register cache with valid config', () => {
    const service = CacheStrategyService.getInstance()
    const config = {
      cacheName: 'test-cache',
      strategy: 'CacheFirst' as const,
      maxEntries: 10,
      maxAgeSeconds: 3600,
    }

    service.registerCache(config)
    const registered = service.getCacheConfig('test-cache')

    expect(registered).toBeDefined()
  })

  test('should check if cache is registered', () => {
    const service = CacheStrategyService.getInstance()

    expect(service.getCacheConfig('nonexistent')).toBeUndefined()
  })

  test('should get cache config', () => {
    const service = CacheStrategyService.getInstance()
    const config = {
      cacheName: 'test-cache',
      strategy: 'CacheFirst' as const,
      maxEntries: 20,
    }

    service.registerCache(config)
    const retrieved = service.getCacheConfig('test-cache')

    expect(retrieved).toBeDefined()
    expect(retrieved?.cacheName).toBe('test-cache')
    expect(retrieved?.strategy).toBe('CacheFirst')
    expect(retrieved?.maxEntries).toBe(20)
  })

  test('should return undefined for nonexistent cache config', () => {
    const service = CacheStrategyService.getInstance()
    const config = service.getCacheConfig('nonexistent')

    expect(config).toBeUndefined()
  })
})

describe('CacheStrategyService - Cache Strategy Types', () => {
  test('should support CacheFirst strategy', () => {
    const service = CacheStrategyService.getInstance()
    const config = {
      cacheName: 'cache-first-test',
      strategy: 'CacheFirst' as const,
    }

    expect(() => service.registerCache(config)).not.toThrow()
  })

  test('should support CacheOnly strategy', () => {
    const service = CacheStrategyService.getInstance()
    const config = {
      cacheName: 'cache-only-test',
      strategy: 'CacheOnly' as const,
    }

    expect(() => service.registerCache(config)).not.toThrow()
  })

  test('should support NetworkFirst strategy', () => {
    const service = CacheStrategyService.getInstance()
    const config = {
      cacheName: 'network-first-test',
      strategy: 'NetworkFirst' as const,
    }

    expect(() => service.registerCache(config)).not.toThrow()
  })

  test('should support NetworkOnly strategy', () => {
    const service = CacheStrategyService.getInstance()
    const config = {
      cacheName: 'network-only-test',
      strategy: 'NetworkOnly' as const,
    }

    expect(() => service.registerCache(config)).not.toThrow()
  })

  test('should support StaleWhileRevalidate strategy', () => {
    const service = CacheStrategyService.getInstance()
    const config = {
      cacheName: 'stale-while-test',
      strategy: 'StaleWhileRevalidate' as const,
    }

    expect(() => service.registerCache(config)).not.toThrow()
  })

  test('should support StaleOnRevalidate strategy', () => {
    const service = CacheStrategyService.getInstance()
    const config = {
      cacheName: 'stale-on-test',
      strategy: 'StaleOnRevalidate' as const,
    }

    expect(() => service.registerCache(config)).not.toThrow()
  })
})

describe('CacheStrategyService - Cache Stats', () => {
  test('should get cache stats', async () => {
    const service = CacheStrategyService.getInstance()

    const stats = await service.getStats('precache-v1')

    expect(stats).toBeDefined()
    expect(stats).toHaveProperty('cacheName')
    expect(stats).toHaveProperty('entryCount')
    expect(stats).toHaveProperty('strategy')
  })

  test('should get all cache stats', async () => {
    const service = CacheStrategyService.getInstance()

    const allStats = await service.getAllStats()

    expect(allStats).toBeInstanceOf(Array)
    expect(allStats.length).toBeGreaterThan(0)
  })
})

describe('CacheStrategyService - Cache Management', () => {
  test('should clear cache', async () => {
    const service = CacheStrategyService.getInstance()

    await expect(service.clearCache('precache-v1')).resolves.toBeUndefined()
  })

  test('should clear all caches', async () => {
    const service = CacheStrategyService.getInstance()

    await expect(service.clearAllCaches()).resolves.toBeUndefined()
  })
})

describe('CacheStrategyService - Cache Configuration', () => {
  test('should handle maxEntries config', () => {
    const service = CacheStrategyService.getInstance()
    const config = {
      cacheName: 'max-entries-test',
      strategy: 'CacheFirst' as const,
      maxEntries: 100,
    }

    service.registerCache(config)
    const retrieved = service.getCacheConfig('max-entries-test')

    expect(retrieved?.maxEntries).toBe(100)
  })

  test('should handle maxAgeSeconds config', () => {
    const service = CacheStrategyService.getInstance()
    const config = {
      cacheName: 'max-age-test',
      strategy: 'CacheFirst' as const,
      maxAgeSeconds: 7200,
    }

    service.registerCache(config)
    const retrieved = service.getCacheConfig('max-age-test')

    expect(retrieved?.maxAgeSeconds).toBe(7200)
  })

  test('should handle networkTimeoutSeconds config', () => {
    const service = CacheStrategyService.getInstance()
    const config = {
      cacheName: 'timeout-test',
      strategy: 'NetworkFirst' as const,
      networkTimeoutSeconds: 10,
    }

    service.registerCache(config)
    const retrieved = service.getCacheConfig('timeout-test')

    expect(retrieved?.networkTimeoutSeconds).toBe(10)
  })

  test('should handle cacheableResponse config', () => {
    const service = CacheStrategyService.getInstance()
    const config = {
      cacheName: 'cacheable-test',
      strategy: 'CacheFirst' as const,
      cacheableResponse: {
        statuses: [200, 304],
      },
    }

    service.registerCache(config)
    const retrieved = service.getCacheConfig('cacheable-test')

    expect(retrieved?.cacheableResponse).toBeDefined()
    expect(retrieved?.cacheableResponse?.statuses).toEqual([200, 304])
  })
})

describe('CacheStrategyService - Error Handling', () => {
  test('should handle duplicate cache registration', () => {
    const service = CacheStrategyService.getInstance()
    const config = {
      cacheName: 'duplicate-test',
      strategy: 'CacheFirst' as const,
    }

    service.registerCache(config)

    // Second registration should not throw
    expect(() => service.registerCache(config)).not.toThrow()
  })
})
