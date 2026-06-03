/**
 * @file sw.ts
 * @description YYC³便携式智能AI系统 - Service Worker主文件
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.1
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service-worker,pwa,cache,offline,critical
 */

import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  StaleWhileRevalidate,
} from 'workbox-strategies';

// ============================================================
// Service Worker版本管理
// ============================================================

const SW_VERSION = '1.0.1';
const CACHE_VERSION = 'v1';

// ============================================================
// 缓存配置常量
// ============================================================

const CACHE_NAMES = {
  PRECACHE: 'precache-v1',
  STATIC: 'static-cache-v1',
  IMAGE: 'image-cache-v1',
  FONT: 'font-cache-v1',
  CDN: 'cdn-cache-v1',
  MONACO: 'monaco-cache-v1',
  API: 'api-cache-v1',
  AI_API: 'ai-api-cache-v1',
  CONFIG: 'config-cache-v1',
};

// ============================================================
// 预缓存配置
// ============================================================

// 静态资源预缓存列表(将在构建时自动生成)
const PRECACHE_URLS = [
  // 核心JS文件
  '/',
  '/index.html',
  // 预缓存将在构建时通过workbox-precaching注入
];

// ============================================================
// Service Worker生命周期
// ============================================================

/**
 * Service Worker安装事件
 * 预缓存关键资源
 */
self.addEventListener('install', (event) => {
  console.log(`[YYC³ SW] Installing version ${SW_VERSION}`);

  // 预缓存关键资源
  event.waitUntil(
    Promise.all([
      // 执行预缓存
      precacheAndRoute(self.__WB_MANIFEST || PRECACHE_URLS),
      // 创建API缓存
      caches.open(`${CACHE_VERSION}-api`).then((_cache) => {
        console.log('[YYC³ SW] API cache created');
      }),
    ]).then(() => {
      console.log('[YYC³ SW] Installation complete');
      // 立即激活新的Service Worker
      return self.skipWaiting();
    })
  );
});

/**
 * Service Worker激活事件
 * 清理旧缓存
 */
