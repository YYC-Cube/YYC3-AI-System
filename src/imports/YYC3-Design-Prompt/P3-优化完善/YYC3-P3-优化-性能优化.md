---
file: YYC3-P3-优化-性能优化.md
description: 全面性能优化策略 (加载/渲染/内存/网络/存储/计算)
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
status: stable
tags: p3,optimization,performance
---

# YYC³ P3-优化-性能优化 (全局策略)

> **范围**: 本文件聚焦 **宏观**性能策略（加载、网络、存储、计算）。
> React 运行时渲染/Zustand/Worker 细节见 `P3-性能-性能优化.md`。

## 目标指标
| 指标 | 目标值 |
|------|--------|
| 首屏加载 | < 2s |
| 页面切换 | < 100ms |
| 内存使用 | < 500MB |
| CPU 使用 | < 30% |
| 网络请求 | 减少 50% |
| 渲染帧率 | 稳定 60fps |

## 1. 加载性能
- 首屏: Critical CSS 内联, preload 关键资源, SSR/SSG
- 资源: 图片 WebP + srcset, 字体 font-display:swap, gzip/brotli
- 代码分割: React.lazy + Suspense, manualChunks vendor splitting
- 预加载: prefetch 非关键路由, preconnect API 域名

## 2. 渲染性能
- React.memo + useMemo + useCallback 避免不必要重渲染
- 虚拟滚动: 大列表 (react-virtuoso / tanstack-virtual)
- 列表渲染: stable key, 避免 index key
- 动画: transform/opacity only, will-change, requestAnimationFrame
- 重绘回流: 批量 DOM 操作, DocumentFragment

## 3. 内存优化
- 内存泄漏检测: useEffect cleanup, WeakRef/WeakMap
- 对象池: 复用频繁创建的对象
- 缓存策略: LRU eviction, TTL 过期清理
- 垃圾回收: 手动 null 解引用大对象

## 4. 网络优化
- 请求合并: batch API, debounce search
- 请求缓存: stale-while-revalidate, Cache API
- 数据压缩: gzip request body, 响应压缩
- CDN: 静态资源 CDN 加速
- WebSocket: 复用长连接, 心跳保活

## 5. 存储优化
- IndexedDB: 索引优化, bulkPut 批量写入, 事务合并
- localStorage: 仅存储小量配置数据
- 文件缓存: Service Worker Cache API
- 数据库查询: 准备 statement, 结果集分页

## 6. 计算优化
- 算法: O(n) 优化, Map/Set 代替 Array.find
- 数据结构: 选择合适的容器
- Web Worker: CPU 密集任务 (diff/patch, 大数据处理)
- GPU 加速: CSS transform, Canvas OffscreenCanvas
- 并发: Promise.all 并行请求