/**
 * @file storage-service.ts
 * @description YYC³便携式智能AI系统 - IndexedDB存储服务
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,storage,indexeddb,offline,critical
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

/**
 * IndexedDB数据库结构
 */
interface YYC3DB extends DBSchema {
  // 文件存储
  files: {
    key: string;
    value: {
      id: string;
      name: string;
      content: string;
      language: string;
      path: string;
      createdAt: number;
      updatedAt: number;
      size: number;
    };
    indexes: {
      'by-name': string;
      'by-path': string;
      'by-updatedAt': number;
    };
  };

  // AI缓存存储
  aiCache: {
    key: string;
    value: {
      id: string;
      prompt: string;
      response: string;
      model: string;
      createdAt: number;
      expiresAt: number;
      ttl: number;
      tokens: number;
    };
    indexes: {
      'by-model': string;
      'by-createdAt': number;
      'by-expiresAt': number;
    };
  };

  // 设置存储
  settings: {
    key: string;
    value: {
      key: string;
      value: unknown;
      updatedAt: number;
    };
    indexes: {
      'by-key': string;
    };
  };

  // 用户会话存储
  sessions: {
    key: string;
    value: {
      id: string;
      userId: string;
      data: Record<string, unknown>;
      createdAt: number;
      updatedAt: number;
      expiresAt: number;
    };
    indexes: {
      'by-userId': string;
      'by-expiresAt': number;
    };
  };
}

/**
 * 文件数据类型
 */
export interface FileData {
  id: string;
  name: string;
  content: string;
  language: string;
  path: string;
  createdAt: number;
  updatedAt: number;
  size: number;
}

/**
 * AI缓存数据类型
 */
export interface AICacheData {
  id: string;
  prompt: string;
  response: string;
  model: string;
  createdAt: number;
  expiresAt: number;
  ttl: number;
  tokens: number;
}

/**
 * 设置数据类型
 */
export interface SettingData {
  key: string;
  value: unknown;
  updatedAt: number;
}

/**
 * 存储服务类
 */
export class StorageService {
  private static instance: StorageService;
  private db: IDBPDatabase<YYC3DB> | null = null;
  private readonly DB_NAME = 'YYC3DB';
  private readonly DB_VERSION = 1;

  private constructor() {
    this.initializeDB();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * 初始化IndexedDB数据库
   */
  private async initializeDB(): Promise<void> {
    try {
      this.db = await openDB<YYC3DB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          // 创建文件存储
          if (!db.objectStoreNames.contains('files')) {
            const filesStore = db.createObjectStore('files', {
              keyPath: 'id',
            });
            filesStore.createIndex('by-name', 'name');
            filesStore.createIndex('by-path', 'path');
            filesStore.createIndex('by-updatedAt', 'updatedAt');
          }

          // 创建AI缓存存储
          if (!db.objectStoreNames.contains('aiCache')) {
            const aiCacheStore = db.createObjectStore('aiCache', {
              keyPath: 'id',
            });
            aiCacheStore.createIndex('by-model', 'model');
            aiCacheStore.createIndex('by-createdAt', 'createdAt');
            aiCacheStore.createIndex('by-expiresAt', 'expiresAt');
          }

          // 创建设置存储
          if (!db.objectStoreNames.contains('settings')) {
            const settingsStore = db.createObjectStore('settings', {
              keyPath: 'key',
            });
            settingsStore.createIndex('by-key', 'key');
          }

          // 创建会话存储
          if (!db.objectStoreNames.contains('sessions')) {
            const sessionsStore = db.createObjectStore('sessions', {
              keyPath: 'id',
            });
            sessionsStore.createIndex('by-userId', 'userId');
            sessionsStore.createIndex('by-expiresAt', 'expiresAt');
          }
        },
      });

