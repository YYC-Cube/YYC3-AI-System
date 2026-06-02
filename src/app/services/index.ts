/**
 * @file index.ts
 * @description YYC³便携式智能AI系统 - 服务层入口点
 * Service Layer Entry Point
 * Re-exports all service singletons for unified import.
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-19
 * @updated 2026-03-19
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,entry,export
 */

export { aiProviderService, AIProviderService, PRESET_PROVIDERS } from './ai-provider';
export { mcpService } from './mcp-service';
export { storageService, StorageService } from './storage-service';
export { syncService, SyncService } from './sync-service';
export type { SyncStatus, SyncConflict } from './sync-service';
export { useAIProvider, useStorage, useSync, useFileVersions, usePreviewSnapshots } from './hooks';
export { pluginRuntime, PluginRuntime } from './plugin-runtime';
export type { PluginAPI } from './plugin-runtime';
export { dbService, DBService } from './db-service';
export type { DetectedEngine } from './db-service';
export {
  indexManager,
  queryCache,
  queryAnalyzer,
  slowQueryMonitor,
  batchOperation,
} from './query-optimizer';
export type {
  IndexConfig,
  IndexStats,
  QueryAnalysis,
  QueryRecommendation,
  SlowQuery,
  CacheStats,
  BatchInsertOptions,
} from './query-optimizer';
export {
  quickActionsService,
  QuickActionsService,
  QUICK_ACTIONS,
  getClipboardHistory,
  clearClipboardHistory,
} from './quick-actions';
export type {
  QuickAction,
  ActionContext,
  ActionResult,
  ClipboardHistoryItem,
  ActionCategory,
  ActionType,
} from './quick-actions';
export { useTaskStore } from './task-store';
export type { Task, SubTask, TaskStatus, TaskPriority, TaskType, Reminder } from './task-store';
export { taskInferenceEngine } from './task-inference';
export type { TaskInference } from './task-inference';
export { reminderService } from './task-reminder';
export { taskActionsService } from './task-actions';
export { aiTaskIntegration } from './task-ai-integration';
export { mvpService } from './mvp-service';
export { previewSandbox } from './preview-sandbox';
export { deviceSimulator, DEVICE_PRESETS } from './device-simulator';

// ── Local-First additions ──
export { opfsStorage, OPFSStorageService } from './opfs-storage';
export type { StorageQuota } from './opfs-storage';
export { RECOMMENDATION_ORDER } from './ai-provider';
