/**
 * @file storage-service.test.ts
 * @description YYC³便携式智能AI系统 - IndexedDB存储服务测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,service,storage,indexeddb
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { storageService } from '../storage-service';

describe('StorageService - 文件存储', () => {
  beforeEach(async () => {
    // 清理文件存储
    await storageService.deleteAllFiles();
  });

  afterEach(async () => {
    // 清理文件存储
    await storageService.deleteAllFiles();
  });

  describe('基础功能', () => {
    it('应该成功保存文件', async () => {
      const file = {
        id: 'file-1',
        name: 'test.ts',
        content: 'console.log("test")',
        language: 'typescript',
        path: '/src/test.ts',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        size: 100,
      };

      await storageService.saveFile(file);

      const savedFile = await storageService.getFile('file-1');
      expect(savedFile).toEqual(file);
    });

    it('应该成功获取所有文件', async () => {
      const files = [
        {
          id: 'file-1',
          name: 'test1.ts',
          content: 'content1',
          language: 'typescript',
          path: '/src/test1.ts',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          size: 100,
        },
        {
          id: 'file-2',
          name: 'test2.ts',
          content: 'content2',
          language: 'typescript',
          path: '/src/test2.ts',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          size: 200,
        },
      ];

      for (const file of files) {
        await storageService.saveFile(file);
      }

      const allFiles = await storageService.getAllFiles();
      expect(allFiles).toHaveLength(2);
      expect(allFiles).toContainEqual(files[0]);
      expect(allFiles).toContainEqual(files[1]);
    });

    it('应该成功按路径获取文件', async () => {
      const file = {
        id: 'file-1',
        name: 'test.ts',
        content: 'console.log("test")',
        language: 'typescript',
        path: '/src/test.ts',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        size: 100,
      };

      await storageService.saveFile(file);

      const foundFile = await storageService.getFileByPath('/src/test.ts');
      expect(foundFile).toEqual(file);
    });

    it('应该成功删除文件', async () => {
      const file = {
        id: 'file-1',
        name: 'test.ts',
        content: 'content',
        language: 'typescript',
        path: '/src/test.ts',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        size: 100,
      };

      await storageService.saveFile(file);
      await storageService.deleteFile('file-1');

      const deletedFile = await storageService.getFile('file-1');
      expect(deletedFile).toBeUndefined();
    });

    it('应该成功删除所有文件', async () => {
      const files = [
        {
          id: 'file-1',
          name: 'test1.ts',
          content: 'c1',
          language: 'ts',
          path: '/p1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          size: 100,
        },
        {
          id: 'file-2',
          name: 'test2.ts',
          content: 'c2',
          language: 'ts',
          path: '/p2',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          size: 200,
        },
      ];

      for (const file of files) {
        await storageService.saveFile(file);
      }

      await storageService.deleteAllFiles();

      const allFiles = await storageService.getAllFiles();
      expect(allFiles).toHaveLength(0);
    });
  });

  describe('文件统计', () => {
    it('应该正确统计文件信息', async () => {
      const files = [
        {
          id: 'file-1',
          name: 'test.ts',
          content: 'content1',
          language: 'typescript',
          path: '/p1',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          size: 100,
        },
        {
          id: 'file-2',
          name: 'test.js',
          content: 'content2',
          language: 'javascript',
          path: '/p2',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          size: 200,
        },
        {
          id: 'file-3',
          name: 'test.css',
          content: 'content3',
          language: 'css',
          path: '/p3',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          size: 150,
        },
      ];

      for (const file of files) {
        await storageService.saveFile(file);
      }

      const stats = await storageService.getFilesStats();

      expect(stats.count).toBe(3);
      expect(stats.totalSize).toBe(450);
      expect(stats.languages.typescript).toBe(1);
      expect(stats.languages.javascript).toBe(1);
      expect(stats.languages.css).toBe(1);
    });
  });
});

describe('StorageService - AI缓存', () => {
  beforeEach(async () => {
    await storageService.deleteAllAICache();
  });

  afterEach(async () => {
    await storageService.deleteAllAICache();
  });

  describe('基础功能', () => {
    it('应该成功保存AI缓存', async () => {
      const cache = {
        id: 'cache-1',
        prompt: 'test prompt',
        response: 'test response',
        model: 'gpt-4',
        createdAt: Date.now(),
        expiresAt: Date.now() + 60000, // 1分钟后过期
        ttl: 60000,
        tokens: 100,
      };

      await storageService.saveAICache(cache);

      const savedCache = await storageService.getAICache('cache-1');
      expect(savedCache).toEqual(cache);
    });

    it('应该获取未过期的AI缓存', async () => {
      const cache = {
        id: 'cache-1',
        prompt: 'test',
        response: 'response',
        model: 'gpt-4',
        createdAt: Date.now(),
        expiresAt: Date.now() + 60000,
        ttl: 60000,
        tokens: 100,
      };

      await storageService.saveAICache(cache);

      const retrievedCache = await storageService.getAICache('cache-1');
      expect(retrievedCache).toEqual(cache);
    });

    it('应该自动清理过期的AI缓存', async () => {
      const cache = {
        id: 'cache-1',
        prompt: 'test',
        response: 'response',
        model: 'gpt-4',
        createdAt: Date.now(),
        expiresAt: Date.now() - 1000, // 已过期
        ttl: 60000,
        tokens: 100,
      };

      await storageService.saveAICache(cache);

      const retrievedCache = await storageService.getAICache('cache-1');
      expect(retrievedCache).toBeUndefined();
    });

    it('应该成功删除AI缓存', async () => {
      const cache = {
        id: 'cache-1',
        prompt: 'test',
        response: 'response',
        model: 'gpt-4',
        createdAt: Date.now(),
        expiresAt: Date.now() + 60000,
        ttl: 60000,
        tokens: 100,
      };

      await storageService.saveAICache(cache);
      await storageService.deleteAICache('cache-1');

      const deletedCache = await storageService.getAICache('cache-1');
      expect(deletedCache).toBeUndefined();
    });
  });

  describe('按模型查询', () => {
    it('应该成功按模型获取AI缓存', async () => {
      const caches = [
        {
          id: 'cache-1',
          prompt: 'p1',
          response: 'r1',
          model: 'gpt-4',
          createdAt: Date.now(),
          expiresAt: Date.now() + 60000,
          ttl: 60000,
          tokens: 100,
        },
        {
          id: 'cache-2',
          prompt: 'p2',
          response: 'r2',
          model: 'gpt-4',
          createdAt: Date.now(),
          expiresAt: Date.now() + 60000,
          ttl: 60000,
          tokens: 150,
        },
        {
          id: 'cache-3',
          prompt: 'p3',
          response: 'r3',
          model: 'gpt-3.5',
          createdAt: Date.now(),
          expiresAt: Date.now() + 60000,
          ttl: 60000,
          tokens: 120,
        },
      ];

      for (const cache of caches) {
        await storageService.saveAICache(cache);
      }

      const gpt4Caches = await storageService.getAICacheByModel('gpt-4');
      expect(gpt4Caches).toHaveLength(2);

      const gpt35Caches = await storageService.getAICacheByModel('gpt-3.5');
      expect(gpt35Caches).toHaveLength(1);
    });
  });

  describe('AI缓存统计', () => {
    it('应该正确统计AI缓存', async () => {
      const caches = [
        {
          id: 'cache-1',
          prompt: 'p1',
          response: 'r1',
          model: 'gpt-4',
          createdAt: Date.now(),
          expiresAt: Date.now() + 60000,
          ttl: 60000,
          tokens: 100,
        },
        {
          id: 'cache-2',
          prompt: 'p2',
          response: 'r2',
          model: 'gpt-4',
          createdAt: Date.now(),
          expiresAt: Date.now() + 60000,
          ttl: 60000,
          tokens: 150,
        },
        {
          id: 'cache-3',
          prompt: 'p3',
          response: 'r3',
          model: 'gpt-3.5',
          createdAt: Date.now(),
          expiresAt: Date.now() + 60000,
          ttl: 60000,
          tokens: 120,
        },
      ];

      for (const cache of caches) {
        await storageService.saveAICache(cache);
      }

      const stats = await storageService.getAICacheStats();

      expect(stats.count).toBe(3);
      expect(stats.totalTokens).toBe(370);
      expect(stats.models['gpt-4']).toBe(2);
      expect(stats.models['gpt-3.5']).toBe(1);
    });
  });
});

describe('StorageService - 设置存储', () => {
  beforeEach(async () => {
    await storageService.deleteAllSettings();
  });

  afterEach(async () => {
    await storageService.deleteAllSettings();
  });

  describe('基础功能', () => {
    it('应该成功保存设置', async () => {
      const key = 'theme';
      const value = 'dark';

      await storageService.saveSetting(key, value);

      const savedSetting = await storageService.getSetting(key);
      expect(savedSetting).toBe(value);
    });

    it('应该成功保存复杂类型设置', async () => {
      const key = 'preferences';
      const value = {
        theme: 'dark',
        fontSize: 14,
        showLineNumbers: true,
      };

      await storageService.saveSetting(key, value);

      const savedSetting = await storageService.getSetting(key);
      expect(savedSetting).toEqual(value);
    });

    it('应该成功获取所有设置', async () => {
      const settings = {
        theme: 'dark',
        fontSize: 14,
        language: 'zh-CN',
      };

      for (const [key, value] of Object.entries(settings)) {
        await storageService.saveSetting(key, value);
      }

      const allSettings = await storageService.getAllSettings();

      expect(allSettings.theme).toBe('dark');
      expect(allSettings.fontSize).toBe(14);
      expect(allSettings.language).toBe('zh-CN');
    });

    it('应该成功删除设置', async () => {
      await storageService.saveSetting('theme', 'dark');
      await storageService.deleteSetting('theme');

      const deletedSetting = await storageService.getSetting('theme');
      expect(deletedSetting).toBeUndefined();
    });
  });
});

describe('StorageService - 会话存储', () => {
  beforeEach(async () => {
    // 清理会话存储（使用deleteAllSessions方法，如果有的话）
    try {
      await storageService.clearAll();
    } catch (error) {
      // 忽略错误
    }
  });

  afterEach(async () => {
    try {
      await storageService.clearAll();
    } catch (error) {
      // 忽略错误
    }
  });

  describe('基础功能', () => {
    it('应该成功保存会话', async () => {
      const session = {
        id: 'session-1',
        userId: 'user-1',
        data: { theme: 'dark', fontSize: 14 },
      };

      await storageService.saveSession(session);

      const savedSession = await storageService.getSession('session-1');
      expect(savedSession).toBeDefined();
      expect(savedSession?.id).toBe('session-1');
      expect(savedSession?.userId).toBe('user-1');
      expect(savedSession?.data).toEqual({ theme: 'dark', fontSize: 14 });
    });

    it('应该成功获取用户会话', async () => {
      const sessions = [
        { id: 'session-1', userId: 'user-1', data: { data: '1' } },
        { id: 'session-2', userId: 'user-1', data: { data: '2' } },
        { id: 'session-3', userId: 'user-2', data: { data: '3' } },
      ];

      for (const session of sessions) {
        await storageService.saveSession(session);
      }

      const user1Sessions = await storageService.getUserSessions('user-1');
      expect(user1Sessions).toHaveLength(2);

      const user2Sessions = await storageService.getUserSessions('user-2');
      expect(user2Sessions).toHaveLength(1);
    });

    it('应该成功删除会话', async () => {
      const session = {
        id: 'session-1',
        userId: 'user-1',
        data: { data: '1' },
      };

      await storageService.saveSession(session);
      await storageService.deleteSession('session-1');

      const deletedSession = await storageService.getSession('session-1');
      expect(deletedSession).toBeUndefined();
    });
  });

  describe('会话过期', () => {
    it('应该自动清理过期会话', async () => {
      const session = {
        id: 'session-1',
        userId: 'user-1',
        data: { data: '1' },
        ttl: 1000, // 1秒后过期
      };

      await storageService.saveSession(session);

      // 等待会话过期
      await new Promise((resolve) => setTimeout(resolve, 1100));

      const expiredSession = await storageService.getSession('session-1');
      expect(expiredSession).toBeUndefined();
    });
  });
});

describe('StorageService - 存储统计', () => {
  beforeEach(async () => {
    await storageService.clearAll();
  });

  afterEach(async () => {
    await storageService.clearAll();
  });

  it('应该正确统计所有存储', async () => {
    // 添加文件
    await storageService.saveFile({
      id: 'file-1',
      name: 'test.ts',
      content: 'content',
      language: 'typescript',
      path: '/test.ts',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      size: 100,
    });

    // 添加AI缓存
    await storageService.saveAICache({
      id: 'cache-1',
      prompt: 'test',
      response: 'response',
      model: 'gpt-4',
      createdAt: Date.now(),
      expiresAt: Date.now() + 60000,
      ttl: 60000,
      tokens: 100,
    });

    // 添加设置
    await storageService.saveSetting('theme', 'dark');

    // 添加会话
    await storageService.saveSession({
      id: 'session-1',
      userId: 'user-1',
      data: { data: '1' },
    });

    const stats = await storageService.getStorageStats();

    expect(stats.files.count).toBe(1);
    expect(stats.files.size).toBe(100);
    expect(stats.aiCache.count).toBe(1);
    expect(stats.aiCache.tokens).toBe(100);
    expect(stats.settings.count).toBe(1);
    expect(stats.sessions.count).toBe(1);
    expect(stats.totalSize).toBeGreaterThan(0);
  });

  it('应该正确计算数据库大小', async () => {
    await storageService.saveFile({
      id: 'file-1',
      name: 'test.ts',
      content: 'content',
      language: 'typescript',
      path: '/test.ts',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      size: 100,
    });

    const size = await storageService.getDBSize();
    expect(size).toBeGreaterThan(0);
  });
});

describe('StorageService - 清理过期数据', () => {
  beforeEach(async () => {
    await storageService.clearAll();
  });

  afterEach(async () => {
    await storageService.clearAll();
  });

  it('应该成功清理过期AI缓存', async () => {
    // 添加有效缓存
    await storageService.saveAICache({
      id: 'cache-1',
      prompt: 'valid',
      response: 'response',
      model: 'gpt-4',
      createdAt: Date.now(),
      expiresAt: Date.now() + 60000,
      ttl: 60000,
      tokens: 100,
    });

    // 添加过期缓存
    await storageService.saveAICache({
      id: 'cache-2',
      prompt: 'expired',
      response: 'response',
      model: 'gpt-4',
      createdAt: Date.now(),
      expiresAt: Date.now() - 1000,
      ttl: 60000,
      tokens: 100,
    });

    const cleanedCount = await storageService.cleanupExpiredAICache();
    expect(cleanedCount).toBe(1);

    const allCache = await storageService.getAllAICache();
    expect(allCache).toHaveLength(1);
    expect(allCache[0].id).toBe('cache-1');
  });

  it('应该成功清理过期会话', async () => {
    // 添加有效会话
    await storageService.saveSession({
      id: 'session-1',
      userId: 'user-1',
      data: { valid: true },
      ttl: 60000,
    });

    // 添加过期会话
    await storageService.saveSession({
      id: 'session-2',
      userId: 'user-1',
      data: { expired: true },
      ttl: 100,
    });

    // 等待会话过期
    await new Promise((resolve) => setTimeout(resolve, 150));

    const cleanedCount = await storageService.cleanupExpiredSessions();
    expect(cleanedCount).toBeGreaterThanOrEqual(1);
  });
});
