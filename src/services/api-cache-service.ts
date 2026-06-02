/**
 * @file api-cache-service.ts
 * @description YYC³便携式智能AI系统 - API缓存服务
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,api,cache,offline,pwa
 */

/**
 * API缓存配置
 */
export interface ApiCacheConfig {
  /** 缓存名称 */
  cacheName: string;
  /** 缓存过期时间（毫秒） */
  ttl?: number;
  /** 是否需要重新验证 */
  revalidate?: boolean;
  /** 是否为重要请求（离线时也显示缓存） */
  important?: boolean;
}

/**
 * 缓存条目
 */
interface CacheEntry<T = unknown> {
  /** 数据 */
  data: T;
  /** 缓存时间 */
  timestamp: number;
  /** 过期时间 */
  expiresAt: number;
  /** 请求URL */
  url: string;
  /** 请求方法 */
  method: string;
}

/**
 * API缓存服务类
 */
export class ApiCacheService {
  private static instance: ApiCacheService;
  private cache: Map<string, CacheEntry> = new Map();
  private config: Map<string, ApiCacheConfig> = new Map();

  // 默认配置
  private defaultConfig: ApiCacheConfig = {
    cacheName: 'api-cache-v1',
    ttl: 5 * 60 * 1000, // 5分钟
    revalidate: true,
    important: false,
  };

  private constructor() {
    this.initializeDefaultConfigs();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): ApiCacheService {
    if (!ApiCacheService.instance) {
      ApiCacheService.instance = new ApiCacheService();
    }
    return ApiCacheService.instance;
  }

  /**
   * 初始化默认配置
   */
  private initializeDefaultConfigs(): void {
    // AI API配置（15分钟）
    this.registerConfig('/api/ai/', {
      cacheName: 'ai-api-cache-v1',
      ttl: 15 * 60 * 1000,
      revalidate: true,
      important: true,
    });

    // 文件API配置（10分钟）
    this.registerConfig('/api/files/', {
      cacheName: 'files-api-cache-v1',
      ttl: 10 * 60 * 1000,
      revalidate: true,
      important: true,
    });

    // 用户配置API配置（30分钟）
    this.registerConfig('/api/config/', {
      cacheName: 'config-api-cache-v1',
      ttl: 30 * 60 * 1000,
      revalidate: true,
      important: true,
    });

    // 普通API配置（5分钟）
    this.registerConfig('/api/', {
      cacheName: 'api-cache-v1',
      ttl: 5 * 60 * 1000,
      revalidate: true,
      important: false,
    });
  }

  /**
   * 注册API缓存配置
   */
  registerConfig(urlPattern: string, config: ApiCacheConfig): void {
    this.config.set(urlPattern, config);
    console.log(`[ApiCache] Registered config for: ${urlPattern}`);
  }

  /**
   * 获取API配置
   */
  private getConfig(url: string): ApiCacheConfig {
    for (const [pattern, config] of this.config.entries()) {
      if (url.startsWith(pattern)) {
        return config;
      }
    }
    return this.defaultConfig;
  }

  /**
   * 生成缓存键
   */
  private generateKey(url: string, method: string): string {
    return `${method}:${url}`;
  }

  /**
   * 获取缓存
   */
  async get<T = unknown>(url: string, method: string = 'GET'): Promise<T | null> {
    const key = this.generateKey(url, method);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > entry.expiresAt) {
      console.log(`[ApiCache] Cache expired: ${url}`);
      this.cache.delete(key);
      return null;
    }

