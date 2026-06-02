/**
 * @file storage-cleanup.ts
 * @description YYC³便携式智能 AI 系统 - localStorage 清理工具
 * Utilities for cleaning up localStorage to prevent overflow
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags utils,storage,cleanup
 */

import {
  APP_STORE_KEY,
  TASK_STORE_KEY,
  CLIPBOARD_HISTORY_KEY,
  MAX_MESSAGES,
  MAX_CLIPBOARD_ITEMS,
  MAX_RECENT_PROJECTS,
  LOCALSTORAGE_WARNING_THRESHOLD,
} from './storage-keys'
import {
  getLocalStorageUsage,
} from './storage-monitor'

// ═════════════════════════════════════════════════════
// Types
// ═════════════════════════════════════════════════════

export interface CleanupResult {
  freedBytes: number
  itemsRemoved: number
  details: CleanupDetail[]
}

export interface CleanupDetail {
  key: string
  action: 'trimmed' | 'cleaned' | 'removed'
  before: number
  after: number
  freedBytes: number
}

// ═════════════════════════════════════════════════════
// Cleanup Functions
// ═════════════════════════════════════════════════════

/**
 * Trim messages to MAX_MESSAGES limit
 */
function trimMessages(): CleanupDetail | null {
  try {
    const data = JSON.parse(localStorage.getItem(APP_STORE_KEY) || '{}')
    const messages = data?.state?.messages || []
    
    if (messages.length <= MAX_MESSAGES) {
      return null
    }
    
    const beforeCount = messages.length
    const kept = messages.slice(-MAX_MESSAGES)
    
    // Update store
    data.state.messages = kept
    localStorage.setItem(APP_STORE_KEY, JSON.stringify(data))
    
    const beforeSize = JSON.stringify(messages).length * 2
    const afterSize = JSON.stringify(kept).length * 2
    
    return {
      key: APP_STORE_KEY,
      action: 'trimmed',
      before: beforeCount,
      after: kept.length,
      freedBytes: beforeSize - afterSize,
    }
  } catch (error) {
    console.warn('Failed to trim messages:', error)
    return null
  }
}

/**
 * Trim clipboard history to MAX_CLIPBOARD_ITEMS limit
 */
function trimClipboardHistory(): CleanupDetail | null {
  try {
    const history = JSON.parse(localStorage.getItem(CLIPBOARD_HISTORY_KEY) || '[]')
    
    if (!Array.isArray(history) || history.length <= MAX_CLIPBOARD_ITEMS) {
      return null
    }
    
    const beforeCount = history.length
    const kept = history.slice(-MAX_CLIPBOARD_ITEMS)
    
    localStorage.setItem(CLIPBOARD_HISTORY_KEY, JSON.stringify(kept))
    
    const beforeSize = JSON.stringify(history).length * 2
    const afterSize = JSON.stringify(kept).length * 2
    
    return {
      key: CLIPBOARD_HISTORY_KEY,
      action: 'trimmed',
      before: beforeCount,
      after: kept.length,
      freedBytes: beforeSize - afterSize,
    }
  } catch (error) {
    console.warn('Failed to trim clipboard history:', error)
    return null
  }
}

/**
 * Trim recent projects to MAX_RECENT_PROJECTS limit
 */
function trimRecentProjects(): CleanupDetail | null {
  try {
    const data = JSON.parse(localStorage.getItem(APP_STORE_KEY) || '{}')
    const projects = data?.state?.recentProjects || []
    
    if (projects.length <= MAX_RECENT_PROJECTS) {
      return null
    }
    
    const beforeCount = projects.length
    const kept = projects.slice(-MAX_RECENT_PROJECTS)
    
    data.state.recentProjects = kept
    localStorage.setItem(APP_STORE_KEY, JSON.stringify(data))
    
    const beforeSize = JSON.stringify(projects).length * 2
    const afterSize = JSON.stringify(kept).length * 2
    
    return {
      key: APP_STORE_KEY,
      action: 'trimmed',
      before: beforeCount,
      after: kept.length,
      freedBytes: beforeSize - afterSize,
    }
  } catch (error) {
    console.warn('Failed to trim recent projects:', error)
    return null
  }
}

