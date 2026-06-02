/**
 * @file sync-queue-service.ts
 * @description YYC³便携式智能AI系统 - 同步队列服务
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags service,sync,queue,offline,critical
 */

import { v4 as uuidv4 } from 'uuid';

import type { SyncOperation } from '../types/sync';
import { SyncOperationStatus } from '../types/sync';

import { StorageService } from './storage-service';

/**
 * 同步队列服务类
 * 管理离线操作队列，支持优先级排序和依赖管理
 */
export class SyncQueueService {
  private static instance: SyncQueueService;
  private storageService: StorageService;
  private queue: Map<string, SyncOperation> = new Map();
  private isInitialized = false;

  private constructor() {
    this.storageService = StorageService.getInstance();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): SyncQueueService {
    if (!SyncQueueService.instance) {
      SyncQueueService.instance = new SyncQueueService();
    }
    return SyncQueueService.instance;
  }

  /**
   * 初始化服务
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 从存储中加载待同步操作
      await this.loadPendingOperations();
      this.isInitialized = true;
      console.log('[SyncQueueService] 初始化成功');
    } catch (error) {
      console.error('[SyncQueueService] 初始化失败:', error);
      throw error;
    }
  }

  /**
   * 从存储中加载待同步操作
   */
  private async loadPendingOperations(): Promise<void> {
    try {
      // 从IndexedDB中加载所有待同步的操作
      // 这里简化实现，实际应该从专门的同步队列存储中读取
      const pendingOperations = await this.storageService.getAllSessions();
      // 过滤出待同步的操作
      pendingOperations.forEach((session) => {
        if (session.data && session.data.operation) {
          const operation = session.data.operation as SyncOperation;
          if (operation.status === SyncOperationStatus.PENDING) {
            this.queue.set(operation.id, operation);
          }
        }
      });
      console.log(`[SyncQueueService] 加载了 ${this.queue.size} 个待同步操作`);
    } catch (error) {
      console.error('[SyncQueueService] 加载待同步操作失败:', error);
    }
  }

  /**
   * 添加操作到队列
   */
  async addOperation(
    operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>
  ): Promise<string> {
    const id = uuidv4();
    const timestamp = Date.now();
    const fullOperation: SyncOperation = {
      ...operation,
      id,
      timestamp,
      retryCount: 0,
      status: SyncOperationStatus.PENDING,
    };

    this.queue.set(id, fullOperation);

    // 保存到存储
    await this.saveOperationToStorage(fullOperation);

    console.log(
      `[SyncQueueService] 添加操作 ${operation.type} - ${operation.resourceType}/${operation.resourceId}`
    );
    return id;
  }

  /**
   * 批量添加操作到队列
   */
  async addOperations(
    operations: Array<Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>>
  ): Promise<string[]> {
    const ids: string[] = [];
    for (const operation of operations) {
      const id = await this.addOperation(operation);
      ids.push(id);
    }
    return ids;
  }

  /**
   * 获取队列中的下一个操作
   */
  getNextOperation(): SyncOperation | null {
    // 按优先级和时间戳排序
    const sortedOperations = Array.from(this.queue.values()).sort((a, b) => {
      // 优先级权重
      const priorityWeights = {
        critical: 4,
        high: 3,
        normal: 2,
        low: 1,
      };
      const weightDiff = priorityWeights[b.priority] - priorityWeights[a.priority];
      if (weightDiff !== 0) {
        return weightDiff;
      }
      // 优先级相同，按时间戳排序
      return a.timestamp - b.timestamp;
    });

    // 返回第一个待同步的操作
    const operation = sortedOperations.find((op) => op.status === SyncOperationStatus.PENDING);
    return operation || null;
  }

  /**
   * 获取所有待同步操作
   */
  getPendingOperations(): SyncOperation[] {
    return Array.from(this.queue.values()).filter(
      (op) => op.status === SyncOperationStatus.PENDING
    );
  }

  /**
   * 获取所有操作
   */
  getAllOperations(): SyncOperation[] {
    return Array.from(this.queue.values());
  }

  /**
   * 根据ID获取操作
   */
  getOperation(id: string): SyncOperation | undefined {
    return this.queue.get(id);
  }

