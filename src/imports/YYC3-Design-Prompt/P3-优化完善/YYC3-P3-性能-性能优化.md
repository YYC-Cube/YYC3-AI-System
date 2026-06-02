---
file: YYC3-P3-性能-性能优化.md
description: 渲染和运行时性能优化
author: YanYuCloudCube Team <admin@0379.email>
version: v1.0.0
created: 2026-03-14
status: stable
tags: p3,performance,runtime
---

# YYC³ P3-性能-性能优化 (运行时)

> **范围**: 本文件聚焦 React **运行时**渲染、状态管理和异步任务优化。
> 宏观加载/网络/存储/计算策略见 `P3-优化-性能优化.md`。

## React 渲染优化

- React.memo: 纯展示组件包裹, 自定义比较函数
- useMemo: 计算密集型派生数据缓存
- useCallback: 事件处理器引用稳定
- Suspense + lazy: 组件级代码分割
- useTransition: 非紧急状态更新降优先级

## Zustand 优化

- 选择器: useStore(s => s.field) 精确订阅
- subscribeWithSelector: 细粒度变更通知
- shallow compare: 数组/对象级比较
- immer: 不可变更新, 避免深拷贝

## 虚拟滚动

- 文件树: 虚拟化大目录 (10000+ 文件)
- 查询结果: 虚拟化大表格 (100000+ 行)
- 日志输出: 虚拟化日志流

## 防抖/节流

- 搜索输入: debounce 300ms
- 窗口 resize: throttle 100ms
- 编辑器内容变更: debounce 500ms (自动保存)
- 滚动事件: throttle 16ms (60fps)

## Web Worker

- diffWorker: 文本差异计算 (大文件 diff)
- pagingWorker: 大结果集分页处理
- backupWorker: 备份文件加密流

## 性能监控

- PerformanceObserver: FCP/LCP/CLS/FID
- React DevTools Profiler: 组件渲染分析
- Memory: performance.memory 监控
- 自定义指标: 面板操作响应时间