/**
 * Remove corrupted JSON entries
 */
function removeCorruptedEntries(): CleanupDetail | null {
  const corruptedKeys: string[] = []
  
  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
      const value = localStorage[key]
      if (value.startsWith('{') || value.startsWith('[')) {
        try {
          JSON.parse(value)
        } catch {
          corruptedKeys.push(key)
        }
      }
    }
  }
  
  if (corruptedKeys.length === 0) {
    return null
  }
  
  let freedBytes = 0
  for (const key of corruptedKeys) {
    freedBytes += (key.length + localStorage[key].length) * 2
    localStorage.removeItem(key)
  }
  
  return {
    key: 'multiple',
    action: 'removed',
    before: corruptedKeys.length,
    after: 0,
    freedBytes,
  }
}

/**
 * Remove old/unused keys (legacy keys)
 */
function removeLegacyKeys(): CleanupDetail | null {
  const legacyKeys = [
    'yyc3-provider-api-keys', // Migrated to yyc3-ai-providers
    'yyc3-provider-urls',     // Migrated to yyc3-ai-providers
  ]
  
  const foundLegacyKeys: string[] = []
  let freedBytes = 0
  
  for (const key of legacyKeys) {
    if (localStorage.getItem(key)) {
      foundLegacyKeys.push(key)
      freedBytes += (key.length + (localStorage.getItem(key)?.length || 0)) * 2
      localStorage.removeItem(key)
    }
  }
  
  if (foundLegacyKeys.length === 0) {
    return null
  }
  
  return {
    key: 'multiple',
    action: 'removed',
    before: foundLegacyKeys.length,
    after: 0,
    freedBytes,
  }
}

// ═════════════════════════════════════════════════════
// Main Cleanup API
// ═════════════════════════════════════════════════════

export interface CleanupOptions {
  trimMessages?: boolean
  trimClipboard?: boolean
  trimProjects?: boolean
  removeCorrupted?: boolean
  removeLegacy?: boolean
  aggressive?: boolean // Remove everything non-essential
}

/**
 * Perform storage cleanup
 */
export function cleanupStorage(options: CleanupOptions = {}): CleanupResult {
  const defaults: CleanupOptions = {
    trimMessages: true,
    trimClipboard: true,
    trimProjects: true,
    removeCorrupted: true,
    removeLegacy: true,
    aggressive: false,
  }
  
  const opts = { ...defaults, ...options }
  const details: CleanupDetail[] = []
  let totalFreed = 0
  let totalItemsRemoved = 0
  
  // Trim messages
  if (opts.trimMessages) {
    const result = trimMessages()
    if (result) {
      details.push(result)
      totalFreed += result.freedBytes
      totalItemsRemoved += result.before - result.after
    }
  }
  
  // Trim clipboard history
  if (opts.trimClipboard) {
    const result = trimClipboardHistory()
    if (result) {
      details.push(result)
      totalFreed += result.freedBytes
      totalItemsRemoved += result.before - result.after
    }
  }
  
  // Trim recent projects
  if (opts.trimProjects) {
    const result = trimRecentProjects()
    if (result) {
      details.push(result)
      totalFreed += result.freedBytes
      totalItemsRemoved += result.before - result.after
    }
  }
  
  // Remove corrupted entries
  if (opts.removeCorrupted) {
    const result = removeCorruptedEntries()
    if (result) {
      details.push(result)
      totalFreed += result.freedBytes
      totalItemsRemoved += result.before
    }
  }
  
  // Remove legacy keys
  if (opts.removeLegacy) {
    const result = removeLegacyKeys()
    if (result) {
      details.push(result)
      totalFreed += result.freedBytes
      totalItemsRemoved += result.before
    }
  }
  
  // Aggressive mode: remove all non-essential data
  if (opts.aggressive) {
    // Clear task store (optional - user might want to keep tasks)
    try {
      localStorage.removeItem(TASK_STORE_KEY)
      const taskStoreSize = (TASK_STORE_KEY.length + (localStorage.getItem(TASK_STORE_KEY)?.length || 0)) * 2
      details.push({
        key: TASK_STORE_KEY,
        action: 'removed',
        before: 1,
        after: 0,
        freedBytes: taskStoreSize,
      })
      totalFreed += taskStoreSize
      totalItemsRemoved += 1
    } catch {
      // Ignore
    }
  }
  
  return {
    freedBytes: totalFreed,
    itemsRemoved: totalItemsRemoved,
    details,
  }
}

