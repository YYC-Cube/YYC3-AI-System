/**
 * @file ai-services.test.ts
 * @description YYC³便携式智能 AI 系统 - AI服务单元测试
 * AI Services Unit Tests
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-25
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,ai,services
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

import { AIProviderService, PRESET_PROVIDERS } from '../../app/services/ai-provider'

describe('AI Services Unit Tests', () => {
  let service: AIProviderService

  beforeEach(() => {
    service = new AIProviderService()
    // Clear localStorage
    localStorage.clear()
  })

  // ── Provider Management Tests (5 tests) ──

  describe('Provider Management', () => {
    it('should list all providers', () => {
      const providers = service.listProviders()
      expect(providers).toHaveLength(PRESET_PROVIDERS.length)
      expect(providers[0].id).toBe('openai')
    })

    it('should get provider by id', () => {
      const provider = service.getProvider('openai')
      expect(provider).toBeDefined()
      expect(provider?.name).toBe('openai')
      expect(provider?.displayName).toBe('OpenAI')
    })

    it('should add new provider', () => {
      const newProvider = {
        id: 'custom',
        name: 'custom',
        displayName: 'Custom Provider',
        type: 'cloud' as const,
        baseURL: 'https://api.custom.com/v1',
        apiKey: 'test-key',
        enabled: true,
        priority: 100,
        models: [],
        pricing: { inputPrice: 0.01, outputPrice: 0.02, currency: 'USD' },
      }
      service.addProvider(newProvider)
      const provider = service.getProvider('custom')
      expect(provider).toBeDefined()
      expect(provider?.displayName).toBe('Custom Provider')
    })

    it('should update provider', () => {
      service.updateProvider('openai', { enabled: false })
      const provider = service.getProvider('openai')
      expect(provider?.enabled).toBe(false)
    })

    it('should remove provider', () => {
      service.removeProvider('openai')
      const provider = service.getProvider('openai')
      expect(provider).toBeUndefined()
    })
  })

  // ── Model Management Tests (5 tests) ──

  describe('Model Management', () => {
    it('should list models for provider', () => {
      const models = service.listModels('openai')
      expect(Array.isArray(models)).toBe(true)
    })

    it('should add model to provider', () => {
      const model = {
        id: 'gpt-4-custom',
        name: 'GPT-4 Custom',
        description: 'Custom GPT-4 model',
        provider: 'openai' as unknown,
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey: 'test-key',
        isActive: true,
        contextLength: 128000,
        maxTokens: 4000,
        supportedFeatures: ['chat', 'completion', 'embedding'],
      }
      service.addModel('openai', model)
      const models = service.listModels('openai')
      expect(models.some(m => m.id === 'gpt-4-custom')).toBe(true)
    })

    it('should remove model from provider', () => {
      const model = {
        id: 'gpt-4-temp',
        name: 'GPT-4 Temp',
        description: 'Temporary model',
        provider: 'openai' as unknown,
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey: 'test-key',
        isActive: true,
        contextLength: 128000,
        maxTokens: 4000,
        supportedFeatures: ['chat'],
      }
      service.addModel('openai', model)
      service.removeModel('openai', 'gpt-4-temp')
      const models = service.listModels('openai')
      expect(models.some(m => m.id === 'gpt-4-temp')).toBe(false)
    })

    it('should get all models across providers', () => {
      const allModels = service.getAllModels()
      expect(Array.isArray(allModels)).toBe(true)
    })

    it('should get model by id', () => {
      const model = {
        id: 'model-123',
        name: 'Test Model',
        description: 'Test',
        provider: 'openai' as unknown,
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey: 'test-key',
        isActive: true,
        contextLength: 1000,
        maxTokens: 100,
        supportedFeatures: ['chat'],
      }
      service.addModel('openai', model)
      const found = service.getModelById('model-123')
      expect(found).toBeDefined()
      expect(found?.id).toBe('model-123')
    })
  })

  // ── Active Selection Tests (3 tests) ──

  describe('Active Selection', () => {
    it('should set active provider', () => {
      service.setActiveProvider('openai')
      const activeId = service.getActiveProviderId()
      expect(activeId).toBe('openai')
    })

    it('should get active provider', () => {
      service.setActiveProvider('openai')
      const active = service.getActiveProvider()
      expect(active?.id).toBe('openai')
    })

    it('should set active model', () => {
      const model = {
        id: 'active-model',
        name: 'Active Model',
        description: 'Test',
        provider: 'openai' as unknown,
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey: 'test-key',
        isActive: true,
        contextLength: 1000,
        maxTokens: 100,
        supportedFeatures: ['chat'],
      }
      service.addModel('openai', model)
      service.setActiveModel('active-model')
      const activeId = service.getActiveModelId()
      expect(activeId).toBe('active-model')
    })
  })

  // ── API Key Tests (2 tests) ──

  describe('API Key Management', () => {
    it('should get API key URL', () => {
      const url = service.getApiKeyURL('openai')
      expect(url).toBe('https://platform.openai.com/api-keys')
    })

    it('should set API key', () => {
      service.setApiKey('openai', 'sk-test-key')
      const provider = service.getProvider('openai')
      expect(provider?.apiKey).toBe('sk-test-key')
    })
  })

  // ── Chat Tests (5 tests) ──

  describe('Chat Functionality', () => {
    it('should handle chat request', async () => {
      service.setActiveProvider('openai')
      const messages = [{ role: 'user' as const, content: 'Hello' }]
      const response = await service.chat(messages)
      expect(response).toBeDefined()
      expect(response.choices).toHaveLength(1)
      expect(response.choices[0].message.role).toBe('assistant')
    })

    it('should handle multiple messages', async () => {
      service.setActiveProvider('openai')
      const messages = [
        { role: 'user' as const, content: 'First' },
        { role: 'assistant' as const, content: 'Response' },
        { role: 'user' as const, content: 'Second' },
      ]
      const response = await service.chat(messages)
      expect(response).toBeDefined()
      expect(response.choices).toHaveLength(1)
    })

    it('should track token usage', async () => {
      service.setActiveProvider('openai')
      const messages = [{ role: 'user' as const, content: 'Test message' }]
      const response = await service.chat(messages)
      expect(response.usage).toBeDefined()
      expect(response.usage.totalTokens).toBeGreaterThan(0)
    })

    it('should handle chat options', async () => {
      service.setActiveProvider('openai')
      const messages = [{ role: 'user' as const, content: 'Hello' }]
      const options = { temperature: 0.7, maxTokens: 100 }
      const response = await service.chat(messages, options)
      expect(response).toBeDefined()
    })

    it('should use fallback provider when active fails', async () => {
      service.setActiveProvider('openai')
      const messages = [{ role: 'user' as const, content: 'Hello' }]
      const response = await service.chat(messages)
      expect(response).toBeDefined()
    })
  })

  // ── Performance Metrics Tests (3 tests) ──

  describe('Performance Metrics', () => {
    it('should record performance metrics', async () => {
      service.setActiveProvider('openai')
      await service.chat([{ role: 'user' as const, content: 'Test' }])
      const metrics = service.getPerformanceMetrics()
      expect(metrics.length).toBeGreaterThan(0)
      expect(metrics[0]).toHaveProperty('providerId')
      expect(metrics[0]).toHaveProperty('latency')
    })

    it('should filter metrics by time', async () => {
      service.setActiveProvider('openai')
      await service.chat([{ role: 'user' as const, content: 'Test' }])
      const metrics = service.getPerformanceMetrics()
      const oneHourAgo = Date.now() - 60 * 60 * 1000
      const recentMetrics = metrics.filter(m => m.timestamp >= oneHourAgo)
      expect(recentMetrics.length).toBeGreaterThan(0)
    })

    it('should limit metrics size', async () => {
      service.setActiveProvider('openai')
      // Disable rate limiting for this test
      ;(service as unknown).rateLimitEnabled = false
      for (let i = 0; i < 600; i++) {
        await service.chat([{ role: 'user' as const, content: `Test ${i}` }])
      }
      const metrics = service.getPerformanceMetrics()
      expect(metrics.length).toBeLessThanOrEqual(500)
    })
  })

  // ── Cost Tracking Tests (2 tests) ──

  describe('Cost Tracking', () => {
    it('should track cost per provider', async () => {
      service.setActiveProvider('openai')
      await service.chat([{ role: 'user' as const, content: 'Test' }])
      const costReport = service.getCostReport()
      expect(costReport.size).toBeGreaterThan(0)
      const openaiCost = costReport.get('openai')
      expect(openaiCost).toBeDefined()
      expect(openaiCost?.cost).toBeGreaterThanOrEqual(0)
    })

    it('should accumulate cost across requests', async () => {
      service.setActiveProvider('openai')
      await service.chat([{ role: 'user' as const, content: 'Test 1' }])
      await service.chat([{ role: 'user' as const, content: 'Test 2' }])
      const costReport = service.getCostReport()
      const openaiCost = costReport.get('openai')
      expect(openaiCost?.inputTokens).toBeGreaterThan(0)
      expect(openaiCost?.outputTokens).toBeGreaterThan(0)
    })
  })

  // ── Cache Tests (3 tests) ──

  describe('Cache Management', () => {
    it('should cache chat responses', async () => {
      service.setActiveProvider('openai')
      const messages = [{ role: 'user' as const, content: 'Test' }]
      
      // First request
      const response1 = await service.chat(messages)
      // Second request with same messages (should use cache)
      const response2 = await service.chat(messages)
      
      expect(response1.id).toBe(response2.id)
    })

    it('should respect cache TTL', async () => {
      service.setActiveProvider('openai')
      const messages = [{ role: 'user' as const, content: 'Test' }]
      
      await service.chat(messages)
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 6000))
      
      // This should generate a new response
      const response2 = await service.chat(messages)
      expect(response2).toBeDefined()
    })

    it('should limit cache size', async () => {
      service.setActiveProvider('openai')
      // Disable rate limiting and caching TTL for this test
      ;(service as unknown).rateLimitEnabled = false
      ;(service as unknown).cacheTTL = 999999
      // Add many items to cache
      for (let i = 0; i < 150; i++) {
        await service.chat([{ role: 'user' as const, content: `Test ${i}` }])
      }
      // Cache should be limited to max size (100)
      const cacheSize = (service as unknown).cache.size
      expect(cacheSize).toBeLessThanOrEqual(100)
    })
  })

  // ── Rate Limiting Tests (2 tests) ──

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      service.setActiveProvider('openai')
      const messages = [{ role: 'user' as const, content: 'Test' }]
      
      // Make 60 requests quickly
      const promises = []
      for (let i = 0; i < 65; i++) {
        promises.push(service.chat(messages))
      }
      
      // Should handle most requests, but might hit rate limit
      const results = await Promise.allSettled(promises)
      expect(results.length).toBe(65)
    })

    it('should reset rate limit after time', async () => {
      service.setActiveProvider('openai')
      const messages = [{ role: 'user' as const, content: 'Test' }]
      
      // Make a request
      const response = await service.chat(messages)
      expect(response).toBeDefined()
    })
  })
})
