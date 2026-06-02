/**
 * @file sync-queue-service.test.ts
 * @description YYC³便携式智能AI系统 - 同步队列服务测试
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-23
 * @updated 2026-03-23
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags test,sync,queue
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { SyncOperationType, SyncPriority, SyncOperationStatus } from '../../types/sync';
import { StorageService } from '../storage-service';
import { SyncQueueService } from '../sync-queue-service';

// Mock StorageService at top level
const mockStorageService = {
  ensureDB: vi.fn().mockResolvedValue(undefined),
  saveSession: vi.fn().mockResolvedValue(undefined),
  deleteSession: vi.fn().mockResolvedValue(undefined),
  getAllSessions: vi.fn().mockResolvedValue([]),
  getSession: vi.fn().mockResolvedValue(null),
};

vi.mock('../storage-service', () => ({
  StorageService: {
    getInstance: vi.fn(() => mockStorageService),
  },
}));

describe('SyncQueueService', () => {
  let queueService: SyncQueueService;

  beforeEach(async () => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    mockStorageService.getAllSessions.mockResolvedValue([]);

    // Clear the queue to ensure clean state
    const queueServiceInstance = SyncQueueService.getInstance();
    await queueServiceInstance.clearQueue();

    queueService = queueServiceInstance;
    await queueService.initialize();
  });

  describe('初始化', () => {
    it('应该成功初始化', async () => {
      expect(queueService).toBeInstanceOf(SyncQueueService);
    });

    it('应该是单例模式', () => {
      const instance1 = SyncQueueService.getInstance();
      const instance2 = SyncQueueService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('添加操作', () => {
    it('应该成功添加操作', async () => {
      const operationId = await queueService.addOperation({
        type: 'create' as SyncOperationType,
        priority: 'normal' as SyncPriority,
        resourceType: 'files',
        resourceId: 'file-1',
        localData: { name: 'test.js', content: 'console.log("test")' },
        maxRetries: 3,
        requiresConfirmation: false,
      });

      expect(operationId).toBeTruthy();
      expect(operationId).toHaveLength(36); // UUID长度
    });

    it('应该批量添加操作', async () => {
      const operations = [
        {
          type: 'create' as SyncOperationType,
          priority: 'normal' as SyncPriority,
          resourceType: 'files',
          resourceId: 'file-1',
          localData: { name: 'test1.js' },
          maxRetries: 3,
          requiresConfirmation: false,
        },
        {
          type: 'create' as SyncOperationType,
          priority: 'normal' as SyncPriority,
          resourceType: 'files',
          resourceId: 'file-2',
          localData: { name: 'test2.js' },
          maxRetries: 3,
          requiresConfirmation: false,
        },
      ];

      const ids = await queueService.addOperations(operations);
      expect(ids).toHaveLength(2);
      expect(ids.every((id) => id.length === 36)).toBe(true);
    });
  });

  describe('获取操作', () => {
    it('应该获取下一个待同步操作', async () => {
      await queueService.addOperation({
        type: 'create' as SyncOperationType,
        priority: 'high' as SyncPriority,
        resourceType: 'files',
        resourceId: 'file-1',
        localData: { name: 'test.js' },
        maxRetries: 3,
        requiresConfirmation: false,
      });

      const nextOperation = queueService.getNextOperation();
      expect(nextOperation).toBeTruthy();
      expect(nextOperation?.priority).toBe('high');
    });

    it('应该按优先级排序', async () => {
      await queueService.addOperation({
        type: 'create' as SyncOperationType,
        priority: 'low' as SyncPriority,
        resourceType: 'files',
        resourceId: 'file-1',
        localData: { name: 'low.js' },
        maxRetries: 3,
        requiresConfirmation: false,
      });

      await queueService.addOperation({
        type: 'create' as SyncOperationType,
        priority: 'critical' as SyncPriority,
        resourceType: 'files',
        resourceId: 'file-2',
        localData: { name: 'critical.js' },
        maxRetries: 3,
        requiresConfirmation: false,
      });

      const nextOperation = queueService.getNextOperation();
      expect(nextOperation?.priority).toBe('critical');
    });

    it('应该获取所有待同步操作', async () => {
      await queueService.addOperation({
        type: 'create' as SyncOperationType,
        priority: 'normal' as SyncPriority,
        resourceType: 'files',
        resourceId: 'file-1',
        localData: { name: 'test.js' },
        maxRetries: 3,
        requiresConfirmation: false,
      });

      const pendingOperations = queueService.getPendingOperations();
      expect(pendingOperations).toHaveLength(1);
    });

    it('应该根据ID获取操作', async () => {
      const operationId = await queueService.addOperation({
        type: 'create' as SyncOperationType,
        priority: 'normal' as SyncPriority,
        resourceType: 'files',
        resourceId: 'file-1',
        localData: { name: 'test.js' },
        maxRetries: 3,
        requiresConfirmation: false,
      });

      const operation = queueService.getOperation(operationId);
      expect(operation).toBeTruthy();
      expect(operation?.id).toBe(operationId);
    });
  });

  describe('更新操作状态', () => {
    it('应该标记操作为同步中', async () => {
      const operationId = await queueService.addOperation({
        type: 'create' as SyncOperationType,
        priority: 'normal' as SyncPriority,
        resourceType: 'files',
        resourceId: 'file-1',
        localData: { name: 'test.js' },
        maxRetries: 3,
        requiresConfirmation: false,
      });

      await queueService.markAsSyncing(operationId);
      const operation = queueService.getOperation(operationId);
      expect(operation?.status).toBe('syncing');
    });

    it('应该标记操作为成功', async () => {
      const operationId = await queueService.addOperation({
        type: 'create' as SyncOperationType,
        priority: 'normal' as SyncPriority,
        resourceType: 'files',
        resourceId: 'file-1',
        localData: { name: 'test.js' },
        maxRetries: 3,
        requiresConfirmation: false,
      });

      await queueService.markAsSuccess(operationId);
      const operation = queueService.getOperation(operationId);
      expect(operation).toBeUndefined();
    });

    it('应该标记操作为失败', async () => {
      const operationId = await queueService.addOperation({
        type: 'create' as SyncOperationType,
        priority: 'normal' as SyncPriority,
        resourceType: 'files',
        resourceId: 'file-1',
        localData: { name: 'test.js' },
        maxRetries: 3,
        requiresConfirmation: false,
      });

      await queueService.markAsFailed(operationId, 'Network error');
      const operation = queueService.getOperation(operationId);
      expect(operation?.status).toBe('pending');
      expect(operation?.retryCount).toBe(1);
      expect(operation?.error).toBe('Network error');
    });

    it('应该达到最大重试次数后标记为失败', async () => {
      const operationId = await queueService.addOperation({
        type: 'create' as SyncOperationType,
        priority: 'normal' as SyncPriority,
        resourceType: 'files',
        resourceId: 'file-1',
        localData: { name: 'test.js' },
        maxRetries: 1,
        requiresConfirmation: false,
      });

      await queueService.markAsFailed(operationId, 'Network error');
      const operation = queueService.getOperation(operationId);
      expect(operation?.status).toBe('failed');
      expect(operation?.retryCount).toBe(1);
    });

    it('应该标记操作为冲突', async () => {
      const operationId = await queueService.addOperation({
        type: 'create' as SyncOperationType,
        priority: 'normal' as SyncPriority,
        resourceType: 'files',
        resourceId: 'file-1',
        localData: { name: 'test.js' },
        maxRetries: 3,
        requiresConfirmation: false,
      });

      const serverData = { name: 'test-server.js' };
      await queueService.markAsConflict(operationId, serverData);
      const operation = queueService.getOperation(operationId);
      expect(operation?.status).toBe('conflict');
      expect(operation?.serverData).toEqual(serverData);
    });
  });

  describe('队列管理', () => {
    it('应该检查是否有待同步操作', async () => {
      expect(queueService.hasPendingOperations()).toBe(false);

      await queueService.addOperation({
        type: 'create' as SyncOperationType,
        priority: 'normal' as SyncPriority,
        resourceType: 'files',
        resourceId: 'file-1',
        localData: { name: 'test.js' },
        maxRetries: 3,
        requiresConfirmation: false,
      });

      expect(queueService.hasPendingOperations()).toBe(true);
    });

    it('应该清空队列', async () => {
      await queueService.addOperation({
        type: 'create' as SyncOperationType,
        priority: 'normal' as SyncPriority,
        resourceType: 'files',
        resourceId: 'file-1',
        localData: { name: 'test.js' },
        maxRetries: 3,
        requiresConfirmation: false,
      });

      await queueService.clearQueue();
      expect(queueService.hasPendingOperations()).toBe(false);
    });
  });

  describe('队列统计', () => {
    it('应该获取队列统计', async () => {
      await queueService.addOperation({
        type: 'create' as SyncOperationType,
        priority: 'normal' as SyncPriority,
        resourceType: 'files',
        resourceId: 'file-1',
        localData: { name: 'test.js' },
        maxRetries: 3,
        requiresConfirmation: false,
      });

      const stats = queueService.getQueueStats();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.pending).toBeGreaterThan(0);
      expect(stats.byResourceType).toHaveProperty('files');
    });
  });

  describe('并发控制', () => {
    it('应该获取可并发的操作', async () => {
      for (let i = 0; i < 5; i++) {
        await queueService.addOperation({
          type: 'create' as SyncOperationType,
          priority: 'normal' as SyncPriority,
          resourceType: 'files',
          resourceId: `file-${i}`,
          localData: { name: `test${i}.js` },
          maxRetries: 3,
          requiresConfirmation: false,
        });
      }

      const concurrentOps = queueService.getConcurrentOperations(3);
      expect(concurrentOps).toHaveLength(3);
    });
  });
});