    console.log(`[ApiCache] Cache hit: ${url}`);
    return entry.data as T;
  }

  /**
   * 设置缓存
   */
  async set<T = unknown>(url: string, method: string, data: T): Promise<void> {
    const config = this.getConfig(url);
    const key = this.generateKey(url, method);
    const now = Date.now();

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + (config.ttl || this.defaultConfig.ttl!),
      url,
      method,
    };

    this.cache.set(key, entry);
    console.log(`[ApiCache] Cached: ${url} (TTL: ${config.ttl}ms)`);
  }

  /**
   * 删除缓存
   */
  async delete(url: string, method: string = 'GET'): Promise<void> {
    const key = this.generateKey(url, method);
    this.cache.delete(key);
    console.log(`[ApiCache] Deleted: ${url}`);
  }

  /**
   * 清除所有缓存
   */
  async clear(): Promise<void> {
    this.cache.clear();
    console.log('[ApiCache] All cache cleared');
  }

  /**
   * 清除过期缓存
   */
  async clearExpired(): Promise<void> {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }

    if (keysToDelete.length > 0) {
      console.log(`[ApiCache] Cleared ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): {
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
    size: number;
  } {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    let totalSize = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredEntries++;
      } else {
        validEntries++;
      }

      // 估算大小
      const dataSize = JSON.stringify(entry.data).length;
      totalSize += dataSize;
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      size: totalSize,
    };
  }

  /**
   * 获取缓存大小（字节）
   */
  getSize(): number {
    return this.getStats().size;
  }

  /**
   * 获取缓存条目数
   */
  getCount(): number {
    return this.cache.size;
  }

  /**
   * 执行API请求（带缓存）
   *
   * 策略: Network-First
   * 1. 优先从网络获取
   * 2. 网络失败时使用缓存
   * 3. 离线时只使用缓存（如果配置允许）
   */
  async fetchWithCache<T = unknown>(url: string, options?: RequestInit): Promise<T> {
    const method = options?.method || 'GET';
    const config = this.getConfig(url);

    // 只缓存GET请求
    if (method !== 'GET') {
      return this.fetchWithoutCache<T>(url, options);
    }

    // 检查是否在线
    const isOnline = navigator.onLine;

    // 如果离线，尝试从缓存获取
    if (!isOnline) {
      const cachedData = await this.get<T>(url, method);
      if (cachedData) {
        console.log(`[ApiCache] Offline, serving from cache: ${url}`);
        return cachedData;
      }

      // 离线且无缓存，抛出错误
      if (config.important) {
        throw new Error(`网络不可用且无缓存数据: ${url}`);
      }
    }

    try {
      // 从网络获取数据
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${url}`);
      }

      const data = await response.json();

      // 缓存响应
      await this.set(url, method, data);

      return data;
    } catch (error) {
      console.error(`[ApiCache] Network request failed: ${url}`, error);

      // 网络失败，尝试使用缓存
      const cachedData = await this.get<T>(url, method);

      if (cachedData) {
        console.log(`[ApiCache] Fallback to cache: ${url}`);
        return cachedData;
      }

      // 缓存也没有，重新抛出错误
      throw error;
    }
  }

  /**
   * 执行API请求（不带缓存）
   */
  async fetchWithoutCache<T = unknown>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${url}`);
    }

    return response.json();
  }

  /**
   * 预热缓存（批量加载）
   */
  async warmUp<T = unknown>(urls: string[]): Promise<void> {
    console.log(`[ApiCache] Warming up cache for ${urls.length} URLs...`);

    const promises = urls.map((url) =>
      this.fetchWithCache<T>(url).catch((error) => {
        console.warn(`[ApiCache] Warm-up failed for ${url}:`, error);
      })
    );

    await Promise.all(promises);
    console.log('[ApiCache] Cache warm-up complete');
  }

  /**
   * 清理内存缓存（定期调用）
   */
  cleanup(): void {
    this.clearExpired();
  }

  /**
   * 打印缓存统计信息
   */
  printStats(): void {
    const stats = this.getStats();
    const sizeKB = (stats.size / 1024).toFixed(2);

    console.group('📊 API缓存统计');
    console.log(`总条目数: ${stats.totalEntries}`);
    console.log(`有效条目: ${stats.validEntries}`);
    console.log(`过期条目: ${stats.expiredEntries}`);
    console.log(`总大小: ${sizeKB} KB`);
    console.groupEnd();
  }
}

/**
 * 导出单例实例
 */
export const apiCacheService = ApiCacheService.getInstance();

/**
 * 便捷函数：执行GET请求（带缓存）
 */
export async function fetchGet<T = unknown>(url: string): Promise<T> {
  return apiCacheService.fetchWithCache<T>(url, { method: 'GET' });
}

/**
 * 便捷函数：执行POST请求（不带缓存）
 */
export async function fetchPost<T = unknown>(url: string, data: unknown): Promise<T> {
  return apiCacheService.fetchWithoutCache<T>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * 便捷函数：执行PUT请求（不带缓存）
 */
export async function fetchPut<T = unknown>(url: string, data: unknown): Promise<T> {
  return apiCacheService.fetchWithoutCache<T>(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

/**
 * 便捷函数：执行DELETE请求（不带缓存）
 */
export async function fetchDelete<T = unknown>(url: string): Promise<T> {
  return apiCacheService.fetchWithoutCache<T>(url, {
    method: 'DELETE',
  });
}
