/**
 * @file precache-manifest.ts
 * @description YYC³便携式智能AI系统 - Service Worker预缓存清单
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service-worker,precache,pwa,cache-manifest,critical
 */

/**
 * 预缓存资源清单
 *
 * 预缓存策略说明:
 * - 关键JS/CSS: 立即缓存，应用启动时加载
 * - 字体文件: 永久缓存，避免字体闪烁
 * - 图标和图片: 预缓存关键图标，提升首屏体验
 * - 配置文件: 预缓存应用配置，快速启动
 *
 * 资源优先级:
 * - Critical: 首屏必需，必须预缓存
 * - High: 重要资源，优先缓存
 * - Medium: 次要资源，按需缓存
 * - Low: 辅助资源，延迟缓存
 */

export type CachePriority = 'critical' | 'high' | 'medium' | 'low';

export interface PrecacheAsset {
  /** 资源URL路径 */
  url: string;
  /** 资源版本（用于缓存失效） */
  revision: string;
  /** 缓存优先级 */
  priority: CachePriority;
  /** 资源类型 */
  type: 'script' | 'style' | 'image' | 'font' | 'config' | 'other';
  /** 资源大小预估（KB） */
  size?: number;
  /** 是否为关键资源（首屏必需） */
  isCritical?: boolean;
  /** 资源描述 */
  description?: string;
}

/**
 * 预缓存资产列表
 *
 * 注意: 这些URL是相对于public目录的
 * 构建时Vite会自动处理版本控制（hash）
 */
