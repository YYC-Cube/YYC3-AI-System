/**
 * @file cache-strategy-service.ts
 * @description YYC³便携式智能AI系统 - 缓存策略服务
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,cache,service-worker,pwa,storage
 */

/**
 * 缓存策略类型
 */
export type CacheStrategy =
  | 'CacheFirst' // 优先从缓存读取，缓存无数据时才请求网络
  | 'CacheOnly' // 仅从缓存读取
  | 'NetworkFirst' // 优先从网络读取，网络失败时从缓存读取
  | 'NetworkOnly' // 仅从网络读取
  | 'StaleWhileRevalidate' // 从缓存读取，同时在后台更新缓存
  | 'StaleOnRevalidate'; // 缓存有效时从缓存读取，失败时从网络读取

/**
 * 缓存配置
 */
export interface CacheConfig {
  /** 缓存名称 */
  cacheName: string;
  /** 缓存策略 */
  strategy: CacheStrategy;
  /** 最大缓存条目数 */
  maxEntries?: number;
  /** 最大缓存时间（秒） */
  maxAgeSeconds?: number;
  /** 网络超时时间（秒） */
  networkTimeoutSeconds?: number;
  /** 缓存前缀 */
  prefix?: string;
  /** 允许的响应状态码 */
  cacheableResponse?: {
    statuses: number[];
  };
}

/**
 * 缓存统计数据
 */
export interface CacheStats {
  /** 缓存名称 */
  cacheName: string;
  /** 缓存条目数 */
  entryCount: number;
  /** 缓存总大小（字节） */
  totalSize: number;
  /** 最后更新时间 */
  lastUpdated: number;
  /** 缓存策略 */
  strategy: CacheStrategy;
}

/**
 * 缓存服务类
 */
export class CacheStrategyService {
  private static instance: CacheStrategyService;
  private caches: Map<string, Cache> = new Map();
  private cacheConfigs: Map<string, CacheConfig> = new Map();
  private stats: Map<string, CacheStats> = new Map();

  private constructor() {
    this.initializeDefaultCaches();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): CacheStrategyService {
    if (!CacheStrategyService.instance) {
      CacheStrategyService.instance = new CacheStrategyService();
    }
    return CacheStrategyService.instance;
  }

  /**
   * 初始化默认缓存配置
   */
  private initializeDefaultCaches(): void {
    // 预缓存资源
    this.registerCache({
      cacheName: 'precache-v1',
      strategy: 'CacheFirst',
      maxEntries: 100,
      maxAgeSeconds: 60 * 60 * 24 * 30, // 30天
    });

    // 静态资源（JS/CSS）
    this.registerCache({
      cacheName: 'static-cache-v1',
      strategy: 'CacheFirst',
      maxEntries: 100,
      maxAgeSeconds: 60 * 60 * 24 * 7, // 7天
    });

    // 图片资源
    this.registerCache({
      cacheName: 'image-cache-v1',
      strategy: 'CacheFirst',
      maxEntries: 150,
      maxAgeSeconds: 60 * 60 * 24 * 30, // 30天
    });

    // 字体资源
    this.registerCache({
      cacheName: 'font-cache-v1',
      strategy: 'CacheFirst',
      maxEntries: 50,
      maxAgeSeconds: 60 * 60 * 24 * 365, // 365天
    });

    // CDN资源
    this.registerCache({
      cacheName: 'cdn-cache-v1',
      strategy: 'CacheFirst',
      maxEntries: 200,
      maxAgeSeconds: 60 * 60 * 24 * 30, // 30天
    });

    // Monaco Editor
    this.registerCache({
      cacheName: 'monaco-cache-v1',
      strategy: 'CacheFirst',
      maxEntries: 300,
      maxAgeSeconds: 60 * 60 * 24 * 30, // 30天
    });

    // API请求
    this.registerCache({
      cacheName: 'api-cache-v1',
      strategy: 'NetworkFirst',
      maxEntries: 50,
      maxAgeSeconds: 60 * 5, // 5分钟
      networkTimeoutSeconds: 3,
    });

    // AI API请求
    this.registerCache({
      cacheName: 'ai-api-cache-v1',
      strategy: 'NetworkFirst',
      maxEntries: 30,
      maxAgeSeconds: 60 * 15, // 15分钟
      networkTimeoutSeconds: 5,
    });

    // 配置文件
    this.registerCache({
      cacheName: 'config-cache-v1',
      strategy: 'StaleWhileRevalidate',
      maxEntries: 20,
      maxAgeSeconds: 60 * 60, // 1小时
    });
  }

  /**
   * 注册缓存配置
   */
  registerCache(config: CacheConfig): void {
    this.cacheConfigs.set(config.cacheName, config);
    console.log(`[Cache] Registered cache: ${config.cacheName} (${config.strategy})`);
  }

