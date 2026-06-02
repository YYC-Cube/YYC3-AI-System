/**
 * @file algorithms.test.ts
 * @description YYC³便携式智能AI系统 - 算法测试
 * Algorithms Tests
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-25
 * @updated 2026-03-25
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,algorithms
 */

import { describe, it, expect, vi } from 'vitest'

// ═════════════════════════════════════════════════════
// Search Algorithms Tests
// ═════════════════════════════════════════════════════

describe('Search Algorithms', () => {
  it('should perform binary search on sorted array', () => {
    const binarySearch = <T,>(arr: T[], target: T): number => {
      let left = 0
      let right = arr.length - 1
      
      while (left <= right) {
        const mid = Math.floor((left + right) / 2)
        const midVal = arr[mid]
        
        if (midVal === target) return mid
        if (midVal < target) left = mid + 1
        else right = mid - 1
      }
      
      return -1
    }
    
    const sortedArr = [1, 3, 5, 7, 9, 11, 13, 15]
    expect(binarySearch(sortedArr, 7)).toBe(3)
    expect(binarySearch(sortedArr, 1)).toBe(0)
    expect(binarySearch(sortedArr, 15)).toBe(7)
    expect(binarySearch(sortedArr, 8)).toBe(-1)
    expect(binarySearch([], 5)).toBe(-1)
  })

  it('should perform linear search', () => {
    const linearSearch = <T,>(arr: T[], target: T): number => {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] === target) return i
      }
      return -1
    }
    
    const arr = [10, 20, 30, 40, 50]
    expect(linearSearch(arr, 30)).toBe(2)
    expect(linearSearch(arr, 10)).toBe(0)
    expect(linearSearch(arr, 50)).toBe(4)
    expect(linearSearch(arr, 25)).toBe(-1)
  })

  it('should search objects by property', () => {
    const searchByProperty = <T, K extends keyof T>(
      arr: T[],
      prop: K,
      value: T[K]
    ): T | null => {
      return arr.find(item => item[prop] === value) || null
    }
    
    const users = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' },
    ]
    
    expect(searchByProperty(users, 'id', 2)).toEqual({ id: 2, name: 'Bob' })
    expect(searchByProperty(users, 'name', 'Alice')).toEqual({ id: 1, name: 'Alice' })
    expect(searchByProperty(users, 'id', 99)).toBeNull()
  })
})

// ═════════════════════════════════════════════════════
// Sorting Algorithms Tests
// ═════════════════════════════════════════════════════

describe('Sorting Algorithms', () => {
  it('should perform bubble sort', () => {
    const bubbleSort = <T,>(arr: T[], compareFn?: (a: T, b: T) => number): T[] => {
      const result = [...arr]
      const n = result.length
      
      for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
          const comparison = compareFn ? compareFn(result[j], result[j + 1]) : 
            (result[j] > result[j + 1] ? 1 : -1)
          if (comparison > 0) {
            [result[j], result[j + 1]] = [result[j + 1], result[j]]
          }
        }
      }
      
      return result
    }
    
    expect(bubbleSort([5, 2, 8, 1, 9])).toEqual([1, 2, 5, 8, 9])
    expect(bubbleSort([3, 2, 1])).toEqual([1, 2, 3])
    expect(bubbleSort([])).toEqual([])
  })

  it('should perform quick sort', () => {
    const quickSort = <T,>(arr: T[], compareFn?: (a: T, b: T) => number): T[] => {
      if (arr.length <= 1) return arr
      
      const pivot = arr[Math.floor(arr.length / 2)]
      const left: T[] = []
      const middle: T[] = []
      const right: T[] = []
      
      for (const item of arr) {
        const comparison = compareFn ? compareFn(item, pivot) : 
          (item > pivot ? 1 : item < pivot ? -1 : 0)
        
        if (comparison < 0) left.push(item)
        else if (comparison > 0) right.push(item)
        else middle.push(item)
      }
      
      return [...quickSort(left, compareFn), ...middle, ...quickSort(right, compareFn)]
    }
    
    expect(quickSort([5, 2, 8, 1, 9])).toEqual([1, 2, 5, 8, 9])
    expect(quickSort([3, 2, 1])).toEqual([1, 2, 3])
    expect(quickSort(['banana', 'apple', 'cherry'])).toEqual(['apple', 'banana', 'cherry'])
  })

  it('should perform merge sort', () => {
    const mergeSort = <T,>(arr: T[], compareFn?: (a: T, b: T) => number): T[] => {
      if (arr.length <= 1) return arr
      
      const mid = Math.floor(arr.length / 2)
      const left = mergeSort(arr.slice(0, mid), compareFn)
      const right = mergeSort(arr.slice(mid), compareFn)
      
      const merged: T[] = []
      let i = 0, j = 0
      
      while (i < left.length && j < right.length) {
        const comparison = compareFn ? compareFn(left[i], right[j]) : 
          (left[i] > right[j] ? 1 : -1)
        
        if (comparison <= 0) merged.push(left[i++])
        else merged.push(right[j++])
      }
      
      return [...merged, ...left.slice(i), ...right.slice(j)]
    }
    
    expect(mergeSort([5, 2, 8, 1, 9])).toEqual([1, 2, 5, 8, 9])
    expect(mergeSort([3, 2, 1])).toEqual([1, 2, 3])
    expect(mergeSort([])).toEqual([])
  })
})

