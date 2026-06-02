/**
 * @file storage-keys.ts
 * @description YYC³便携式智能 AI 系统 - 统一存储键名管理
 * Centralized storage key constants to prevent typos and ensure consistency
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags utils,storage,constants
 */

// ═════════════════════════════════════════════════════
// localStorage Keys - Zustand Stores
// ═════════════════════════════════════════════════════

/** Main app state (UI state, messages, projects, AI models) */
export const APP_STORE_KEY = 'yyc3-storage' as const

/** User settings (editor, shortcuts, agents, MCP, etc.) */
export const SETTINGS_STORE_KEY = 'yyc3-settings' as const

/** Task board data (tasks, reminders, view settings) */
export const TASK_STORE_KEY = 'yyc3-task-board' as const

/** Window manager state (multi-instance windows) */
export const WINDOW_MANAGER_KEY = 'yyc3-window-manager' as const

/** Workspace manager state (workspaces) */
export const WORKSPACE_MANAGER_KEY = 'yyc3-workspace-manager' as const

/** Session manager state (AI sessions) */
export const SESSION_MANAGER_KEY = 'yyc3-session-manager' as const

// ═════════════════════════════════════════════════════
// localStorage Keys - Service Layer
// ═════════════════════════════════════════════════════

/** AI provider configurations and API keys */
export const AI_PROVIDERS_KEY = 'yyc3-ai-providers' as const

/** Plugin registry and plugin-specific data */
export const PLUGINS_KEY = 'yyc3-plugins' as const

/** Plugin data prefix: plugin:${pluginId}:${key} */
export const PLUGIN_DATA_PREFIX = 'plugin:' as const

/** Sync state (pending changes, conflicts) */
export const SYNC_STATE_KEY = 'yyc3-sync-state' as const

/** Clipboard history for quick actions */
export const CLIPBOARD_HISTORY_KEY = 'yyc3-clipboard-history' as const

/** MCP servers configuration */
export const MCP_SERVERS_KEY = 'yyc3-mcp-servers' as const

/** Custom providers configuration */
export const CUSTOM_PROVIDERS_KEY = 'yyc3-custom-providers' as const

/** Provider API keys (legacy, being migrated to AI_PROVIDERS_KEY) */
export const PROVIDER_KEYS_KEY = 'yyc3-provider-api-keys' as const

/** Provider URLs (legacy, being migrated to AI_PROVIDERS_KEY) */
export const PROVIDER_URLS_KEY = 'yyc3-provider-urls' as const

// ═════════════════════════════════════════════════════
// IndexedDB Configuration
// ═════════════════════════════════════════════════════

/** IndexedDB database name */
export const INDEXEDDB_NAME = 'yyc3-ai-code' as const

/** IndexedDB database version */
export const INDEXEDDB_VERSION = 3 as const

/** Object store: Files */
export const FILES_STORE = 'files' as const

/** Object store: File versions */
export const VERSIONS_STORE = 'versions' as const

/** Object store: Preview snapshots */
export const SNAPSHOTS_STORE = 'snapshots' as const

/** Object store: Database connection profiles */
export const DB_PROFILES_STORE = 'dbProfiles' as const

/** Object store: Generic key-value pairs */
export const KEY_VALUE_STORE = 'keyValue' as const

// ═════════════════════════════════════════════════════
// Storage Limits
// ═════════════════════════════════════════════════════

/** Maximum number of chat messages to keep */
export const MAX_MESSAGES = 100 as const

/** Maximum number of clipboard history items */
export const MAX_CLIPBOARD_ITEMS = 50 as const

/** Maximum number of recent projects */
export const MAX_RECENT_PROJECTS = 20 as const

/** Maximum number of saved layouts */
export const MAX_SAVED_LAYOUTS = 10 as const

/** Maximum number of open tabs */
export const MAX_OPEN_TABS = 50 as const

/** Maximum file versions to keep per file */
export const MAX_FILE_VERSIONS = 20 as const

/** Maximum preview snapshots */
export const MAX_SNAPSHOTS = 30 as const

/** LRU cache max size for key-value cache */
export const LRU_CACHE_KV_MAX = 200 as const

/** LRU cache max size for file cache */
export const LRU_CACHE_FILE_MAX = 100 as const

/** LRU cache max size for version cache */
export const LRU_CACHE_VERSION_MAX = 50 as const

/** LRU cache TTL for key-value cache (seconds) */
export const LRU_CACHE_KV_TTL = 300 as const

/** LRU cache TTL for file cache (seconds) */
export const LRU_CACHE_FILE_TTL = 600 as const

/** LRU cache TTL for version cache (seconds) */
export const LRU_CACHE_VERSION_TTL = 120 as const

// ═════════════════════════════════════════════════════
// localStorage Size Limits (Estimates)
// ═════════════════════════════════════════════════════

/** Estimated localStorage limit (5MB) */
export const LOCALSTORAGE_LIMIT = 5 * 1024 * 1024

/** Warning threshold (80% of limit) */
export const LOCALSTORAGE_WARNING_THRESHOLD = 0.8

/** Critical threshold (95% of limit) */
export const LOCALSTORAGE_CRITICAL_THRESHOLD = 0.95 as const

// ═════════════════════════════════════════════════════
// Helper Functions
// ═════════════════════════════════════════════════════

/**
 * Get all storage keys for quick reference
 */
export function getAllStorageKeys(): {
  localStorage: string[]
  indexedDB: { db: string; stores: string[] }
} {
  return {
    localStorage: [
      APP_STORE_KEY,
      SETTINGS_STORE_KEY,
      TASK_STORE_KEY,
      WINDOW_MANAGER_KEY,
      WORKSPACE_MANAGER_KEY,
      SESSION_MANAGER_KEY,
      AI_PROVIDERS_KEY,
      PLUGINS_KEY,
      SYNC_STATE_KEY,
      CLIPBOARD_HISTORY_KEY,
      MCP_SERVERS_KEY,
      CUSTOM_PROVIDERS_KEY,
    ],
    indexedDB: {
      db: INDEXEDDB_NAME,
      stores: [FILES_STORE, VERSIONS_STORE, SNAPSHOTS_STORE, DB_PROFILES_STORE, KEY_VALUE_STORE],
    },
  }
}

/**
 * Check if a key is a valid storage key
 */
export function isValidStorageKey(key: string): boolean {
  const allKeys = getAllStorageKeys()
  return (
    allKeys.localStorage.includes(key) ||
    key.startsWith(PLUGIN_DATA_PREFIX) ||
    key === allKeys.indexedDB.db
  )
}

/**
 * Get plugin-specific storage key
 */
export function getPluginStorageKey(pluginId: string, key: string): string {
  return `${PLUGIN_DATA_PREFIX}${pluginId}:${key}`
}