      console.log(`[Storage] Initialized database: ${this.DB_NAME} v${this.DB_VERSION}`);
    } catch (error) {
      console.error('[Storage] Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * 确保数据库已初始化
   */
  async ensureDB(): Promise<IDBPDatabase<YYC3DB>> {
    if (!this.db) {
      await this.initializeDB();
    }
    return this.db!;
  }

  // ============================================================
  // 文件存储API
  // ============================================================

  /**
   * 保存文件
   */
  async saveFile(file: FileData): Promise<void> {
    const db = await this.ensureDB();
    await db.put('files', file);
    console.log(`[Storage] Saved file: ${file.id}`);
  }

  /**
   * 获取文件
   */
  async getFile(id: string): Promise<FileData | undefined> {
    const db = await this.ensureDB();
    return db.get('files', id);
  }

  /**
   * 获取所有文件
   */
  async getAllFiles(): Promise<FileData[]> {
    const db = await this.ensureDB();
    return db.getAll('files');
  }

  /**
   * 按路径获取文件
   */
  async getFileByPath(path: string): Promise<FileData | undefined> {
    const db = await this.ensureDB();
    return db.getFromIndex('files', 'by-path', path);
  }

  /**
   * 按名称搜索文件
   */
  async searchFilesByName(name: string): Promise<FileData[]> {
    const db = await this.ensureDB();
    return db.getAllFromIndex('files', 'by-name', IDBKeyRange.lowerBound(name));
  }

  /**
   * 删除文件
   */
  async deleteFile(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('files', id);
    console.log(`[Storage] Deleted file: ${id}`);
  }

  /**
   * 删除所有文件
   */
  async deleteAllFiles(): Promise<void> {
    const db = await this.ensureDB();
    await db.clear('files');
    console.log('[Storage] Cleared all files');
  }

  /**
   * 获取文件统计
   */
  async getFilesStats(): Promise<{
    count: number;
    totalSize: number;
    languages: Record<string, number>;
  }> {
    const files = await this.getAllFiles();
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const languages: Record<string, number> = {};

    for (const file of files) {
      languages[file.language] = (languages[file.language] || 0) + 1;
    }

    return {
      count: files.length,
      totalSize,
      languages,
    };
  }

  // ============================================================
  // AI缓存API
  // ============================================================

  /**
   * 保存AI响应缓存
   */
  async saveAICache(cache: AICacheData): Promise<void> {
    const db = await this.ensureDB();
    await db.put('aiCache', cache);
    console.log(`[Storage] Saved AI cache: ${cache.id}`);
  }

  /**
   * 获取AI缓存
   */
  async getAICache(id: string): Promise<AICacheData | undefined> {
    const db = await this.ensureDB();
    const cache = await db.get('aiCache', id);

    // 检查是否过期
    if (cache && Date.now() > cache.expiresAt) {
      await this.deleteAICache(id);
      return undefined;
    }

    return cache;
  }

  /**
   * 获取所有AI缓存
   */
  async getAllAICache(): Promise<AICacheData[]> {
    const db = await this.ensureDB();
    const allCache = await db.getAll('aiCache');
    const now = Date.now();

    // 过滤掉过期的缓存
    const validCache = allCache.filter((cache) => now <= cache.expiresAt);

    // 如果有过期缓存，清理它们
    if (validCache.length < allCache.length) {
      const expiredCache = allCache.filter((cache) => now > cache.expiresAt);
      for (const cache of expiredCache) {
        await this.deleteAICache(cache.id);
      }
    }

    return validCache;
  }

  /**
   * 按模型获取AI缓存
   */
  async getAICacheByModel(model: string): Promise<AICacheData[]> {
    const db = await this.ensureDB();
    const caches = await db.getAllFromIndex('aiCache', 'by-model', model);
    const now = Date.now();

    // 过滤掉过期的缓存
    return caches.filter((cache) => now <= cache.expiresAt);
  }

  /**
   * 删除AI缓存
   */
  async deleteAICache(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('aiCache', id);
    console.log(`[Storage] Deleted AI cache: ${id}`);
  }

  /**
   * 删除所有AI缓存
   */
  async deleteAllAICache(): Promise<void> {
    const db = await this.ensureDB();
    await db.clear('aiCache');
    console.log('[Storage] Cleared all AI cache');
  }

  /**
   * 清理过期AI缓存
   */
  async cleanupExpiredAICache(): Promise<number> {
    const db = await this.ensureDB();
    const allCache = await db.getAll('aiCache');
    const now = Date.now();
    const expiredCache = allCache.filter((cache) => now > cache.expiresAt);

    for (const cache of expiredCache) {
      await this.deleteAICache(cache.id);
    }

    if (expiredCache.length > 0) {
      console.log(`[Storage] Cleaned up ${expiredCache.length} expired AI cache entries`);
    }

    return expiredCache.length;
  }

  /**
   * 获取AI缓存统计
   */
  async getAICacheStats(): Promise<{
    count: number;
    totalTokens: number;
    models: Record<string, number>;
  }> {
    const caches = await this.getAllAICache();
    const totalTokens = caches.reduce((sum, cache) => sum + cache.tokens, 0);
    const models: Record<string, number> = {};

    for (const cache of caches) {
      models[cache.model] = (models[cache.model] || 0) + 1;
    }

    return {
      count: caches.length,
      totalTokens,
      models,
    };
  }

  // ============================================================
  // 设置存储API
  // ============================================================

  /**
   * 保存设置
   */
  async saveSetting(key: string, value: unknown): Promise<void> {
    const db = await this.ensureDB();
    const setting: SettingData = {
      key,
      value,
      updatedAt: Date.now(),
    };
    await db.put('settings', setting);
    console.log(`[Storage] Saved setting: ${key}`);
  }

  /**
   * 获取设置
   */
  async getSetting<T = unknown>(key: string): Promise<T | undefined> {
    const db = await this.ensureDB();
    const setting = await db.get('settings', key);
    return setting?.value as T | undefined;
  }

  /**
   * 获取所有设置
   */
  async getAllSettings(): Promise<Record<string, unknown>> {
    const db = await this.ensureDB();
    const settings = await db.getAll('settings');
    const result: Record<string, unknown> = {};

    for (const setting of settings) {
      result[setting.key] = setting.value;
    }

    return result;
  }

  /**
   * 删除设置
   */
  async deleteSetting(key: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('settings', key);
    console.log(`[Storage] Deleted setting: ${key}`);
  }

  /**
   * 删除所有设置
   */
  async deleteAllSettings(): Promise<void> {
    const db = await this.ensureDB();
    await db.clear('settings');
    console.log('[Storage] Cleared all settings');
  }

  // ============================================================
  // 会话存储API
  // ============================================================

  /**
   * 保存会话
   */
  async saveSession(session: {
    id: string;
    userId: string;
    data: Record<string, unknown>;
    ttl?: number;
    createdAt?: number;
    updatedAt?: number;
  }): Promise<void> {
    const db = await this.ensureDB();
    const now = Date.now();
    const ttl = session.ttl || 24 * 60 * 60 * 1000; // 默认24小时

    await db.put('sessions', {
      ...session,
      createdAt: now,
      updatedAt: now,
      expiresAt: now + ttl,
    });
    console.log(`[Storage] Saved session: ${session.id}`);
  }

  /**
   * 获取会话
   */
  async getSession(id: string): Promise<
    | {
        id: string;
        userId: string;
        data: Record<string, unknown>;
        createdAt: number;
        updatedAt: number;
        expiresAt: number;
      }
    | undefined
  > {
    const db = await this.ensureDB();
    const session = await db.get('sessions', id);

    // 检查是否过期
    if (session && Date.now() > session.expiresAt) {
      await this.deleteSession(id);
      return undefined;
    }

    return session;
  }

  /**
   * 获取用户所有会话
   */
  async getUserSessions(userId: string): Promise<
    Array<{
      id: string;
      userId: string;
      data: Record<string, unknown>;
      createdAt: number;
      updatedAt: number;
      expiresAt: number;
    }>
  > {
    const db = await this.ensureDB();
    const sessions = await db.getAllFromIndex('sessions', 'by-userId', userId);
    const now = Date.now();

    // 过滤掉过期的会话
    return sessions.filter((session) => now <= session.expiresAt);
  }

  /**
   * 删除会话
   */
  async deleteSession(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('sessions', id);
    console.log(`[Storage] Deleted session: ${id}`);
  }

  /**
   * 删除用户所有会话
   */
  async deleteUserSessions(userId: string): Promise<void> {
    const db = await this.ensureDB();
    const sessions = await db.getAllFromIndex('sessions', 'by-userId', userId);

    for (const session of sessions) {
      await db.delete('sessions', session.id);
    }

    console.log(`[Storage] Deleted ${sessions.length} sessions for user: ${userId}`);
  }

  /**
   * 清理过期会话
   */
  async cleanupExpiredSessions(): Promise<number> {
    const db = await this.ensureDB();
    const allSessions = await db.getAll('sessions');
    const now = Date.now();
    const expiredSessions = allSessions.filter((session) => now > session.expiresAt);

    for (const session of expiredSessions) {
      await this.deleteSession(session.id);
    }

    if (expiredSessions.length > 0) {
      console.log(`[Storage] Cleaned up ${expiredSessions.length} expired sessions`);
    }

    return expiredSessions.length;
  }

  // ============================================================
  // 通用方法
  // ============================================================

  /**
   * 清除所有数据
   */
  async clearAll(): Promise<void> {
    const db = await this.ensureDB();
    const stores = db.objectStoreNames;

    for (const storeName of stores) {
      await db.clear(storeName as 'settings' | 'sessions' | 'files' | 'aiCache');
      console.log(`[Storage] Cleared store: ${storeName}`);
    }
  }

  /**
   * 获取数据库大小（估算）
   */
  async getDBSize(): Promise<number> {
    const db = await this.ensureDB();
    let totalSize = 0;

    for (const storeName of db.objectStoreNames) {
      const storeKey = storeName as 'settings' | 'sessions' | 'files' | 'aiCache';
      const keys = await db.getAllKeys(storeKey);
      for (const key of keys) {
        const value = await db.get(storeKey, key);
        if (value) {
          const dataString = JSON.stringify(value);
          totalSize += dataString.length * 2; // 每个字符2字节（UTF-16）
        }
      }
    }

    return totalSize;
  }

  /**
   * 获取存储统计
   */
  async getStorageStats(): Promise<{
    files: { count: number; size: number };
    aiCache: { count: number; tokens: number };
    settings: { count: number };
    sessions: { count: number };
    totalSize: number;
  }> {
    const [filesStats, aiCacheStats, settings, sessions] = await Promise.all([
      this.getFilesStats(),
      this.getAICacheStats(),
      this.getAllSettings(),
      this.getAllSessions(),
    ]);

    const settingsCount = Object.keys(settings).length;
    const totalSize = await this.getDBSize();

    return {
      files: {
        count: filesStats.count,
        size: filesStats.totalSize,
      },
      aiCache: {
        count: aiCacheStats.count,
        tokens: aiCacheStats.totalTokens,
      },
      settings: {
        count: settingsCount,
      },
      sessions: {
        count: sessions.length,
      },
      totalSize,
    };
  }

  /**
   * 获取所有会话
   */
  async getAllSessions(): Promise<
    Array<{
      id: string;
      userId: string;
      data: Record<string, unknown>;
      createdAt: number;
      updatedAt: number;
      expiresAt: number;
    }>
  > {
    const db = await this.ensureDB();
    const allSessions = await db.getAll('sessions');
    const now = Date.now();
    return allSessions.filter((session) => now <= session.expiresAt);
  }

  /**
   * 打印存储统计信息
   */
  async printStats(): Promise<void> {
    const stats = await this.getStorageStats();
    const sizeMB = (stats.totalSize / 1024 / 1024).toFixed(2);

    console.group('📊 存储统计信息');
    console.log(`总大小: ${sizeMB} MB`);
    console.log(`文件: ${stats.files.count} 个 (${(stats.files.size / 1024).toFixed(2)} KB)`);
    console.log(`AI缓存: ${stats.aiCache.count} 条 (${stats.aiCache.tokens} tokens)`);
    console.log(`设置: ${stats.settings.count} 个`);
    console.log(`会话: ${stats.sessions.count} 个`);
    console.groupEnd();
  }
}

/**
 * 导出单例实例
 */
export const storageService = StorageService.getInstance();