// ═════════════════════════════════════════════════════
// Caching Algorithms Tests
// ═════════════════════════════════════════════════════

describe('Caching Algorithms', () => {
  it('should implement LRU cache', () => {
    class LRUCache<K, V> {
      private capacity: number
      private cache: Map<K, V>
      
      constructor(capacity: number) {
        this.capacity = capacity
        this.cache = new Map()
      }
      
      get(key: K): V | undefined {
        const value = this.cache.get(key)
        if (value !== undefined) {
          this.cache.delete(key)
          this.cache.set(key, value)
        }
        return value
      }
      
      set(key: K, value: V): void {
        if (this.cache.has(key)) {
          this.cache.delete(key)
        } else if (this.cache.size >= this.capacity) {
          const firstKey = this.cache.keys().next().value
          if (firstKey !== undefined) {
            this.cache.delete(firstKey)
          }
        }
        this.cache.set(key, value)
      }
      
      has(key: K): boolean {
        return this.cache.has(key)
      }
      
      size(): number {
        return this.cache.size
      }
    }
    
    const cache = new LRUCache<number, string>(2)
    
    // Test basic operations
    cache.set(1, 'one')
    expect(cache.get(1)).toBe('one')
    expect(cache.has(1)).toBe(true)
    expect(cache.size()).toBe(1)
    
    cache.set(2, 'two')
    expect(cache.get(1)).toBe('one')
    expect(cache.get(2)).toBe('two')
    expect(cache.size()).toBe(2)
    
    // Test eviction
    cache.set(3, 'three')
    expect(cache.size()).toBe(2)
    expect(cache.get(3)).toBe('three')
    expect(cache.has(1)).toBe(false) // Evicted
    expect(cache.has(2)).toBe(true)
    
    // Test LRU update on get
    cache.get(2)
    cache.set(4, 'four')
    expect(cache.has(3)).toBe(false) // Evicted
    expect(cache.has(2)).toBe(true)
    expect(cache.has(4)).toBe(true)
  })

  it('should implement simple memoization', () => {
    const memoize = <T extends (...args: unknown[]) => any>(fn: T): T => {
      const cache = new Map<string, ReturnType<T>>()
      
      return ((...args: unknown[]) => {
        const key = JSON.stringify(args)
        if (cache.has(key)) return cache.get(key)
        
        const result = fn(...args)
        cache.set(key, result)
        return result
      }) as T
    }
    
    let callCount = 0
    const expensiveFn = memoize((x: number, y: number): number => {
      callCount++
      return x + y
    })
    
    expect(expensiveFn(1, 2)).toBe(3)
    expect(callCount).toBe(1)
    
    expect(expensiveFn(1, 2)).toBe(3)
    expect(callCount).toBe(1) // Cached
    
    expect(expensiveFn(2, 3)).toBe(5)
    expect(callCount).toBe(2)
  })
})

// ═════════════════════════════════════════════════════
// Conflict Resolution Algorithms Tests
// ═════════════════════════════════════════════════════

