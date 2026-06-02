/**
 * @file sync-manager-service.ts
 * @description YYC³便携式智能AI系统 - 同步管理服务
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,sync,manager,offline,critical
 */

import { SyncEventType } from '../types/sync';
import type {
  SyncOperation,
  SyncStatus,
  SyncConfig,
  SyncStatistics,
  SyncEventData,
} from '../types/sync';

import { SyncQueueService } from './sync-queue-service';

/**
 * 同步管理器服务类
 * 管理在线检测、自动同步和冲突解决
 */
export class SyncManagerService {
  private static instance: SyncManagerService;
  private queueService: SyncQueueService;

  private isOnline = false;
  private isSyncing = false;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private eventListeners: Map<SyncEventType, Set<(data: SyncEventData) => void>> = new Map();

  // 同步配置
  private config: SyncConfig = {
    autoSync: true,
    syncInterval: 5 * 60 * 1000, // 5分钟
    maxConcurrentSyncs: 3,
    syncTimeout: 30 * 1000, // 30秒
    syncInBackground: true,
    priorityWeights: {
      critical: 4,
      high: 3,
      normal: 2,
      low: 1,
    },
  };

  // 同步统计
  private statistics: SyncStatistics = {
    totalSyncs: 0,
    successCount: 0,
    failureCount: 0,
    conflictCount: 0,
    averageSyncTime: 0,
    lastSyncTime: 0,
    pendingOperations: 0,
  };

  private constructor() {
    this.queueService = SyncQueueService.getInstance();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): SyncManagerService {
    if (!SyncManagerService.instance) {
      SyncManagerService.instance = new SyncManagerService();
    }
    return SyncManagerService.instance;
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    try {
      // 初始化队列服务
      await this.queueService.initialize();

      // 初始化在线状态
      this.isOnline = navigator.onLine;

      // 监听在线状态变化
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));

      // 如果配置了自动同步，启动同步定时器
      if (this.config.autoSync && this.isOnline) {
        this.startAutoSync();
      }