export const PRECACHE_ASSETS: PrecacheAsset[] = [
  // ========== Critical Priority（关键资源，首屏必需） ==========

  {
    url: '/index.html',
    revision: '1.0.0',
    priority: 'critical',
    type: 'config',
    isCritical: true,
    description: '应用入口HTML',
  },

  {
    url: '/manifest.json',
    revision: '1.0.0',
    priority: 'critical',
    type: 'config',
    isCritical: true,
    description: 'PWA manifest配置',
  },

  {
    url: '/yyc3-icons/icon-72x72.png',
    revision: '1.0.0',
    priority: 'critical',
    type: 'image',
    isCritical: true,
    description: '72x72应用图标',
  },

  {
    url: '/yyc3-icons/icon-96x96.png',
    revision: '1.0.0',
    priority: 'critical',
    type: 'image',
    isCritical: true,
    description: '96x96应用图标',
  },

  {
    url: '/yyc3-icons/icon-128x128.png',
    revision: '1.0.0',
    priority: 'critical',
    type: 'image',
    isCritical: true,
    description: '128x128应用图标',
  },

  {
    url: '/yyc3-icons/icon-144x144.png',
    revision: '1.0.0',
    priority: 'critical',
    type: 'image',
    isCritical: true,
    description: '144x144应用图标',
  },

  {
    url: '/yyc3-icons/icon-152x152.png',
    revision: '1.0.0',
    priority: 'critical',
    type: 'image',
    isCritical: true,
    description: '152x152应用图标',
  },

  {
    url: '/yyc3-icons/icon-192x192.png',
    revision: '1.0.0',
    priority: 'critical',
    type: 'image',
    isCritical: true,
    description: '192x192应用图标',
  },

  {
    url: '/yyc3-icons/icon-384x384.png',
    revision: '1.0.0',
    priority: 'critical',
    type: 'image',
    isCritical: true,
    description: '384x384应用图标',
  },

  {
    url: '/yyc3-icons/icon-512x512.png',
    revision: '1.0.0',
    priority: 'critical',
    type: 'image',
    isCritical: true,
    description: '512x512应用图标',
  },

  {
    url: '/yyc3-icons/icon-maskable-192x192.png',
    revision: '1.0.0',
    priority: 'critical',
    type: 'image',
    isCritical: true,
    description: '192x192 maskable图标',
  },

  {
    url: '/yyc3-icons/icon-maskable-512x512.png',
    revision: '1.0.0',
    priority: 'critical',
    type: 'image',
    isCritical: true,
    description: '512x512 maskable图标',
  },

  // ========== High Priority（重要资源，优先缓存） ==========

  {
    url: '/yyc3-icons/logo-dark.png',
    revision: '1.0.0',
    priority: 'high',
    type: 'image',
    size: 25,
    description: '暗色主题Logo',
  },

  {
    url: '/yyc3-icons/logo-light.png',
    revision: '1.0.0',
    priority: 'high',
    type: 'image',
    size: 25,
    description: '亮色主题Logo',
  },

  {
    url: '/yyc3-icons/ai-assistant.png',
    revision: '1.0.0',
    priority: 'high',
    type: 'image',
    size: 30,
    description: 'AI助手图标',
  },

  {
    url: '/yyc3-icons/code-editor.png',
    revision: '1.0.0',
    priority: 'high',
    type: 'image',
    size: 30,
    description: '代码编辑器图标',
  },

  {
    url: '/yyc3-icons/file-explorer.png',
    revision: '1.0.0',
    priority: 'high',
    type: 'image',
    size: 20,
    description: '文件浏览器图标',
  },

  {
    url: '/yyc3-icons/settings.png',
    revision: '1.0.0',
    priority: 'high',
    type: 'image',
    size: 15,
    description: '设置图标',
  },

  {
    url: '/yyc3-icons/terminal.png',
    revision: '1.0.0',
    priority: 'high',
    type: 'image',
    size: 20,
    description: '终端图标',
  },

  {
    url: '/yyc3-icons/collaboration.png',
    revision: '1.0.0',
    priority: 'high',
    type: 'image',
    size: 25,
    description: '协作图标',
  },

  {
    url: '/yyc3-icons/deploy.png',
    revision: '1.0.0',
    priority: 'high',
    type: 'image',
    size: 20,
    description: '部署图标',
  },

  {
    url: '/yyc3-icons/database.png',
    revision: '1.0.0',
    priority: 'high',
    type: 'image',
    size: 20,
    description: '数据库图标',
  },

  {
    url: '/yyc3-icons/offline.png',
    revision: '1.0.0',
    priority: 'high',
    type: 'image',
    size: 15,
    description: '离线状态图标',
  },

  {
    url: '/yyc3-icons/online.png',
    revision: '1.0.0',
    priority: 'high',
    type: 'image',
    size: 15,
    description: '在线状态图标',
  },

  // ========== Medium Priority（次要资源，按需缓存） ==========

  {
    url: '/yyc3-icons/new-file.png',
    revision: '1.0.0',
    priority: 'medium',
    type: 'image',
    size: 10,
    description: '新建文件图标',
  },

  {
    url: '/yyc3-icons/folder.png',
    revision: '1.0.0',
    priority: 'medium',
    type: 'image',
    size: 12,
    description: '文件夹图标',
  },

  {
    url: '/yyc3-icons/search.png',
    revision: '1.0.0',
    priority: 'medium',
    type: 'image',
    size: 10,
    description: '搜索图标',
  },

  {
    url: '/yyc3-icons/git.png',
    revision: '1.0.0',
    priority: 'medium',
    type: 'image',
    size: 15,
    description: 'Git图标',
  },

  {
    url: '/yyc3-icons/extensions.png',
    revision: '1.0.0',
    priority: 'medium',
    type: 'image',
    size: 20,
    description: '扩展图标',
  },

  {
    url: '/yyc3-icons/keyboard.png',
    revision: '1.0.0',
    priority: 'medium',
    type: 'image',
    size: 15,
    description: '键盘快捷键图标',
  },

  {
    url: '/yyc3-icons/account.png',
    revision: '1.0.0',
    priority: 'medium',
    type: 'image',
    size: 18,
    description: '账户图标',
  },

  {
    url: '/yyc3-icons/notifications.png',
    revision: '1.0.0',
    priority: 'medium',
    type: 'image',
    size: 12,
    description: '通知图标',
  },

  // ========== Low Priority（辅助资源，延迟缓存） ==========

  {
    url: '/yyc3-icons/welcome-bg.jpg',
    revision: '1.0.0',
    priority: 'low',
    type: 'image',
    size: 150,
    description: '欢迎页背景',
  },

  {
    url: '/yyc3-icons/tutorial-1.png',
    revision: '1.0.0',
    priority: 'low',
    type: 'image',
    size: 80,
    description: '教程图片1',
  },

  {
    url: '/yyc3-icons/tutorial-2.png',
    revision: '1.0.0',
    priority: 'low',
    type: 'image',
    size: 85,
    description: '教程图片2',
  },

  {
    url: '/yyc3-icons/tutorial-3.png',
    revision: '1.0.0',
    priority: 'low',
    type: 'image',
    size: 75,
    description: '教程图片3',
  },
];