  /**
   * 更新操作状态
   */
  async updateOperationStatus(
    id: string,
    status: SyncOperationStatus,
    additionalData?: Partial<SyncOperation>
  ): Promise<void> {
    const operation = this.queue.get(id);
    if (!operation) {
      console.warn(`[SyncQueueService] 操作 ${id} 不存在`);
      return;
    }

    operation.status = status;
    if (additionalData) {
      Object.assign(operation, additionalData);
    }

    await this.saveOperationToStorage(operation);
  }

  /**
   * 标记操作为同步中
   */
  async markAsSyncing(id: string): Promise<void> {
    await this.updateOperationStatus(id, SyncOperationStatus.SYNCING);
  }

  /**
   * 标记操作为成功
   */
  async markAsSuccess(id: string): Promise<void> {
    await this.updateOperationStatus(id, SyncOperationStatus.SUCCESS);
    this.queue.delete(id);
  }

  /**
   * 标记操作为失败
   */
  async markAsFailed(id: string, error: string): Promise<void> {
    const operation = this.queue.get(id);
    if (!operation) return;

    operation.retryCount++;
    if (operation.retryCount >= operation.maxRetries) {
      await this.updateOperationStatus(id, SyncOperationStatus.FAILED, { error });
    } else {
      // 重置为待同步，稍后重试
      await this.updateOperationStatus(id, SyncOperationStatus.PENDING, { error });
    }
  }

  /**
   * 标记操作为冲突
   */
  async markAsConflict(id: string, serverData: Record<string, unknown>): Promise<void> {
    await this.updateOperationStatus(id, SyncOperationStatus.CONFLICT, { serverData });
  }

  /**
   * 移除操作
   */
  async removeOperation(id: string): Promise<void> {
    this.queue.delete(id);
    // 从存储中移除
    await this.storageService.deleteSession(id);
  }

  /**
   * 清空队列
   */
  async clearQueue(): Promise<void> {
    const ids = Array.from(this.queue.keys());
    for (const id of ids) {
      await this.removeOperation(id);
    }
    this.queue.clear();
  }

  /**
   * 获取队列统计
   */
  getQueueStats() {
    const operations = Array.from(this.queue.values());
    return {
      total: operations.length,
      pending: operations.filter((op) => op.status === SyncOperationStatus.PENDING).length,
      syncing: operations.filter((op) => op.status === SyncOperationStatus.SYNCING).length,
      success: operations.filter((op) => op.status === SyncOperationStatus.SUCCESS).length,
      failed: operations.filter((op) => op.status === SyncOperationStatus.FAILED).length,
      conflict: operations.filter((op) => op.status === SyncOperationStatus.CONFLICT).length,
      byResourceType: this.groupByResourceType(operations),
    };
  }

  /**
   * 按资源类型分组
   */
  private groupByResourceType(operations: SyncOperation[]) {
    const grouped: Record<string, number> = {};
    operations.forEach((op) => {
      grouped[op.resourceType] = (grouped[op.resourceType] || 0) + 1;
    });
    return grouped;
  }

  /**
   * 保存操作到存储
   */
  private async saveOperationToStorage(operation: SyncOperation): Promise<void> {
    try {
      // 使用sessions存储保存同步操作
      await this.storageService.saveSession({
        id: operation.id,
        userId: 'sync-queue',
        data: { operation },
        createdAt: operation.timestamp,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('[SyncQueueService] 保存操作失败:', error);
      throw error;
    }
  }

  /**
   * 获取可并发的操作列表
   */
  getConcurrentOperations(maxConcurrent: number): SyncOperation[] {
    const pending = this.getPendingOperations();
    return pending.slice(0, maxConcurrent);
  }

  /**
   * 检查是否有待同步操作
   */
  hasPendingOperations(): boolean {
    return this.getPendingOperations().length > 0;
  }

  /**
   * 获取操作依赖
   */
  getOperationDependencies(operationId: string): string[] {
    this.getOperation(operationId);
    // 这里简化处理，实际应该从操作元数据中获取依赖
    return [];
  }
}