      console.log('[SyncManagerService] 初始化成功');
    } catch (error) {
      console.error('[SyncManagerService] 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };

    // 如果自动同步配置变化，重新启动
    if (config.autoSync !== undefined) {
      if (config.autoSync && this.isOnline) {
        this.startAutoSync();
      } else {
        this.stopAutoSync();
      }
    }

    console.log('[SyncManagerService] 配置已更新:', this.config);
  }

  /**
   * 获取配置
   */
  getConfig(): SyncConfig {
    return { ...this.config };
  }

  /**
   * 处理上线事件
   */
  private handleOnline(): void {
    console.log('[SyncManagerService] 设备已上线');
    this.isOnline = true;
    this.emitEvent(SyncEventType.ONLINE_STATUS_CHANGED, { isOnline: true });

    // 立即开始同步
    if (this.config.autoSync) {
      this.startAutoSync();
      this.syncNow();
    }
  }

  /**
   * 处理离线事件
   */
  private handleOffline(): void {
    console.log('[SyncManagerService] 设备已离线');
    this.isOnline = false;
    this.emitEvent(SyncEventType.ONLINE_STATUS_CHANGED, { isOnline: false });

    // 停止同步
    this.stopAutoSync();
  }

  /**
   * 启动自动同步
   */
  private startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncNow();
      }
    }, this.config.syncInterval);

    console.log(`[SyncManagerService] 自动同步已启动，间隔 ${this.config.syncInterval / 1000} 秒`);
  }

  /**
   * 停止自动同步
   */
  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    console.log('[SyncManagerService] 自动同步已停止');
  }

  /**
   * 立即同步
   */
  async syncNow(): Promise<void> {
    if (this.isSyncing) {
      console.warn('[SyncManagerService] 同步正在进行中');
      return;
    }

    if (!this.isOnline) {
      console.warn('[SyncManagerService] 设备离线，无法同步');
      return;
    }

    const startTime = Date.now();
    this.isSyncing = true;
    this.emitEvent(SyncEventType.SYNC_START, { timestamp: startTime });

    try {
      // 获取待同步操作
      const operations = this.queueService.getConcurrentOperations(this.config.maxConcurrentSyncs);

      if (operations.length === 0) {
        console.log('[SyncManagerService] 没有待同步的操作');
        return;
      }

      console.log(`[SyncManagerService] 开始同步 ${operations.length} 个操作`);

      // 并发执行同步操作
      const syncPromises = operations.map((op) => this.syncOperation(op));
      await Promise.all(syncPromises);

      const syncTime = Date.now() - startTime;

      // 更新统计
      this.statistics.totalSyncs++;
      this.statistics.lastSyncTime = Date.now();
      this.statistics.averageSyncTime =
        (this.statistics.averageSyncTime * (this.statistics.totalSyncs - 1) + syncTime) /
        this.statistics.totalSyncs;
      this.statistics.pendingOperations = this.queueService.getPendingOperations().length;

      this.emitEvent(SyncEventType.SYNC_COMPLETE, {
        timestamp: Date.now(),
        operationsCount: operations.length,
        syncTime,
      });

      console.log(`[SyncManagerService] 同步完成，耗时 ${syncTime}ms`);
    } catch (error) {
      console.error('[SyncManagerService] 同步失败:', error);
      this.statistics.failureCount++;
      this.emitEvent(SyncEventType.SYNC_ERROR, {
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 同步单个操作
   */
  private async syncOperation(operation: SyncOperation): Promise<void> {
    try {
      // 标记为同步中
      await this.queueService.markAsSyncing(operation.id);
      this.emitEvent(SyncEventType.OPERATION_STARTED, { operationId: operation.id });

      // 根据操作类型执行同步
      let result: Response | null = null;
      switch (operation.type) {
        case 'create':
          result = await this.syncCreate(operation);
          break;
        case 'update':
          result = await this.syncUpdate(operation);
          break;
        case 'delete':
          result = await this.syncDelete(operation);
          break;
        default:
          throw new Error(`不支持的操作类型: ${operation.type}`);
      }

      // 检查响应状态
      if (result && result.ok) {
        await this.queueService.markAsSuccess(operation.id);
        this.statistics.successCount++;
        this.emitEvent(SyncEventType.OPERATION_COMPLETED, { operationId: operation.id });
      } else if (result && result.status === 409) {
        // 冲突
        const serverData = await result.json().catch(() => ({}));
        await this.queueService.markAsConflict(operation.id, serverData);
        this.statistics.conflictCount++;
        this.emitEvent(SyncEventType.CONFLICT_DETECTED, {
          operationId: operation.id,
          resourceType: operation.resourceType,
          resourceId: operation.resourceId,
        });
      } else {
        throw new Error(`同步失败: ${result?.status || 'Unknown error'}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.queueService.markAsFailed(operation.id, errorMessage);
      this.emitEvent(SyncEventType.OPERATION_FAILED, {
        operationId: operation.id,
        error: errorMessage,
      });
      console.error(`[SyncManagerService] 同步操作失败 ${operation.id}:`, error);
    }
  }

  /**
   * 同步创建操作
   */
  private async syncCreate(operation: SyncOperation): Promise<Response> {
    const url = `/api/${operation.resourceType}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(operation.localData),
    });
    return response;
  }

  /**
   * 同步更新操作
   */
  private async syncUpdate(operation: SyncOperation): Promise<Response> {
    const url = `/api/${operation.resourceType}/${operation.resourceId}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(operation.localData),
    });
    return response;
  }

  /**
   * 同步删除操作
   */
  private async syncDelete(operation: SyncOperation): Promise<Response> {
    const url = `/api/${operation.resourceType}/${operation.resourceId}`;
    const response = await fetch(url, {
      method: 'DELETE',
    });
    return response;
  }

  /**
   * 获取同步状态
   */
  getSyncStatus(): SyncStatus {
    const queueStats = this.queueService.getQueueStats();
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingCount: queueStats.pending,
      failedCount: queueStats.failed,
      conflictCount: queueStats.conflict,
      lastSyncTime: this.statistics.lastSyncTime,
      nextSyncTime: this.isOnline && this.syncTimer ? Date.now() + this.config.syncInterval : 0,
    };
  }

  /**
   * 获取同步统计
   */
  getStatistics(): SyncStatistics {
    return { ...this.statistics };
  }

  /**
   * 添加事件监听器
   */
  on(event: SyncEventType, callback: (data: SyncEventData) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * 移除事件监听器
   */
  off(event: SyncEventType, callback: (data: SyncEventData) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(type: SyncEventType, data?: Record<string, unknown>): void {
    const eventData: SyncEventData = {
      type,
      timestamp: Date.now(),
      data,
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(eventData);
        } catch (error) {
          console.error(`[SyncManagerService] 事件回调执行失败:`, error);
        }
      });
    }
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.stopAutoSync();
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    this.eventListeners.clear();
    console.log('[SyncManagerService] 服务已销毁');
  }
}

export const syncManagerService = SyncManagerService.getInstance();
