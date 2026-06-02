/**
 * @file api-cache-service.test.ts
 * @description YYC³便携式智能AI系统 - API缓存服务测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,service,api,cache,offline
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { apiCacheService } from '../api-cache-service'

describe('ApiCacheService', () => {
  beforeEach(async () => {
    // 清理缓存
    await apiCacheService.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('基础功能', () => {
    it('应该成功缓存数据', async () => {
      const testData = { id: 1, name: 'Test' }
      await apiCacheService.set('/api/test', 'GET', testData)

      const cachedData = await apiCacheService.get('/api/test', 'GET')
      expect(cachedData).toEqual(testData)
    })

    it('应该正确删除缓存', async () => {
      const testData = { id: 1, name: 'Test' }
      await apiCacheService.set('/api/test', 'GET', testData)
      await apiCacheService.delete('/api/test', 'GET')

      const cachedData = await apiCacheService.get('/api/test', 'GET')
      expect(cachedData).toBeNull()
    })

    it('应该清除所有缓存', async () => {
      await apiCacheService.set('/api/test1', 'GET', { id: 1 })
      await apiCacheService.set('/api/test2', 'GET', { id: 2 })
      
      await apiCacheService.clear()

      expect(await apiCacheService.get('/api/test1', 'GET')).toBeNull()
      expect(await apiCacheService.get('/api/test2', 'GET')).toBeNull()
    })
  })

  describe('TTL过期', () => {
    it('应该在TTL过期后返回null', async () => {
      // 注册一个短的TTL
      apiCacheService.registerConfig('/api/ttl-test/', {
        cacheName: 'test-cache',
        ttl: 100, // 100ms
        revalidate: true,
        important: false,
      })

      const testData = { id: 1, name: 'Test' }
      await apiCacheService.set('/api/ttl-test/data', 'GET', testData)

      // 立即获取，应该有数据
      let cachedData = await apiCacheService.get('/api/ttl-test/data', 'GET')
      expect(cachedData).toEqual(testData)

      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 150))

      // 过期后应该返回null
      cachedData = await apiCacheService.get('/api/ttl-test/data', 'GET')
      expect(cachedData).toBeNull()
    })

    it('应该清除过期的缓存条目', async () => {
      // 注册一个短的TTL
      apiCacheService.registerConfig('/api/expired-test/', {
        cacheName: 'test-cache',
        ttl: 100, // 100ms
        revalidate: true,
        important: false,
      })

      await apiCacheService.set('/api/expired-test/1', 'GET', { id: 1 })
      await apiCacheService.set('/api/expired-test/2', 'GET', { id: 2 })
      
      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 150))

      await apiCacheService.clearExpired()

      const stats = apiCacheService.getStats()
      expect(stats.validEntries).toBe(0)
      expect(stats.expiredEntries).toBe(0) // 过期条目应该被删除
    })
  })

  describe('缓存配置', () => {
    it('应该正确注册和使用缓存配置', async () => {
      apiCacheService.registerConfig('/api/custom/', {
        cacheName: 'custom-cache',
        ttl: 60000,
        revalidate: false,
        important: true,
      })

      // 验证配置已注册：缓存数据时应使用匹配的配置
      const testData = { id: 1 }
      await apiCacheService.set('/api/custom/test', 'GET', testData)
      const cachedData = await apiCacheService.get('/api/custom/test', 'GET')
      expect(cachedData).toEqual(testData)
    })

    it('应该使用默认配置处理未注册的URL', async () => {
      // 默认配置使用 api-cache-v1
      const testData = { id: 1 }
      await apiCacheService.set('/api/unregistered/test', 'GET', testData)
      const cachedData = await apiCacheService.get('/api/unregistered/test', 'GET')
      expect(cachedData).toEqual(testData)
    })
  })

  describe('缓存统计', () => {
    it('应该正确统计缓存条目', async () => {
      await apiCacheService.set('/api/test1', 'GET', { id: 1 })
      await apiCacheService.set('/api/test2', 'GET', { id: 2 })
      await apiCacheService.set('/api/test3', 'GET', { id: 3 })

      const count = apiCacheService.getCount()
      expect(count).toBe(3)
    })

    it('应该正确计算缓存大小', async () => {
      const testData1 = { id: 1, name: 'Test1', description: 'Long description text here' }
      const testData2 = { id: 2, name: 'Test2', description: 'Another long description text here' }

      await apiCacheService.set('/api/test1', 'GET', testData1)
      await apiCacheService.set('/api/test2', 'GET', testData2)

      const size = apiCacheService.getSize()
      expect(size).toBeGreaterThan(0)
    })

    it('应该正确分类有效和过期条目', async () => {
      // 注册一个短的TTL
      apiCacheService.registerConfig('/api/stat-test/', {
        cacheName: 'test-cache',
        ttl: 100,
        revalidate: true,
        important: false,
      })

      await apiCacheService.set('/api/stat-test/expired', 'GET', { id: 1 })
      await apiCacheService.set('/api/test/valid', 'GET', { id: 2 })
      
      // 等待第一个条目过期
      await new Promise(resolve => setTimeout(resolve, 150))

      const stats = apiCacheService.getStats()
      expect(stats.totalEntries).toBe(2)
      expect(stats.expiredEntries).toBe(1)
    })
  })

  describe('网络请求', () => {
    it('应该成功执行网络请求并缓存响应', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1, name: 'Test' }),
      })

      global.fetch = mockFetch as unknown

      const data = await apiCacheService.fetchWithCache('/api/test')
      expect(data).toEqual({ id: 1, name: 'Test' })
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // 验证缓存
      const cachedData = await apiCacheService.get('/api/test', 'GET')
      expect(cachedData).toEqual({ id: 1, name: 'Test' })
    })

    it('应该在网络失败时使用缓存', async () => {
      // 先缓存数据
      await apiCacheService.set('/api/test', 'GET', { id: 1, name: 'Cached' })

      // 模拟网络失败
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))
      global.fetch = mockFetch as unknown

      // 应该从缓存获取
      const data = await apiCacheService.fetchWithCache('/api/test')
      expect(data).toEqual({ id: 1, name: 'Cached' })
    })

    it('应该在无缓存且网络失败时抛出错误', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'))
      global.fetch = mockFetch as unknown

      await expect(
        apiCacheService.fetchWithCache('/api/test')
      ).rejects.toThrow('Network error')
    })

    it('应该只缓存GET请求', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      })

      global.fetch = mockFetch as unknown

      // POST请求
      await apiCacheService.fetchWithCache('/api/test', { method: 'POST' })
      
      // 验证没有缓存
      const cachedData = await apiCacheService.get('/api/test', 'POST')
      expect(cachedData).toBeNull()
    })
  })

  describe('预热缓存', () => {
    it('应该成功预热多个URL', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 1 }),
      })

      global.fetch = mockFetch as unknown

      const urls = ['/api/test1', '/api/test2', '/api/test3']
      await apiCacheService.warmUp(urls)

      expect(mockFetch).toHaveBeenCalledTimes(urls.length)

      // 验证所有URL都已缓存
      for (const url of urls) {
        const cachedData = await apiCacheService.get(url, 'GET')
        expect(cachedData).not.toBeNull()
      }
    })
  })
})

describe('便捷函数', () => {
  beforeEach(async () => {
    await apiCacheService.clear()
  })

  it('fetchGet应该正确执行GET请求', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 1, name: 'Test' }),
    })

    global.fetch = mockFetch as unknown

    const { fetchGet } = await import('../api-cache-service')
    const data = await fetchGet('/api/test')

    expect(data).toEqual({ id: 1, name: 'Test' })
  })

  it('fetchPost应该正确执行POST请求', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })

    global.fetch = mockFetch as unknown

    const { fetchPost } = await import('../api-cache-service')
    const data = await fetchPost('/api/test', { name: 'Test' })

    expect(data).toEqual({ success: true })
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      })
    )
  })
})
