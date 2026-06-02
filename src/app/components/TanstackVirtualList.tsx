/**
 * @file TanstackVirtualList.tsx
 * @description YYC³便携式智能AI系统 - 基于@tanstack/react-virtual的虚拟滚动列表组件
 * Virtual Scrolling List Component powered by @tanstack/react-virtual
 * High-performance windowed rendering for large datasets.
 * Only renders visible items + overscan buffer.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,virtual-scroll,performance,tanstack-virtual
 */

import { useVirtualizer } from '@tanstack/react-virtual'
import React, { useRef, useCallback, useMemo } from 'react'

interface TanstackVirtualListProps<T> {
  items: T[]
  /** Estimate height of each item (for dynamic height, provide an estimator) */
  estimateSize?: number | ((index: number) => number)
  /** Number of items to render outside the visible area */
  overscan?: number
  className?: string
  renderItem: (item: T, index: number) => React.ReactNode
  getKey: (item: T, index: number) => string
  emptyMessage?: string
  /** Scroll behavior: 'auto' | 'instant' | 'smooth' */
  scrollBehavior?: ScrollBehavior
  /** Enable smooth scrolling */
  smoothScrolling?: boolean
}

export function TanstackVirtualList<T>({
  items,
  estimateSize = 28,
  overscan = 8,
  className = '',
  renderItem,
  getKey,
  emptyMessage = '暂无数据',
}: TanstackVirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Initialize the virtualizer
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: typeof estimateSize === 'function' ? estimateSize : () => estimateSize,
    overscan,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  // Memoize the rendered items
  const renderedItems = useMemo(() => {
    return virtualItems.map((virtualRow) => {
      const item = items[virtualRow.index]
      return (
        <div
          key={getKey(item, virtualRow.index)}
          data-index={virtualRow.index}
          ref={(el) => virtualizer.measureElement(el)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualRow.start}px)`,
          }}
        >
          {renderItem(item, virtualRow.index)}
        </div>
      )
    })
  }, [items, virtualItems, renderItem, getKey, virtualizer])

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full text-[11px] opacity-40 ${className}`}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      className={`overflow-auto outline-none ${className}`}
      style={{
        height: '100%',
        position: 'relative',
      }}
    >
      <div
        style={{
          height: `${totalSize}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {renderedItems}
      </div>
    </div>
  )
}

/**
 * 带动态高度支持的虚拟列表
 * Virtual List with Dynamic Height Support
 */
export function TanstackVirtualListDynamic<T>({
  items,
  overscan = 8,
  className = '',
  renderItem,
  getKey,
  emptyMessage = '暂无数据',
  /** Provide initial estimate, will be refined dynamically */
  initialEstimate = 28,
}: Omit<TanstackVirtualListProps<T>, 'estimateSize' | 'scrollBehavior' | 'smoothScrolling'> & {
  initialEstimate?: number
}) {
  const parentRef = useRef<HTMLDivElement>(null)
  const sizeCache = useRef<Map<number, number>>(new Map())

  // Dynamic size estimator with cache
  const estimateSize = useCallback((index: number) => {
    // Return cached size if available
    if (sizeCache.current.has(index)) {
      return sizeCache.current.get(index)!
    }
    // Otherwise return initial estimate
    return initialEstimate
  }, [initialEstimate])

  // Update cache when element is measured
  const handleMeasure = useCallback((element: Element | null, index: number) => {
    if (!element) return
    const height = element.getBoundingClientRect().height
    sizeCache.current.set(index, height)
  }, [])

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  const renderedItems = useMemo(() => {
    return virtualItems.map((virtualRow) => {
      const item = items[virtualRow.index]
      return (
        <div
          key={getKey(item, virtualRow.index)}
          data-index={virtualRow.index}
          ref={(el) => {
            handleMeasure(el, virtualRow.index)
            virtualizer.measureElement(el)
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualRow.start}px)`,
          }}
        >
          {renderItem(item, virtualRow.index)}
        </div>
      )
    })
  }, [items, virtualItems, renderItem, getKey, virtualizer, handleMeasure])

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full text-[11px] opacity-40 ${className}`}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      className={`overflow-auto outline-none ${className}`}
      style={{
        height: '100%',
        position: 'relative',
      }}
    >
      <div
        style={{
          height: `${totalSize}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {renderedItems}
      </div>
    </div>
  )
}

/**
 * 带滚动位置记忆的虚拟列表
 * Virtual List with Scroll Position Memory
 */
interface VirtualListWithScrollMemoryProps<T> extends TanstackVirtualListProps<T> {
  /** Unique identifier for scroll position storage */
  scrollId: string
  /** Save scroll position to localStorage/sessionStorage */
  storageType?: 'localStorage' | 'sessionStorage'
}

export function TanstackVirtualListWithScrollMemory<T>({
  items,
  scrollId,
  storageType = 'sessionStorage',
  ...virtualListProps
}: VirtualListWithScrollMemoryProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Save scroll position
  const saveScrollPosition = useCallback((scrollTop: number) => {
    try {
      const storage = storageType === 'localStorage' ? window.localStorage : window.sessionStorage
      storage.setItem(`virtual-scroll-${scrollId}`, String(scrollTop))
    } catch (e) {
      // Storage might be disabled
      console.warn('Failed to save scroll position:', e)
    }
  }, [scrollId, storageType])

  // Load scroll position
  const loadScrollPosition = useCallback(() => {
    try {
      const storage = storageType === 'localStorage' ? window.localStorage : window.sessionStorage
      const saved = storage.getItem(`virtual-scroll-${scrollId}`)
      return saved ? Number.parseInt(saved, 10) : 0
    } catch (e) {
      return 0
    }
  }, [scrollId, storageType])

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index: number) => {
      const size = virtualListProps.estimateSize
      return typeof size === 'function' ? size(index) : (size ?? 28)
    },
    overscan: virtualListProps.overscan ?? 8,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()

  // Restore scroll position on mount
  React.useEffect(() => {
    const savedScrollTop = loadScrollPosition()
    if (savedScrollTop > 0 && parentRef.current) {
      parentRef.current.scrollTop = savedScrollTop
    }
  }, [loadScrollPosition, items.length]) // Re-run when items change

  // Save scroll position on scroll
  const handleScroll = useCallback(() => {
    if (parentRef.current) {
      saveScrollPosition(parentRef.current.scrollTop)
    }
  }, [saveScrollPosition])

  const renderedItems = useMemo(() => {
    return virtualItems.map((virtualRow) => {
      const item = items[virtualRow.index]
      return (
        <div
          key={virtualListProps.getKey(item, virtualRow.index)}
          data-index={virtualRow.index}
          ref={(el) => virtualizer.measureElement(el)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualRow.start}px)`,
          }}
        >
          {virtualListProps.renderItem(item, virtualRow.index)}
        </div>
      )
    })
  }, [items, virtualItems, virtualListProps, virtualizer])

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full text-[11px] opacity-40 ${virtualListProps.className}`}>
        {virtualListProps.emptyMessage}
      </div>
    )
  }

  return (
    <div
      ref={parentRef}
      className={`overflow-auto outline-none ${virtualListProps.className}`}
      onScroll={handleScroll}
      style={{
        height: '100%',
        position: 'relative',
      }}
    >
      <div
        style={{
          height: `${totalSize}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {renderedItems}
      </div>
    </div>
  )
}
