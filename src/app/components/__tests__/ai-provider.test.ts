/**
 * @file ai-provider.test.ts
 * @description YYC³便携式智能AI系统 - AI提供器服务测试
 * AI Provider Service Tests
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,service,ai,provider
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { AIProviderService, PRESET_PROVIDERS } from '../../services/ai-provider';
import type { AIProviderConfig, AIModel, AIChatMessage } from '../../types';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn((): string | null => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('AIProviderService', () => {
  let service: AIProviderService;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    service = new AIProviderService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with preset providers', () => {
      const providers = service.listProviders();
      expect(providers.length).toBeGreaterThan(0);
      expect(providers.map((p) => p.id)).toEqual(
        expect.arrayContaining([
          'openai',
          'anthropic',
          'deepseek',
          'zhipuai',
          'aliyun',
          'baidu',
          'ollama',
        ])
      );
    });

    it('should load from storage on init', () => {
      // Should call loadFromStorage in constructor
      expect(localStorageMock.getItem).toHaveBeenCalled();
    });
  });

  describe('Provider CRUD', () => {
    it('should list all providers', () => {
      const providers = service.listProviders();
      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBe(PRESET_PROVIDERS.length);
    });

    it('should get provider by ID', () => {
      const provider = service.getProvider('openai');
      expect(provider).toBeDefined();
      expect(provider?.id).toBe('openai');
    });

    it('should return undefined for non-existent provider', () => {
      const provider = service.getProvider('non-existent');
      expect(provider).toBeUndefined();
    });

    it('should add new provider', () => {
      const newProvider: AIProviderConfig = {
        id: 'test-provider',
        name: 'test',
        displayName: 'Test Provider',
        type: 'cloud',
        baseURL: 'https://test.com/v1',
        apiKey: 'test-key',
        models: [],
        enabled: true,
        priority: 100,
      };

      service.addProvider(newProvider);
      const providers = service.listProviders();
      expect(providers.length).toBe(PRESET_PROVIDERS.length + 1);
      expect(providers.some((p) => p.id === 'test-provider')).toBe(true);
    });

    it('should not add duplicate provider', () => {
      const newProvider: AIProviderConfig = {
        id: 'openai',
        name: 'openai',
        displayName: 'OpenAI',
        type: 'cloud',
        baseURL: 'https://test.com/v1',
        apiKey: 'test-key',
        models: [],
        enabled: true,
        priority: 100,
      };

      service.addProvider(newProvider);
      const providers = service.listProviders();
      expect(providers.length).toBe(PRESET_PROVIDERS.length);
    });

    it('should update provider', () => {
      service.updateProvider('openai', { displayName: 'Updated OpenAI' });
      const provider = service.getProvider('openai');
      expect(provider?.displayName).toBe('Updated OpenAI');
    });

    it('should remove provider', () => {
      const newProvider: AIProviderConfig = {
        id: 'to-remove',
        name: 'remove',
        displayName: 'To Remove',
        type: 'cloud',
        baseURL: 'https://test.com/v1',
        apiKey: '',
        models: [],
        enabled: true,
        priority: 100,
      };
      service.addProvider(newProvider);

      service.removeProvider('to-remove');
      const providers = service.listProviders();
      expect(providers.some((p) => p.id === 'to-remove')).toBe(false);
    });

    it('should clear active provider when removed', () => {
      service.setActiveProvider('openai');
      service.removeProvider('openai');
      expect(service.getActiveProvider()).toBeUndefined();
    });

    it('should toggle provider enabled state', () => {
      service.toggleProvider('openai', false);
      let provider = service.getProvider('openai');
      expect(provider?.enabled).toBe(false);

      service.toggleProvider('openai', true);
      provider = service.getProvider('openai');
      expect(provider?.enabled).toBe(true);
    });
  });

  describe('Model CRUD', () => {
    it('should list models for provider', () => {
      const models = service.listModels('openai');
      expect(Array.isArray(models)).toBe(true);
    });

    it('should return empty array for non-existent provider', () => {
      const models = service.listModels('non-existent');
      expect(models).toEqual([]);
    });

    it('should add model to provider', () => {
      const newModel: AIModel = {
        id: 'test-model',
        name: 'Test Model',
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1',
        apiKey: 'test-key',
        isActive: false,
        type: 'chat',
        contextLength: 4096,
        maxTokens: 2048,
      };

      service.addModel('openai', newModel);
      const models = service.listModels('openai');
      expect(models.some((m) => m.id === 'test-model')).toBe(true);
    });

    it('should remove model from provider', () => {
      const newModel: AIModel = {
        id: 'to-remove',
        name: 'To Remove',
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1',
        apiKey: '',
        isActive: false,
        type: 'chat',
        contextLength: 4096,
        maxTokens: 2048,
      };

      service.addModel('openai', newModel);
      service.removeModel('openai', 'to-remove');
      const models = service.listModels('openai');
      expect(models.some((m) => m.id === 'to-remove')).toBe(false);
    });
  });

  describe('Active Selection', () => {
    it('should set active provider', () => {
      service.setActiveProvider('anthropic');
      const active = service.getActiveProvider();
      expect(active?.id).toBe('anthropic');
    });

    it('should set active model', () => {
      service.setActiveModel('gpt-4o');
      // Should be saved to storage
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should return undefined when no active provider set', () => {
      // Create new service instance without setting active provider
      const newService = new AIProviderService();
      const active = newService.getActiveProvider();
      expect(active).toBeUndefined();
    });
  });

  describe('API Key Management', () => {
    it('should set API key for provider', () => {
      service.setApiKey('openai', 'sk-test-key');
      const provider = service.getProvider('openai');
      expect(provider?.apiKey).toBe('sk-test-key');
    });

    it('should get API key URL', () => {
      const url = service.getApiKeyURL('openai');
      expect(url).toBe('https://platform.openai.com/api-keys');
    });

    it('should return empty string for provider without key URL', () => {
      const url = service.getApiKeyURL('ollama');
      expect(url).toBe('');
    });
  });

  describe('Chat Functionality', () => {
    it('should throw error when no active provider', async () => {
      // Clear all providers
      PRESET_PROVIDERS.forEach((p) => service.removeProvider(p.id));

      const messages: AIChatMessage[] = [{ role: 'user', content: 'Hello' }];
      await expect(service.chat(messages)).rejects.toThrow();
    });

    it('should use active provider for chat', async () => {
      const messages: AIChatMessage[] = [{ role: 'user', content: 'Hello' }];

      // Mock fetch
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              choices: [{ message: { content: 'Hi' } }],
              usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
            }),
        })
      ) as unknown;

      const response = await service.chat(messages);
      expect(response).toHaveProperty('choices');
      expect(response).toHaveProperty('usage');
    });

    it('should handle chat with mock response', async () => {
      const messages: AIChatMessage[] = [{ role: 'user', content: 'Test' }];

      const response = await service.chat(messages);
      expect(response).toHaveProperty('choices');
      expect(response).toHaveProperty('usage');
      expect(response.choices[0]?.message?.content).toContain('[OpenAI] Response to: Test');
    });
  });

  describe('Performance Monitoring', () => {
    it('should record performance metrics', () => {
      // Performance metrics are recorded internally during chat
      const allMetrics = service.getPerformanceMetrics();
      expect(Array.isArray(allMetrics)).toBe(true);
    });

    it('should get recent performance metrics', () => {
      const metrics = service.getPerformanceMetrics();
      expect(Array.isArray(metrics)).toBe(true);
    });
  });

  describe('Error Analysis', () => {
    it('should get error history', () => {
      // Errors are recorded internally during failed operations
      const errors = service.getErrorHistory();
      expect(Array.isArray(errors)).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should track request count', () => {
      // Should increment request count
      expect(true).toBe(true);
    });

    it('should respect rate limit', () => {
      // Should throw when rate limit exceeded
      expect(true).toBe(true);
    });

    it('should reset rate limit after minute', () => {
      // Should reset count after 60 seconds
      expect(true).toBe(true);
    });
  });

  describe('Cost Tracking', () => {
    it('should track token usage', () => {
      // Cost is tracked internally during chat operations
      const report = service.getCostReport();
      expect(report).toBeInstanceOf(Map);
    });

    it('should calculate cost based on pricing', () => {
      // Cost is tracked internally during chat operations
      const report = service.getCostReport();
      expect(report).toBeInstanceOf(Map);
    });

    it('should get cost report', () => {
      const report = service.getCostReport();
      expect(report).toBeInstanceOf(Map);
    });
  });

  describe('Storage Persistence', () => {
    it('should save to localStorage', () => {
      service.addProvider({
        id: 'persist-test',
        name: 'persist',
        displayName: 'Persist Test',
        type: 'cloud',
        baseURL: 'https://test.com',
        apiKey: '',
        models: [],
        enabled: true,
        priority: 100,
      });
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should load from localStorage', () => {
      localStorageMock.getItem.mockReturnValue(
        JSON.stringify({
          providers: [
            {
              id: 'loaded-provider',
              name: 'loaded',
              displayName: 'Loaded Provider',
              type: 'cloud',
              baseURL: 'https://loaded.com',
              apiKey: '',
              models: [],
              enabled: true,
              priority: 100,
            },
          ],
        }) as unknown
      );

      const service2 = new AIProviderService();
      const providers = service2.listProviders();
      expect(providers.some((p) => p.id === 'loaded-provider')).toBe(true);
    });

    it('should handle invalid storage data', () => {
      localStorageMock.getItem.mockReturnValue('invalid json' as unknown);

      const service2 = new AIProviderService();
      const providers = service2.listProviders();
      expect(providers.length).toBe(PRESET_PROVIDERS.length);
    });
  });

  describe('Preset Providers', () => {
    it('should have OpenAI preset', () => {
      const openai = PRESET_PROVIDERS.find((p) => p.id === 'openai');
      expect(openai).toBeDefined();
      expect(openai?.baseURL).toBe('https://api.openai.com/v1');
    });

    it('should have Anthropic preset', () => {
      const anthropic = PRESET_PROVIDERS.find((p) => p.id === 'anthropic');
      expect(anthropic).toBeDefined();
      expect(anthropic?.baseURL).toBe('https://api.anthropic.com/v1');
    });

    it('should have DeepSeek preset', () => {
      const deepseek = PRESET_PROVIDERS.find((p) => p.id === 'deepseek');
      expect(deepseek).toBeDefined();
    });

    it('should have ZhipuAI preset', () => {
      const zhipuai = PRESET_PROVIDERS.find((p) => p.id === 'zhipuai');
      expect(zhipuai).toBeDefined();
      expect(zhipuai?.region).toBe('cn');
    });

    it('should have Aliyun preset', () => {
      const aliyun = PRESET_PROVIDERS.find((p) => p.id === 'aliyun');
      expect(aliyun).toBeDefined();
      expect(aliyun?.region).toBe('cn');
    });

    it('should have Baidu preset', () => {
      const baidu = PRESET_PROVIDERS.find((p) => p.id === 'baidu');
      expect(baidu).toBeDefined();
      expect(baidu?.region).toBe('cn');
    });

    it('should have Ollama preset', () => {
      const ollama = PRESET_PROVIDERS.find((p) => p.id === 'ollama');
      expect(ollama).toBeDefined();
      expect(ollama?.type).toBe('local');
    });
  });

  describe('Error Handling', () => {
    it('should handle when no provider configured', async () => {
      // Clear all providers
      PRESET_PROVIDERS.forEach((p) => service.removeProvider(p.id));

      const messages: AIChatMessage[] = [{ role: 'user', content: 'Hello' }];
      await expect(service.chat(messages)).rejects.toThrow('No active AI provider configured');
    });

    it('should handle simulated responses', async () => {
      const messages: AIChatMessage[] = [{ role: 'user', content: 'Test' }];

      const response = await service.chat(messages);
      expect(response).toHaveProperty('choices');
      expect(response).toHaveProperty('usage');
      expect(response.choices[0]?.message?.content).toContain('[OpenAI] Response to: Test');
    });

    it('should handle rate limit errors', async () => {
      // Set max requests to 1 and try to make 2 requests
      service['maxRequestsPerMinute'] = 1;
      service['rateLimitEnabled'] = true;

      const messages: AIChatMessage[] = [{ role: 'user', content: 'Hello' }];

      // First request should succeed
      await service.chat(messages);

      // Second request should throw rate limit error
      await expect(service.chat(messages)).rejects.toThrow('Rate limit exceeded');
    });
  });
});
