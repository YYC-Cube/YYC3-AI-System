/**
 * @file storage-keys.test.ts
 * @description YYC³便携式智能AI系统 - 存储键常量测试
 * Storage Keys Test
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-24
 * @updated 2026-03-24
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,utils,storage,constants
 */

import {
  APP_STORE_KEY,
  SETTINGS_STORE_KEY,
  TASK_STORE_KEY,
  WINDOW_MANAGER_KEY,
  WORKSPACE_MANAGER_KEY,
  SESSION_MANAGER_KEY,
  AI_PROVIDERS_KEY,
  PLUGINS_KEY,
  PLUGIN_DATA_PREFIX,
  SYNC_STATE_KEY,
  CLIPBOARD_HISTORY_KEY,
  MCP_SERVERS_KEY,
  CUSTOM_PROVIDERS_KEY,
  PROVIDER_KEYS_KEY,
  PROVIDER_URLS_KEY,
  INDEXEDDB_NAME,
  INDEXEDDB_VERSION,
  FILES_STORE,
  VERSIONS_STORE,
  SNAPSHOTS_STORE,
  DB_PROFILES_STORE,
  KEY_VALUE_STORE,
  MAX_MESSAGES,
  MAX_CLIPBOARD_ITEMS,
  MAX_RECENT_PROJECTS,
  MAX_SAVED_LAYOUTS,
  MAX_OPEN_TABS,
  MAX_FILE_VERSIONS,
  MAX_SNAPSHOTS,
} from '../../app/utils/storage-keys'

describe('Storage Keys - Zustand Store Keys', () => {
  test('APP_STORE_KEY should be defined and unique', () => {
    expect(APP_STORE_KEY).toBe('yyc3-storage')
    expect(typeof APP_STORE_KEY).toBe('string')
  })

  test('SETTINGS_STORE_KEY should be defined and unique', () => {
    expect(SETTINGS_STORE_KEY).toBe('yyc3-settings')
    expect(typeof SETTINGS_STORE_KEY).toBe('string')
    expect(SETTINGS_STORE_KEY).not.toBe(APP_STORE_KEY)
  })

  test('TASK_STORE_KEY should be defined and unique', () => {
    expect(TASK_STORE_KEY).toBe('yyc3-task-board')
    expect(typeof TASK_STORE_KEY).toBe('string')
    expect(TASK_STORE_KEY).not.toBe(APP_STORE_KEY)
    expect(TASK_STORE_KEY).not.toBe(SETTINGS_STORE_KEY)
  })

  test('WINDOW_MANAGER_KEY should be defined', () => {
    expect(WINDOW_MANAGER_KEY).toBe('yyc3-window-manager')
    expect(typeof WINDOW_MANAGER_KEY).toBe('string')
  })

  test('WORKSPACE_MANAGER_KEY should be defined', () => {
    expect(WORKSPACE_MANAGER_KEY).toBe('yyc3-workspace-manager')
    expect(typeof WORKSPACE_MANAGER_KEY).toBe('string')
  })

  test('SESSION_MANAGER_KEY should be defined', () => {
    expect(SESSION_MANAGER_KEY).toBe('yyc3-session-manager')
    expect(typeof SESSION_MANAGER_KEY).toBe('string')
  })
})

describe('Storage Keys - Service Layer Keys', () => {
  test('AI_PROVIDERS_KEY should be defined', () => {
    expect(AI_PROVIDERS_KEY).toBe('yyc3-ai-providers')
    expect(typeof AI_PROVIDERS_KEY).toBe('string')
  })

  test('PLUGINS_KEY should be defined', () => {
    expect(PLUGINS_KEY).toBe('yyc3-plugins')
    expect(typeof PLUGINS_KEY).toBe('string')
  })

  test('PLUGIN_DATA_PREFIX should be a valid prefix', () => {
    expect(PLUGIN_DATA_PREFIX).toBe('plugin:')
    expect(typeof PLUGIN_DATA_PREFIX).toBe('string')
    expect(PLUGIN_DATA_PREFIX.endsWith(':')).toBe(true)
  })

  test('SYNC_STATE_KEY should be defined', () => {
    expect(SYNC_STATE_KEY).toBe('yyc3-sync-state')
    expect(typeof SYNC_STATE_KEY).toBe('string')
  })

  test('CLIPBOARD_HISTORY_KEY should be defined', () => {
    expect(CLIPBOARD_HISTORY_KEY).toBe('yyc3-clipboard-history')
    expect(typeof CLIPBOARD_HISTORY_KEY).toBe('string')
  })

  test('MCP_SERVERS_KEY should be defined', () => {
    expect(MCP_SERVERS_KEY).toBe('yyc3-mcp-servers')
    expect(typeof MCP_SERVERS_KEY).toBe('string')
  })

  test('CUSTOM_PROVIDERS_KEY should be defined', () => {
    expect(CUSTOM_PROVIDERS_KEY).toBe('yyc3-custom-providers')
    expect(typeof CUSTOM_PROVIDERS_KEY).toBe('string')
  })

  test('Legacy provider keys should be defined', () => {
    expect(PROVIDER_KEYS_KEY).toBe('yyc3-provider-api-keys')
    expect(PROVIDER_URLS_KEY).toBe('yyc3-provider-urls')
    expect(typeof PROVIDER_KEYS_KEY).toBe('string')
    expect(typeof PROVIDER_URLS_KEY).toBe('string')
  })
})

