/**
 * @file storage-monitor.ts
 * @description YYC³便携式智能 AI 系统 - 存储监控工具
 * Storage monitoring utilities for localStorage and IndexedDB
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags utils,storage,monitoring
 */

import {
  LOCALSTORAGE_LIMIT,
  LOCALSTORAGE_WARNING_THRESHOLD,
  LOCALSTORAGE_CRITICAL_THRESHOLD,
  APP_STORE_KEY,
  SETTINGS_STORE_KEY,
  TASK_STORE_KEY,
  AI_PROVIDERS_KEY,
  PLUGINS_KEY,
  SYNC_STATE_KEY,
  CLIPBOARD_HISTORY_KEY,
} from './storage-keys'

// ═════════════════════════════════════════════════════
// Types
// ═════════════════════════════════════════════════════

export interface StorageUsage {
  used: number
  limit: number
  percent: number
  status: 'normal' | 'warning' | 'critical'
}

export interface StorageBreakdown {
  key: string
  size: number
  percent: number
  itemCount?: number
}

export interface StorageReport {
  total: StorageUsage
  breakdown: StorageBreakdown[]
  timestamp: number
}

export interface CacheStats {
  hits: number
  misses: number
  size: number
  hitRate: number
}

// ═════════════════════════════════════════════════════
// localStorage Monitoring
// ═════════════════════════════════════════════════════

/**
 * Calculate localStorage usage
 */
export function getLocalStorageUsage(): StorageUsage {
  let totalSize = 0
  
  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      // Key length + value length + overhead
      const keySize = key.length * 2 // UTF-16
      const valueSize = localStorage[key].length * 2
      totalSize += keySize + valueSize
    }
  }
  
  const percent = (totalSize / LOCALSTORAGE_LIMIT) * 100
  let status: 'normal' | 'warning' | 'critical' = 'normal'
  
  if (percent >= LOCALSTORAGE_CRITICAL_THRESHOLD * 100) {
    status = 'critical'
  } else if (percent >= LOCALSTORAGE_WARNING_THRESHOLD * 100) {
    status = 'warning'
  }
  
  return {
    used: totalSize,
    limit: LOCALSTORAGE_LIMIT,
    percent,
    status,
  }
}

/**
 * Get breakdown of localStorage usage by key
 */
export function getLocalStorageBreakdown(): StorageBreakdown[] {
  const breakdown: StorageBreakdown[] = []
  let totalSize = 0
  
  // Calculate sizes for known keys
  const knownKeys = [
    APP_STORE_KEY,
    SETTINGS_STORE_KEY,
    TASK_STORE_KEY,
    AI_PROVIDERS_KEY,
    PLUGINS_KEY,
    SYNC_STATE_KEY,
    CLIPBOARD_HISTORY_KEY,
  ]
  
  for (const key of knownKeys) {
    const value = localStorage.getItem(key)
    if (value) {
      const keySize = key.length * 2
      const valueSize = value.length * 2
      const size = keySize + valueSize
      totalSize += size
      
      let itemCount: number | undefined
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) {
          itemCount = parsed.length
        } else if (typeof parsed === 'object') {
          itemCount = Object.keys(parsed).length
        }
      } catch {
        // Ignore parse errors
      }
      
      breakdown.push({
        key,
        size,
        percent: 0, // Will calculate below
        itemCount,
      })
    }
  }
  
  // Calculate percentages
  for (const item of breakdown) {
    item.percent = totalSize > 0 ? (item.size / totalSize) * 100 : 0
  }
  
  // Sort by size (descending)
  breakdown.sort((a, b) => b.size - a.size)
  
  return breakdown
}

/**
 * Get full storage report
 */
export function getStorageReport(): StorageReport {
  return {
    total: getLocalStorageUsage(),
    breakdown: getLocalStorageBreakdown(),
    timestamp: Date.now(),
  }
}

/**
 * Log storage report to console
 */
export function logStorageReport(): void {
  const report = getStorageReport()
  const totalMB = (report.total.used / (1024 * 1024)).toFixed(2)
  const limitMB = (report.total.limit / (1024 * 1024)).toFixed(2)
  
  console.group('📦 Storage Report')
  console.log(`Total: ${totalMB}MB / ${limitMB}MB (${report.total.percent.toFixed(1)}%) - ${report.total.status.toUpperCase()}`)
  console.table(
    report.breakdown.map(item => ({
      Key: item.key,
      Size: `${(item.size / 1024).toFixed(2)}KB`,
      Percent: `${item.percent.toFixed(1)}%`,
      Items: item.itemCount ?? 'N/A',
    }))
  )
  console.groupEnd()
}

// ═════════════════════════════════════════════════════
// IndexedDB Monitoring
// ═════════════════════════════════════════════════════

/**
 * Get IndexedDB size estimate (if supported)
 */
