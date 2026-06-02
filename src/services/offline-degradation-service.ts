/**
 * @file offline-degradation-service.ts
 * @description YYC³便携式智能AI系统 - 离线降级服务
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,offline,degradation,queue,critical
 */

import { v4 as uuidv4 } from 'uuid';

import {
  OfflineState,
  DegradationStrategy,
  OfflineEventType,
  OfflineOperationStatus,
  FeatureAvailability,
} from '../types/offline';
import type {
  OfflineOperation,
  OfflineOperationType,
  OfflineConfig,
  OfflineStatus,
  OfflineStatistics,
  OfflineEventData,
  OfflineEventListener,
  OfflineDegradationResult,
} from '../types/offline';
import { WebSocketEventType } from '../types/websocket';

import { StorageService } from './storage-service';
import { SyncQueueService } from './sync-queue-service';
import { WebSocketService } from './websocket-service';

/**
 * 离线降级服务类
 * 整合WebSocket和同步队列，实现在线/离线切换时的自动队列管理
 */
export class OfflineDegradationService {
  private static instance: OfflineDegradationService;
  private storageService: StorageService;
  private webSocketService: WebSocketService;
  private syncQueueService: SyncQueueService;

  private currentState: OfflineState = OfflineState.ONLINE;
  private isInitialized = false;
  private config: OfflineConfig;
  private eventListeners: Map<OfflineEventType, Set<OfflineEventListener>> = new Map();
  private offlineStartTime?: number;
  private onlineCheckTimer?: NodeJS.Timeout;
  private autoSyncTimer?: NodeJS.Timeout;
  private operationQueue: OfflineOperation[] = [];

  // 统计信息
  private statistics: OfflineStatistics = {
    totalOfflineTime: 0,
    totalOfflineCount: 0,
    totalQueueOperations: 0,
    successOperations: 0,
    failedOperations: 0,
    averageQueueSize: 0,
    maxQueueSize: 0,
    currentQueueSize: 0,
  };