describe('Conflict Resolution Algorithms', () => {
  it('should implement last-write-wins strategy', () => {
    const lastWriteWins = <T,>(local: T, remote: T, timestamp: { local: number; remote: number }): T => {
      return timestamp.remote > timestamp.local ? remote : local
    }
    
    expect(lastWriteWins(
      { value: 'local' },
      { value: 'remote' },
      { local: 100, remote: 200 }
    )).toEqual({ value: 'remote' })
    
    expect(lastWriteWins(
      { value: 'local' },
      { value: 'remote' },
      { local: 200, remote: 100 }
    )).toEqual({ value: 'local' })
  })

  it('should implement merge strategy for objects', () => {
    const deepMerge = <T extends Record<string, any>>(...objects: T[]): T => {
      const result: unknown = {}
      
      for (const obj of objects) {
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            result[key] = deepMerge(result[key] || {}, value)
          } else {
            result[key] = value
          }
        }
      }
      
      return result
    }
    
    const obj1 = { a: 1, b: { x: 1, y: 2 } }
    const obj2: unknown = { b: { y: 3, z: 4 }, c: 3 }
    const obj3: unknown = { d: 4 }
    
    expect(deepMerge(obj1, obj2, obj3)).toEqual({
      a: 1,
      b: { x: 1, y: 3, z: 4 },
      c: 3,
      d: 4,
    })
  })

  it('should implement three-way merge for text', () => {
    const threeWayMerge = (base: string, local: string, remote: string): string => {
      // Simple implementation: prefer remote if local is unchanged
      if (local === base) return remote
      if (remote === base) return local
      
      // Both changed - return local (simplified)
      return local
    }
    
    expect(threeWayMerge('Hello', 'Hello World', 'Hello There')).toBe('Hello World')
    expect(threeWayMerge('Hello', 'Hello', 'Hello There')).toBe('Hello There')
    expect(threeWayMerge('Hello', 'Hello World', 'Hello')).toBe('Hello World')
  })
})

// ═════════════════════════════════════════════════════
// Utility Algorithms Tests
// ═════════════════════════════════════════════════════

describe('Utility Algorithms', () => {
  it('should debounce function calls', () => {
    const debounce = <T extends (...args: unknown[]) => any>(
      fn: T,
      delay: number
    ): T => {
      let timeoutId: NodeJS.Timeout | null = null
      
      return ((...args: unknown[]) => {
        if (timeoutId) clearTimeout(timeoutId)
        timeoutId = setTimeout(() => fn(...args), delay)
      }) as T
    }
    
    vi.useFakeTimers()
    
    let callCount = 0
    const debouncedFn = debounce(() => {
      callCount++
    }, 100)
    
    debouncedFn()
    expect(callCount).toBe(0)
    
    vi.advanceTimersByTime(50)
    expect(callCount).toBe(0)
    
    debouncedFn()
    vi.advanceTimersByTime(100)
    expect(callCount).toBe(1)
    
    vi.useRealTimers()
  })

  it('should throttle function calls', () => {
    const throttle = <T extends (...args: unknown[]) => any>(
      fn: T,
      delay: number
    ): T => {
      let lastCall = 0
      
      return ((...args: unknown[]) => {
        const now = Date.now()
        if (now - lastCall >= delay) {
          lastCall = now
          fn(...args)
        }
      }) as T
    }
    
    vi.useFakeTimers()
    
    let callCount = 0
    const throttledFn = throttle(() => {
      callCount++
    }, 100)
    
    throttledFn()
    expect(callCount).toBe(1)
    
    throttledFn()
    expect(callCount).toBe(1) // Throttled
    
    vi.advanceTimersByTime(100)
    throttledFn()
    expect(callCount).toBe(2)
    
    vi.useRealTimers()
  })

  it('should generate unique IDs', () => {
    const generateId = (): string => {
      return Math.random().toString(36).substr(2, 9)
    }
    
    const ids = new Set()
    for (let i = 0; i < 1000; i++) {
      ids.add(generateId())
    }
    
    expect(ids.size).toBe(1000) // All unique
  })

  it('should deep clone objects', () => {
    const deepClone = <T,>(obj: T): T => {
      if (obj === null || typeof obj !== 'object') return obj
      if (obj instanceof Date) return new Date(obj.getTime()) as unknown
      if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown
      
      const cloned: unknown = {}
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = deepClone(obj[key])
        }
      }
      return cloned
    }
    
    const original = {
      a: 1,
      b: { c: 2, d: [3, 4] },
      e: new Date('2024-01-01'),
    }
    
    const cloned = deepClone(original)
    expect(cloned).toEqual(original)
    expect(cloned).not.toBe(original)
    expect(cloned.b).not.toBe(original.b)
    expect(cloned.b.d).not.toBe(original.b.d)
  })
})
