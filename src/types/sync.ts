/**
 * @file sync.ts
 * @description YYC³便携式智能AI系统 - 同步相关类型定义
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags types,sync,offline,conflict
 */

/**
 * 同步操作类型
 */
export enum SyncOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
}

/**
 * 同步操作优先级
 */
export enum SyncPriority {
  CRITICAL = 'critical', // 关键操作，需要立即同步
  HIGH = 'high', // 高优先级
  NORMAL = 'normal', // 普通优先级
  LOW = 'low', // 低优先级
}

/**
 * 同步操作状态
 */
export enum SyncOperationStatus {
  PENDING = 'pending', // 待同步
  SYNCING = 'syncing', // 同步中
  SUCCESS = 'success', // 同步成功
  FAILED = 'failed', // 同步失败
  CONFLICT = 'conflict', // 冲突待解决
  CANCELLED = 'cancelled', // 已取消
}

/**
 * 同步操作
 */
export interface SyncOperation {
  /** 操作ID */
  id: string;
  /** 操作类型 */
  type: SyncOperationType;
  /** 优先级 */
  priority: SyncPriority;
  /** 状态 */
  status: SyncOperationStatus;
  /** 资源类型 */
  resourceType: string;
  /** 资源ID */
  resourceId: string;
  /** 本地数据 */
  localData: Record<string, unknown>;
  /** 服务器数据（冲突时） */
  serverData?: Record<string, unknown>;
  /** 操作时间 */
  timestamp: number;
  /** 重试次数 */
  retryCount: number;
  /** 最大重试次数 */
  maxRetries: number;
  /** 错误信息 */
  error?: string;
  /** 是否需要用户确认 */
  requiresConfirmation: boolean;
  /** 用户决策（解决冲突时） */
  userDecision?: 'local' | 'server' | 'merge';
}

/**
 * 冲突类型
 */
export enum ConflictType {
  VERSION = 'version', // 版本冲突
  CONTENT = 'content', // 内容冲突
  DELETE_CONFLICT = 'delete', // 删除冲突
  CONCURRENT_EDIT = 'concurrent', // 并发编辑
  REFERENCE = 'reference', // 引用冲突
}

/**
 * 冲突信息
 */
export interface ConflictInfo {
  /** 冲突ID */
  id: string;
  /** 冲突类型 */
  type: ConflictType;
  /** 资源类型 */
  resourceType: string;
  /** 资源ID */
  resourceId: string;
  /** 本地版本 */
  localVersion: {
    id: string;
    version: number;
    timestamp: number;
    data: Record<string, unknown>;
  };
  /** 服务器版本 */
  serverVersion: {
    id: string;
    version: number;
    timestamp: number;
    data: Record<string, unknown>;
  };
  /** 冲突描述 */
  description: string;
  /** 建议的解决方案 */
  suggestedResolution: 'local' | 'server' | 'merge';
  /** 是否自动解决 */
  autoResolve: boolean;
}

/**
 * 同步状态
 */
export interface SyncStatus {
  /** 是否在线 */
  isOnline: boolean;
  /** 是否正在同步 */
  isSyncing: boolean;
  /** 待同步操作数量 */
  pendingCount: number;
  /** 同步失败数量 */
  failedCount: number;
  /** 冲突数量 */
  conflictCount: number;
  /** 最后同步时间 */
  lastSyncTime: number;
  /** 下次同步时间 */
  nextSyncTime: number;
}

/**
 * 同步配置
 */
export interface SyncConfig {
  /** 是否自动同步 */
  autoSync: boolean;
  /** 同步间隔（毫秒） */
  syncInterval: number;
  /** 最大并发同步数 */
  maxConcurrentSyncs: number;
  /** 同步超时时间（毫秒） */
  syncTimeout: number;
  /** 是否在后台同步 */
  syncInBackground: boolean;
  /** 优先级权重 */
  priorityWeights: {
    [key in SyncPriority]: number;
  };
}

/**
 * 同步统计
 */
export interface SyncStatistics {
  /** 总同步次数 */
  totalSyncs: number;
  /** 成功次数 */
  successCount: number;
  /** 失败次数 */
  failureCount: number;
  /** 冲突次数 */
  conflictCount: number;
  /** 平均同步时间（毫秒） */
  averageSyncTime: number;
  /** 最后同步时间 */
  lastSyncTime: number;
  /** 待同步操作数 */
  pendingOperations: number;
}

/**
 * 同步事件
 */
export enum SyncEventType {
  SYNC_START = 'sync_start',
  SYNC_PROGRESS = 'sync_progress',
  SYNC_COMPLETE = 'sync_complete',
  SYNC_ERROR = 'sync_error',
  CONFLICT_DETECTED = 'conflict_detected',
  CONFLICT_RESOLVED = 'conflict_resolved',
  OPERATION_QUEUED = 'operation_queued',
  OPERATION_STARTED = 'operation_started',
  OPERATION_COMPLETED = 'operation_completed',
  OPERATION_FAILED = 'operation_failed',
  ONLINE_STATUS_CHANGED = 'online_status_changed',
}

/**
 * 同步事件数据
 */
export interface SyncEventData {
  type: SyncEventType;
  timestamp: number;
  data?: Record<string, unknown>;
}

/**
 * 同步队列项
 */
export interface SyncQueueItem {
  /** 操作 */
  operation: SyncOperation;
  /** 依赖的操作ID列表 */
  dependencies: string[];
  /** 估算的同步时间（毫秒） */
  estimatedTime: number;
}