  private constructor() {
    this.storageService = StorageService.getInstance();
    this.webSocketService = WebSocketService.getInstance();
    this.syncQueueService = SyncQueueService.getInstance();
    this.config = this.getDefaultConfig();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): OfflineDegradationService {
    if (!OfflineDegradationService.instance) {
      OfflineDegradationService.instance = new OfflineDegradationService();
    }
    return OfflineDegradationService.instance;
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): OfflineConfig {
    return {
      enabled: true,
      autoDetectOnline: true,
      onlineCheckInterval: 5000, // 5秒
      maxQueueSize: 100,
      maxRetryCount: 3,
      retryInterval: 3000, // 3秒
      autoSyncEnabled: true,
      autoSyncInterval: 30000, // 30秒
      defaultDegradationStrategy: DegradationStrategy.QUEUE,
      featureStrategies: {
        // 定义各功能的降级策略
        create_file: DegradationStrategy.QUEUE,
        update_file: DegradationStrategy.QUEUE,
        delete_file: DegradationStrategy.QUEUE,
        create_message: DegradationStrategy.QUEUE,
        send_message: DegradationStrategy.SILENT,
        query_data: DegradationStrategy.WARNING,
      },
      showOfflineNotification: true,
      notificationDuration: 3000,
      enableLogging: true,
    };
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 初始化依赖服务
      await this.storageService.ensureDB();
      await this.syncQueueService.initialize();

      // 加载配置和统计信息
      await this.loadConfig();
      await this.loadStatistics();

      // 设置WebSocket事件监听
      this.setupWebSocketListeners();

      // 启动在线检测
      if (this.config.autoDetectOnline) {
        this.startOnlineDetection();
      }

      // 启动自动同步
      if (this.config.autoSyncEnabled) {
        this.startAutoSync();
      }

      this.isInitialized = true;
      console.log('[OfflineDegradationService] 初始化成功');
      this.log('服务初始化完成');
    } catch (error) {
      console.error('[OfflineDegradationService] 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 加载配置
   */
  private async loadConfig(): Promise<void> {
    try {
      const savedConfig = await this.storageService.getSession('offline-degradation-config');
      if (savedConfig?.data?.config) {
        this.config = { ...this.config, ...savedConfig.data.config };
        this.log('配置已加载');
      }
    } catch (error) {
      console.error('[OfflineDegradationService] 加载配置失败:', error);
    }
  }

  /**
   * 加载统计信息
   */
  private async loadStatistics(): Promise<void> {
    try {
      const savedStats = await this.storageService.getSession('offline-statistics');
      if (savedStats?.data?.statistics) {
        this.statistics = savedStats.data.statistics as OfflineStatistics;
        this.log('统计信息已加载');
      }
    } catch (error) {
      console.error('[OfflineDegradationService] 加载统计信息失败:', error);
    }
  }

  /**
   * 保存统计信息
   */
  private async saveStatistics(): Promise<void> {
    try {
      await this.storageService.saveSession({
        id: 'offline-statistics',
        userId: 'system',
        data: { statistics: this.statistics },
      });
    } catch (error) {
      console.error('[OfflineDegradationService] 保存统计信息失败:', error);
    }
  }

  /**
   * 设置WebSocket事件监听
   */
  private setupWebSocketListeners(): void {
    this.webSocketService.on(WebSocketEventType.OPEN, () => {
      this.handleOnline();
    });

    this.webSocketService.on(WebSocketEventType.CLOSE, () => {
      this.handleOffline();
    });

    this.webSocketService.on(WebSocketEventType.RECONNECT_START, () => {
      this.handleReconnecting();
    });

    this.webSocketService.on(WebSocketEventType.RECONNECT_SUCCESS, () => {
      this.handleOnline();
    });

    this.webSocketService.on(WebSocketEventType.RECONNECT_FAILED, () => {
      this.handleOffline();
    });
  }

  /**
   * 处理在线状态
   */
  private handleOnline(): void {
    const oldState = this.currentState;
    if (oldState === OfflineState.ONLINE) {
      return;
    }

    this.currentState = OfflineState.ONLINE;

    // 更新统计信息
    if (this.offlineStartTime) {
      const offlineDuration = Date.now() - this.offlineStartTime;
      this.statistics.totalOfflineTime += offlineDuration;
      this.statistics.lastOfflineTime = this.offlineStartTime;
      this.offlineStartTime = undefined;
      this.saveStatistics();
    }

    this.statistics.lastOnlineTime = Date.now();

    // 触发事件
    this.emitEvent({
      type: OfflineEventType.ONLINE,
      timestamp: Date.now(),
      oldState,
      newState: OfflineState.ONLINE,
    });

    this.log('已连接到网络');

    // 自动同步队列中的操作
    if (this.config.autoSyncEnabled) {
      this.syncQueue();
    }
  }

  /**
   * 处理离线状态
   */
  private handleOffline(): void {
    const oldState = this.currentState;
    if (oldState === OfflineState.OFFLINE) {
      return;
    }

    this.currentState = OfflineState.OFFLINE;
    this.offlineStartTime = Date.now();
    this.statistics.totalOfflineCount++;
    this.saveStatistics();

    // 触发事件
    this.emitEvent({
      type: OfflineEventType.OFFLINE,
      timestamp: Date.now(),
      oldState,
      newState: OfflineState.OFFLINE,
    });

    this.log('已断开网络连接');

    // 显示离线通知
    if (this.config.showOfflineNotification) {
      this.showOfflineNotification();
    }
  }

  /**
   * 处理重连中状态
   */
  private handleReconnecting(): void {
    const oldState = this.currentState;
    if (oldState === OfflineState.RECONNECTING) {
      return;
    }

    this.currentState = OfflineState.RECONNECTING;

    // 触发事件
    this.emitEvent({
      type: OfflineEventType.DEGRADED,
      timestamp: Date.now(),
      oldState,
      newState: OfflineState.RECONNECTING,
    });

    this.log('正在重新连接...');
  }

  /**
   * 启动在线检测
   */
  private startOnlineDetection(): void {
    this.stopOnlineDetection();

    this.onlineCheckTimer = setInterval(() => {
      this.checkOnlineStatus();
    }, this.config.onlineCheckInterval);

    this.log(`在线检测已启动，间隔: ${this.config.onlineCheckInterval}ms`);
  }

  /**
   * 停止在线检测
   */
  private stopOnlineDetection(): void {
    if (this.onlineCheckTimer) {
      clearInterval(this.onlineCheckTimer);
      this.onlineCheckTimer = undefined;
      this.log('在线检测已停止');
    }
  }

  /**
   * 检查在线状态
   */
  private checkOnlineStatus(): void {
    // 检查网络连接状态
    const isOnline = navigator.onLine;
    const wsConnected = this.webSocketService.getState() === 'connected';

    if (isOnline && wsConnected) {
      this.handleOnline();
    } else if (!isOnline || !wsConnected) {
      this.handleOffline();
    }
  }

  /**
   * 启动自动同步
   */
  private startAutoSync(): void {
    this.stopAutoSync();

    this.autoSyncTimer = setInterval(() => {
      if (this.currentState === OfflineState.ONLINE) {
        this.syncQueue();
      }
    }, this.config.autoSyncInterval);

    this.log(`自动同步已启动，间隔: ${this.config.autoSyncInterval}ms`);
  }

  /**
   * 停止自动同步
   */
  private stopAutoSync(): void {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = undefined;
      this.log('自动同步已停止');
    }
  }

  /**
   * 同步队列
   */
  async syncQueue(): Promise<void> {
    if (this.currentState !== OfflineState.ONLINE) {
      this.log('当前不在线，跳过同步');
      return;
    }

    this.currentState = OfflineState.SYNCING;

    // 触发同步开始事件
    this.emitEvent({
      type: OfflineEventType.SYNC_START,
      timestamp: Date.now(),
    });

    try {
      // 获取待同步的操作
      const pendingOperations = await this.syncQueueService.getPendingOperations();

      if (pendingOperations.length === 0) {
        this.log('没有待同步的操作');
        this.currentState = OfflineState.ONLINE;
        return;
      }

      this.log(`开始同步 ${pendingOperations.length} 个操作`);

      // 逐个同步操作
      for (const operation of pendingOperations) {
        try {
          // TODO: 这里应该调用实际的API同步操作
          // 简化实现，直接标记为成功
          await this.syncQueueService.markAsSuccess(operation.id);

          this.statistics.successOperations++;
          this.statistics.totalQueueOperations++;

          // 触发操作成功事件
          this.emitEvent({
            type: OfflineEventType.OPERATION_SUCCESS,
            timestamp: Date.now(),
            operationId: operation.id,
            operationType: operation.type as unknown as OfflineOperationType,
          });
        } catch (error) {
          // 同步失败，重试
          await this.syncQueueService.markAsFailed(
            operation.id,
            error instanceof Error ? error.message : String(error)
          );

          this.statistics.failedOperations++;
          this.statistics.totalQueueOperations++;

          // 触发操作失败事件
          this.emitEvent({
            type: OfflineEventType.OPERATION_FAILED,
            timestamp: Date.now(),
            operationId: operation.id,
            operationType: operation.type as unknown as OfflineOperationType,
          });
        }
      }

      this.currentState = OfflineState.ONLINE;
      this.statistics.lastSyncTime = Date.now();
      this.saveStatistics();

      // 触发同步完成事件
      this.emitEvent({
        type: OfflineEventType.SYNC_COMPLETE,
        timestamp: Date.now(),
        data: {
          successCount: this.statistics.successOperations,
          failedCount: this.statistics.failedOperations,
        },
      });

      this.log('同步完成');
    } catch (error) {
      console.error('[OfflineDegradationService] 同步失败:', error);

      this.currentState = OfflineState.ONLINE;

      // 触发同步失败事件
      this.emitEvent({
        type: OfflineEventType.SYNC_FAILED,
        timestamp: Date.now(),
        error,
      });
    }
  }

  /**
   * 处理离线操作
   */
  async handleOfflineOperation(
    type: OfflineOperationType,
    resource: string,
    data: unknown,
    options?: {
      resourceId?: string;
      priority?: number;
      strategy?: DegradationStrategy;
    }
  ): Promise<OfflineDegradationResult> {
    const { resourceId, priority = 5, strategy } = options || {};

    // 检查是否在线
    if (this.currentState === OfflineState.ONLINE) {
      // 在线时直接执行
      try {
        // TODO: 调用实际API执行操作
        return {
          success: true,
          degraded: false,
          strategy: DegradationStrategy.SILENT,
          queued: false,
        };
      } catch (error) {
        // 执行失败，根据策略处理
        return this.handleOfflineOperationFallback(
          type,
          resource,
          data,
          resourceId,
          priority,
          strategy
        );
      }
    }

    // 离线时根据降级策略处理
    return this.handleOfflineOperationFallback(
      type,
      resource,
      data,
      resourceId,
      priority,
      strategy
    );
  }

  /**
   * 处理离线操作的降级方案
   */
  private handleOfflineOperationFallback(
    type: OfflineOperationType,
    resource: string,
    data: unknown,
    resourceId?: string,
    priority: number = 5,
    strategy?: DegradationStrategy
  ): OfflineDegradationResult {
    // 获取降级策略
    const effectiveStrategy =
      strategy || this.config.featureStrategies[resource] || this.config.defaultDegradationStrategy;

    switch (effectiveStrategy) {
      case DegradationStrategy.SILENT:
        // 静默降级，不显示错误，使用本地数据
        this.log(`静默降级: ${resource}`);
        return {
          success: true,
          degraded: true,
          strategy: effectiveStrategy,
          queued: false,
          localData: data,
        };

      case DegradationStrategy.WARNING:
        // 警告降级，显示警告消息，使用本地数据
        this.log(`警告降级: ${resource}`);
        this.showWarningNotification(`网络不可用，使用本地数据: ${resource}`);
        return {
          success: true,
          degraded: true,
          strategy: effectiveStrategy,
          queued: false,
          localData: data,
        };

      case DegradationStrategy.ERROR:
        // 错误降级，显示错误消息，阻止操作
        this.log(`错误降级: ${resource}`);
        this.showErrorNotification(`网络不可用，无法执行操作: ${resource}`);
        return {
          success: false,
          degraded: true,
          strategy: effectiveStrategy,
          queued: false,
          error: new Error('Network unavailable'),
        };

      case DegradationStrategy.QUEUE:
        // 队列降级，将操作加入队列，等待在线时执行
        return this.queueOperation(type, resource, data, resourceId, priority);

      case DegradationStrategy.RETRY:
        // 重试降级，自动重试失败的操作
        return this.retryOperation(type, resource, data, resourceId, priority);

      default:
        return {
          success: false,
          degraded: true,
          strategy: effectiveStrategy,
          queued: false,
          error: new Error('Unknown degradation strategy'),
        };
    }
  }

  /**
   * 将操作加入队列
   */
  private queueOperation(
    type: OfflineOperationType,
    resource: string,
    data: unknown,
    resourceId?: string,
    priority: number = 5
  ): OfflineDegradationResult {
    // 检查队列大小
    if (this.operationQueue.length >= this.config.maxQueueSize) {
      this.log('队列已满，无法添加操作');
      return {
        success: false,
        degraded: true,
        strategy: DegradationStrategy.QUEUE,
        queued: false,
        error: new Error('Queue is full'),
      };
    }

    // 创建操作
    const operation: OfflineOperation = {
      id: uuidv4(),
      type,
      resource,
      resourceId,
      data,
      priority,
      retryCount: 0,
      maxRetryCount: this.config.maxRetryCount,
      createdAt: Date.now(),
      status: OfflineOperationStatus.PENDING,
      strategy: DegradationStrategy.QUEUE,
    };

    // 添加到队列
    this.operationQueue.push(operation);

    // 更新统计信息
    this.statistics.currentQueueSize = this.operationQueue.length;
    if (this.statistics.currentQueueSize > this.statistics.maxQueueSize) {
      this.statistics.maxQueueSize = this.statistics.currentQueueSize;
    }
    this.saveStatistics();

    // 触发操作入队事件
    this.emitEvent({
      type: OfflineEventType.OPERATION_QUEUED,
      timestamp: Date.now(),
      operationId: operation.id,
      operationType: type,
    });

    this.log(`操作已加入队列: ${operation.id}`);

    return {
      success: true,
      degraded: true,
      strategy: DegradationStrategy.QUEUE,
      queued: true,
      operationId: operation.id,
    };
  }

  /**
   * 重试操作
   */
  private retryOperation(
    type: OfflineOperationType,
    resource: string,
    data: unknown,
    resourceId?: string,
    priority: number = 5
  ): OfflineDegradationResult {
    // 简化实现，直接加入队列
    return this.queueOperation(type, resource, data, resourceId, priority);
  }

  /**
   * 显示离线通知
   */
  private showOfflineNotification(): void {
    // TODO: 实现离线通知UI
    console.log('[OfflineDegradationService] 显示离线通知');
  }

  /**
   * 显示警告通知
   */
  private showWarningNotification(message: string): void {
    // TODO: 实现警告通知UI
    console.log(`[OfflineDegradationService] 警告: ${message}`);
  }

  /**
   * 显示错误通知
   */
  private showErrorNotification(message: string): void {
    // TODO: 实现错误通知UI
    console.error(`[OfflineDegradationService] 错误: ${message}`);
  }

  /**
   * 触发事件
   */
  private emitEvent(data: OfflineEventData): void {
    const listeners = this.eventListeners.get(data.type);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (error) {
          console.error(`[OfflineDegradationService] 事件监听器错误:`, error);
        }
      });
    }
  }

  /**
   * 添加事件监听器
   */
  on(eventType: OfflineEventType, listener: OfflineEventListener): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener);
  }

  /**
   * 移除事件监听器
   */
  off(eventType: OfflineEventType, listener: OfflineEventListener): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * 更新配置
   */
  async updateConfig(config: Partial<OfflineConfig>): Promise<void> {
    this.config = { ...this.config, ...config };

    // 保存配置
    await this.storageService.saveSession({
      id: 'offline-degradation-config',
      userId: 'system',
      data: { config: this.config },
    });

    // 重启检测和同步
    if (this.config.autoDetectOnline) {
      this.startOnlineDetection();
    } else {
      this.stopOnlineDetection();
    }

    if (this.config.autoSyncEnabled) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }

    this.log('配置已更新');
  }

  /**
   * 获取配置
   */
  getConfig(): OfflineConfig {
    return { ...this.config };
  }

  /**
   * 获取离线状态
   */
  getOfflineState(): OfflineState {
    return this.currentState;
  }

  /**
   * 获取离线状态信息
   */
  getOfflineStatus(): OfflineStatus {
    return {
      state: this.currentState,
      isOnline: this.currentState === OfflineState.ONLINE,
      latency: undefined, // TODO: 实现延迟检测
      networkQuality: undefined, // TODO: 实现网络质量检测
      queuedOperations: this.operationQueue.length,
      succeededOperations: this.statistics.successOperations,
      failedOperations: this.statistics.failedOperations,
      lastUpdated: Date.now(),
      nextOnlineCheck: this.config.autoDetectOnline
        ? Date.now() + this.config.onlineCheckInterval
        : undefined,
    };
  }

  /**
   * 获取统计信息
   */
  getStatistics(): OfflineStatistics {
    return { ...this.statistics };
  }

  /**
   * 检查功能可用性
   */
  checkFeatureAvailability(_feature: string): FeatureAvailability {
    if (this.currentState === OfflineState.ONLINE) {
      return FeatureAvailability.AVAILABLE;
    }

    // 检查是否有本地缓存
    // TODO: 实现缓存检查逻辑
    return FeatureAvailability.UNAVAILABLE;
  }

  /**
   * 手动触发同步
   */
  async syncNow(): Promise<void> {
    await this.syncQueue();
  }

  /**
   * 清空队列
   */
  clearQueue(): void {
    this.operationQueue = [];
    this.statistics.currentQueueSize = 0;
    this.saveStatistics();
    this.log('队列已清空');
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.stopOnlineDetection();
    this.stopAutoSync();
    this.eventListeners.clear();
    this.operationQueue = [];
    this.isInitialized = false;
    this.log('服务已销毁');
  }

  /**
   * 日志
   */
  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[OfflineDegradationService] ${message}`);
    }
  }
}

export const offlineDegradationService = OfflineDegradationService.getInstance();