export async function getIndexedDBUsage(): Promise<{ used: number }> {
  // Note: This is a placeholder - actual implementation depends on browser support
  try {
    // Try to use StorageManager API if available
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      return {
        used: estimate.usage || 0,
      }
    }
    
    // Fallback: return 0 if not supported
    return { used: 0 }
  } catch (error) {
    console.warn('Failed to get IndexedDB usage:', error)
    return { used: 0 }
  }
}

// ═════════════════════════════════════════════════════
// Cache Monitoring
// ═════════════════════════════════════════════════════

/**
 * Create cache statistics tracker
 */
export function createCacheStatsTracker() {
  let hits = 0
  let misses = 0
  let size = 0
  
  return {
    recordHit() {
      hits++
    },
    recordMiss() {
      misses++
    },
    setSize(newSize: number) {
      size = newSize
    },
    getStats(): CacheStats {
      const total = hits + misses
      return {
        hits,
        misses,
        size,
        hitRate: total > 0 ? (hits / total) * 100 : 0,
      }
    },
    reset() {
      hits = 0
      misses = 0
      size = 0
    },
  }
}

// ═════════════════════════════════════════════════════
// Storage Health Check
// ═════════════════════════════════════════════════════

export interface StorageHealth {
  status: 'healthy' | 'degraded' | 'critical'
  issues: string[]
  recommendations: string[]
}

/**
 * Check storage health
 */
export function checkStorageHealth(): StorageHealth {
  const usage = getLocalStorageUsage()
  const issues: string[] = []
  const recommendations: string[] = []
  
  let status: 'healthy' | 'degraded' | 'critical' = 'healthy'
  
  // Check overall usage
  if (usage.status === 'critical') {
    status = 'critical'
    issues.push('localStorage usage is critical (>95%)')
    recommendations.push('Clear unused data immediately')
    recommendations.push('Consider migrating large data to IndexedDB')
  } else if (usage.status === 'warning') {
    status = 'degraded'
    issues.push('localStorage usage is high (>80%)')
    recommendations.push('Review and clean up old data')
  }
  
  // Check message count
  try {
    const messages = JSON.parse(localStorage.getItem(APP_STORE_KEY) || '{}')
    const messageCount = messages?.state?.messages?.length || 0
    if (messageCount > 100) {
      issues.push(`High message count: ${messageCount}`)
      recommendations.push('Consider limiting message history to 100 items')
    }
  } catch {
    // Ignore parse errors
  }
  
  // Check clipboard history
  try {
    const clipboard = JSON.parse(localStorage.getItem(CLIPBOARD_HISTORY_KEY) || '[]')
    if (Array.isArray(clipboard) && clipboard.length > 50) {
      issues.push(`Large clipboard history: ${clipboard.length} items`)
      recommendations.push('Limit clipboard history to 50 items')
    }
  } catch {
    // Ignore parse errors
  }
  
  return {
    status,
    issues,
    recommendations,
  }
}

/**
 * Log storage health check
 */
export function logStorageHealth(): void {
  const health = checkStorageHealth()
  
  console.group('🏥 Storage Health Check')
  console.log(`Status: ${health.status.toUpperCase()}`)
  
  if (health.issues.length > 0) {
    console.log('Issues:')
    health.issues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`))
  }
  
  if (health.recommendations.length > 0) {
    console.log('Recommendations:')
    health.recommendations.forEach((rec, i) => console.log(`  ${i + 1}. ${rec}`))
  }
  
  if (health.issues.length === 0) {
    console.log('✅ No issues found')
  }
  
  console.groupEnd()
}

// ═════════════════════════════════════════════════════
// Auto-Monitoring
// ═════════════════════════════════════════════════════

let autoMonitorInterval: number | null = null

/**
 * Start automatic storage monitoring
 */
export function startAutoMonitoring(intervalMs = 60000): void {
  if (autoMonitorInterval) {
    stopAutoMonitoring()
  }
  
  autoMonitorInterval = window.setInterval(() => {
    const health = checkStorageHealth()
    
    if (health.status === 'critical') {
      console.error('🚨 Critical Storage Alert:', health.issues)
    } else if (health.status === 'degraded') {
      console.warn('⚠️ Storage Warning:', health.issues)
    }
  }, intervalMs)
  
  console.log('✅ Auto-monitoring started')
}

/**
 * Stop automatic storage monitoring
 */
export function stopAutoMonitoring(): void {
  if (autoMonitorInterval) {
    window.clearInterval(autoMonitorInterval)
    autoMonitorInterval = null
    console.log('⏹️ Auto-monitoring stopped')
  }
}

// ═════════════════════════════════════════════════════
// Exports
// ═════════════════════════════════════════════════════

export const storageMonitor = {
  // localStorage
  getLocalStorageUsage,
  getLocalStorageBreakdown,
  getStorageReport,
  logStorageReport,
  
  // IndexedDB
  getIndexedDBUsage,
  
  // Cache
  createCacheStatsTracker,
  
  // Health
  checkStorageHealth,
  logStorageHealth,
  
  // Auto-monitoring
  startAutoMonitoring,
  stopAutoMonitoring,
}

export default storageMonitor