describe('Storage Keys - IndexedDB Configuration', () => {
  test('INDEXEDDB_NAME should be defined', () => {
    expect(INDEXEDDB_NAME).toBe('yyc3-ai-code')
    expect(typeof INDEXEDDB_NAME).toBe('string')
  })

  test('INDEXEDDB_VERSION should be a number', () => {
    expect(INDEXEDDB_VERSION).toBe(3)
    expect(typeof INDEXEDDB_VERSION).toBe('number')
    expect(INDEXEDDB_VERSION).toBeGreaterThan(0)
  })

  test('Object store names should be defined', () => {
    expect(FILES_STORE).toBe('files')
    expect(VERSIONS_STORE).toBe('versions')
    expect(SNAPSHOTS_STORE).toBe('snapshots')
    expect(DB_PROFILES_STORE).toBe('dbProfiles')
    expect(KEY_VALUE_STORE).toBe('keyValue')

    expect(typeof FILES_STORE).toBe('string')
    expect(typeof VERSIONS_STORE).toBe('string')
    expect(typeof SNAPSHOTS_STORE).toBe('string')
    expect(typeof DB_PROFILES_STORE).toBe('string')
    expect(typeof KEY_VALUE_STORE).toBe('string')
  })

  test('Object store names should be unique', () => {
    const stores = [FILES_STORE, VERSIONS_STORE, SNAPSHOTS_STORE, DB_PROFILES_STORE, KEY_VALUE_STORE]
    const uniqueStores = new Set(stores)
    expect(stores.length).toBe(uniqueStores.size)
  })
})

describe('Storage Keys - Storage Limits', () => {
  test('MAX_MESSAGES should be a reasonable number', () => {
    expect(MAX_MESSAGES).toBe(100)
    expect(typeof MAX_MESSAGES).toBe('number')
    expect(MAX_MESSAGES).toBeGreaterThan(0)
    expect(MAX_MESSAGES).toBeLessThan(10000)
  })

  test('MAX_CLIPBOARD_ITEMS should be defined', () => {
    expect(typeof MAX_CLIPBOARD_ITEMS).toBe('number')
    expect(MAX_CLIPBOARD_ITEMS).toBeGreaterThan(0)
  })

  test('MAX_RECENT_PROJECTS should be defined', () => {
    expect(typeof MAX_RECENT_PROJECTS).toBe('number')
    expect(MAX_RECENT_PROJECTS).toBeGreaterThan(0)
  })

  test('MAX_SAVED_LAYOUTS should be defined', () => {
    expect(typeof MAX_SAVED_LAYOUTS).toBe('number')
    expect(MAX_SAVED_LAYOUTS).toBeGreaterThan(0)
  })

  test('MAX_OPEN_TABS should be defined', () => {
    expect(typeof MAX_OPEN_TABS).toBe('number')
    expect(MAX_OPEN_TABS).toBeGreaterThan(0)
  })

  test('MAX_FILE_VERSIONS should be defined', () => {
    expect(typeof MAX_FILE_VERSIONS).toBe('number')
    expect(MAX_FILE_VERSIONS).toBeGreaterThan(0)
  })

  test('MAX_SNAPSHOTS should be defined', () => {
    expect(typeof MAX_SNAPSHOTS).toBe('number')
    expect(MAX_SNAPSHOTS).toBeGreaterThan(0)
  })
})

describe('Storage Keys - Key Validation', () => {
  test('All store keys should start with yyc3 prefix', () => {
    const storeKeys = [
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
      PROVIDER_KEYS_KEY,
      PROVIDER_URLS_KEY,
    ]

    storeKeys.forEach(key => {
      expect(key).toMatch(/^yyc3-/)
    })
  })

  test('Keys should not contain spaces', () => {
    const keys = [
      APP_STORE_KEY,
      SETTINGS_STORE_KEY,
      TASK_STORE_KEY,
      AI_PROVIDERS_KEY,
      PLUGINS_KEY,
      SYNC_STATE_KEY,
    ]

    keys.forEach(key => {
      expect(key).not.toMatch(/\s/)
    })
  })

  test('Keys should be lowercase with hyphens', () => {
    const keys = [
      APP_STORE_KEY,
      SETTINGS_STORE_KEY,
      TASK_STORE_KEY,
    ]

    keys.forEach(key => {
      expect(key).toMatch(/^[a-z0-9-]+$/)
    })
  })
})

describe('Storage Keys - Consistency', () => {
  test('Related keys should follow naming conventions', () => {
    expect(PROVIDER_KEYS_KEY).toContain('provider')
    expect(PROVIDER_URLS_KEY).toContain('provider')
    expect(AI_PROVIDERS_KEY).toContain('providers')
  })

  test('Plugin-related keys should be consistent', () => {
    expect(PLUGINS_KEY).toContain('plugins')
    expect(PLUGIN_DATA_PREFIX).toContain('plugin')
  })

  test('Storage limits should have consistent units', () => {
    expect(MAX_MESSAGES).toBeGreaterThan(0)
    expect(MAX_CLIPBOARD_ITEMS).toBeGreaterThan(0)
    expect(MAX_RECENT_PROJECTS).toBeGreaterThan(0)
    expect(MAX_MESSAGES).toBeGreaterThan(MAX_CLIPBOARD_ITEMS)
  })
})