self.addEventListener('activate', (event) => {
  console.log(`[YYC³ SW] Activating version ${SW_VERSION}`);

  event.waitUntil(
    Promise.all([
      // 清理过期的预缓存
      cleanupOutdatedCaches(),
      // 清理旧版本缓存
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('yyc3-') && !cacheName.includes(CACHE_VERSION);
            })
            .map((cacheName) => {
              console.log(`[YYC³ SW] Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            })
        );
      }),
    ]).then(() => {
      console.log('[YYC³ SW] Activation complete');
      // 立即控制所有客户端
      return self.clients.claim();
    })
  );
});

// ============================================================
// 消息处理
// ============================================================

/**
 * 处理来自客户端的消息
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[YYC³ SW] Skip waiting requested');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: SW_VERSION });
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
        })
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
    );
  }
});

// ============================================================
// 缓存策略配置
// ============================================================

/**
 * 1. CDN资源 - Cache-First策略（长期缓存30天）
 * 第三方CDN资源,优先从缓存读取,大幅提升加载速度
 */
registerRoute(
  ({ url }) => {
    return (
      url.hostname.includes('cdn.jsdelivr.net') ||
      url.hostname.includes('unpkg.com') ||
      url.hostname.includes('cdnjs.cloudflare.com')
    );
  },
  new CacheFirst({
    cacheName: CACHE_NAMES.CDN,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30天
        purgeOnQuotaError: true,
      }),
    ],
  })
);

/**
 * 2. Monaco Editor - Cache-First策略（长期缓存30天）
 * Monaco Editor资源较大,需要强力缓存以提升启动速度
 */
registerRoute(
  ({ url }) => {
    return (
      url.pathname.includes('monaco-editor') ||
      url.pathname.includes('/node_modules/monaco-editor') ||
      url.href.includes('monaco')
    );
  },
  new CacheFirst({
    cacheName: CACHE_NAMES.MONACO,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 300,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30天
        purgeOnQuotaError: true,
      }),
    ],
  })
);

/**
 * 3. 图片资源 - Cache-First策略（长期缓存30天）
 * 图片等媒体资源优先从缓存读取
 */
registerRoute(
  ({ request }) => {
    return (
      request.destination === 'image' ||
      /\.(png|jpg|jpeg|svg|gif|webp|avif|ico)$/i.test(request.url)
    );
  },
  new CacheFirst({
    cacheName: CACHE_NAMES.IMAGE,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 150,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30天
        purgeOnQuotaError: true,
      }),
    ],
  })
);

/**
 * 4. 字体资源 - Cache-First策略（永久缓存365天）
 * 字体资源永久缓存,避免字体闪烁
 */
registerRoute(
  ({ request }) => {
    return request.destination === 'font' || /\.(woff|woff2|ttf|eot|otf)$/i.test(request.url);
  },
  new CacheFirst({
    cacheName: CACHE_NAMES.FONT,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 365天
        purgeOnQuotaError: false,
      }),
    ],
  })
);

/**
 * 5. 静态资源（JS/CSS） - Cache-First策略（缓存7天）
 * 静态JS和CSS文件优先从缓存读取
 */
registerRoute(
  ({ request }) => {
    return /\.(js|css)$/i.test(request.url);
  },
  new CacheFirst({
    cacheName: CACHE_NAMES.STATIC,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7天
        purgeOnQuotaError: true,
      }),
    ],
  })
);

/**
 * 6. AI API请求 - Network-First策略（缓存15分钟，5秒超时）
 * AI API请求优先从网络获取,缓存较长时间
 */
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/ai/'),
  new NetworkFirst({
    cacheName: CACHE_NAMES.AI_API,
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 15, // 15分钟
        purgeOnQuotaError: true,
      }),
      {
        cacheWillUpdate: async ({ request, response }) => {
          // 只缓存成功的GET请求
          if (request.method !== 'GET' || !response || response.status !== 200) {
            return null;
          }
          return response;
        },
      },
    ],
  })
);

/**
 * 7. 普通API请求 - Network-First策略（缓存5分钟，3秒超时）
 * 普通API请求优先从网络获取,快速回退到缓存
 */
registerRoute(
  ({ url }) => {
    return url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/ai/');
  },
  new NetworkFirst({
    cacheName: CACHE_NAMES.API,
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 5, // 5分钟
        purgeOnQuotaError: true,
      }),
      {
        cacheWillUpdate: async ({ request, response }) => {
          // 只缓存成功的GET请求
          if (request.method !== 'GET' || !response || response.status !== 200) {
            return null;
          }
          return response;
        },
      },
    ],
  })
);

/**
 * 8. 配置文件 - Stale-While-Revalidate策略（缓存1小时）
 * 配置文件立即返回缓存,同时在后台更新
 */
registerRoute(
  ({ url }) => /\.config\.json$/i.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: CACHE_NAMES.CONFIG,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60, // 1小时
        purgeOnQuotaError: true,
      }),
    ],
  })
);

/**
 * 导航请求: Network-First策略
 * 用于页面导航,优先从网络获取
 */
const navigationHandler = new NetworkFirst({
  cacheName: `${CACHE_VERSION}-pages`,
  networkTimeoutSeconds: 3,
  plugins: [
    {
      cacheableResponse: {
        statuses: [0, 200],
      },
    },
  ],
});

const navigationRoute = new NavigationRoute(navigationHandler);
registerRoute(navigationRoute);

// ============================================================
// 工具函数
// ============================================================

/**
 * 获取缓存统计信息
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {
    totalCaches: cacheNames.length,
    caches: [] as Array<{ name: string; size: number }>,
  };

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    let size = 0;

    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        size += blob.size;
      }
    }

    stats.caches.push({
      name: cacheName,
      size,
    });
  }

  return stats;
}

/**
 * 清理所有缓存
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  console.log('[YYC³ SW] All caches cleared');
}

// ============================================================
// 离线回退
// ============================================================

/**
 * 离线回退页面
 * 当所有策略都失败时,返回离线提示页面
 */
registerRoute(
  ({ url }) => {
    return url.pathname.startsWith('/offline.html');
  },
  new CacheFirst({
    cacheName: `${CACHE_VERSION}-offline`,
    plugins: [
      {
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    ],
  })
);

/**
 * 创建离线回送页面(如果不存在)
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(`${CACHE_VERSION}-offline`).then((cache) => {
      return cache.add('/offline.html').catch(() => {
        console.warn('[YYC³ SW] Offline page not found, skipping');
      });
    })
  );
});

// ============================================================
// 导出Service Worker信息
// ============================================================

// 导出版本信息,用于客户端检查
self.__SW_VERSION__ = SW_VERSION;
self.__CACHE_VERSION__ = CACHE_VERSION;

console.log(`[YYC³ SW] Service Worker ${SW_VERSION} loaded`);