/**
 * Auto cleanup when storage is near capacity
 */
export function autoCleanupIfNeeded(): CleanupResult | null {
  const usage = getLocalStorageUsage()
  
  // Only cleanup if above warning threshold
  if (usage.percent < LOCALSTORAGE_WARNING_THRESHOLD * 100) {
    return null
  }
  
  console.log(`🧹 Auto-cleanup triggered (${usage.percent.toFixed(1)}% capacity)`)
  return cleanupStorage()
}

/**
 * Get cleanup preview (what would be cleaned)
 */
export function getCleanupPreview(): {
  canTrimMessages: boolean
  canTrimClipboard: boolean
  canTrimProjects: boolean
  corruptedCount: number
  legacyCount: number
  estimatedFreedBytes: number
} {
  let estimatedFreedBytes = 0
  
  // Check messages
  const messages = JSON.parse(localStorage.getItem(APP_STORE_KEY) || '{}')?.state?.messages || []
  const canTrimMessages = messages.length > MAX_MESSAGES
  if (canTrimMessages) {
    const toRemove = messages.length - MAX_MESSAGES
    estimatedFreedBytes += JSON.stringify(messages.slice(0, toRemove)).length * 2
  }
  
  // Check clipboard
  const clipboard = JSON.parse(localStorage.getItem(CLIPBOARD_HISTORY_KEY) || '[]')
  const canTrimClipboard = Array.isArray(clipboard) && clipboard.length > MAX_CLIPBOARD_ITEMS
  if (canTrimClipboard) {
    const toRemove = clipboard.length - MAX_CLIPBOARD_ITEMS
    estimatedFreedBytes += JSON.stringify(clipboard.slice(0, toRemove)).length * 2
  }
  
  // Check projects
  const projects = JSON.parse(localStorage.getItem(APP_STORE_KEY) || '{}')?.state?.recentProjects || []
  const canTrimProjects = projects.length > MAX_RECENT_PROJECTS
  if (canTrimProjects) {
    const toRemove = projects.length - MAX_RECENT_PROJECTS
    estimatedFreedBytes += JSON.stringify(projects.slice(0, toRemove)).length * 2
  }
  
  // Check corrupted
  let corruptedCount = 0
  for (const key in localStorage) {
    const value = localStorage[key]
    if ((value.startsWith('{') || value.startsWith('['))) {
      try {
        JSON.parse(value)
      } catch {
        corruptedCount++
      }
    }
  }
  
  // Check legacy
  const legacyKeys = ['yyc3-provider-api-keys', 'yyc3-provider-urls']
  const legacyCount = legacyKeys.filter(key => localStorage.getItem(key)).length
  
  return {
    canTrimMessages,
    canTrimClipboard,
    canTrimProjects,
    corruptedCount,
    legacyCount,
    estimatedFreedBytes,
  }
}

/**
 * Log cleanup result
 */
export function logCleanupResult(result: CleanupResult): void {
  console.group('🧹 Storage Cleanup Result')
  console.log(`Freed: ${(result.freedBytes / 1024).toFixed(2)}KB`)
  console.log(`Items removed: ${result.itemsRemoved}`)
  
  if (result.details.length > 0) {
    console.table(
      result.details.map(d => ({
        Key: d.key,
        Action: d.action,
        Before: d.before,
        After: d.after,
        Freed: `${(d.freedBytes / 1024).toFixed(2)}KB`,
      }))
    )
  }
  
  console.groupEnd()
}

// ═════════════════════════════════════════════════════
// Exports
// ═════════════════════════════════════════════════════

export const storageCleanup = {
  cleanup: cleanupStorage,
  autoCleanupIfNeeded,
  getPreview: getCleanupPreview,
  logResult: logCleanupResult,
}

export default storageCleanup
