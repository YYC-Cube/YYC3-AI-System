/**
 * @file api-integration.test.ts
 * @description YYC³便携式智能 AI 系统 - API集成测试
 * API Integration Tests
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-25
 * @updated 2026-04-08
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,api,integration
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { StorageService, FileData, AICacheData } from '../storage-service';

describe('API Integration Tests', () => {
  let storageService: ReturnType<typeof StorageService.getInstance>;

  beforeEach(async () => {
    storageService = StorageService.getInstance();
    await storageService.ensureDB();
    await storageService.deleteAllFiles();
    await storageService.deleteAllAICache();
    await storageService.deleteAllSettings();
  });

  describe('Storage Service API', () => {
    it('should initialize storage successfully', async () => {
      await storageService.ensureDB();
      expect(true).toBe(true);
    });

    it('should store and retrieve file data', async () => {
      const now = Date.now();
      const testData: FileData = {
        id: 'test-1',
        name: 'Test Item',
        path: '/test/path',
        content: 'test content',
        language: 'typescript',
        size: 100,
        createdAt: now,
        updatedAt: now,
      };

      await storageService.saveFile(testData);
      const retrieved = await storageService.getFile('test-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('test-1');
      expect(retrieved?.name).toBe('Test Item');
      expect(retrieved?.language).toBe('typescript');
    });

    it('should handle batch file operations', async () => {
      const now = Date.now();
      const items: FileData[] = Array.from({ length: 10 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        path: `/item/${i}`,
        content: `content ${i}`,
        language: 'typescript',
        size: i * 100,
        createdAt: now,
        updatedAt: now,
      }));

      for (const item of items) {
        await storageService.saveFile(item);
      }

      const allFiles = await storageService.getAllFiles();
      expect(allFiles).toHaveLength(10);

      const retrievedItem = await storageService.getFile('item-0');
      expect(retrievedItem).toBeDefined();
      expect(retrievedItem?.name).toBe('Item 0');
    });

    it('should handle file deletion', async () => {
      const now = Date.now();
      const testData: FileData = {
        id: 'delete-test',
        name: 'Delete Me',
        path: '/delete',
        content: 'delete',
        language: 'javascript',
        size: 50,
        createdAt: now,
        updatedAt: now,
      };
      await storageService.saveFile(testData);

      let exists = await storageService.getFile('delete-test');
      expect(exists).toBeDefined();

      await storageService.deleteFile('delete-test');

      exists = await storageService.getFile('delete-test');
      expect(exists).toBeUndefined();
    });

    it('should handle file updates', async () => {
      const now = Date.now();
      const testData: FileData = {
        id: 'update-test',
        name: 'Original',
        path: '/update',
        content: 'original',
        language: 'python',
        size: 50,
        createdAt: now,
        updatedAt: now,
      };
      await storageService.saveFile(testData);

      const updatedData: FileData = {
        ...testData,
        name: 'Updated',
        content: 'updated content',
        updatedAt: Date.now(),
      };
      await storageService.saveFile(updatedData);

      const retrieved = await storageService.getFile('update-test');
      expect(retrieved?.name).toBe('Updated');
      expect(retrieved?.content).toBe('updated content');
    });

    it('should get file by path', async () => {
      const now = Date.now();
      const testData: FileData = {
        id: 'path-test',
        name: 'Path Test',
        path: '/unique/path/test.ts',
        content: 'path test',
        language: 'typescript',
        size: 100,
        createdAt: now,
        updatedAt: now,
      };

      await storageService.saveFile(testData);
      const retrieved = await storageService.getFileByPath('/unique/path/test.ts');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('path-test');
    });
  });

  describe('AI Cache API', () => {
    it('should store and retrieve AI cache', async () => {
      const now = Date.now();
      const cacheData: AICacheData = {
        id: 'cache-1',
        prompt: 'What is TypeScript?',
        response: 'TypeScript is a typed superset of JavaScript',
        model: 'gpt-4',
        createdAt: now,
        expiresAt: now + 3600000,
        ttl: 3600,
        tokens: 50,
      };

      await storageService.saveAICache(cacheData);
      const retrieved = await storageService.getAICache('cache-1');

      expect(retrieved).toBeDefined();
      expect(retrieved?.prompt).toBe('What is TypeScript?');
      expect(retrieved?.model).toBe('gpt-4');
    });

    it('should get AI cache by model', async () => {
      const now = Date.now();
      const cacheItems: AICacheData[] = [
        {
          id: 'cache-gpt-1',
          prompt: 'Question 1',
          response: 'Answer 1',
          model: 'gpt-4',
          createdAt: now,
          expiresAt: now + 3600000,
          ttl: 3600,
          tokens: 30,
        },
        {
          id: 'cache-gpt-2',
          prompt: 'Question 2',
          response: 'Answer 2',
          model: 'gpt-4',
          createdAt: now,
          expiresAt: now + 3600000,
          ttl: 3600,
          tokens: 40,
        },
        {
          id: 'cache-claude-1',
          prompt: 'Question 3',
          response: 'Answer 3',
          model: 'claude-3',
          createdAt: now,
          expiresAt: now + 3600000,
          ttl: 3600,
          tokens: 35,
        },
      ];

      for (const item of cacheItems) {
        await storageService.saveAICache(item);
      }

      const gptCache = await storageService.getAICacheByModel('gpt-4');
      expect(gptCache).toHaveLength(2);

      const claudeCache = await storageService.getAICacheByModel('claude-3');
      expect(claudeCache).toHaveLength(1);
    });

    it('should delete AI cache', async () => {
      const now = Date.now();
      const cacheData: AICacheData = {
        id: 'delete-cache',
        prompt: 'Test prompt',
        response: 'Test response',
        model: 'gpt-4',
        createdAt: now,
        expiresAt: now + 3600000,
        ttl: 3600,
        tokens: 20,
      };

      await storageService.saveAICache(cacheData);
      let exists = await storageService.getAICache('delete-cache');
      expect(exists).toBeDefined();

      await storageService.deleteAICache('delete-cache');
      exists = await storageService.getAICache('delete-cache');
      expect(exists).toBeUndefined();
    });
  });

  describe('Settings API', () => {
    it('should store and retrieve settings', async () => {
      await storageService.saveSetting('theme', 'dark');
      await storageService.saveSetting('language', 'zh-CN');
      await storageService.saveSetting('fontSize', 14);

      const theme = await storageService.getSetting<string>('theme');
      const language = await storageService.getSetting<string>('language');
      const fontSize = await storageService.getSetting<number>('fontSize');

      expect(theme).toBe('dark');
      expect(language).toBe('zh-CN');
      expect(fontSize).toBe(14);
    });

    it('should handle complex setting values', async () => {
      const complexSetting = {
        enabled: true,
        options: ['option1', 'option2'],
        config: { nested: { value: 42 } },
      };

      await storageService.saveSetting('complex', complexSetting);
      const retrieved = await storageService.getSetting<typeof complexSetting>('complex');

      expect(retrieved?.enabled).toBe(true);
      expect(retrieved?.options).toEqual(['option1', 'option2']);
      expect(retrieved?.config.nested.value).toBe(42);
    });

    it('should delete settings', async () => {
      await storageService.saveSetting('temp', 'temporary');
      let value = await storageService.getSetting<string>('temp');
      expect(value).toBe('temporary');

      await storageService.deleteSetting('temp');
      value = await storageService.getSetting<string>('temp');
      expect(value).toBeUndefined();
    });

    it('should get all settings', async () => {
      await storageService.saveSetting('key1', 'value1');
      await storageService.saveSetting('key2', 'value2');
      await storageService.saveSetting('key3', 'value3');

      const allSettings = await storageService.getAllSettings();
      expect(allSettings.key1).toBe('value1');
      expect(allSettings.key2).toBe('value2');
      expect(allSettings.key3).toBe('value3');
    });
  });

  describe('API Error Handling', () => {
    it('should handle non-existent file retrieval', async () => {
      const file = await storageService.getFile('non-existent-id');
      expect(file).toBeUndefined();
    });

    it('should handle non-existent cache retrieval', async () => {
      const cache = await storageService.getAICache('non-existent-id');
      expect(cache).toBeUndefined();
    });

    it('should handle non-existent setting retrieval', async () => {
      const setting = await storageService.getSetting('non-existent-key');
      expect(setting).toBeUndefined();
    });

    it('should handle concurrent file operations', async () => {
      const now = Date.now();
      const operations = Array.from({ length: 50 }, (_, i) => {
        const fileData: FileData = {
          id: `concurrent-${i}`,
          name: `Concurrent File ${i}`,
          path: `/concurrent/${i}`,
          content: `content ${i}`,
          language: 'typescript',
          size: i * 10,
          createdAt: now,
          updatedAt: now,
        };
        return storageService.saveFile(fileData);
      });

      await Promise.all(operations);

      const allFiles = await storageService.getAllFiles();
      expect(allFiles.length).toBeGreaterThanOrEqual(50);
    });

    it('should handle concurrent cache operations', async () => {
      const now = Date.now();
      const operations = Array.from({ length: 30 }, (_, i) => {
        const cacheData: AICacheData = {
          id: `concurrent-cache-${i}`,
          prompt: `Prompt ${i}`,
          response: `Response ${i}`,
          model: 'gpt-4',
          createdAt: now,
          expiresAt: now + 3600000,
          ttl: 3600,
          tokens: i,
        };
        return storageService.saveAICache(cacheData);
      });

      await Promise.all(operations);

      const allCache = await storageService.getAllAICache();
      expect(allCache.length).toBeGreaterThanOrEqual(30);
    });
  });

  describe('API Performance', () => {
    it('should complete file read operations within acceptable time', async () => {
      const now = Date.now();
      const testData: FileData = {
        id: 'perf-test',
        name: 'Performance Test',
        path: '/perf/test',
        content: 'x'.repeat(10000),
        language: 'typescript',
        size: 10000,
        createdAt: now,
        updatedAt: now,
      };
      await storageService.saveFile(testData);

      const startTime = Date.now();
      await storageService.getFile('perf-test');
      const elapsedTime = Date.now() - startTime;

      expect(elapsedTime).toBeLessThan(100);
    });

    it('should complete file write operations within acceptable time', async () => {
      const now = Date.now();
      const testData: FileData = {
        id: 'write-perf-test',
        name: 'Write Performance Test',
        path: '/write/perf',
        content: 'test content',
        language: 'typescript',
        size: 100,
        createdAt: now,
        updatedAt: now,
      };

      const startTime = Date.now();
      await storageService.saveFile(testData);
      const elapsedTime = Date.now() - startTime;

      expect(elapsedTime).toBeLessThan(100);
    });

    it('should handle bulk file operations efficiently', async () => {
      const now = Date.now();
      const itemCount = 100;
      const startTime = Date.now();

      const operations = Array.from({ length: itemCount }, (_, i) => {
        const fileData: FileData = {
          id: `bulk-${i}`,
          name: `Bulk File ${i}`,
          path: `/bulk/${i}`,
          content: `content ${i}`,
          language: 'typescript',
          size: i * 10,
          createdAt: now,
          updatedAt: now,
        };
        return storageService.saveFile(fileData);
      });

      await Promise.all(operations);
      const elapsedTime = Date.now() - startTime;

      expect(elapsedTime).toBeLessThan(5000);
    });

    it('should maintain performance with large datasets', async () => {
      const now = Date.now();
      const items: FileData[] = Array.from({ length: 200 }, (_, i) => ({
        id: `dataset-${i}`,
        name: `Dataset File ${i}`,
        path: `/dataset/${i}`,
        content: `Data content ${i}`,
        language: 'typescript',
        size: i * 10,
        createdAt: now,
        updatedAt: now,
      }));

      for (const item of items) {
        await storageService.saveFile(item);
      }

      const startTime = Date.now();
      const retrieved = await storageService.getAllFiles();
      const elapsedTime = Date.now() - startTime;

      expect(retrieved.length).toBeGreaterThanOrEqual(200);
      expect(elapsedTime).toBeLessThan(500);
    });
  });

  describe('API Data Consistency', () => {
    it('should maintain file data integrity', async () => {
      const now = Date.now();
      const originalData: FileData = {
        id: 'integrity-test',
        name: 'Integrity Test',
        path: '/integrity/test',
        content: 'original content',
        language: 'typescript',
        size: 100,
        createdAt: now,
        updatedAt: now,
      };

      await storageService.saveFile(originalData);
      const retrieved = await storageService.getFile('integrity-test');

      expect(retrieved?.id).toBe(originalData.id);
      expect(retrieved?.name).toBe(originalData.name);
      expect(retrieved?.content).toBe(originalData.content);
      expect(retrieved?.language).toBe(originalData.language);
    });

    it('should maintain cache data integrity', async () => {
      const now = Date.now();
      const cacheData: AICacheData = {
        id: 'integrity-cache',
        prompt: 'Test prompt with special characters: 你好 🎉',
        response: 'Test response with unicode: 世界 🌍',
        model: 'gpt-4',
        createdAt: now,
        expiresAt: now + 3600000,
        ttl: 3600,
        tokens: 50,
      };

      await storageService.saveAICache(cacheData);
      const retrieved = await storageService.getAICache('integrity-cache');

      expect(retrieved?.prompt).toBe(cacheData.prompt);
      expect(retrieved?.response).toBe(cacheData.response);
      expect(retrieved?.tokens).toBe(cacheData.tokens);
    });

    it('should handle UTF-8 encoding correctly', async () => {
      const now = Date.now();
      const unicodeData: FileData = {
        id: 'unicode-test',
        name: '中文文件名',
        path: '/路径/测试',
        content: '中文内容测试 🎉🚀 Hello 世界 🌍',
        language: 'markdown',
        size: 100,
        createdAt: now,
        updatedAt: now,
      };

      await storageService.saveFile(unicodeData);
      const retrieved = await storageService.getFile('unicode-test');

      expect(retrieved?.name).toBe('中文文件名');
      expect(retrieved?.path).toBe('/路径/测试');
      expect(retrieved?.content).toBe('中文内容测试 🎉🚀 Hello 世界 🌍');
    });

    it('should handle multiple updates correctly', async () => {
      const now = Date.now();
      let testData: FileData = {
        id: 'multi-update-test',
        name: 'Original',
        path: '/multi/update',
        content: 'version 0',
        language: 'typescript',
        size: 10,
        createdAt: now,
        updatedAt: now,
      };

      await storageService.saveFile(testData);

      for (let i = 1; i <= 5; i++) {
        testData = {
          ...testData,
          content: `version ${i}`,
          size: i * 10,
          updatedAt: Date.now(),
        };
        await storageService.saveFile(testData);
      }

      const final = await storageService.getFile('multi-update-test');
      expect(final?.content).toBe('version 5');
      expect(final?.size).toBe(50);
    });

    it('should preserve data types in settings', async () => {
      await storageService.saveSetting('string', 'text');
      await storageService.saveSetting('number', 123);
      await storageService.saveSetting('boolean', true);
      await storageService.saveSetting('array', [1, 2, 3]);
      await storageService.saveSetting('object', { nested: 'value' });

      const stringVal = await storageService.getSetting<string>('string');
      const numberVal = await storageService.getSetting<number>('number');
      const booleanVal = await storageService.getSetting<boolean>('boolean');
      const arrayVal = await storageService.getSetting<number[]>('array');
      const objectVal = await storageService.getSetting<{ nested: string }>('object');

      expect(typeof stringVal).toBe('string');
      expect(typeof numberVal).toBe('number');
      expect(typeof booleanVal).toBe('boolean');
      expect(Array.isArray(arrayVal)).toBe(true);
      expect(typeof objectVal).toBe('object');
    });
  });

  describe('Storage Statistics', () => {
    it('should get file statistics', async () => {
      const now = Date.now();
      const files: FileData[] = Array.from({ length: 5 }, (_, i) => ({
        id: `stats-file-${i}`,
        name: `Stats File ${i}`,
        path: `/stats/${i}`,
        content: `content ${i}`,
        language: 'typescript',
        size: (i + 1) * 100,
        createdAt: now,
        updatedAt: now,
      }));

      for (const file of files) {
        await storageService.saveFile(file);
      }

      const stats = await storageService.getFilesStats();
      expect(stats.count).toBeGreaterThanOrEqual(5);
      expect(stats.totalSize).toBeGreaterThan(0);
    });

    it('should get AI cache statistics', async () => {
      const now = Date.now();
      const caches: AICacheData[] = Array.from({ length: 3 }, (_, i) => ({
        id: `stats-cache-${i}`,
        prompt: `Prompt ${i}`,
        response: `Response ${i}`,
        model: 'gpt-4',
        createdAt: now,
        expiresAt: now + 3600000,
        ttl: 3600,
        tokens: (i + 1) * 10,
      }));

      for (const cache of caches) {
        await storageService.saveAICache(cache);
      }

      const stats = await storageService.getAICacheStats();
      expect(stats.count).toBeGreaterThanOrEqual(3);
      expect(stats.totalTokens).toBeGreaterThan(0);
    });

    it('should get storage statistics', async () => {
      const stats = await storageService.getStorageStats();
      expect(stats).toHaveProperty('files');
      expect(stats).toHaveProperty('aiCache');
      expect(stats).toHaveProperty('settings');
    });
  });
});