  /**
   * 获取缓存配置
   */
  getCacheConfig(cacheName: string): CacheConfig | undefined {
    return this.cacheConfigs.get(cacheName);
  }

  /**
   * 获取所有缓存配置
   */
  getAllCacheConfigs(): CacheConfig[] {
    return Array.from(this.cacheConfigs.values());
  }

  /**
   * 打开缓存
   */
  async openCache(cacheName: string): Promise<Cache> {
    if (this.caches.has(cacheName)) {
      return this.caches.get(cacheName)!;
    }

    const cache = await caches.open(cacheName);
    this.caches.set(cacheName, cache);
    return cache;
  }

  /**
   * 根据URL模式匹配缓存名称
   */
  matchCacheName(url: string): string | null {
    // Monaco Editor资源
    if (url.includes('monaco-editor') || url.includes('monaco')) {
      return 'monaco-cache-v1';
    }

    // CDN资源
    if (/^https:\/\/(cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com)/.test(url)) {
      return 'cdn-cache-v1';
    }

    // API请求
    if (/\/api\//.test(url)) {
      if (/\/api\/ai\//.test(url)) {
        return 'ai-api-cache-v1';
      }
      return 'api-cache-v1';
    }

    // 图片资源
    if (/\.(png|jpg|jpeg|svg|gif|webp|avif)$/i.test(url)) {
      return 'image-cache-v1';
    }

    // 字体资源
    if (/\.(woff|woff2|ttf|eot|otf)$/i.test(url)) {
      return 'font-cache-v1';
    }

    // 静态资源（JS/CSS）
    if (/\.(js|css)$/i.test(url)) {
      return 'static-cache-v1';
    }

    // 配置文件
    if (/\.config\.json$/i.test(url)) {
      return 'config-cache-v1';
    }

    // 默认返回预缓存
    return 'precache-v1';
  }

  /**
   * CacheFirst策略实现
   */
  async cacheFirst(request: Request, cacheName: string): Promise<Response> {
    const cache = await this.openCache(cacheName);

    try {
      // 先尝试从缓存获取
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        console.log(`[Cache] Hit: ${request.url}`);
        return cachedResponse;
      }

      // 缓存未命中，从网络获取
      console.log(`[Cache] Miss: ${request.url}`);
      const networkResponse = await fetch(request);

      // 验证响应状态
      const config = this.getCacheConfig(cacheName);
      if (config?.cacheableResponse?.statuses) {
        if (!config.cacheableResponse.statuses.includes(networkResponse.status)) {
          return networkResponse;
        }
      }

      // 缓存响应
      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
        await this.cleanupCache(cacheName);
      }

