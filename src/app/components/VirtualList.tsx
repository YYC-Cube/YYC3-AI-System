/**
 * @file VirtualList.tsx
 * @description YYC³便携式智能AI系统 - 虚拟滚动列表组件
 * Virtual Scrolling List Component
 * High-performance windowed rendering for large datasets.
 * Only renders visible items + overscan buffer.
 * Keyboard navigation: ↑↓ to select, Enter to activate, Escape to clear.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags component,virtual-scroll,performance,keyboard
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  overscan?: number;
  className?: string;
  renderItem: (item: T, index: number, isFocused: boolean) => React.ReactNode;
  getKey: (item: T, index: number) => string;
  emptyMessage?: string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  /** Called when Enter is pressed on a focused item */
  onItemActivate?: (item: T, index: number) => void;
  /** Called when focus changes via keyboard */
  onFocusChange?: (index: number) => void;
  /** Enable keyboard navigation (default: true) */
  keyboardNav?: boolean;
  /** Allow tabbing into the list for focus (default: true) */
  focusable?: boolean;
  /** CSS class applied to the focused item wrapper */
  focusedClassName?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  overscan = 5,
  className = '',
  renderItem,
  getKey,
  emptyMessage = 'No items',
  onEndReached,
  endReachedThreshold = 200,
  onItemActivate,
  onFocusChange,
  keyboardNav = true,
  focusable = true,
  focusedClassName = '',
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // ResizeObserver for container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Reset focused index when items change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [items.length]);

  // Scroll handler
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    setScrollTop(el.scrollTop);

    if (onEndReached) {
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (remaining < endReachedThreshold) onEndReached();
    }
  }, [onEndReached, endReachedThreshold]);

  // Scroll focused item into view
  const scrollToIndex = useCallback(
    (index: number) => {
      const el = containerRef.current;
      if (!el || index < 0) return;

      const itemTop = index * itemHeight;
      const itemBottom = itemTop + itemHeight;
      const viewTop = el.scrollTop;
      const viewBottom = viewTop + el.clientHeight;

      if (itemTop < viewTop) {
        el.scrollTop = itemTop;
      } else if (itemBottom > viewBottom) {
        el.scrollTop = itemBottom - el.clientHeight;
      }
    },
    [itemHeight]
  );

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!keyboardNav || items.length === 0) return;

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const next = focusedIndex < items.length - 1 ? focusedIndex + 1 : 0;
          setFocusedIndex(next);
          scrollToIndex(next);
          onFocusChange?.(next);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const prev = focusedIndex > 0 ? focusedIndex - 1 : items.length - 1;
          setFocusedIndex(prev);
          scrollToIndex(prev);
          onFocusChange?.(prev);
          break;
        }
        case 'Enter': {
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < items.length) {
            onItemActivate?.(items[focusedIndex], focusedIndex);
          }
          break;
        }
        case 'Escape': {
          e.preventDefault();
          setFocusedIndex(-1);
          containerRef.current?.blur();
          break;
        }
        case 'Home': {
          e.preventDefault();
          setFocusedIndex(0);
          scrollToIndex(0);
          onFocusChange?.(0);
          break;
        }
        case 'End': {
          e.preventDefault();
          const last = items.length - 1;
          setFocusedIndex(last);
          scrollToIndex(last);
          onFocusChange?.(last);
          break;
        }
      }
    },
    [keyboardNav, items, focusedIndex, scrollToIndex, onItemActivate, onFocusChange]
  );

  // Click to focus an item
  const handleItemClick = useCallback(
    (index: number) => {
      setFocusedIndex(index);
      onFocusChange?.(index);
    },
    [onFocusChange]
  );

  // Calculate visible range
  const { visibleItems } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length - 1, start + visibleCount + overscan * 2);

    return {
      startIndex: start,
      endIndex: end,
      visibleItems: items.slice(start, end + 1).map((item, i) => ({
        item,
        index: start + i,
      })),
    };
  }, [items, itemHeight, scrollTop, containerHeight, overscan]);

  const totalHeight = items.length * itemHeight;

  if (items.length === 0) {
    return (
      <div
        className={`flex items-center justify-center h-full text-[11px] opacity-40 ${className}`}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto outline-none ${className}`}
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
      tabIndex={focusable ? 0 : undefined}
      role="listbox"
      aria-label="Virtual scrolling list"
      aria-activedescendant={focusedIndex >= 0 ? `vl-item-${focusedIndex}` : undefined}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index }) => {
          const isFocused = index === focusedIndex;
          return (
            <div
              key={getKey(item, index)}
              id={`vl-item-${index}`}
              role="option"
              aria-selected={isFocused}
              style={{
                position: 'absolute',
                top: index * itemHeight,
                left: 0,
                right: 0,
                height: itemHeight,
              }}
              onClick={() => handleItemClick(index)}
              onDoubleClick={() => onItemActivate?.(item, index)}
              className={isFocused ? focusedClassName : ''}
            >
              {renderItem(item, index, isFocused)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Virtual Table (for DB query results) ──

interface VirtualTableProps {
  columns: string[];
  rows: Record<string, unknown>[];
  rowHeight?: number;
  className?: string;
  onRowClick?: (row: Record<string, unknown>, index: number) => void;
  isDark?: boolean;
}

export function VirtualTable({
  columns,
  rows,
  rowHeight = 32,
  className = '',
  onRowClick,
  isDark = true,
}: VirtualTableProps) {
  const bg = isDark ? 'bg-white/[0.02]' : 'bg-slate-50';
  const hoverBg = isDark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-100';
  const headerBg = isDark ? 'bg-white/[0.04]' : 'bg-slate-100';
  const borderColor = isDark ? 'border-white/[0.06]' : 'border-slate-200';
  const textPrimary = isDark ? 'text-white/70' : 'text-slate-700';
  const textDim = isDark ? 'text-white/30' : 'text-slate-400';
  const focusBg = isDark ? 'bg-indigo-500/10' : 'bg-indigo-50';

  return (
    <div className={`flex flex-col overflow-hidden rounded-xl border ${borderColor} ${className}`}>
      {/* Header */}
      <div className={`flex ${headerBg} border-b ${borderColor}`} style={{ height: rowHeight + 4 }}>
        {columns.map((col) => (
          <div
            key={col}
            className={`flex items-center px-3 text-[10px] ${textDim} flex-1 min-w-[100px]`}
            style={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}
          >
            {col}
          </div>
        ))}
      </div>

      {/* Virtual rows */}
      <VirtualList
        items={rows}
        itemHeight={rowHeight}
        overscan={10}
        className="flex-1"
        getKey={(_, i) => `row-${i}`}
        emptyMessage="No rows returned"
        onItemActivate={(row, index) => onRowClick?.(row, index)}
        focusedClassName={focusBg}
        renderItem={(row, index, isFocused) => (
          <div
            className={`flex items-center border-b ${borderColor} ${hoverBg} cursor-pointer transition-colors ${
              isFocused ? focusBg : index % 2 === 0 ? bg : ''
            }`}
            style={{ height: rowHeight }}
            onClick={() => onRowClick?.(row, index)}
          >
            {columns.map((col) => (
              <div
                key={col}
                className={`px-3 text-[10px] ${textPrimary} truncate flex-1 min-w-[100px]`}
              >
                {formatCellValue(row[col])}
              </div>
            ))}
          </div>
        )}
      />
    </div>
  );
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