/**
 * 按优先级分组的预缓存资产
 */
export const PRECACHE_ASSETS_BY_PRIORITY = {
  critical: PRECACHE_ASSETS.filter((asset) => asset.priority === 'critical'),
  high: PRECACHE_ASSETS.filter((asset) => asset.priority === 'high'),
  medium: PRECACHE_ASSETS.filter((asset) => asset.priority === 'medium'),
  low: PRECACHE_ASSETS.filter((asset) => asset.priority === 'low'),
};

/**
 * 按类型分组的预缓存资产
 */
export const PRECACHE_ASSETS_BY_TYPE = {
  script: PRECACHE_ASSETS.filter((asset) => asset.type === 'script'),
  style: PRECACHE_ASSETS.filter((asset) => asset.type === 'style'),
  image: PRECACHE_ASSETS.filter((asset) => asset.type === 'image'),
  font: PRECACHE_ASSETS.filter((asset) => asset.type === 'font'),
  config: PRECACHE_ASSETS.filter((asset) => asset.type === 'config'),
  other: PRECACHE_ASSETS.filter((asset) => asset.type === 'other'),
};

/**
 * 计算预缓存总大小
 */
export const PRECACHE_TOTAL_SIZE = PRECACHE_ASSETS.reduce(
  (total, asset) => total + (asset.size || 0),
  0
);

/**
 * 获取Workbox预缓存清单格式
 */
export function getWorkboxPrecacheManifest(): Array<{ url: string; revision: string }> {
  return PRECACHE_ASSETS.map((asset) => ({
    url: asset.url,
    revision: asset.revision,
  }));
}

/**
 * 获取关键资源列表
 */
export function getCriticalAssets(): string[] {
  return PRECACHE_ASSETS.filter((asset) => asset.isCritical).map((asset) => asset.url);
}

/**
 * 获取高优先级资源列表
 */
export function getHighPriorityAssets(): string[] {
  return PRECACHE_ASSETS.filter((asset) => asset.priority === 'high').map((asset) => asset.url);
}

/**
 * 打印预缓存统计信息
 */
export function printPrecacheStats(): void {
  console.group('📦 预缓存清单统计');
  console.log(`总资源数: ${PRECACHE_ASSETS.length}`);
  console.log(`总大小: ${PRECACHE_TOTAL_SIZE} KB`);
  console.log('');
  console.log('按优先级分布:');
  console.log(`  - Critical: ${PRECACHE_ASSETS_BY_PRIORITY.critical.length}`);
  console.log(`  - High: ${PRECACHE_ASSETS_BY_PRIORITY.high.length}`);
  console.log(`  - Medium: ${PRECACHE_ASSETS_BY_PRIORITY.medium.length}`);
  console.log(`  - Low: ${PRECACHE_ASSETS_BY_PRIORITY.low.length}`);
  console.log('');
  console.log('按类型分布:');
  console.log(`  - Config: ${PRECACHE_ASSETS_BY_TYPE.config.length}`);
  console.log(`  - Image: ${PRECACHE_ASSETS_BY_TYPE.image.length}`);
  console.log(`  - Script: ${PRECACHE_ASSETS_BY_TYPE.script.length}`);
  console.log(`  - Style: ${PRECACHE_ASSETS_BY_TYPE.style.length}`);
  console.log(`  - Font: ${PRECACHE_ASSETS_BY_TYPE.font.length}`);
  console.log(`  - Other: ${PRECACHE_ASSETS_BY_TYPE.other.length}`);
  console.groupEnd();
}

// 在模块加载时打印统计信息
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  printPrecacheStats();
}