      return networkResponse;
    } catch (error) {
      console.error(`[Cache] Error: ${request.url}`, error);
      throw error;
    }
  }

  /**
   * NetworkFirst策略实现
   */
  async networkFirst(request: Request, cacheName: string): Promise<Response> {
    const config = this.getCacheConfig(cacheName);
    const timeout = config?.networkTimeoutSeconds || 3;

    const cache = await this.openCache(cacheName);

    try {
      // 尝试从网络获取（带超时）
      const networkPromise = fetch(request);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), timeout * 1000)
      );

      const networkResponse = await Promise.race([networkPromise, timeoutPromise]);

      // 缓存响应
      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
        await this.cleanupCache(cacheName);
      }

      return networkResponse;
    } catch (_error) {
      // 网络失败，尝试从缓存获取
      console.log(`[Cache] Network failed, trying cache: ${request.url}`);
      const cachedResponse = await cache.match(request);

      if (cachedResponse) {
        console.log(`[Cache] Serving from cache: ${request.url}`);
        return cachedResponse;
      }

      // 缓存也没有，返回错误
      throw new Error(`Network and cache both failed for: ${request.url}`);
    }
  }

  /**
   * StaleWhileRevalidate策略实现
   */
  async staleWhileRevalidate(request: Request, cacheName: string): Promise<Response> {
    const cache = await this.openCache(cacheName);

    // 先尝试从缓存获取（快速响应）
    const cachedResponse = await cache.match(request);

    // 同时在后台更新缓存
    const fetchPromise = fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
        await this.cleanupCache(cacheName);
      }
      return networkResponse;
    });

    if (cachedResponse) {
      // 返回缓存响应，同时启动后台更新
      fetchPromise.catch((error) => {
        console.warn(`[Cache] Background update failed: ${request.url}`, error);
      });
      return cachedResponse;
    }

    // 缓存未命中，等待网络响应
    console.log(`[Cache] Miss, waiting for network: ${request.url}`);
    return fetchPromise;
  }

  /**
   * 清理过期缓存
   */
  async cleanupCache(cacheName: string): Promise<void> {
    const cache = await this.openCache(cacheName);
    const config = this.getCacheConfig(cacheName);

    if (!config?.maxEntries && !config?.maxAgeSeconds) {
      return;
    }

    const keys = await cache.keys();
    const now = Date.now();

    // 清理过期条目
    const entriesToRemove: Request[] = [];
    for (const request of keys) {
      const response = await cache.match(request);
      if (!response) continue;

      const cacheTime = parseInt(response.headers.get('sw-cache-time') || '0');
      const age = (now - cacheTime) / 1000; // 秒

      // 检查是否过期
      if (config.maxAgeSeconds && age > config.maxAgeSeconds) {
        entriesToRemove.push(request);
        continue;
      }
    }

    // 检查条目数量限制
    if (config.maxEntries && keys.length - entriesToRemove.length > config.maxEntries) {
      const excess = keys.length - entriesToRemove.length - config.maxEntries;
      // 按时间排序，删除最旧的
      const sortedKeys = await this.sortKeysByCacheTime(cache, keys);
      entriesToRemove.push(...Array.from(sortedKeys.slice(0, excess)));
    }

    // 删除条目
    for (const request of entriesToRemove) {
      await cache.delete(request);
      console.log(`[Cache] Removed: ${request.url}`);
    }

    // 更新统计数据
    await this.updateStats(cacheName);
  }

  /**
   * 按缓存时间排序keys
   */
  private async sortKeysByCacheTime(cache: Cache, keys: readonly Request[]): Promise<Request[]> {
    const entries = await Promise.all(
      keys.map(async (key) => {
        const response = await cache.match(key);
        const cacheTime = parseInt(response?.headers.get('sw-cache-time') || '0');
        return { key, cacheTime };
      })
    );

    return entries.sort((a, b) => a.cacheTime - b.cacheTime).map((e) => e.key);
  }

  /**
   * 更新缓存统计信息
   */
  private async updateStats(cacheName: string): Promise<void> {
    const cache = await this.openCache(cacheName);
    const config = this.getCacheConfig(cacheName);

    const keys = await cache.keys();
    let totalSize = 0;
    let lastUpdated = 0;

    for (const request of keys) {
      const response = await cache.match(request);
      if (!response) continue;

      const cacheTime = parseInt(response.headers.get('sw-cache-time') || '0');
      if (cacheTime > lastUpdated) {
        lastUpdated = cacheTime;
      }

      // 计算响应大小（估算）
      const size = parseInt(response.headers.get('content-length') || '0');
      totalSize += size;
    }

    this.stats.set(cacheName, {
      cacheName,
      entryCount: keys.length,
      totalSize,
      lastUpdated,
      strategy: config?.strategy || 'CacheFirst',
    });
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(cacheName: string): Promise<CacheStats | undefined> {
    await this.updateStats(cacheName);
    return this.stats.get(cacheName);
  }

  /**
   * 获取所有缓存统计信息
   */
  async getAllStats(): Promise<CacheStats[]> {
    const allStats: CacheStats[] = [];

    for (const cacheName of Array.from(this.cacheConfigs.keys())) {
      const stats = await this.getStats(cacheName);
      if (stats) {
        allStats.push(stats);
      }
    }

    return allStats;
  }

  /**
   * 清除指定缓存
   */
  async clearCache(cacheName: string): Promise<void> {
    if (await caches.delete(cacheName)) {
      this.caches.delete(cacheName);
      this.stats.delete(cacheName);
      console.log(`[Cache] Cleared cache: ${cacheName}`);
    }
  }

  /**
   * 清除所有缓存
   */
  async clearAllCaches(): Promise<void> {
    const cacheNames = await caches.keys();
    for (const cacheName of cacheNames) {
      await this.clearCache(cacheName);
    }
  }

  /**
   * 打印缓存统计信息
   */
  async printStats(): Promise<void> {
    const stats = await this.getAllStats();

    console.group('📊 缓存统计信息');
    for (const stat of stats) {
      const sizeMB = (stat.totalSize / 1024 / 1024).toFixed(2);
      console.log(`${stat.cacheName}:`);
      console.log(`  条目数: ${stat.entryCount}`);
      console.log(`  总大小: ${sizeMB} MB`);
      console.log(`  策略: ${stat.strategy}`);
      console.log(`  最后更新: ${new Date(stat.lastUpdated).toLocaleString()}`);
      console.log('');
    }
    console.groupEnd();
  }
}

/**
 * 导出单例实例
 */
export const cacheStrategyService = CacheStrategyService.getInstance();
